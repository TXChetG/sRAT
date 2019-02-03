// Copyright 2018-2019 Chet Gassett. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
/*jslint es6, this */
const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const database = require('./database');

(function() {
    'use strict';

    var ActiveQuiz = function() {
        /* globals Atomics, SharedArrayBuffer */
        let buffer = new SharedArrayBuffer(4);
        let active = new Int32Array(buffer);
        active[0] = -1;

        let activate = (quizid) => Atomics.store(active, 0, quizid);
        let deactivate = () => Atomics.store(active, 0, -1);
        let isactive = () => (Atomics.load(active, 0) === -1);
        let getid = () => Atomics.load(active, 0);

        return {
            activate: activate,
            deactivate: deactivate,
            getid: getid,
            isactive: isactive
        };
    };

    var randomid = (n) => Math.random().toString(16).substring(2, n + 2);

    const frontend_path = './frontend';
    const common_path = `${frontend_path}/common`;

    const dashboard_root = '/' + randomid(16);
    console.log(`Dashboard Root: ${dashboard_root}`);

    var db = database.Database('srat.db', function(err) {
        if (err !== null) {
            return console.error(`cannot create database: ${err}`);
        }
    });

    var app = express();

    let active_quiz = new ActiveQuiz();

    app.use(bodyParser.json({
        type: () => true
    }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static('frontend'));

    hbs.registerPartials(__dirname + '/frontend/views/partials/');
    app.set('view engine', 'hbs');
    app.set('views', [__dirname + '/frontend/views']);

    app.use(express.static(frontend_path));

    app.get(dashboard_root + '/quizzes/list', function(ignore, res) {
        db.list_quizzes(function(err, rows) {
            if (err !== null) {
                res.send({ 'error': err });
            }
            else {
                res.send(rows);
            }
        });
    });

    app.put(dashboard_root + '/quizzes/new', function(req, res) {
        db.add_quiz(req.body, function(err, quizid) {
            if (err !== null) {
                res.send({ 'error': err });
            }
            else {
                db.get_quiz(quizid, function(err, row) {
                    if (err !== null) {
                        res.send({ 'error': err });
                    }
                    else {
                        res.send(row);
                    }
                });
            }
        });
    });

    app.get(dashboard_root + '/quizzes/new', function(ignore, res) {
        res.locals.page_title = "Create a new quiz";
        res.render('quiz-create.hbs');
    });

    app.post(dashboard_root + '/quizzes/:quizid(\\d+)/:questionid(\\d+)/check', function(req, res) {
        let quizid = req.params.quizid,
            questionid = req.params.questionid;
        db.check_answer(quizid, questionid, req.body, function(err, result) {
            if (err !== null) {
                res.send({ 'error': err });
            }
            else if (result === undefined) {
                res.send({ 'error': `quiz ${quizid}, question ${questionid} does not exist` });
            }
            else {
                res.send(result);
            }
        });
    });

    app.get(dashboard_root + '/quizzes/:quizid(\\d+)', function(req, res) {
        let quizid = req.params.quizid;
        db.get_quiz(quizid, function(err, row) {
            if (err !== null) {
                res.send({ 'error': err });
            }
            else if (row === undefined) {
                res.send({ 'error': `cannot find quiz with quizid=${quizid}` });
            }
            else {
                res.locals.page_title = row.name;
                res.send(row);
            }
        });
    });

    app.put(dashboard_root + '/quizzes/:quizid(\\d+)/open', function(req, res) {
        let quizid = req.params.quizid,
            active = active_quiz.getid();

        if (active !== -1) {
            if (quizid != active) {
                res.send({ 'error': `quiz ${active} is already open` });
            }
            else {
                res.send({ 'quizid': active });
            }
        }
        else {
            db.get_quiz(quizid, function(err, row) {
                if (err !== null) {
                    res.send({ 'error': err });
                }
                else if (row === undefined) {
                    res.send({ 'error': `cannot open quiz with quizid=${quizid}` });
                }
                else {
                    res.send({ 'quizid': active_quiz.activate(quizid) });
                }
            });
        }
    });

    app.get(dashboard_root + '/quizzes/:quizid(\\d+)/view', function(req, res) {
        let quizid = req.params.quizid;
        res.locals.teamcode = dashboard_root;
        res.locals.quizid = quizid;
        res.locals.page_title = "Viewing open quiz";
        res.render('quiz.hbs');
    });

    app.put(dashboard_root + '/quizzes/:quizid(\\d+)/close', function(req, res) {
        let quizid = req.params.quizid,
            active = active_quiz.getid();

        if (active === -1 || quizid != active) {
            res.send({ 'closed': true });
        }
        else {
            db.get_quiz(quizid, function(err, row) {
                if (err !== null) {
                    res.send({ 'error': err });
                }
                else if (row === undefined) {
                    res.send({ 'error': `cannot close quiz with quizid=${quizid}` });
                }
                else {
                    active_quiz.deactivate();
                    res.send({ 'closed': active_quiz.isactive() });
                }
            });
        }
    });

    app.put(dashboard_root + '/teams/new', function(req, res) {
        req.body.teamcode = randomid(16);
        db.add_team(req.body, function(err, teamid) {
            if (err !== null) {
                res.send({ 'error': err });
            }
            else {
                db.get_team_by_id(teamid, function(err, row) {
                    if (err !== null) {
                        res.send({ 'error': err });
                    }
                    else {
                        res.send(row);
                    }
                });
            }
        });
    });

    app.get(dashboard_root + '/teams/new', function(ignore, res) {
        res.locals.dashboard_root = dashboard_root;
        res.locals.page_title = "Create a new team";
        res.render('teams__add.hbs');
    });

    app.use(dashboard_root, function(ignore, res) {
        res.locals.dashboard_root = dashboard_root;
        res.locals.page_title = "Dashboard";
        res.render('dashboard.hbs');
    });

    app.post('/:teamcode([\\da-f]+)/quizzes/:quizid(\\d+)/:questionid(\\d+)/check', function(req, res) {
        let teamcode = req.params.teamcode,
            quizid = req.params.quizid,
            questionid = req.params.questionid;
        db.get_team_by_code(teamcode, function(err, team) {
            if (err !== null) {
                res.send({ 'error': err });
            }
            else if (team === undefined) {
                res.send({ 'error': `team ${teamcode} does not exist` });
            }
            else {
                db.check_answer(quizid, questionid, req.body, function(err, result) {
                    if (err !== null) {
                        res.send({ 'error': err });
                    }
                    else if (result === undefined) {
                        res.send({ 'error': `quiz ${quizid}, question ${questionid} does not exist` });
                    }
                    else {
                        db.save_response(team, result, function(err, result) {
                            if (err !== null) {
                                res.send({ 'error': err });
                            }
                            else if (result === undefined) {
                                res.send({ 'error': 'could not save response for unknown reasons' });
                            }
                            else {
                                res.send(result);
                            }
                        });
                    }
                });
            }
        });
    });

    app.get('/:teamcode([\\da-f]+)/quizzes/:quizid(\\d+)', function(req, res) {
        let teamcode = req.params.teamcode,
            quizid = req.params.quizid,
            active = active_quiz.getid();

        if (active === -1) {
            res.send({ 'error': 'no quiz is open' });
        }
        else if (quizid != active) {
            res.send({ 'error': `quiz ${quizid} is not active` });
        }
        else {
            db.get_team_by_code(teamcode, function(err, row) {
                if (err !== null) {
                    res.send(err);
                }
                else if (row === undefined) {
                    res.send({ 'error': `team ${teamcode} does not exist` });
                }
                else {
                    db.get_quiz(quizid, function(err, row) {
                        if (err !== null) {
                            res.send({ 'error': err });
                        }
                        else if (row === undefined) {
                            res.send({ 'error': `quiz ${quizid} does not exist` });
                        }
                        else {
                            res.send(row);
                            res.locals.page_title = row.name;
                        }
                    });
                }
            });
        }
    });

    app.get('/:teamcode([\\da-f]+)', function(req, res) {
        let teamcode = req.params.teamcode,
            active = active_quiz.getid();

        if (active === -1) {
            return res.redirect('lost.html');
        }

        db.get_team_by_code(teamcode, function(err, row) {
            if (err !== null) {
                res.redirect('lost.html');
            }
            else if (row === undefined) {
                res.redirect('lost.html');
            }
            else {
                res.locals.teamcode = '/' + teamcode;
                res.locals.quizid = active;
                res.locals.page_title = "Active Quiz";
                res.render('quiz.hbs');
            }
        });
    });

    app.get('/:teamcode([\\da-z]+)', function(req, res) {
        let teamcode = req.params.teamcode,
            active = active_quiz.getid();

        if (active === -1) {
            return res.redirect('lost.html');
        }

        db.get_team_by_code(teamcode, function(err, row) {
            if (err !== null) {
                res.redirect('lost.html');
            }
            else if (row === undefined) {
                res.redirect('lost.html');
            }
            else {
                res.locals.teamcode = '/' + teamcode;
                res.locals.quizid = active;
                res.locals.page_title = "Active Quiz";
                res.render('quiz.hbs');
            }
        });
    });

    app.get('/', function(ignore, res) {
        res.redirect('lost.html');
    });

    app.listen(8080);
}());
