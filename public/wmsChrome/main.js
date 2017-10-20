function getData(){
  var listUrl = 'http://'+window.location.host+'/inbound/receive-manage/quality-list?ReceivePhyInfo%5Bcreate_time%5D%5Bbtime%5D=&ReceivePhyInfo%5Bcreate_time%5D%5Betime%5D=&ReceivePhyInfo%5Breturn_time%5D%5Bbtime%5D=&ReceivePhyInfo%5Breturn_time%5D%5Betime%5D=&ReceivePhyInfo%5Bbill_id%5D=&ReceivePhyInfo%5Bbill_type%5D=&ReceivePhyInfo%5Bduty_type%5D=&ReceivePhyInfo%5Bpay_customer_type%5D=&ReceivePhyInfo%5Bsn%5D=&ReceivePhyInfo%5Bcount%5D=&ReceivePhyInfo%5Bsku%5D=&ReceivePhyInfo%5Bdesc%5D=&per-page=10&page='
  var pageCount = 0;
  var curPage = 0;
  var queryCount = 0;
  var storeName = $('#dropdown-user').prev().find('.lang-name').eq(0).text();
  function getInfo(){
    $.ajax({
      url:listUrl+ 1,
      headers:{
        'X-CSRF-Token':$('meta[name=csrf-token]').attr('content')
      }, 
      type:'json',
      success:function(res){
        if(res.split('共<b>').length==1) return;
        pageCount =  res.split('共<b>')[1].split('</b>条')[0]*1;
        curPage = 1;
        console.log('共' + pageCount);
        
        var pagesLength = parseInt(pageCount/10, 10) + 1;
        for (var i = 1; i <= pagesLength; i++) {
          getPageList(i);
        }
      }
    })
  }
  getInfo();
  var dataList = [];
  
  function getPageList(page){
    $.ajax({
      url:listUrl+ page,
      headers:{
        'X-CSRF-Token':$('meta[name=csrf-token]').attr('content')
      }, 
      success:function(res){
        var tableHtml = res.split('</thead>')[1].split('</table>')[0];
        var $table = $(tableHtml);
        var trs = $table.find('tr');
        for (var i = 0; i < trs.length; i++) {
          var tr = $(trs[i]);
          (function(index,$item){
            var detailUrl = 'http://'+window.location.host + $item.find('.btn-default').attr('href')
            $.ajax({
              url:detailUrl,
              success:function(res){
                queryCount += 1;
                var arr = res.split('<img src="');
                var imgList = [];
                for (var i = 1; i < arr.length; i++) {
                  var src = arr[i].split('"')[0]
                  imgList.push(src);
                }
                dataList.push({
                  code:$item.find('td').eq(4).text(),
                  desc:$item.find('td').eq(9).text(),
                  createTime:$item.find('td').eq(10).text(),
                  imgs:imgList
                });
                if(queryCount == pageCount){
                  console.log('查询完成,共' + dataList.length)
                  createImg(dataList)
                }
                
              }
            })
          })(i,tr)
        }
      }
    })
  }
  function createImg(list) {
      $.ajax({
      url:'http://10.236.91.7:3002/users/getimg',
      type:'POST',
      data:{
          list:JSON.stringify(dataList),
          store:storeName
      },
      success:function(res){
        console.log(res)
      }
    })   

  }
}
getData();