var express = require('express');
var router = express.Router();
var multer  = require('multer');
var xlsx = require('node-xlsx');
var fs = require('fs');
var http=require('http'); 
var https=require('https');
var querystring=require('querystring'); 

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
 //

 
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
	    	var wxsid = str.split('<wxsid>')[1].split('</wxsid>')[0];
	    	var uin = str.split('<wxuin>')[1].split('</wxuin>')[0];
	    	console.log('PassTicket='+pass_ticket);
	    	console.log('skey='+skey);
	    	console.log('wxsid='+wxsid);
	    	console.log('uin='+uin);
		    //res.send(pass_ticket)
	    });  
	    ress.on('data',function(chunk){
	    	str+=chunk;
	    });  
	 	});

	}
});

/* GET users listing. */
router.post('/uploads',upload.single('myfile'), function(req, res, next) {
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
	var queryCount = 0;
	var myfilename = req.file.originalname;
	var datatype = 0;
	var start = '北京市';
	var stop = '西藏自治区';
	var startCity = '北京';
	var stopCity = '北京';
	var rowIndex = 0;
	var xlRows = [];
	var tempRows = [];
	var datatype = req.body.type == 1 ? 1 : 0;
	console.log('类型==='+datatype)
	var queryNoCount = 0;
	var startTime = Date.now();
	var timeoutCount = 0;
	var xyQueryCount = 0;
	var isover = false;
	console.log(req.file.originalname);
	xlRows = xlsx.parse('public/excles/'+req.file.originalname)[0].data;
	su(1, xlRows[rowIndex][0]);
	
	function find(str,cha,num){
    var x=str.indexOf(cha);
    for(var i=0;i<num;i++){
        x=str.indexOf(cha,x+1);
    }
    return x;
    }

	//查询精确地址
	function su(type,word){
		console.log('+++++++++'+word);
		var data = {
			wd:word,
			cid:131,
			type:0,
			newmap:1,
			b:'(8135923.805,432968.26999999955;16319731.805,9362248.27)',
			t:Date.now(),
			pc_ver:2
		}
		var parm = querystring.stringify(data);
		var waitCount = 0;
		var queryTimer = setTimeout(function(){
			if (waitCount > 0){
				console.log('超时--------------');
				timeoutCount++;
		  	waitCount = 0;
		  	queryError();
		    return;
		  }
		}, 3000); 
		//创建请求  
		var hreq=http.request('http://map.baidu.com/su?'+parm,function(ress){  
		    ress.setEncoding('utf-8');  
		    var str ='';
		    waitCount ++;
		    ress.on('end',function(){
		    	waitCount = 0;
		    	clearTimeout(queryTimer);
		    	try{
		    		var result = JSON.parse(str);
			    	if(result.s.length <= 0 ){
			    		//查询不到
			    		if(word.length <= 0) {
			    			//递归结束
			    			console.log('su没有结果======'+type)
					    	queryError();
			    		}else{
			    			//递归删除查询
			    			var w = word.slice(0,word.length-1);
			    			console.log('递归查询---'+w)
			    			if(w.length){
			    				su(type,w);
			    			}else{
			    				queryError();
			    			}
			    		}
			    	}else{
			    		//起点搜索
			    		if(type == 1){	
			    			if(!result.p){
			    				var w = result.s[0];
			    				var start_i = find(w,'$',2);
			    				var end_i = find(w,'$',3);
			    				startCity = w.substring(0,start_i).replace(/\$/g,'');
			    				start = w.substring(start_i,end_i).replace(/\$/g,'');
			    				//start = result.s[0].split(/\$\d/)[0].split('$$')[1].replace(/\$/g,'');
			    				//startCity = result.s[0].split(/\$\d/)[0].split('$$')[0].replace(/\$/g,'');
			    			}else{
			    				start = word;
			    				startCity = "";
			    			}
			    			
				    		//是否关联。第二列是不是第一列的下属
				    		if(datatype == 1){
				    			var w2 = xlRows[rowIndex][0] + '' + xlRows[rowIndex][1];
				    			su(2,w2);
				    		}else{
				    			su(2,xlRows[rowIndex][1]);
				    		}		    		
				    	}
				    	//终点搜索
				    	if(type == 2){
				    		if(!result.p){
				    			var w = result.s[0];
				    			var stop_i = find(w,'$',2);
			    				var stopend_i = find(w,'$',3);
			    				stopCity = w.substring(0,stop_i).replace(/\$/g,'');
			    				stop = w.substring(stop_i,stopend_i).replace(/\$/g,'');

				    			//stop = result.s[0].split(/\$\d/)[0].split('$$')[1].replace(/\$/g,'')
			    				//stopCity = result.s[0].split(/\$\d/)[0].split('$$')[0].replace(/\$/g,'');
				    		}else{
				    			stop = word
			    				stopCity ="";
				    		}
			    			
				    		//stop = result.s[0].split(/\$\d/)[0].replace(/\$/g,'');
				    		queryLens()
				    	}
			    	}
		    	}catch(err){
		    		console.log(err);
		    		if(err instanceof SyntaxError){
		    			console.log('SyntaxError-query');
		    			queryError();
		    		} else if( err instanceof TypeError){
		    			console.log('TypeError-query');
		    			queryError();
		    		}
		    	}
		    });  
		    ress.on('data',function(chunk){ 
		    	str += chunk;
		    });  
		});  
		hreq.on('error',function(err){
			console.log('---su---error------')
			queryError();  
		}); 
		hreq.end(); 
	}
	var sq= '';
	var eq = '';
	var sn = '';
	var en = '';
	//查询距离
	function queryLens(){
		if(xyQueryCount > 2){
			queryError();
			return;
		}
		if(queryCount == 2){
			var data={  
	    newmap:1,
			reqflag:'pcmap',
			biz:1,
			from:'webmap',
			da_par:'direct',
			pcevaname:'pc4.1',
			qt:'nav',
			c:74,
			navtp:4,
			sn:sn,
			en:en,
			sq:sq,
			eq:eq,
			sc:74,
			ec:74,
			mrs:1,
			drag:0,
			version:4,
			route_traffic:1,
			sy:0,
			da_src:'pcmappg.routeaddr',
			extinfo:63,
			tn:'B_NORMAL_MAP',
			nn:0,
			u_loc:'12951465,4842932',
			ie:'utf-8',
			l:12,
			b:'(12937545,4796788;12988809,4866548)',
			t:Date.now()
		}; 
	}else{
		 var sn1 ='';
		 var en1= '';
		 if(startCity){
		 	sn1= '2$$$$$$'+start+'$$1$$'+startCity+'$$'
		 }else{
		 	sn1 = '2$$$$$$'+start+'$$0$$$$'
		 }
		 if(stopCity){
		 	en1= '2$$$$$$'+stop+'$$1$$'+stopCity+'$$'
		 }else{
		 	en1 = '2$$$$$$'+stop+'$$0$$$$'
		 }
		var data={  
	    newmap:1,
			reqflag:'pcmap',
			biz:1,
			from:'webmap',
			da_par:'direct',
			pcevaname:'pc4.1',
			qt:'nav',
			c:1,
			sn:sn1,
			en:en1,
			sc:1,
			ec:1,
			pn:0,
			rn:5,
			mrs:1,
			version:4,
			route_traffic:1,
			sy:0,
			da_src:'pcmappg.searchBox.button',
			extinfo:63,
			tn:'B_NORMAL_MAP',
			nn:0,
			u_loc:'12951465,4842932',
			ie:'utf-8',
			l:12,
			b:'(12937545,4796788;12988809,4866548)',
			t:Date.now()
		}; 
	}  
		var content = querystring.stringify(data);
		var waitCount = 0;
		var queryTimer = setTimeout(function(){
			if(isover)
				return
			if (waitCount > 0){
				console.log('超时--------------');
				timeoutCount++;
		  	waitCount = 0;
		  	queryError();
		    return;
		  }
		}, 3000);

		//创建请求  
		try{
				var hreq = http.request('http://map.baidu.com?'+content,function(ress){  
		    ress.setEncoding('utf-8');  
		    var str = '';
		    waitCount ++;
		    ress.on('end',function(){
		    	waitCount = 0;
		    	clearTimeout(queryTimer); 
		    	try{
		    		var result = JSON.parse(str);
			    	var len = 0;
			    	if(result.content && result.content.routes){
			    		len = result.content.routes[0].legs[0].distance;
			    	}else if(result && result.content && result.content.length > 1){
			    		var s = result.content[0];
			    		var e = result.content[1];
			    		if(queryCount == 2){
			    			console.log('查询失败，直接跳过>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
			    			queryNoCount++;
			    		}else if(queryCount == 0 && s.length > 0 && e.length > 0){
			    			start = s[0].name || s[0].addr;
			    			stop = e[0].name || e[0].addr;
			    			queryCount++;
			    			queryLens();
			    			return;
			    		}else if(queryCount == 1 && s.length > 0 && e.length > 0){
			    			console.log('普通查询没有查到-进行坐标查询---------------------')
			    			if(!s[0].geo || !e[0].geo){
			    				if(!s[0].geo){
				    				start = s[0].name+start;
				    			}
				    			if(!e[0].geo){
				    				stop = e[0].name+stop;
				    			}
			    				queryCount = 0;
			    				xyQueryCount++;
				    			queryLens();
				    			
				    			return;
			    			}
			    			
			    			var x1y1 = s[0].geo.split('|')[2].replace(';','');
			    			var x2y2 = e[0].geo.split('|')[2].replace(';','');

			    			sn = '1$$'+s[0].uid+'$$'+x1y1 + '$$'+ s[0].name + '$$$$$$';
			    			en = '1$$'+e[0].uid+'$$'+x2y2 + '$$'+ e[0].name + '$$$$$$';
			    			sq = start;
			    			eq = stop;
			    			queryCount++;
			    			queryLens();
			    			
			    			return;
			    		}
			    		// }else if(queryCount == 2 && s.length > 0 && e.length > 0){
			    		// 	console.log('第三次查询距离:::::'+start+'----'+stop)
			    		// 	if(datatype == 1){
				    	// 		var w2 = xlRows[rowIndex][0] + '' + xlRows[rowIndex][1];
				    	// 		su(2,w2)
				    	// 	}else{
				    	// 		su(2,xlRows[rowIndex][1])
				    	// 	}		 
			    		// 	queryCount++;
			    		// 	return;
			    		// }
			    	}
			    	console.log(rowIndex + '::::::::' + start + '<--->' + stop + '::::::距离:::' + len/1000);
			    	var arr = [];
				    	arr.push(xlRows[rowIndex][0]);
				    	arr.push(xlRows[rowIndex][1]);
				    	arr.push(len/1000);
				    tempRows.push(arr);
			    	rowIndex++;
			    	queryCount = 0;
			    	xyQueryCount = 0;
			    	if(rowIndex == xlRows.length){
			    		waitCount = 0;
		    			clearTimeout(queryTimer); 
			    		over();
			    	}else{
			    		su(1,xlRows[rowIndex][0])
			    	}
		    	}catch(err){
		    		console.log('catch-error-query');
		    		console.log(err);
		    		if(err instanceof SyntaxError){
		    			console.log('SyntaxError-query');
		    			queryError();
		    		} else if( err instanceof TypeError){
		    			console.log('TypeError-query');
		    			queryError();
		    		}
		    	}
		    });  
		    ress.on('data',function(chunk){
		    	str+=chunk;
		    });  
		});  
		hreq.on('error',function(err){
		  console.error(err);  
		  queryError();
		}); 
		hreq.end();
		}catch(error){
			console.log('post-error');
			console.log(error);
		}
		
	}

	function queryError(){
		console.log('------------------queryError');
  	rowIndex++;
  	queryCount = 0;
  	xyQueryCount = 0;
  	queryNoCount++;
  	if(rowIndex < xlRows.length - 1){
  		var arr = [];
    	arr.push(xlRows[rowIndex][0]);
    	arr.push(xlRows[rowIndex][1]);
    	arr.push(0);
    	tempRows.push(arr);
  		su(1,xlRows[rowIndex][0])
  	}else{
  		console.log('==>>>>>>>>查询结束:::'+ queryNoCount + '条查询失败')
  		over();
  	}
	}
	function over(){
		isover = true;
		console.log(queryNoCount + '条查询失败')
		var m = parseInt((Date.now() - startTime)/1000/60, 10);
		var s = parseInt((Date.now() - startTime)/1000%60, 10);
		var useTime = m + '分' + s +'秒';
		var buffer = xlsx.build([
	    {
	        name:'sheet1',
	        data:tempRows
	    }        
		]);
		//将文件内容插入新的文件中
		var filePath = '/excles/'+myfilename + Date.now()+'.xlsx';
		fs.writeFileSync('public'+filePath,buffer,{'flag':'w'});
		res.send('<h3>总共查询'+rowIndex+'条，其中'+queryNoCount + '条数据没有查到，查询所用时间为：'+useTime+'</h3><br><a href = "http://10.236.91.57:3000'+filePath+'">点我下载</a><br/> <br/><a href = "http://10.236.91.57:3000">继续查询</a>');
	}
});

module.exports = router;
