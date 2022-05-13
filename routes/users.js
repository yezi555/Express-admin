const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const service = require('../services/userService');

// 登录/注册校验
const vaildator = [
  check('username').isString().withMessage('用户名类型错误'),
  check('password').isString().withMessage('密码类型错误')
]

// 重置密码校验
const resetPwdVaildator = [
  check('username').isString().withMessage('用户名类型错误'),
  check('oldPassword').isString().withMessage('密码类型错误'),
  check('newPassword').isString().withMessage('密码类型错误')
]
//修改用户信息校验
const updateUserInfoVaildator = [
  check('username').isLength({ max: 1 }).withMessage('不支持修改用户名'),
  check('nickname').isString().withMessage('昵称类型错误')
]
// 用户登录路由
router.post('/login', vaildator, service.login);

// 用户注册路由
router.post('/register', vaildator, service.register);

// 密码重置路由
router.post('/resetPwd', resetPwdVaildator, service.resetPwd);

//获取用户信息
router.get('/getuserInfo', service.getuserInfo);

//修改用户信息
router.get('/updateUserInfo', updateUserInfoVaildator, service.updateUserInfo);

module.exports = router;
