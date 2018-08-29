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

        db.run('CREATE TABLE IF NOT EXISTS questions (questionid INTEGER PRIMARY KEY, quizid INTEGER, statement TEXT, correct INTEGER)', callback);

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
                console.log('Adding quiz failed');
                return callback(err);
            }

            let quizid = this.lastID;
            if ('questions' in quiz && quiz.questions.constructor === Array) {
                var promises = new Array();
                for (let i = 0; i < quiz.questions.length; ++i) {
                    console.log('Add question ' + i);
                    let question = quiz.questions[i];
                    promises.push(new Promise(function (resolve, reject) {
                        add_question(quizid, question, function (err) {
                            if (err != null) {
                                console.log('Adding question ' + i + ' failed.');
                                reject(err);
                            } else {
                                console.log('Adding question ' + i + ' succeeded.');
                                resolve();
                            }
                        });
                    }));
                };
                console.log('Waiting for all questions to add...');
                Promise.all(promises).then(function() {
                    console.log('All questions were successfully added.');
                    callback(null, quizid);
                }).catch(function (errors) {
                    console.log("Questions\' promises have resolved. Something failed.");
                    callback(errors, quizid)
                });
            } else {
                console.log('No questions found.');
                callback(err, quizid);
            }
        });
    };

    var add_question = function (quizid, question, callback) {
        let stmt = db.prepare('INSERT INTO questions (quizid, statement, correct) VALUES (?, ?, ?)');
        stmt.run(quizid, question.statement, question.correct, function (err) {
            if (err !== null) {
                return callback(err);
            }

            let questionid = this.lastID;
            if ('answers' in question && question.answers.constructor === Array) {
                var promises = new Array();
                for (let i = 0; i < question.answers.length; ++i) {
                    let answerid = i + 1;
                    console.log('Add answer ' + answerid + ' for question ' + questionid);
                    promises.push(new Promise(function (resolve, reject) {
                        add_answer(answerid, questionid, quizid, question.answers[i], function (err) {
                            if (err !== null) {
                                console.log('Adding answer ' + answerid + ' for question ' + questionid + ' failed.');
                                reject(err);
                            } else {
                                console.log('Adding answer ' + answerid + ' for question ' + questionid + ' succeeded.');
                                resolve();
                            }
                        });
                    }));
                }
                console.log('Waiting for all answers to add...');
                Promise.all(promises).then(function () {
                    console.log('All answers were successfully added.');
                    callback(null, quizid);
                }).catch(function (errors) {
                    console.log('Some answers failed to add.');
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
        return db.get('SELECT * FROM quizzes WHERE quizid=?', quizid, callback);
    };

    return {
        handle: db,
        close: close,

        list_quizzes,
        add_quiz,
        get_quiz
    };
};
