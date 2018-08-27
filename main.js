// Copyright 2018 Nicole M. Lozano. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
/*jslint es6 */
const express = require('express');
const path = require('path');
const opn = require('opn');

(function () {
    'use strict';

    var randomid = (n) => Math.random().toString(16).substring(2, n + 2);

    const frontend_path = path.join(__dirname, 'frontend');
    const common_path = path.join(frontend_path, 'common');
    const dashboard_path = path.join(frontend_path, 'dashboard');

    const dashboard_root = path.join('/', randomid(16));
    console.log(`Dashboard path: ${dashboard_root}`);

    var app = express();

    app.use(express.static(common_path));
    app.use(dashboard_root, express.static(dashboard_path));

    app.get('/', function (ignore, res) {
        res.redirect('lost.html');
    });

    opn(`http://127.0.0.1:8080${dashboard_root}`, {'wait': false});

    app.listen(8080);
}());
