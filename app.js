var express = require('express');
var router = require('./router/router');
var common = require('./common/common.js');
var cookie = require('cookie');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();
app.use("/",router);
app.use(bodyParser.urlencoded({extended: true}));

app.listen(2000);

console.log("web start success!!!");