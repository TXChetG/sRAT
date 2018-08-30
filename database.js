// Copyright 2018 Nicole M. Lozano. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
/*jslint es6 */
const sqlite3 = require('sqlite3').verbose();

module.exports.Database = function (filename = 'srat.db', callback) {


    var db = new sqlite3.Database(filename, function (err) {
        if (err !== null) {
            return console.error(`cannot open database ${filename}: ${err}`);
        }
    });

    db.serialize(function () {
        db.run('CREATE TABLE IF NOT EXISTS quizzes (quizid INTEGER PRIMARY KEY, name TEXT)', callback);

        db.run('CREATE TABLE IF NOT EXISTS questions (questionid INTEGER, quizid INTEGER, statement TEXT, correct INTEGER, PRIMARY KEY (questionid, quizid))', callback);

        db.run('CREATE TABLE IF NOT EXISTS answers (answerid INTEGER NOT NULL, questionid INTEGER NOT NULL, quizid INTEGER, statement TEXT, PRIMARY KEY (answerid, questionid))', callback);

        db.run('CREATE TABLE IF NOT EXISTS teams (teamid INTEGER PRIMARY KEY)', callback);
    });

    var close = function () {
        return db.close(function (err) {
            if (err !== null) {
                return console.error(`cannot open database ${filename}: ${err}`);
            }
        });
    };

    var list_quizzes = function (callback) {
        return db.all('SELECT * FROM quizzes', callback);
    };

    var add_quiz = function (quiz, callback) {
        db.run('INSERT INTO quizzes (name) VALUES (?)', quiz.name, function (err) {
            if (err !== null) {
                return callback(err);
            }

            let quizid = this.lastID;
            if ('questions' in quiz && quiz.questions.constructor === Array) {
                let promises = [];
                for (let i = 0; i < quiz.questions.length; ++i) {
                    let question = quiz.questions[i],
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
                };
                Promise.all(promises).then(function() {
                    callback(null, quizid);
                }).catch(function (errors) {
                    callback(errors, quizid);
                });
            } else {
                callback(err, quizid);
            }
        });
    };

    var add_question = function (quizid, questionid, question, callback) {
        let stmt = db.prepare('INSERT INTO questions (questionid, quizid, statement, correct) VALUES (?, ?, ?, ?)');
        stmt.run(questionid, quizid, question.statement, question.correct, function (err) {
            if (err !== null) {
                return callback(err);
            }

            let questionid = this.lastID;
            if ('answers' in question && question.answers.constructor === Array) {
                let promises = [];
                for (let i = 0; i < question.answers.length; ++i) {
                    let answerid = i + 1;
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
                    callback(errors)
                });
            } else {
                callback(null);
            };
        });
        stmt.finalize();
    };

    var add_answer = function (answerid, questionid, quizid, statement, callback) {
        let stmt = db.prepare('INSERT INTO answers (answerid, questionid, quizid, statement) VALUES (?, ?, ?, ?)');
        stmt.run(answerid, questionid, quizid, statement, callback);
        stmt.finalize();
    }

    var get_quiz = function (quizid, callback) {
        db.get('SELECT * FROM quizzes WHERE quizid=?', quizid, function (err, quiz) {
            if (err !== null) {
                return callback(err);
            }

            quiz.questions = [];
            new Promise(function (resolve, reject) {
                get_questions(quizid, function (err, questions) {
                    if (err !== null) {
                        reject(err);
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
        });
    };

    var get_questions = function(quizid, callback) {
        db.all('SELECT questionid, statement FROM questions WHERE quizid=?', quizid, function (err, questions) {
            if (err !== null) {
                return callback(err);
            }

            let promises = [];
            for (let i = 0; i < questions.length; ++i) {
                let question = questions[i],
                    questionid = question.questionid;
                promises.push(new Promise(function (resolve, reject) {
                    get_answers(quizid, questionid, function (err, answers) {
                        if (err !== null) {
                            reject(err);
                        } else {
                            resolve(answers);
                        }
                    });
                }));
            }
            Promise.all(promises).then(function(all_answers) {
                for (let i = 0; i < questions.length; ++i) {
                    questions[i].answers = all_answers[i];
                }
                callback(null, questions);
            }).catch(function (err) {
                callback(err, null);
            });
        });
    };

    var get_answers = function(quizid, questionid, callback) {
        let stmt = db.prepare('SELECT answerid, statement FROM answers WHERE quizid=? AND questionid=?');
        stmt.all(quizid, questionid, callback);
        stmt.finalize();
    };

    var check_answer = function (quizid, questionid, answer, callback) {
        db.get('SELECT correct FROM questions WHERE quizid=? AND questionid=?', quizid, questionid, function (err, response) {
            if (err !== null) {
                return callback(err);
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

    return {
        handle: db,
        close: close,

        list_quizzes,
        add_quiz,
        get_quiz,
        check_answer
    };
};
