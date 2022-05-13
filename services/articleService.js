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

function updateClassification(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    if (req.body?.id) {
      console.log('有id',)
      const query = `update sys_article_cate set ? where id=${req.body.id}`;
      updateOne(query, req.body).then(result => {
        if (result.affectedRows === 1) {
          res.json({
            code: CODE_SUCCESS,
            msg: '更新分类成功',
            data: null
          })
        } else {
          res.json({
            code: CODE_ERROR,
            msg: '更新分类失败',
            data: null
          })
        }
      })

    } else {
      const query = 'desc sys_article_cate'
      //查询所有字段
      let objs = querySql(query).then(result => {
        let obj = {}
        result.forEach(item => {
          obj[item.Field] = item.Default
        })
        return obj
      })
      //查看分类标题是否重复
      const sql = `select * from sys_article_cate where name="${req.body.name}"`
      querySql(sql).then(result => {
        console.log('--------------', result)
        if (result.length > 0) {
          return res.json({
            code: CODE_ERROR,
            msg: '分类名称被占用',
            data: null
          })
        } else {
          objs.then(result => {
            const querySql = `insert into sys_article_cate set ?`;
            updateOne(querySql, { ...result, ...req.body }).then(result => {
              if (result.affectedRows === 1) {
                res.json({
                  code: CODE_SUCCESS,
                  msg: '新增分类成功',
                  data: null
                })
              } else {
                res.json({
                  code: CODE_ERROR,
                  msg: '新增分类失败',
                  data: null
                })
              }
            })
          })
        }
      })
    }
  }
}

//删除
function deleteClassification(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    console.log('-----', req.params)
    const query = `update sys_article_cate set is_delete=1 where id=${req.params.id}`
    querySql(query).then(result => {
      if (result.affectedRows === 1) {
        res.json({
          code: CODE_SUCCESS,
          msg: '删除分类成功',
          data: null
        })
      } else {
        res.json({
          code: CODE_ERROR,
          msg: '删除分类失败',
          data: null
        })
      }
    })
  }
}

module.exports = {
  updateClassification,
  deleteClassification
}