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
        return db.run('INSERT INTO quizzes (name) VALUES (?)', quiz.name, callback);
    };

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
