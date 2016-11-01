var express = require('express');
var request = require('request');
var fs = require('fs');
var ejs = require('ejs');
var os = require('os');
var bodyParser = require('body-parser');
var common = require('../common/util.js');
var log = require("./log4js.js").logger("index");

var config = JSON.parse(fs.readFileSync(global.configPath));
var route = express.Router();
var clientId = "";
var clientSecret = "";
var userIp = "";

if(!/^[\D]*(\d+)\.(\d+)\.(\d+)\.(\d+)$/.test(config.webHost)){
    var webUrl = config.webHost;
}else{
    var webUrl = config.webHost+":"+config.webPort;
}

route.use(bodyParser.urlencoded({ extended: false }));
route.use(bodyParser.json());


route.get('/',function(req, res, next){
    var userName = common.getCookie("username",req);
    var token = common.getCookie("token",req);

    if(!userName && !token){//未登录
        log.info("Login start");
        userIp = req.ip;
        log.info("Login get url:"+config.oauthHost+"/index?redirect_uri="+webUrl+"/identification");
        res.redirect(config.oauthHost+"/index?redirect_uri="+webUrl+"/identification");
    }else{//已登录
        fs.readFile(config.frontSrcPath + "/index.ejs",function(err,data){
            if (err) {
                return console.error(err);
            };
            var template = data.toString();
            var dictionary = {
                name:6
            };
            var html = ejs.render(template,dictionary);
            res.writeHead(200,{"Content-Type":"text/html;charset=UTF8"});
            res.end(html);
        });
    }
});

route.get('/identification',function(req, res, next){
    clientId = req.param('client_id');
    clientSecret = req.param('client_secret');
    var url = config.oauthHost+"/authorize?client_id="+clientId+"&response_type=code&redirect_uri="+webUrl+"/identification/code";
    log.info("Login identification:"+url);
    res.redirect(url);
});

route.get('/identification/code',function(req, res, next){
    var code = req.param('code');
    var url = config.oauthHost+"/accesstoken?grant_type=authorization_code&code="+code+"&client_id="+clientId+"&client_secret="+clientSecret+"&redirect_uri=http://127.0.0.1/unused";
    log.info("Login identification-code url:"+url);
    request(url, callBackAccessToken);

    function callBackAccessToken(error, response, body){
        var access_token = JSON.parse(body)["access_token"];
        var url = config.oauthHost+"/userdetailinfo?access_token="+access_token;
        log.info("Login callBackAccessToken url:"+url);
        request(url, callBackDetailInfo);
    }

    function callBackDetailInfo(error, response, body){
        log.info("Login callBackDetailInfo body:"+JSON.stringify(body));
        var username = JSON.parse(body)["username"];
        var usersource = JSON.parse(body)["usersource"];

        if(usersource!=1){
            res.send("现阶段只允许乐视网内部用户访问，请点击内网用户登录，输入您的邮箱前缀和密码");
        }else {
            var httpObj = {
                method: "get",
                uri: config.backendHost + '/v1/admin/users/login?username='+username,
                headers: {
                    "username": username,
                    "logintoken":config.logintoken,
                    "clientaddr": userIp
                },
                body: JSON.stringify({
                    "username": username
                })
            };
            log.info("Login callBackDetailInfo httpObj :"+JSON.stringify(httpObj));
            common.sendHttpRequest(httpObj, function (body) {
                log.info("Login callBackDetailInfo result :"+JSON.stringify(body));
                if (body.Code == 203 || body.Code == 200) {
                    res.cookie('username', username, {expires: new Date(Date.now() + config.cookieTime), httpOnly: true});
                    var adminToken = '';
                    if (body.Details) {
                        adminToken = body.Details.AdminToken;
                    }
                    res.cookie('token', adminToken, {
                        expires: new Date(Date.now() + config.cookieTime),
                        httpOnly: true
                    });
                    res.redirect(webUrl);
                } else {
                    res.send(body.Message);
                }
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
    log.info("User Logout Url: "+url);
    request(url, function (error, response, body) {
        res.clearCookie('username');
        res.clearCookie('token');
        log.info("Logout Response: "+response);
        log.info("Logout Response Body: "+body);
        var obj = {
            data:{},
            callback:null,
            msgs:[],
            alertMessage:null,
            result:1
        }
        log.info("Logout Response Obj: "+obj);
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