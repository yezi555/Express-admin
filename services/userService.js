const { querySql, queryOne, updateOne } = require('../utils/index');
const md5 = require('../utils/md5');
const jwt = require('jsonwebtoken');
const boom = require('boom');
const { body, validationResult } = require('express-validator');

const {
  CODE_ERROR,
  CODE_SUCCESS,
  PRIVATE_KEY,
  JWT_EXPIRED
} = require('../utils/constant');
const { decode } = require('../utils/user-jwt');

var request = require('request');

// 登录
function login(req, res, next) {
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {
    let { username, password } = req.body;
    // md5加密
    password = md5(password);
    const query = `select * from sys_user where username='${username}' and password='${password}'`;
    querySql(query)
      .then(user => {
        // console.log('用户登录===', user);
        if (!user || user.length === 0) {
          res.json({
            code: CODE_ERROR,
            msg: '用户名或密码错误',
            data: null
          })
        } else {
          // 登录成功，签发一个token并返回给前端
          const token = jwt.sign(
            // payload：签发的 token 里面要包含的一些数据。
            { id: user[0].id, username },
            // 私钥
            PRIVATE_KEY,
            // 设置过期时间
            { expiresIn: JWT_EXPIRED }
          )

          let userData = {
            id: user[0].id,
            username: user[0].username,
            nickname: user[0].nickname,
            avatarUrl: user[0].avatarUrl,
            sex: user[0].sex,
            gmt_create: user[0].gmt_create,
            gmt_modify: user[0].gmt_modify
          };

          res.json({
            code: CODE_SUCCESS,
            msg: '登录成功',
            data: {
              token,
              userData
            }
          })
        }
      })
  }
}
//微信登陆
function WxLogin(req, res, next) {
  let { code, avatarUrl, nickName } = req.body;
  if (code) {
    let url = xcxLoginGetToken(code)
    request(url, async (err, response, body) => {
      let { openid } = JSON.parse(body)
      checkWxUser(openid).then(result => {
        if (!result || result.length === 0) {
          const querySqls = `insert into sys_user(username, avatarUrl,openid) values('${nickName}', '${avatarUrl}','${openid}')`;
          addUser(querySqls, nickName, openid, res)
        } else {
          const querySqll = `select * from sys_user where username='${nickName}' and openid='${openid}'`;
          querySql(querySqll)
            .then(user => {
              const token = jwt.sign(
                // payload：签发的 token 里面要包含的一些数据。
                { id: user[0].id, username: nickName },
                // 私钥
                PRIVATE_KEY,
                // 设置过期时间
                { expiresIn: JWT_EXPIRED }
              )

              let userData = { ...user[0] };

              res.json({
                code: CODE_SUCCESS,
                msg: '登录成功',
                data: {
                  token,
                  userData
                }
              })
            })
        }
      })


    })
  }
}
//添加用户到数据库
function addUser(query, username, openid, res) {
  return new Promise((resolve, reject) => {
    querySql(query)
      .then(result => {
        // console.log('用户注册===', result);
        if (!result || result.length === 0) {
          res.json({
            code: CODE_ERROR,
            msg: '注册失败',
            data: null
          })
        } else {
          const queryUser = `select * from sys_user where username='${username}' and openid='${openid}'`;
          querySql(queryUser)
            .then(user => {
              const token = jwt.sign(
                { id: user[0].id, username },
                PRIVATE_KEY,
                { expiresIn: JWT_EXPIRED }
              )
              let userData = { ...user[0] };

              res.json({
                code: CODE_SUCCESS,
                msg: '注册成功',
                data: {
                  token,
                  userData
                }
              })
            })
        }
      })
  })
}
//查询是否有这个用户
function checkWxUser(openid, username, avatarUrl) {
  return new Promise((resolve, reject) => {
    const query = `select * from sys_user where openid='${openid}'`;
    queryOne(query).then(result => {
      console.log('----查询是否有这个用户-', result)
      resolve(result)
    })
  }
  )
}
//
xcxLoginGetToken = (code) => {
  const appid = "wx2f1dd77efc7db5e9";
  const secret = "263b5882c4952efc21658f409432e37b";
  //通过code获取用户openid和unionid和session_key
  const code2Session = "https://api.weixin.qq.com/sns/jscode2session?";//通过code获取用户openid和unionid和session_key
  const getAccessToken = "https://api.weixin.qq.com/cgi-bin/token";//获取accesstoken
  let js_code = code;
  let params = {
    appid,
    secret,
    js_code,
    grant_type: "authorization_code",
  }
  let urlData = encodeSearchParams(params);
  let url = `${code2Session}${urlData}`
  return url
}


//
encodeSearchParams = (obj) => {
  const params = []
  Object.keys(obj).forEach((key) => {
    let value = obj[key]
    // 如果值为undefined我们将其置空
    if (typeof value === 'undefined') {
      value = ''
    }
    // 对于需要编码的文本（比如说中文）我们要进行编码
    params.push([key, encodeURIComponent(value)].join('='))
  })

  return params.join('&')
}
//退出
function loginOut(req, res, next) {
  console.log('--------------', req.session)
  req.session.user = null;
}

// 注册
function register(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { username, password } = req.body;
    findUser(username)
      .then(data => {
        // console.log('用户注册===', data);
        if (data) {
          res.json({
            code: CODE_ERROR,
            msg: '用户已存在',
            data: null
          })
        } else {
          password = md5(password);
          const query = `insert into sys_user(username, password) values('${username}', '${password}')`;
          querySql(query)
            .then(result => {
              // console.log('用户注册===', result);
              if (!result || result.length === 0) {
                res.json({
                  code: CODE_ERROR,
                  msg: '注册失败',
                  data: null
                })
              } else {
                const queryUser = `select * from sys_user where username='${username}' and password='${password}'`;
                querySql(queryUser)
                  .then(user => {
                    const token = jwt.sign(
                      { id: user[0].id, username },
                      PRIVATE_KEY,
                      { expiresIn: JWT_EXPIRED }
                    )

                    let userData = {
                      id: user[0].id,
                      username: user[0].username,
                      nickname: user[0].nickname,
                      avatarUrl: user[0].avatarUrl,
                      sex: user[0].sex,
                      gmt_create: user[0].gmt_create,
                      gmt_modify: user[0].gmt_modify
                    };

                    res.json({
                      code: CODE_SUCCESS,
                      msg: '注册成功',
                      data: {
                        token,
                        userData
                      }
                    })
                  })
              }
            })
        }
      })

  }
}

// 重置密码
function resetPwd(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { username, oldPassword, newPassword } = req.body;
    oldPassword = md5(oldPassword);
    validateUser(username, oldPassword)
      .then(data => {
        console.log('校验用户名和密码===', username, oldPassword, data);
        if (data) {
          if (newPassword) {
            newPassword = md5(newPassword);
            const query = `update sys_user set password='${newPassword}' where username='${username}'`;
            querySql(query)
              .then(user => {
                // console.log('密码重置===', user);
                if (!user || user.length === 0) {
                  res.json({
                    code: CODE_ERROR,
                    msg: '重置密码失败',
                    data: null
                  })
                } else {
                  res.json({
                    code: CODE_SUCCESS,
                    msg: '重置密码成功',
                    data: null
                  })
                }
              })
          } else {
            res.json({
              code: CODE_ERROR,
              msg: '新密码不能为空',
              data: null
            })
          }
        } else {
          res.json({
            code: CODE_ERROR,
            msg: '用户名或旧密码错误',
            data: null
          })
        }
      })

  }
}

//获取用户信息
function getuserInfo(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    const username = decode(req).username
    const query = `select * from sys_user where username="${username}"`;
    querySql(query).then(user => {
      if (!user || user.length === 0) {
        res.json({
          code: CODE_ERROR,
          msg: '获取用户信息失败',
          data: null
        })
      } else {
        res.json({
          code: CODE_SUCCESS,
          msg: '获取用户信息成功',
          data: user[0]
        })
      }
    })

  }
}
//更新用户信息
function updateUserInfo(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    const id = decode(req).id
    console.log('校验用户名和密码===', req.body,);
    const sql = `update sys_user set ? where id="${id}"`
    updateOne(sql, [req.body]).then(result => {
      console.log('校验用户名和密码===', result,);
      if (result.affectedRows === 1) {
        res.json({
          code: CODE_SUCCESS,
          msg: '更新用户信息成功',
          data: null
        })
      } else {
        res.json({
          code: CODE_ERROR,
          msg: '更新用户信息失败',
          data: null
        })
      }
    })
  }
}
// 校验用户名和密码
function validateUser(username, oldPassword) {
  const query = `select id, username from sys_user where username='${username}' and password='${oldPassword}'`;
  return queryOne(query);
}

// 通过用户名查询用户信息
function findUser(username) {
  const query = `select id, username from sys_user where username='${username}'`;
  return queryOne(query);
}

module.exports = {
  login,
  loginOut,
  register,
  resetPwd,
  getuserInfo,
  updateUserInfo,
  WxLogin
}
