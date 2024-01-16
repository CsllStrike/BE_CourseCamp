const express = require('express');
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require('http');
const path = require('path');

require('dotenv').config();

const mysql = require('mysql');
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT;
const host = process.env.HOST;

app.use(
    cors(),
    bodyParser.urlencoded({ extended: true }),
    bodyParser.json()
);

app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true,
    })
);

app.use(require('./src/db/dbConnector')(express, mysql))

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "coursecamp2",
});

//Auth
function authenticateToken(req, res, next) {
    let token = req.body.token;

    if (!token) {
        return res.status(401).send({
            message: "No token provided!",
        });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({
                message: "Unauthorized!",
            });
        }
        req.userId = decoded.id;
        next();
    });
}

app.use(
    require('./src/routes/UserController')(express, con, authenticateToken),
    require('./src/routes/CourseController')(express, con, authenticateToken),
    require('./src/routes/RecommendController')(express, con, authenticateToken),
    require('./src/routes/CategoryController')(express, con, authenticateToken),
    require('./src/routes/ModulController')(express, con, authenticateToken),
    require('./src/routes/LearnController')(express, con, authenticateToken)
)

http.createServer(app)
    .listen({ port, host }, function (err) {
        if (err) {
            console.log(err)
            process.exit(1)
        }
        console.log(`Server listening at ${port}`)
    })