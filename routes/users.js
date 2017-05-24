var express = require('express');
var router = express.Router();
var multer  = require('multer');
var xlsx = require('node-xlsx');
var fs = require('fs');
var http=require('http');  
var querystring=require('querystring'); 

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/excles/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
var upload = multer({ storage: storage })

/* GET users listing. */
router.post('/uploads',upload.single('myfile'), function(req, res, next) {
	var queryCount = 0;
	var myfilename = req.file.originalname;
	var datatype = 0;
	var start = '北京市';
	var stop = '西藏自治区';
	var rowIndex = 0;
	var xlRows = [];
	var tempRows = [];
	var datatype = req.body.type;

	console.log(myfilename);
	xlRows = xlsx.parse('public/excles/'+req.file.originalname)[0].data;
	console.log(xlRows);
	su(1, xlRows[rowIndex][0]);
	//查询精确地址
	function su(type,word){
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
		//创建请求  
		var hreq=http.request('http://map.baidu.com/su?'+parm,function(ress){  
		    ress.setEncoding('utf-8');  
		    var str ='';
		    ress.on('end',function(){
		    	var result = JSON.parse(str);
		    	if(result.s.length <= 0 ){
		    		//查询不到
		    		if(word.length <= 0) {
		    			//递归结束，
				    	var arr = [];
					    	arr.push(xlRows[rowIndex][0]);
					    	arr.push(xlRows[rowIndex][1]);
					    	arr.push(0);
					    tempRows.push(arr);
					    su(1,tempRows[rowIndex][0])
		    		}else{
		    			//递归删除查询
		    			var w = word.slice(0,word.length-1)
		    			su(type,w)
		    		}
		    	}else{
		    		//起点
		    		if(type == 1){	
		    			start = result.q;
			    		//start = result.s[0].split(/\$\d/)[0].replace(/\$/g,'');
			    		//是否关联。第二列是不是第一列的下属
			    		if(datatype == 1){
			    			var w2 = xlRows[rowIndex][0] + ' ' + xlRows[rowIndex][1];
			    			su(2,w2)
			    		}else{
			    			su(2,xlRows[rowIndex][1])
			    		}		    		
			    	}
			    	//终点
			    	if(type == 2){
			    		stop = result.q;
			    		if(queryCount > 0){
			    			console.log('二次元查询')
		    				stop = result.s[0].split(/\$\d/)[0].replace(/\$/g,'');
		    			}
			    		//stop = result.s[0].split(/\$\d/)[0].replace(/\$/g,'');
			    		queryLens()
			    	}
		    	}
		    });  
		    ress.on('data',function(chunk){ 
		    	str += chunk;
		    });  
		});  
		hreq.on('error',function(err){  
		    console.error(err);  
		});  
		hreq.end(); 
	}

	//查询距离
	function queryLens(){
		console.log('2$$$$$$'+start+'$$0$$$$');
		console.log('2$$$$$$'+stop+'$$0$$$$');
		var data={  
	    newmap:1,
			reqflag:'pcmap',
			biz:1,
			from:'webmap',
			da_par:'direct',
			pcevaname:'pc4.1',
			qt:'nav',
			c:131,
			sn:'2$$$$$$'+start+'$$0$$$$',
			en:'2$$$$$$'+stop+'$$0$$$$',
			sc:131,
			ec:131,
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
		var content=querystring.stringify(data);   
		//创建请求  
		var hreq = http.request('http://map.baidu.com?'+content,function(ress){  

		    ress.setEncoding('utf-8');  
		    var str = '';
		    ress.on('end',function(){ 
		    	var result = JSON.parse(str);
		    	var len = 0;
		    	//if(str.toString().split('distance').length>0){
		    	if(result.content && result.content.routes){
		    		len = result.content.routes[0].legs[0].distance;
		    		//len = str.toString().split('distance')[1].split(':')[1].split(',')[0];
		    	}else if(result && result.content && result.content.length > 0){
		    		var a = result.content[1];
		    		if(queryCount == 0 && a.length >= 0){
		    			console.log('第一次查询')
		    			stop = a[0].addr;
		    			queryLens();
		    			queryCount++;
		    			return;
		    		}else if(queryCount == 1){
		    			console.log('第二次查询')
		    			if(datatype == 1){
			    			var w2 = xlRows[rowIndex][0] + ' ' + xlRows[rowIndex][1];
			    			su(2,w2)
			    		}else{
			    			su(2,xlRows[rowIndex][1])
			    		}		 
		    			queryCount++;
		    			return;
		    		}else if(queryCount == 2){
		    			console.log('第三次查询，直接跳过')
		    		}
		    	}
		    	
		    	var arr = [];
			    	arr.push(xlRows[rowIndex][0]);
			    	arr.push(xlRows[rowIndex][1]);
			    	arr.push(len/1000);
			    tempRows.push(arr);
		    	rowIndex++;
		    	queryCount = 0;
		    	if(rowIndex == xlRows.length){
		    		console.log('查询结束');
		    		over();
		    	}else{
		    		su(1,xlRows[rowIndex][0])
		    	}
		    });  
		    ress.on('data',function(chunk){
		    	str+=chunk; 
		    });  
		});  
		hreq.on('error',function(err){  
		    console.error(err);  
		});  
		hreq.end();
	}

	function over(){
		var buffer = xlsx.build([
	    {
	        name:'sheet1',
	        data:tempRows
	    }        
		]);
		//将文件内容插入新的文件中
		var filePath = '/excles/'+myfilename + Date.now()+'.xlsx';
		fs.writeFileSync('public'+filePath,buffer,{'flag':'w'});
		res.send('<a href = "http://10.236.91.57:3000'+filePath+'">下载地址</a>');
	}
});

module.exports = router;
