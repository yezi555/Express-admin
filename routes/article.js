const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const articleService = require('../services/articleService');

//新增/修改分类
router.post('/updateArticle', articleService.updateClassification)
//删除分类
router.get('/deleteArticle/:id', articleService.deleteClassification)

module.exports = router;