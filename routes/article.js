const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const articleService = require('../services/articleService');

//新增/修改分类
router.post('/updateArticleClass', articleService.updateClassification)
//删除分类
router.get('/deleteArticleClass/:id', articleService.deleteClassification)
//c查询分类
router.get('/getArticleClass', articleService.getClassification)

//新增/修改文章
router.post('/updateArticle', articleService.updateArticle)
//获取文章
router.get('/getArticleList/:id', articleService.getArticleList)


module.exports = router;