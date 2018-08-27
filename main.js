// Copyright 2018 Nicole M. Lozano. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
/*jslint es6 */
const express = require('express');
const path = require('path');

(function () {
    'use strict';

    const static_path = path.join(__dirname + '/frontend');

    var app = express();

    app.use(express.static(static_path));

    app.get('/', function (ignore, res) {
        res.redirect('dashboard.html');
    });

    app.listen(8080);
}());
