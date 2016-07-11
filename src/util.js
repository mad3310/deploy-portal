var request = require('request');
var cookie = require('cookie');

var sendHttpRequest = function(httpObj, callBack){
    request(httpObj, function (error, response, body) {
                if(error || !body){
                    console.log(error);
                    return;
                }
                var objBody = JSON.parse(body);
                callBack(objBody);
            }
        );
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