/**
 * Created by dongwanlong on 2016/11/1.
 */
var path = require("path");
var log4js = require("log4js");

exports.configure = function() {
    log4js.configure({
        "appenders": [
            {
                "type": "dateFile",
                "filename": "logs/booklist.log",
                "pattern": "-yyyy-MM-dd",
                "alwaysIncludePattern": true,
                "maxLogSize":2048,
                "backups":10
            }
        ]
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