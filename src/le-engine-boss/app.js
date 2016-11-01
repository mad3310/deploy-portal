var express = require('express');
var fs = require('fs');
//初始化配置
var os = require('os');
if(os.type()=="Linux"){
    global.configPath = "/usr/local/node/boss/backend/boss_config.json";
}else{
    global.configPath = __dirname+'/config.json';
}
//初始化日志
var log4js = require("./log4js.js");
var app = express();
log4js.configure();
app.use(log4js.useLog());

var oauthRouter = require('./auth');
var leEngineRouter = require('./api-proxy');

var config=JSON.parse(fs.readFileSync(global.configPath));
var app = express();

app.use("/",oauthRouter);
app.use("/",leEngineRouter);

app.use(express.static(config.frontSrcPath));

app.listen(config.webPort);

console.log("web start success!!!");