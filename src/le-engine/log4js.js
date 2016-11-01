/**
 * Created by dongwanlong on 2016/11/1.
 */
var path = require("path");
var fs = require("fs");
var log4js = require("log4js");
var config = JSON.parse(fs.readFileSync(global.configPath));

exports.configure = function() {
    log4js.configure({
        "appenders": [config.logConfig]
    });
};

exports.logger = function(name) {
    var dateFileLog = log4js.getLogger(name);
    dateFileLog.setLevel(log4js.levels.INFO);
    return dateFileLog;
}

exports.useLog = function() {
    return log4js.connectLogger(log4js.getLogger("app"), {level: log4js.levels.INFO});
}