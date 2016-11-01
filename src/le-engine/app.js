var express = require('express');
var fs = require('fs');
//资源加载路径配置
var os = require('os');
if(os.type()=="Linux"){
    global.configPath = "/usr/local/node/console/backend/console_config.json";
}else{
    global.configPath = __dirname+'/config.json';
}
//日志系统初始化
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
