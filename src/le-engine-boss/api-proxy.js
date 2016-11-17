/**
 * Created by dongwanlong on 2016/7/8.
 */
var express = require('express');
var httpProxy = require('http-proxy');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var common = require('../common/util.js');
var crypto = require('../common/le-crypto.js');

var config=JSON.parse(fs.readFileSync(global.configPath));
var route = express.Router();
var proxy = httpProxy.createProxyServer({});

route.use(bodyParser.urlencoded({ extended: false }));
route.use(bodyParser.json());

route.use(function (req, res, next) {
    var ext = path.extname(req.path);
    ext = ext ? ext.slice(1) : 'unknown';
    if(ext==='unknown'){
        leEngineCallBack(req, res);
    }else{
        next();
    }
});


function leEngineCallBack(req, res){
    var userName = crypto.decrypt(common.getCookie("username",req));
    var token = crypto.decrypt(common.getCookie("token",req));

    var httpObj = {
        method: req.method,
        uri: config.backendHost + req.originalUrl,
        headers: {
            "username": userName,
            "admintoken": token
        },
        body: JSON.stringify(req.body)
    };
    common.sendHttpRequest(httpObj, function (body) {
        var obj = {
            data: body,
            callback: null,
            msgs: [],
            alertMessage: null,
            cookieLost:(!userName||!token)?1:0,
            result: 1
        }
        res.send(obj);
    });
}

module.exports = route;