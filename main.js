// Copyright 2018 Nicole M. Lozano. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
/*jslint es6 */
const express = require('express');
const path = require('path');
const opn = require('opn');
const hbs = require('hbs');

(function () {
    'use strict';

    var randomid = (n) => Math.random().toString(16).substring(2, n + 2);

    const frontend_path = './frontend';
    const common_path = `${frontend_path}/common`;
    const dashboard_path = `${frontend_path}/dashboard`;

    const dashboard_root = '/' + randomid(16);
    console.log(`Dashboard Root: ${dashboard_root}`);
    console.log(`Frontend Path: ${frontend_path}`);
    console.log(`Dashboard Path: ${dashboard_path}`);

    var app = express();
    hbs.registerPartials(__dirname + '/frontend/common/views/partials');
    app.set('view engine', 'hbs');
    app.set('views',[__dirname + '/frontend/dashboard/views',__dirname + '/frontend/common/views']);

    app.use(express.static(common_path));
    app.use(dashboard_root, function(req,res,next){
        res.render('dashboard.hbs');
    });

    app.get('/dashboard', (req,res) => {
        res.render('dashboard.hbs');
    })

    app.get('/', function (ignore, res) {
        res.redirect('lost.html');
    });

    app.listen(8080, function () {
        opn(`http://localhost:8080${dashboard_root}`, {'wait': false});
        //opn(`http://localhost:8080/dashboard`, {'wait': false})
    });
}());