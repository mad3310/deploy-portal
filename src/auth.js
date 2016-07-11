var express = require('express');
var request = require('request');
var fs = require('fs');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var common = require('./util.js');


var config = JSON.parse(fs.readFileSync(__dirname+'/config.json'));
var route = express.Router();
var clientId = "";
var clientSecret = "";
var userIp = "";

route.use(bodyParser.urlencoded({ extended: false }));
route.use(bodyParser.json());


route.get('/',function(req, res, next){
    var userName = common.getCookie("username",req);
    var token = common.getCookie("token",req);

    if(!userName && !token){//未登录
        userIp = req.ip;
        res.redirect(config.oauthHost+"/index?redirect_uri="+config.webHost+"/identification");
    }else{//已登录
        fs.readFile(__dirname+"/index.ejs",function(err,data){
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
    var url = config.oauthHost+"/authorize?client_id="+clientId+"&response_type=code&redirect_uri="+config.webHost+"/identification/code";
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

        var httpObj = {
            method: "post",
            uri: config.pythonHost + '/v1/cloud/users/login',
            headers:
            {
                "username": username,
                "logintoken": "cloud_leengine",
                "clientaddr": userIp
            },
            body:JSON.stringify({
                "Email":email,
                "Name":username
            })
        };

        common.sendHttpRequest(httpObj, function(body){
            res.cookie('username',username, { maxAge: config.cookieTime });
            res.cookie('token', body.Details.AccessToken, { maxAge: config.cookieTime });
            res.redirect(config.webHost);
        });
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

module.exports = route;