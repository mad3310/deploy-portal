/**
 * Created by dongwanlong on 2016/7/8.
 */
var fs = require('fs');
var config = JSON.parse(fs.readFileSync(__dirname+'/config.json'));
var app = require('./src/'+config.app+'/app.js');