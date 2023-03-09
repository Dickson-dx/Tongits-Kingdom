/**获取url里的game_id */
function getGameId(){
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == 'game_id'){return pair[1];}
    }
}
/**获取url里的所有参数，并组成对象 */
function getUrlObj(){
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    const obj={}
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        obj[pair[0]]=pair[1];
    }
    return obj;
}

/**获取游戏数据 */
 function getDetail(gameId){
    return new Promise((res,rej)=>{
        const xlr=new XMLHttpRequest();
        xlr.open("post","https://test.tongitskingdom.com/api/web-api/game/detail",true);
        xlr.setRequestHeader("Content-Type","application/json");
        xlr.onload=()=>{
            if(xlr.status==201){
                response=JSON.parse(xlr.responseText);
                if(response.success){
                    console.log("获取到信息",response)
                    res(response.data)
                }else{
                    console.error("获取详情失败,错误提示：\n",response)
                }
               
            }else{
                response=JSON.parse(xlr.responseText);
                console.error("获取详情失败,错误提示：",response)
            }
        }

        xlr.send(JSON.stringify({
            accessKey: "84a6f4d47431494289ad503fb0e9392c", 
            gameId,//: "6405834e4ce95d13669a35e3" 
        }))
    })
   
}