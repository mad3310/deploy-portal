var request = require('request');
var cookie = require('cookie');
var fs = require('fs');
var crypto = require('../common/crypto.js');
var config = JSON.parse(fs.readFileSync(global.configPath));


var sendHttpRequest = function(httpObj, callBack){
    request(httpObj, function (error, response, body) {
                if(error || !body){
                    return;
                }
                var objBody = JSON.parse(body);
                callBack(objBody);
            }
        );
}

var getCurrentLang = function(req){
    var langArray = req.acceptsLanguages(req['accept-language']);
    if(langArray && langArray.length>0){
        var defaultLang = langArray[0].substr(0,2);
        if(defaultLang=="en"){
            defaultLang = 'en-us';
        }else{
            defaultLang = 'zh-cn';
        }
    }else{
        var defaultLang = config.defaultLang;
    }
    return defaultLang;
}

var getCookie = function(key,req){
    if(req.headers.cookie && config.webHost.indexOf(req.headers.host)!=-1) {
        var cookieObj = cookie.parse(req.headers.cookie);
        if(!cookieObj[key])return "";
        return cookieObj[key];
    }
    return "";
}

var setCookie = function(res,key,value,option){
    var defaultOption = {
        "expires":new Date(Date.now() + config.cookieTime),
        "httpOnly":true,
        "domain":config.cookieDomain
    };
    res.cookie(key, value, defaultOption);
}

exports.getCookie = getCookie;
exports.setCookie = setCookie;
exports.sendHttpRequest = sendHttpRequest;
exports.getCurrentLang = getCurrentLang;