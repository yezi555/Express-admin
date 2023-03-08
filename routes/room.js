const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const roomService = require('../services/roomService');


var superagent = require('superagent');
var cheerio = require('cheerio');

//创建房间
router.post('/createRoom', roomService.createRoom)
//删除房间
router.get('/deleteRoom', roomService.deleteRoom)
//生成邀请码
router.get('/invitation', roomService.invitation)





module.exports = router;