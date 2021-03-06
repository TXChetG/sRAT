// Copyright 2018-2019 Chet Gassett. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
/*jslint es6 */
const sqlite3 = require('sqlite3').verbose();

module.exports.Database = function (filename = 'srat.db', callback) {
    const db = new sqlite3.Database(filename, function (err) {
        if (err !== null) {
            return console.error(`cannot open database ${filename}: ${err}`);
        }
    });

    db.serialize(function () {
        db.run('CREATE TABLE IF NOT EXISTS quizzes (quizid INTEGER PRIMARY KEY, name TEXT)', callback);

        db.run('CREATE TABLE IF NOT EXISTS questions (questionid INTEGER, quizid INTEGER, statement TEXT, correct INTEGER, PRIMARY KEY (questionid, quizid))', callback);

        db.run('CREATE TABLE IF NOT EXISTS answers (answerid INTEGER NOT NULL, questionid INTEGER NOT NULL, quizid INTEGER, statement TEXT, PRIMARY KEY (answerid, questionid, quizid))', callback);

        db.run('CREATE TABLE IF NOT EXISTS teams (teamid INTEGER PRIMARY KEY, name TEXT, teamcode TEXT, teamslug TEXT)', callback);

        db.run('CREATE TABLE IF NOT EXISTS responses (responseid INTEGER, teamid INTEGER, questionid INTEGER, quizid INTEGER, response INTEGER, iscorrect INTEGER, score REAL, PRIMARY KEY (responseid, teamid, questionid, quizid))', callback);
    });

    const close = function () {
        return db.close(function (err) {
            if (err !== null) {
                return console.error(`cannot open database ${filename}: ${err}`);
            }
        });
    };

    const list_quizzes = function (callback) {
        return db.all('SELECT * FROM quizzes', callback);
    };

    const add_quiz = function (quiz, callback) {
        db.run('INSERT INTO quizzes (name) VALUES (?)', quiz.name, function (err) {
            if (err !== null) {
                return callback(err);
            }

            const quizid = this.lastID;
            if ('questions' in quiz && quiz.questions.constructor === Array) {
                const promises = [];
                for (let i = 0; i < quiz.questions.length; ++i) {
                    const question = quiz.questions[i],
                        questionid = i + 1;
                    promises.push(new Promise(function (resolve, reject) {
                        add_question(quizid, questionid, question, function (err) {
                            if (err !== null) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    }));
                }
                Promise.all(promises).then(function () {
                    callback(null, quizid);
                }).catch(function (errors) {
                    callback(errors, quizid);
                });
            } else {
                callback(err, quizid);
            }
        });
    };

    const add_question = function (quizid, questionid, question, callback) {
        const stmt = db.prepare('INSERT INTO questions (questionid, quizid, statement, correct) VALUES (?, ?, ?, ?)');
        stmt.run(questionid, quizid, question.statement, question.correct, function (err) {
            if (err !== null) {
                return callback(err);
            }

            if ('answers' in question && question.answers.constructor === Array) {
                const promises = [];
                for (let i = 0; i < question.answers.length; ++i) {
                    const answerid = i + 1;
                    promises.push(new Promise(function (resolve, reject) {
                        add_answer(answerid, questionid, quizid, question.answers[i], function (err) {
                            if (err !== null) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    }));
                }
                Promise.all(promises).then(function () {
                    callback(null);
                }).catch(function (errors) {
                    callback(errors);
                });
            } else {
                callback(null);
            }
        });
        stmt.finalize();
    };

    const add_answer = function (answerid, questionid, quizid, statement, callback) {
        const stmt = db.prepare('INSERT INTO answers (answerid, questionid, quizid, statement) VALUES (?, ?, ?, ?)');
        stmt.run(answerid, questionid, quizid, statement, callback);
        stmt.finalize();
    };

    const get_quiz = function (quizid, callback) {
        db.get('SELECT * FROM quizzes WHERE quizid=?', quizid, function (err, quiz) {
            if (err !== null) {
                return callback(err);
            } else if (quiz === undefined) {
                return callback(null, quiz);
            } else {
                quiz.questions = [];
                new Promise(function (resolve, reject) {
                    get_questions(quizid, function (err, questions) {
                        if (err !== null) {
                            reject(err);
                        } else if (questions === undefined) {
                            resolve([]);
                        } else {
                            resolve(questions);
                        }
                    });
                }).then(function (questions) {
                    quiz.questions = questions;
                    callback(null, quiz);
                }).catch(function (err) {
                    callback(err);
                });
            }
        });
    };

    const get_questions = function (quizid, callback) {
        db.all('SELECT questionid, statement FROM questions WHERE quizid=?', quizid, function (err, questions) {
            if (err !== null) {
                return callback(err);
            } else if (questions === undefined) {
                return callback(null, questions);
            } else {
                const promises = [];
                for (let i = 0; i < questions.length; ++i) {
                    const question = questions[i],
                        questionid = question.questionid;
                    promises.push(new Promise(function (resolve, reject) {
                        get_answers(quizid, questionid, function (err, answers) {
                            if (err !== null) {
                                reject(err);
                            } else if (answers === undefined) {
                                resolve([]);
                            } else {
                                resolve(answers);
                            }
                        });
                    }));
                }
                Promise.all(promises).then(function (all_answers) {
                    for (let i = 0; i < questions.length; ++i) {
                        questions[i].answers = all_answers[i];
                    }
                    callback(null, questions);
                }).catch(function (err) {
                    callback(err, null);
                });
            }
        });
    };

    const get_answers = function (quizid, questionid, callback) {
        const stmt = db.prepare('SELECT answerid, statement FROM answers WHERE quizid=? AND questionid=?');
        stmt.all(quizid, questionid, callback);
        stmt.finalize();
    };

    const count_answers = function (quizid, questionid, callback) {
        db.get('SELECT COUNT(*) AS count FROM answers WHERE quizid=? AND questionid=?', quizid, questionid, callback);
    };

    const check_answer = function (quizid, questionid, answer, callback) {
        db.get('SELECT correct FROM questions WHERE quizid=? AND questionid=?', quizid, questionid, function (err, response) {
            if (err !== null) {
                callback(err);
            } else if (response === undefined) {
                callback(null, response);
            } else {
                callback(err, {
                    quizid: quizid,
                    questionid: questionid,
                    proposed: answer.proposed,
                    iscorrect: answer.proposed == response.correct
                });
            }
        });
    };

    const list_teams = function (callback) {
        return db.all('SELECT * FROM teams', callback);
    };

    const add_team = function (team, callback) {
        let slug = team.name.toLowerCase();
        slug.replace(/\s+/g, '-');
        slug.replace(/[^a-z0-9+]/gi, '');
        db.run('INSERT INTO teams (name, teamcode, teamslug) VALUES (?, ?, ?)', team.name, team.teamcode, slug, function (err) {
            if (err !== null) {
                return callback(err);
            }
            callback(err, this.lastID);
        });
    };

    const get_team_by_id = function (teamid, callback) {
        db.get('SELECT * FROM teams WHERE teamid=?', teamid, function (err, response) {
            if (err !== null) {
                return callback(err, null);
            }
            return callback(err, response);
        });
    };

    const get_team_by_code = function (teamcode, callback) {
        db.get('SELECT * FROM teams WHERE teamcode=?', teamcode, callback);
    };

    const get_team_by_slug = function (teamslug, callback) {
        db.get('SELECT * FROM teams WHERE teamslug=?', teamslug, callback);
    }

    const save_response = function (team, result, callback) {
        const quizid = result.quizid,
            questionid = result.questionid,
            proposed = result.proposed,
            iscorrect = result.iscorrect;

        count_answers(quizid, questionid, function (err, answers) {
            if (err !== null) {
                return callback(err);
            } else if (answers === undefined) {
                return callback({
                    'error': `no answers for quiz ${quizid}, question ${questionid} found`
                });
            }

            let query = 'SELECT COUNT(*) AS count, MIN(score) AS score FROM responses WHERE teamid=? AND quizid=? AND questionid=?';
            db.get(query, team.teamid, quizid, questionid, function (err, response) {
                let score = 1.0;
                if (err !== null) {
                    return callback(err);
                } else if (response.score === null) {
                    score = iscorrect ? score : score / 2.0;
                } else {
                    score = iscorrect ? response.score : response.score / 2.0;
                }
                if (response.count >= (answers.count - 1)) {
                    score = 0.0;
                }

                const responseid = response.count + 1;
                query = 'INSERT INTO responses(teamid, quizid, questionid, responseid, response, iscorrect, score) VALUES (?, ?, ?, ?, ?, ?, ?)';
                db.run(query, team.teamid, quizid, questionid, responseid, proposed, iscorrect, score, function (err) {
                    if (err !== null) {
                        return callback(err);
                    }
                    callback(null, Object.assign({}, team, result, {
                        score: score
                    }));
                });
            });
        });
    };

    const get_results = function (quizid, callback) {
        const query = `SELECT
            responses.teamid,
            teams.name,
            responses.questionid,
            responses.responseid,
            questions.correct,
            responses.response,
            responses.iscorrect,
            responses.score
        FROM responses
        JOIN teams
            ON responses.teamid = teams.teamid
        JOIN questions
            ON responses.quizid = questions.quizid
            AND responses.questionid = questions.questionid
        WHERE responses.quizid == ?
        ORDER BY
            responses.teamid,
            responses.questionid,
            responses.responseid;`;

        db.all(query, quizid, callback);
    };

    return {
        handle: db,
        close: close,

        list_quizzes,
        add_quiz,
        get_quiz,
        check_answer,
        list_teams,
        add_team,
        get_team_by_id,
        get_team_by_code,
        get_team_by_slug,
        save_response,
        get_results
    };
};