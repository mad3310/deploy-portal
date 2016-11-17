/**
 * Created by dongwanlong on 2016/11/2.
 */
var crypto = require('crypto');
var secret='leCloud';

exports.encrypt = function(str){
    if(!str)return;
    var cipher = crypto.createCipher('aes192', secret);
    var enc = cipher.update(str, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
};

exports.decrypt = function(str){
    if(!str)return;
    var decipher = crypto.createDecipher('aes192', secret);
    var dec = decipher.update(str, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
};