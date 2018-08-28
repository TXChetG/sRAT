// Copyright 2018 Nicole M. Lozano. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
/*jslint es6 */
const sqlite3 = require('sqlite3').verbose();

module.exports.Database = function (filename = 'srat.db') {
    var db = new sqlite3.Database(filename, function (err) {
        if (err !== null) {
            return console.error(`cannot open database ${filename}: ${err}`);
        }
    });

    db.serialize(function () {
        db.run('CREATE TABLE IF NOT EXISTS quizzes (quizid INTEGER)', function (err) {
            if (err !== null) {
                return console.error(`cannot create quizzes table: ${err}`);
            }
        }).run('CREATE TABLE IF NOT EXISTS teams (teamid INTEGER)', function (err) {
            if (err !== null) {
                return console.error(`cannot create quizzes table: ${err}`);
            }
        });
    });

    var close = function () {
        return db.close(function (err) {
            if (err !== null) {
                return console.error(`cannot open database ${filename}: ${err}`);
            }
        });
    };

    return {
        handle: db,
        close: close
    };
};
