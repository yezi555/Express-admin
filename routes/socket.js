let express = require('express');
let expressWs = require('express-ws');
const router = express.Router()
expressWs(router)
const { querySql, queryOne, updateOne } = require('../utils/index');


router.ws('/userSocket',function(ws,req){
  console.log("client connect to server successful!",req.query);
  // ws.send(jump())
  ws.on('message',async function(msg){
    let responce = JSON.parse(msg)
    console.log("说到消息",responce);

    let sendData = ''
    switch(responce.type){
      case '9999':
        sendData = msg
      break;
      case '8888':
        sendData = JSON.stringify( await queryroomInfo(req))
      break;
      // default:
      //   sendData = jump()
    }
   
    ws.send(sendData)
  })
  ws.on("close", function(msg){
    console.log("client is closed");
  });

})

//心跳检测
function jump(){
  return JSON.stringify({
            jsonStr:{
              name:'room',
              msg:'心跳'
            },
            type:'9999'
        })
}
////根据房间id查询房间的信息
async function queryroomInfo(req){
  // if(!req.query){
  //   return
  // }
  console.log('resms',req.query)
  let {userId,roomId } = req.query
  const query = `select * from room where user_id='${userId}' and code = '${roomId}' and delete_flag = 0`;
  let responce = await querySql(query)
  console.log("responce",responce);

  return responce
}
//计算分数
async function quweryroomInfo(req){
  if(!req.query){
    return
  }
  let {userId,roomId } = req.query
  const query = `select * from score where room_code='${roomId}'`;
  let responce = await querySql(query)
  return responce
}

module.exports = router;
