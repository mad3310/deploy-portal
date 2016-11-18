var express = require('express');
var request = require('request');
var fs = require('fs');
var ejs = require('ejs');
var os = require('os');
var crypto = require('../common/le-crypto.js');
var bodyParser = require('body-parser');
var common = require('../common/util.js');
var log = require("./../common/le-log4js.js").logger("index");
var config = JSON.parse(fs.readFileSync(global.configPath));
var route = express.Router();


if(/^[\D]*(\d+)\.(\d+)\.(\d+)\.(\d+)$/.test(config.webHost)){
    var webUrl = config.webHost+":"+config.webPort;
}else{
    var webUrl = config.webHost;
}

route.use(bodyParser.urlencoded({ extended: false }));
route.use(bodyParser.json());


route.get('/',function(req, res, next){

    var userName = crypto.decrypt(common.getCookie("username",req));
    var token = crypto.decrypt(common.getCookie("token",req));

    if(!userName && !token){//未登录
        log.info("Login start");
        common.setCookie(res,'userIp', req.ip);
        log.info("Login get url:"+config.oauthHost+"/index?redirect_uri="+webUrl+"/identification");
        res.redirect(config.oauthHost+"/index?redirect_uri="+webUrl+"/identification");
    }else{//已登录
        var defaultLang = common.getCurrentLang(req);

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
    var userIp = common.getCookie("userIp",req);
    var clientId = req.param('client_id');
    var clientSecret = req.param('client_secret');

    var url = config.oauthHost+"/authorize?client_id="+clientId+"&response_type=code&redirect_uri="+webUrl+"/identification/code";
    log.info("Login identification:"+url);

    common.setCookie(res,'clientId', clientId);
    common.setCookie(res,'clientSecret', clientSecret);
    common.setCookie(res,'userIp', req.ip);

    res.redirect(url);
});

route.get('/identification/code',function(req, res, next){
    var clientId = common.getCookie("clientId",req);
    var clientSecret = common.getCookie("clientSecret",req);
    var userIp = common.getCookie("userIp",req);
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
        var email = JSON.parse(body)["email"];
        var usersource = JSON.parse(body)["usersource"];
        if(usersource!=1){
            log.info("Login callBackDetailInfo usersource error :"+usersource);
            if(common.getCurrentLang(req)=='zh-cn'){
                res.send("现阶段只允许乐视网内部用户访问，请点击内网用户登录，输入您的邮箱前缀和密码");
            }else{
                res.send("At this stage only to allow the user to access the music network, please click on the network user login, enter your mailbox prefix and password");
            }
        }else {
            webBackendHostCallBack(username,email);
        }
    }

    function webBackendHostCallBack(username,email){
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
        log.info("Login callBackDetailInfo httpObj :"+JSON.stringify(httpObj));
        common.sendHttpRequest(httpObj, function (body) {
            log.info("Login callBackDetailInfo result :"+JSON.stringify(body));
            if (body.Code == 203 || body.Code == 200) {

                var accessToken = crypto.encrypt(body.Details.AccessToken);
                username = crypto.encrypt(username);

                common.setCookie(res,'username', username);
                common.setCookie(res,'token', accessToken);

                var url = config.oauthHost+"/logout?client_id="+clientId+"&client_secret="+clientSecret;
                request(url, function (error, response, body) {
                    log.info("Logout oauth httpObj success!");
                });

                res.redirect(webUrl);
            }else{
                res.send(body.Message);
            }
        });
    }

});

//获取用户信息
route.get('/user',function(req, res){
    var userName = crypto.decrypt(common.getCookie("username",req));
    var token = crypto.decrypt(common.getCookie("token",req));
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
    var obj = {
        data:{},
        callback:null,
        msgs:[],
        alertMessage:null,
        result:1
    }
    res.clearCookie('username');
    res.clearCookie('token');
    res.send(obj);
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