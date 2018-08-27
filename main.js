// Copyright 2018 Nicole M. Lozano. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
/*jslint es6 */
const express = require('express');
const path = require('path');

(function () {
    'use strict';

    var randomid = (n) => Math.random().toString(16).substring(2, n + 2);

    const static_path = path.join(__dirname + '/frontend');
    const dashboard_path = path.join('/', randomid(16));

    var app = express();

    app.use(dashboard_path, express.static(static_path));

    console.log(`Dashboard path: ${dashboard_path}`);

    app.get('/', function (ignore, res) {
        res.redirect(path.join(dashboard_path, 'dashboard.html'));
    });

    app.listen(8080);
}());
