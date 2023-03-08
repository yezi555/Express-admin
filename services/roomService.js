const { querySql, queryOne, updateOne } = require('../utils/index');
const md5 = require('../utils/md5');
const jwt = require('jsonwebtoken');
const boom = require('boom');
const { body, validationResult } = require('express-validator');
const lodash = require('lodash');

const {
  CODE_ERROR,
  CODE_SUCCESS,
  PRIVATE_KEY,
  JWT_EXPIRED
} = require('../utils/constant');
const { decode } = require('../utils/user-jwt');

var request = require('request');

// 创建房间
async function createRoom(req, res, next) {
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {
    let {userId } = req.body;
    // 查询room表中当前用户是否创建过房间
    const query = `select * from room where user_id='${userId}' and delete_flag = 0`;
   let response = await  querySql(query)
    if(!response.length){
      const querySql = `insert into room set ?`;
      const charSet = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let id = lodash.sampleSize(charSet,16).toString().replace(/,/g, '');
      let code = lodash.sampleSize(charSet, 4).toString().replace(/,/g, '');
      let create_time = new Date
      let delete_flag = 0
      let result = await  updateOne(querySql, { ...response, user_id:userId,id,code,create_time,delete_flag })
        console.log('创建房间',result)
        if (result.affectedRows === 1) {
          resFun(res,CODE_SUCCESS,'房间创建成功',{
            user_id:userId,id,code,create_time,delete_flag
          })
        } else {
          resFun(res,CODE_ERROR,'房间创建失败',null)
        }
    }else{
      resFun(res,CODE_SUCCESS,'该用户已创建过房间',response[0])
    }
  }
}

//删除房间
async function deleteRoom(req, res, next){
  emptyFun(req, res, next)
  console.log('-----', req.body)
  const query = `update room set delete_flag = 1 where id = '${req.body.id}'`
  let result = await querySql(query)
  if (result.affectedRows === 1) {
    resFun(res,CODE_SUCCESS,'房间删除成功',null)
  } else {
    resFun(res,CODE_ERROR,'房间删除失败',result)
  }
}
//邀请
async function invitation(req,res,next){
  emptyFun(req, res, next)
  let {userId,roomId} = req.query
  console.log('-----', req.query)

  const query = `select * from room where user_id='${userId}' and delete_flag = 0`;
  let result = await querySql(query)

  console.log("result",result)
  if (result.affectedRows === 1) {
    resFun(res,CODE_SUCCESS,'邀请码生成成功',result)
  } else {
    resFun(res,CODE_ERROR,'邀请码生成失败',result)
  }
}

// response函数
function resFun(res,CODE_SUCCESS=CODE_SUCCESS,msg,data=null){
  return res.json({
    code: CODE_SUCCESS,
    msg,
    data
  })
}
//验证为空
function emptyFun(req, res, next){
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } 
}

module.exports = {
  createRoom,
  deleteRoom,
  invitation
}
