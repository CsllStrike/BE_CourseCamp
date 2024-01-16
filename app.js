// app.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { PythonShell } = require('python-shell');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
const api_url = process.env.API_URL || 'http://127.0.0.1:8082/get-all-active-course';
const pythonPort = process.env.PYTHON_PORT || 5000;

const getRecommendationsScriptPath = path.join(__dirname, 'src', 'routes', 'app.py');

PythonShell.run(getRecommendationsScriptPath, { args: [api_url, pythonPort, host] }, function (err, result) {
    if (err) throw err;

    console.log(`Flask server has started. ${result}`);
});

app.use(
    cors(),
    bodyParser.urlencoded({ extended: true }),
    bodyParser.json()
);
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
    })
);

module.exports = { app, port, host };
