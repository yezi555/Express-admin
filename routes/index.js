const express = require('express');
// const boom = require('boom'); // 引入boom模块，处理程序异常状态
const userRouter = require('./users'); // 引入user路由模块
const articleRouter = require('./article'); // 引入user路由模块
const uploadRouter = require('./upload'); // 引入user路由模块
const roomRouter = require('./room'); // 引入user路由模块
const socket = require('./socket'); // 引入user路由模块




// const taskRouter = require('./tasks'); // 引入task路由模块
const { jwtAuth, decode } = require('../utils/user-jwt'); // 引入jwt认证函数
const router = express.Router(); // 注册路由 

router.use(jwtAuth); // 注入认证模块

router.use('/api', userRouter); // 注入用户路由模块
router.use('/api', articleRouter); // 注入任务路由模块
router.use('/api', roomRouter); // 注入房间
router.use('/api', uploadRouter); // 注入上传
router.use('/api', socket); // 注入上传



// 自定义统一异常处理中间件，需要放在代码最后
router.use((err, req, res, next) => {
  // 自定义用户认证失败的错误返回
  if (err && err.name === 'UnauthorizedError') {
    const { status = 401, message } = err;
    // 抛出401异常
    res.status(status).json({
      code: status,
      msg: 'token失效，请重新登录',
      data: err
    })
  } else {
    const { output } = err || {};
    // 错误码和错误信息
    console.log('-------ssss', err)

    const errCode = (output && output.statusCode) || 500;
    const errMsg = (output && output.payload && output.payload.error) || err.message;
    res.status(errCode).json({
      code: errCode,
      msg: errMsg
    })
  }
})

module.exports = router;
