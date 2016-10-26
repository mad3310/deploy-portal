var os = require('os');
if(os.type()=="Linux"){
    global.configPath = "/usr/local/node/boss/backend/boss_config.json";
}else{
    global.configPath = __dirname+'/config.json';
}

var express = require('express');
var fs = require('fs');

var oauthRouter = require('./auth');
var leEngineRouter = require('./api-proxy');

var config=JSON.parse(fs.readFileSync(global.configPath));
var app = express();

app.use("/",oauthRouter);
app.use("/",leEngineRouter);

app.use(express.static(config.frontSrcPath));

app.listen(80);

console.log("web start success!!!");