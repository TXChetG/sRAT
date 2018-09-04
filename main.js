// Copyright 2018 Nicole M. Lozano. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
/*jslint es6, this */
const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const database = require('./database');

(function () {
    'use strict';

    var ActiveQuiz = function () {
        let buffer = new SharedArrayBuffer(4);
        let active = new Int32Array(buffer);
        active[0] = -1;

        let activate = (quizid) => {return Atomics.store(active, 0, quizid)};
        let deactivate = () => Atomics.store(active, 0, -1);
        let getid = () => Atomics.load(active, 0);

        return {
            activate: activate,
            deactivate: deactivate,
            getid: getid
        };
    };

    var randomid = (n) => Math.random().toString(16).substring(2, n + 2);

    const frontend_path = './frontend';
    const common_path = `${frontend_path}/common`;

    // const dashboard_root = '/' + randomid(16);
    const dashboard_root = '/dashboard';
    console.log(`Dashboard Root: ${dashboard_root}`);

    var db = database.Database('srat.db', function (err) {
        if (err !== null) {
            return console.error(`cannot create database: ${err}`);
        }
    });

    var app = express();

    let active_quiz = new ActiveQuiz();

    app.use(bodyParser.json({
        type: () => true
    }));
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(express.static('frontend'));

    hbs.registerPartials(__dirname + '/frontend/common/views/partials/');
    app.set('view engine', 'hbs');
    app.set('views', [__dirname + '/frontend/dashboard/views', __dirname + '/frontend/common/views']);

    app.use(express.static(common_path));

    app.get(dashboard_root + '/quizzes/list', function (ignore, res) {
        db.list_quizzes(function (err, rows) {
            if (err !== null) {
                res.send({'error': err});
            } else {
                res.send(rows);
            }
        });
    });

    app.put(dashboard_root + '/quizzes/new', function (req, res) {
        db.add_quiz(req.body, function (err, quizid) {
            if (err !== null) {
                res.send({'error': err});
            } else {
                db.get_quiz(quizid, function (err, row) {
                    if (err !== null) {
                        res.send({'error': err});
                    } else {
                        res.send(row);
                    }
                });
            }
        });
    });

    app.get(dashboard_root + '/quizzes/new', function (ignore, res) {
        res.render('quiz-create.hbs');
    });

    app.post(dashboard_root + '/quizzes/:quizid(\\d+)/:questionid(\\d+)/check', function (req, res) {
        let quizid = req.params.quizid,
            questionid = req.params.questionid;
        db.check_answer(quizid, questionid, req.body, function (err, result) {
            if (err !== null) {
                res.send({'error': err});
            } else {
                res.send(result);
            }
        });
    });

    app.get(dashboard_root + '/quizzes/:quizid(\\d+)', function (req, res) {
        let quizid = req.params.quizid;
        db.get_quiz(quizid, function (err, row) {
            if (err !== null) {
                res.send({'error': err});
            } else if (row === undefined) {
                res.send({'error': `cannot find quiz with quizid=${quizid}`});
            } else {
                res.send(row);
            }
        });
    });

    app.get(dashboard_root + '/quizzes/:quizid(\\d+)/view', function (req, res) {
        let quizid = req.params.quizid;
        active_quiz.activate(quizid);
        res.locals.quizid = quizid;
        res.locals.dashboard_root = dashboard_root;
        res.render('quiz.hbs');
    });

    app.put(dashboard_root + '/teams/new', function (req, res) {
        req.body.teamcode = randomid(16);
        db.add_team(req.body, function (err, teamid) {
            if (err !== null) {
                res.send({'error': err});
            } else {
                db.get_team(teamid, function (err, row) {
                    if (err !== null) {
                        res.send({'error': err});
                    } else {
                        res.send(row);
                    }
                });
            }
        });
    });

    app.get(dashboard_root + '/teams/new', function(ignore, res){
        res.render('teams__add.hbs');
    });

    app.use(dashboard_root, function (ignore, res) {
        res.locals.dashboard_root = dashboard_root;
        res.render('dashboard.hbs');
    });

    app.get('/new', function (ignore, res) {
        res.redirect(dashboard_root + '/quizzes/new');
    });

    app.get('/', function (ignore, res) {
        res.redirect('lost.html');
    });

    app.listen(8080);
}());
