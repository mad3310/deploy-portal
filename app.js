var express = require('express');
var router = require('./router/router');

var app = express();
app.use("/",router);

app.listen(2000);

console.log("web start gsuccess!!!");