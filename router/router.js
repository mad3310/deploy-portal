var express = require('express');
var httpProxy = require('http-proxy');
var request = require('request');
var querystring = require('querystring');
var fs = require('fs');
var http = require('http');
var ejs = require('ejs');
var path = require('path');
var bodyParser = require('body-parser');
var common = require('../common/util.js');



var config=JSON.parse(fs.readFileSync(__dirname+'/../common/config.json'));
var route = express.Router();
var proxy = httpProxy.createProxyServer({});
var clientId = "";
var clientSecret = "";


route.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
route.use(bodyParser.json())

route.use(function (req, res, next) {
	var ext = path.extname(req.path);
	ext = ext ? ext.slice(1) : 'unknown';
	if(ext==='unknown'){
		next();
	}else{
		proxy.web(req, res, { target:config.resourcesHost });
	}
});

route.get('/',function(req, res, next){
	var userName = common.getCookie("username",req);
	var token = common.getCookie("token",req);

	if(!userName && !token){//未登录
		res.redirect("https://oauth.lecloud.com/index?redirect_uri="+config.webHost+"/identification");
	}else{//已登录
		fs.readFile(__dirname+"/../index.ejs",function(err,data){
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

/****************************登录相关操作****************************/
route.get('/identification',function(req, res, next){
	clientId = req.param('client_id');
	clientSecret = req.param('client_secret');
   var url = "https://oauth.lecloud.com/authorize?client_id="+clientId+"&response_type=code&redirect_uri="+config.webHost+"/identification/code";
   res.redirect(url);
});
route.get('/identification/code',function(req, res, next){
	var code = req.param('code');
	var url = "https://oauth.lecloud.com/accesstoken?grant_type=authorization_code&code="+code+"&client_id="+clientId+"&client_secret="+clientSecret+"&redirect_uri=http://127.0.0.1:2000/zard";

	request(url, CallBackAccessToken);

	function CallBackAccessToken(error, response, body){
		var access_token = JSON.parse(body)["access_token"];
		var url = "https://oauth.lecloud.com/userdetailinfo?access_token="+access_token;
		request(url, CallBackDetailInfo);
	}

	function CallBackDetailInfo(error, response, body){
		var username = JSON.parse(body)["username"];
		var email = JSON.parse(body)["email"];

		var httpObj = {
			method: "post",
			uri: config.pythonHost + '/v1/cloud/users/login',
			headers:
			{
				"username": username,
				"logintoken": "cloud_leengine",
				"clientaddr": "127.0.0.1"
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


/****************************登录相关操作END*************************/

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
	var url = "https://oauth.lecloud.com/logout?client_id="+clientId+"&client_secret="+clientSecret;
	request(url, function (error, response, body) {

	});

	var obj = {
		data:{},
		callback:null,
		msgs:[],
		alertMessage:null,
		result:1
	}
	res.send(obj);
});

//获取仓库列表(查看镜像group 列表)
route.get('/imagegroups',function(req, res){
	var userName = common.getCookie("username",req);
	var token = common.getCookie("token",req);

	var httpObj = {
		method: "get",
		uri: config.pythonHost+'/v1/cloud/imagegroups',
		headers:
		{
			"username": userName,
			"accesstoken": token
		},
		body:""
	};
	common.sendHttpRequest(httpObj, function(body){
		var obj = {
			data:body,
			callback:null,
			msgs:[],
			alertMessage:null,
			result:1
		}
		res.send(obj);
	});

});

//创建创库(创建镜像group)
route.post('/imagegroups',function(req, res){
	var userName = common.getCookie("username",req);
	var token = common.getCookie("token",req);
	var httpObj = {
		method: "post",
		uri: config.pythonHost+'/v1/cloud/imagegroups',
		headers:
		{
			"username": userName,
			"accesstoken": token
		},
		body:JSON.stringify(req.body)
	};
	common.sendHttpRequest(httpObj, function(body){
		var obj = {
			data:body,
			callback:null,
			msgs:[],
			alertMessage:null,
			result:1
		}
		res.send(obj);
	});
});

//修改仓库信息(修改镜像group 信息)
route.put('/imagegroups/:imagegroupid',function(req, res){
	var userName = common.getCookie("username",req);
	var token = common.getCookie("token",req);
	var httpObj = {
		method: "post",
		uri: config.pythonHost+'/v1/cloud/imagegroups/'+req.params.imagegroupid,
		headers:
		{
			"username": userName,
			"accesstoken": token
		},
		body:JSON.stringify(req.body)
	};
	common.sendHttpRequest(httpObj, function(body){
		var obj = {
			data:body,
			callback:null,
			msgs:[],
			alertMessage:null,
			result:1
		}
		res.send(obj);
	});
});

//查看仓库信息(查看镜像group 信息)
route.get('/imagegroups/:imagegroupid',function(req, res){
	var userName = common.getCookie("username",req);
	var token = common.getCookie("token",req);
	var httpObj = {
		method: "post",
		uri: config.pythonHost+'/v1/cloud/imagegroups/'+req.params.imagegroupid,
		headers:
		{
			"username": userName,
			"accesstoken": token
		},
		body:JSON.stringify(req.body)
	};
	common.sendHttpRequest(httpObj, function(body){
		var obj = {
			data:body,
			callback:null,
			msgs:[],
			alertMessage:null,
			result:1
		}
		res.send(obj);
	});
});

module.exports = route;