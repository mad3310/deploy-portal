var express = require('express');
var fs = require('fs');
var leEngineRouter = require('./api-proxy');
var oauthRouter = require('./oauth');

var config=JSON.parse(fs.readFileSync(__dirname+'/config.json'));

var app = express();

app.use("/",oauthRouter);
app.use("/",leEngineRouter);
app.use(express.static(config.frontSrcPath));

app.listen(80);

console.log("web start success!!!");