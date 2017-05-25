var uploadfile = null;
var flag = false;
function StartUpload(file) {
	flag = true;
	$('.myfile').hide();
	$('button').text('查询中..')
    var formData = new FormData(file);
    formData.append("type", $('.type').val());
    formData.append("myfile", file);
    $.ajax({
        url:'/users/uploads/',
        type:'POST',
        data: formData,
        timeout:36000000,
        processData: false,  // tell jQuery not to process the data
        contentType: false,   // tell jQuery not to set contentType
        success:function(ret){
          $('body').empty().append(ret);
        },
        error:function(){
          alert('查询异常');
        }
    });
};
$('button').click(function(e){
	e.preventDefault();
	if(flag){
		alert('请等待');
		return;
	}
	if(uploadfile)
  	StartUpload(uploadfile);
  else{
  	alert('请选择一个文件');
  }
})
 $('body').on('change','.myfile',function(e){
  var files = e.target.files||e.dataTransfer.files;
  uploadfile = files[0];
})