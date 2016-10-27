var request = require('request');
var cookie = require('cookie');

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
    if(req.headers.cookie) {
        var cookieObj = cookie.parse(req.headers.cookie);
        if(cookieObj[key])return cookieObj[key];
    }
    return "";
}

exports.getCookie = getCookie;
exports.sendHttpRequest = sendHttpRequest;
exports.getCurrentLang = getCurrentLang;