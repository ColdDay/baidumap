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

router.post('/getimg', function(req, res, next) {
	var list = JSON.parse(req.body.list);
	var store = req.body.store;
	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var code = item.code;
		if(code.trim().toString().length == 0){
			code = i;
		}
		for (var j = 0; j < item.imgs.length; j++) {
			var imgSrc = item.imgs[j];
			(function(index,link,id){
				request.get({
				  url:link,
				  encoding: 'binary'
				}, function(error, response, body){
					fs.writeFileSync('folds/'+store+'-'+id.toString().replace('/','_')+'('+index+').jpg', body, 'binary');
				});
			})(j,imgSrc,code)
		}
	}
	res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' 3.2.1')
	res.send('');

});
/* GET home page. */
router.get('/wxlogin', function(req, res, next) {

	var headers = {
		// 'Content-Type' : 'text/plain;charset=UTF-8',
		'user-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
		'Host':'wx.qq.com',
		'Accept-Language':'zh-CN,en;q=0.8,zh;q=0.6,zh-TW;q=0.4,ja;q=0.2,id;q=0.2,ru;q=0.2',
		'Connection':'keep-alive',
		'Referer':'https://wx.qq.com/',
		'DNT':'1'
	}
	var myUserName = '';
	var pass_ticket = '';
	var skey = '';
	var sid = '';
	var uin = '';
	var deviceId = 'e'+Math.random().toFixed(15).substring(2,17)
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
	    	}else if(code == 408){
	    		getTicket(uuid);
	    	}else{
	    		console.log('超时');
	    	}
	    	
	    });  
	    ress.on('data',function(chunk){
	    	str+=chunk;
	    });  
	 	});
	}

	function getPassTicket(ticket,uuid){
		request.get({
		  url:'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?ticket='+ticket+'&uuid='+uuid+'&lang=zh_CN&scan=1508243070&fun=new&version=v2&lang=zh_CN',
		}, function(error, response, body){
			console.log('请求PassTicket------->>>>>>>>');
			var str = body.toString();
    	pass_ticket = str.split('<pass_ticket>')[1].split('</pass_ticket>')[0];
    	skey = str.split('<skey>')[1].split('</skey>')[0];
    	sid = str.split('<wxsid>')[1].split('</wxsid>')[0];
    	uin = str.split('<wxuin>')[1].split('</wxuin>')[0];
    	setCookie(response.headers['set-cookie'])
    	wxInit()
		});
	}

	function wxInit(){
		var baseRequest = {
			DeviceID:deviceId,
			Sid:sid,
			Skey:skey,
			Uin:uin
		}
		var json = {
				"BaseRequest":baseRequest
		}
		request.post({
		  headers: headers,
		  url:'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=-713029383&pass_ticket='+pass_ticket,
		  json:json
		}, function(error, response, body){
			console.log('getWxData..........');
		 	myUserName = body.User.UserName;
		  statusNotify();
		  getAllUsers();
		});
	}

	function statusNotify(){
		var json = {
			BaseRequest:{
				DeviceID:deviceId,
				Sid:sid,
				Skey:skey,
				Uin:uin
			},
			Code:3,
			FromUserName:myUserName,
			ToUserName:myUserName,
			ClientMsgId:Date.now()
		}
		request.post({
		  headers: headers,
		  url:'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxstatusnotify?pass_ticket='+pass_ticket,
		  json:json
		}, function(error, response, body){
			console.log('statusNotify..........');
			console.log(body)
		  
		});
	}

	function getAllUsers(){
		request.get({
			headers: headers,
		  url:'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&pass_ticket='+pass_ticket+'&r='+Date.now()+'&seq=0&skey='+skey
		}, function(error, response, body){
			console.log('getAllUsers..........')
			console.log(body)
		  var list = JSON.parse(body).MemberList;
		  console.log(list.length)
		  for (var i = 0; i < list.length; i++) {
		  	var member = list[i];
		  	console.log(member.NickName,member.UserName);
		  	// if(member.NickName == '曹利敏') {
		  	// 	postMsg(myUserName,member.UserName,'走吗');
		  	// 	break;
		  	// }
		  }
		});
	}
	var member = {
		"Uin": 0,
		"UserName": "@4fefa813b154a90b245bd795d42d10bb64eac76235793642f87601b64e528ee3",
		"NickName": "孙常淘",
		"HeadImgUrl": "/cgi-bin/mmwebwx-bin/webwxgeticon?seq=661865615&username=@4fefa813b154a90b245bd795d42d10bb64eac76235793642f87601b64e528ee3&skey=@crypt_a1017fd0_14958be5690f3a6972e2e5e31b97bdfb",
		"ContactFlag": 3,
		"MemberCount": 0,
		"MemberList": [],
		"RemarkName": "",
		"HideInputBarFlag": 0,
		"Sex": 1,
		"Signature": "开心每一天",
		"VerifyFlag": 0,
		"OwnerUin": 0,
		"PYInitial": "SCT",
		"PYQuanPin": "sunchangtao",
		"RemarkPYInitial": "",
		"RemarkPYQuanPin": "",
		"StarFriend": 0,
		"AppAccountFlag": 0,
		"Statues": 0,
		"AttrStatus": 4133,
		"Province": "山东",
		"City": "威海",
		"Alias": "",
		"SnsFlag": 17,
		"UniFriend": 0,
		"DisplayName": "",
		"ChatRoomId": 0,
		"KeyWord": "",
		"EncryChatRoomId": "",
		"IsOwner": 0
		}
	function postMsg(myUserName,toUserName,msg){
		var json = {
				BaseRequest:{
					DeviceID:deviceId,
					Sid:sid,
					Skey:skey,
					Uin:uin
				},
				Msg:{
					ClientMsgId:Date.now(),
					Type:1,
					LocalID:Date.now(),
					FromUserName:myUserName,
					ToUserName:toUserName,
					Content:msg
				},
				Scene:0
		}
		request.post({
		  headers: headers,
		  url:'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?lang=zh_CN&pass_ticket='+pass_ticket,
		  json:json
		}, function(error, response, body){
			console.log('postMsg..........')
		  console.log(body);
		});
	}

	function setCookie(cookies){
		var wxuin = cookies[0].split(';')[0];
		var wxsid = cookies[1].split(';')[0];
		var wxloadtime = cookies[2].split(';')[0];
		var webwx_data_ticket = cookies[4].split(';')[0];
		var webwxuvid = cookies[5].split(';')[0];
		var webwx_auth_ticket = cookies[6].split(';')[0];
		var last_wxuin = cookies[0].split(';')[0];
		var wxuin = cookies[0].split(';')[0];
		headers['Cookie'] = 'MM_WX_NOTIFY_STATE=1; MM_WX_SOUND_STATE=1; '+wxuin+';'+wxsid+'; '+wxloadtime+'; mm_lang=zh_CN; '+webwx_data_ticket+'; '+webwxuvid+'; '+webwx_auth_ticket+'; login_frequency=1; '+wxuin;
	}
});

module.exports = router;
