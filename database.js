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
                return callback(err);
            }

            let quizid = this.lastID;
            if ('questions' in quiz && quiz.questions.constructor === Array) {
                for (let i = 0; i < quiz.questions.length; ++i) {
                    add_question(quizid, quiz.questions[i], (err) => callback(err, quizid));
                }
            }
            callback(err, quizid);
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
                for (let i = 0; i < question.answers.length; ++i) {
                    let answerid = i + 1;
                    add_answer(answerid, questionid, quizid, question.answers[i], callback);
                }
            }
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
