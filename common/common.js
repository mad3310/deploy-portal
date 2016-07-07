var request = require('request');
var cookie = require('cookie');

var sendHttpRequest = function(httpObj, callBack){
    request(httpObj, function (error, response, body) {
                if(error || !body){
                    console.log(error);
                    return;
                }
                //console.log(body);
                var objBody = JSON.parse(body);
                if(objBody.Code==203){
                    callBack(objBody);
                }else{
                    console.log("Code is not 203, is "+objBody.Code+",please check it!");
                }
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