var express = require('express');
var request = require('request');
var fs = require('fs');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var common = require('../common/util.js');

var config = JSON.parse(fs.readFileSync(global.configPath));
var route = express.Router();
var clientId = "";
var clientSecret = "";
var userIp = "";
var webUrl = config.webHost+":"+config.webPort;

route.use(bodyParser.urlencoded({ extended: false }));
route.use(bodyParser.json());

route.get('/',function(req, res, next){


    var userName = common.getCookie("username",req);
    var token = common.getCookie("token",req);

    if(!userName && !token){//未登录
        userIp = req.ip;
        res.redirect(config.oauthHost+"/index?redirect_uri="+webUrl+"/identification");
    }else{//已登录
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

        if(!req.query.lang){//默认语言版本
            res.redirect(webUrl+"/?lang="+defaultLang);
        }else{
            fs.readFile(config.frontSrcPath+"/indexs/le-engine/index.ejs",function(err,data){
                if (err) {
                    return console.error(err);
                };
                var template = data.toString();
                var dictionary = {
                    lang:req.query.lang
                };
                var html = ejs.render(template,dictionary);
                res.writeHead(200,{"Content-Type":"text/html;charset=UTF8"});
                res.end(html);
            });
        }

    }
});

route.get('/identification',function(req, res, next){
    clientId = req.param('client_id');
    clientSecret = req.param('client_secret');
    var url = config.oauthHost+"/authorize?client_id="+clientId+"&response_type=code&redirect_uri="+webUrl+"/identification/code";
    res.redirect(url);
});

route.get('/identification/code',function(req, res, next){
    var code = req.param('code');
    var url = config.oauthHost+"/accesstoken?grant_type=authorization_code&code="+code+"&client_id="+clientId+"&client_secret="+clientSecret+"&redirect_uri=http://127.0.0.1/unused";
    request(url, callBackAccessToken);

    function callBackAccessToken(error, response, body){
        var access_token = JSON.parse(body)["access_token"];
        var url = config.oauthHost+"/userdetailinfo?access_token="+access_token;
        request(url, callBackDetailInfo);
    }

    function callBackDetailInfo(error, response, body){
        var username = JSON.parse(body)["username"];
        var email = JSON.parse(body)["email"];
        var usersource = JSON.parse(body)["usersource"];
        if(usersource!=1){
            res.send("现阶段只允许乐视网内部用户访问，请点击内网用户登录，输入您的邮箱前缀和密码");
        }else {
            var httpObj = {
                method: "post",
                uri: config.backendHost + '/v1/cloud/users/login',
                headers: {
                    "username": username,
                    "logintoken":config.logintoken,
                    "clientaddr": userIp
                },
                body: JSON.stringify({
                    "Email": email,
                    "Name": username
                })
            };
            common.sendHttpRequest(httpObj, function (body) {
                res.cookie('username', username, {expires: new Date(Date.now() + config.cookieTime), httpOnly: true});
                res.cookie('token', body.Details.AccessToken, {
                    expires: new Date(Date.now() + config.cookieTime),
                    httpOnly: true
                });
                res.redirect(webUrl);
            });
        }
    }
});

//获取用户信息
route.get('/user',function(req, res){
    var userName = common.getCookie("username",req);
    var token = common.getCookie("token",req);
    var obj = {
        data:{
            "username":userName
        },
        callback:null,
        msgs:[],
        alertMessage:null,
        result:1
    }
    res.send(obj);
});

//退出
route.get('/user/logout',function(req, res){
    var url = config.oauthHost+"/logout?client_id="+clientId+"&client_secret="+clientSecret;
    request(url, function (error, response, body) {
        res.clearCookie('username');
        res.clearCookie('token');
        var obj = {
            data:{},
            callback:null,
            msgs:[],
            alertMessage:null,
            result:1
        }
        res.send(obj);
    });
});

//获取脚本文件信息
route.get('/shell',function(req, res){
    var type = req.param('type');
    var filePath = __dirname+"/shell";
    if(type=='compile'){
        filePath += "/compile-init-shell.sh"
    }else if(type=='dockfile'){
        filePath += "/dockfile-init-shell.sh"
    }else if(type=='health-check'){
        filePath += "/health-check-init-shell.sh"
    }else if(type=='service-start'){
        filePath += "/service-start-init-shell.sh"
    }else{
    }

    fs.readFile(filePath,function(err,data){
        if (err) {
            return console.error(err);
        };
        var obj = {
            data:{file:data.toString()},
            callback:null,
            msgs:[],
            alertMessage:null,
            result:1
        }
        res.send(obj);
    });
});

//获取backendHost值
route.get('/backendhost',function(req, res){
    var backendHost = config.backendHost;
    var obj = {
        data:{
            "backendhost":backendHost
        },
        callback:null,
        msgs:[],
        alertMessage:null,
        result:1
    }
    res.send(obj);
});


module.exports = route;