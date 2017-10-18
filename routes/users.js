var express = require('express');
var router = express.Router();
var multer  = require('multer');
var xlsx = require('node-xlsx');
var fs = require('fs');
var http=require('http'); 
var https=require('https');
var querystring=require('querystring'); 
var request = require('request');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/excles/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
var serverStartTime = Date.now();
var upload = multer({ storage: storage })

/* GET home page. */
router.get('/wxlogin', function(req, res, next) {
	getUUID();

	function getUUID(){
	 	var hreq = https.get('https://login.wx.qq.com/jslogin?appid=wx782c26e4c19acffb&redirect_uri=https%3A%2F%2Fwx.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=zh_CN&_=1508239448402',function(ress){  
	    ress.setEncoding('utf-8');  
	    var str = '';
	    ress.on('end',function(){

	    	var regxp = new RegExp(/^""$/)
	    	var uuid = str.split('"')[1];
	    	var img = '<img src="https://login.weixin.qq.com/qrcode/'+uuid + '"/>'
	    	res.send(img)
	    	getTicket(uuid)

	    });  
	    ress.on('data',function(chunk){
	    	str+=chunk;
	    });  
	 	});
	}
	function getTicket(uuid){
		var hreq = https.get('https://login.wx.qq.com/cgi-bin/mmwebwx-bin/login?loginicon=true&uuid='+uuid+'&tip=0&r=-707878598&_=1508241344680',function(ress){  
	    ress.setEncoding('utf-8');  
	    var str = '';
	    ress.on('end',function(){
	    	console.log('请求ticket。。。。。。');
	    	var code = str.split(';')[0].split('=')[1];
	    	console.log('code='+code);
	    	if(code == 200){
	    		var ticket = str.split('ticket=')[1].split('&uuid')[0];
	    		console.log('ticket=' + ticket);
	    		getPassTicket(ticket,uuid);
	    	}else{
	    		getTicket(uuid);
	    	}
	    	
	    });  
	    ress.on('data',function(chunk){
	    	str+=chunk;
	    });  
	 	});
	}

	function getPassTicket(ticket,uuid){
		
		var hreq = https.get('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?ticket='+ticket+'&uuid='+uuid+'&lang=zh_CN&scan=1508243070&fun=new&version=v2&lang=zh_CN',function(ress){  
	    ress.setEncoding('utf-8');  
	    var str = '';
	    ress.on('end',function(){
	    	console.log('请求PassTicket------->>>>>>>>');
	    	var pass_ticket = str.split('<pass_ticket>')[1].split('</pass_ticket>')[0];
	    	var skey = str.split('<skey>')[1].split('</skey>')[0];
	    	var sid = str.split('<wxsid>')[1].split('</wxsid>')[0];
	    	var uin = str.split('<wxuin>')[1].split('</wxuin>')[0];
	    	console.log('PassTicket='+pass_ticket);
	    	console.log('skey='+skey);
	    	console.log('sid='+sid);
	    	console.log('uin='+uin);
	    	getWxData(pass_ticket,skey,sid,uin)
		    //res.send(pass_ticket)
	    });  
	    ress.on('data',function(chunk){
	    	str+=chunk;
	    });  
	 	});
	}
	function getWxData(pass_ticket,skey,sid,uin){
		var baseRequest = {
			DeviceID:"e734118103793217",
			Sid:sid,
			Skey:skey,
			Uin:uin
		}
		var json = {
				"BaseRequest":baseRequest
		}
		request.post({
		  headers: {'content-type' : 'text/plain;charset=UTF-8'},
		  url:'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=-713029383&pass_ticket='+pass_ticket,
		  json:json
		}, function(error, response, body){
			console.log('getWxData..........')
		  var myUserName = body.User.UserName;
		  console.log(body.User);
		  console.log(myUserName)
		  getAllUsers(pass_ticket,skey);
		  //postMsg(myUserName,'@b63f16520526d2fadcfaa4abf2d39a7a78458101f34eddefa69bb6aa712cc664','~',pass_ticket,baseRequest);
		});
	}
	function getAllUsers(pass_ticket,skey){
		console.log(pass_ticket,skey);
		request.get({
		  url:'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&pass_ticket='+pass_ticket+'&r='+Date.now()+'&seq=0&skey='+skey
		}, function(error, response, body){
			console.log('getAllUsers..........')
		  console.log(body);
		});
	}
	function postMsg(myUserName,toUserName,msg,pass_ticket,baseRequest){
		var json = {
				BaseRequest:baseRequest,
				Msg:{
					ClientMsgId:Date.now(),
					Type:1,
					ToUserName:toUserName,
					LocalID:Date.now(),
					FromUserName:myUserName,
					Content:msg
				}
		}
		request.post({
		  headers: {'content-type' : 'text/plain;charset=UTF-8'},
		  url:'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?lang=zh_CN&pass_ticket='+pass_ticket,
		  json:json
		}, function(error, response, body){
			console.log('postMsg..........')
		  console.log(body);
		});
	}
});

module.exports = router;
