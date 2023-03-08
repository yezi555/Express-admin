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

var superagent = require('superagent');
var cheerio = require('cheerio');

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
    console.log('-----', req.query)
    const query = `update sys_article_cate set is_delete=1 where id=${req.query.id}`
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
//查询
function getClassification(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    console.log('-----', req.params)
    const query = `select * from sys_article_cate`
    querySql(query).then(result => {
      res.json({
        code: CODE_SUCCESS,
        msg: '获取分类成功',
        data: result
      })
    })
  }
}
//根据分类查询文章
function getArticleList(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    console.log('req.query',req.query)
    const query = `select * from sys_article where lable_id=${req.query.id}`
    querySql(query).then(result => {
      res.json({
        code: CODE_SUCCESS,
        msg: '获取列表成功',
        data: result
      })
    })
  }
}

//更新文章
function updateArticle(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    updateOrEdit(req, res, 'sys_article', next).then(result => {
      if (result.affectedRows === 1) {
        res.json({
          code: CODE_SUCCESS,
          msg: '成功',
          data: null
        })
      } else {
        res.json({
          code: CODE_ERROR,
          msg: '失败',
          data: null
        })
      }
    })
  }
}
//查询文章详情
function getArticleDetail(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    const query = `select * from sys_article where id=${req.query.id}`
    querySql(query).then(result => {
      console.log('----', result)

      if (result.length === 1) {
        res.json({
          code: CODE_SUCCESS,
          msg: '成功',
          data: result[0]
        })
      } else {
        res.json({
          code: CODE_ERROR,
          msg: '失败',
          data: null
        })
      }
    })
  }
}

//查询表所有字段
function getTableAll(tableName) {
  const query = `desc ${tableName}`
  //查询所有字段
  return new Promise((resolve, reject) => {
    querySql(query).then(result => {
      let obj = {}
      result.forEach(item => {
        obj[item.Field] = item.Default
      })
      resolve(obj)
    })
  })
}

//新增/修改处理函数
function updateOrEdit(req, res, tableName) {
  return new Promise((resolve, reject) => {
    if (req.body?.id) {
      const query = `update ${tableName} set ? where id=${req.body.id}`;
      updateOne(query, req.body).then(result => {
        resolve(result)
      })
    } else {
      const querySqls = `insert into ${tableName} set ?`;
      let objs = {}
      getTableAll(tableName).then(result => {
        objs = result
      })
      updateOne(querySqls, { ...objs, ...req.body }).then(result => {
        resolve(result)
      })
    }
  })
}
//爬百度新闻
function getBaiduNews(req, res, next) {
  const { url, seave, lableId } = req.body
  console.log('作者----', url)

  superagent.get(url)
    // .set('Referer', 'https://author.baidu.com/')
    .set('Accept', 'image/webp,image/,/*;q=0.8')
    .end(async (err, sres) => {
      console.log('errerrerr', err, sres);
      // 常规的错误处理
      if (err) {
        return next(err);
      }
      // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
      // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
      // 剩下就都是 jquery 的内容了
      //删除前一次的数据
      // let deleteQuery = `delete from sys_article where lable_id=${lableId}`
      // await querySql(deleteQuery)
      let $ = cheerio.load(sres.text);
      let items = [];
      let values = []
      $('.corriente .one-articulo-titulo a').each((idx, element) => {
        let $element = $(element);
        console.log('作者----', $element.attr('href'))
        res.send( {href:$element.attr('href')});

      });

      // const querySqls = `insert into sys_article(title,href,content,lable_id,time) values?`;
      // updateOne(querySqls, [values]).then(result => {
      //   console.log('------', result)
      //   res.send(items);
      // })
    })
}
//爬新闻详情
function getNewsDetail(req, res, next) {
  console.log('作者----', req.body)

  const { url, lableId, id } = req.body
  superagent.get(url)
    .set('Accept', 'image/webp,image/,/*;q=0.8')
    .end(async (err, sres) => {
      console.log('errerrerr', err, sres);
      // 常规的错误处理
      if (err) {
        return next(err);
      }
      let $ = cheerio.load(sres.text);
      let items = [];
      let values = []
      $('.one-articulo').each((idx, element) => {
        let $element = $(element);
        console.log('作者----', $element.html())
      });
      res.send({
        content: $('.one-articulo').html()
      });
      const query = `update sys_article_cate set (content) where id=${req.params.id}`
      // updateOne(query, [values]).then(result => {
      //   console.log('------', result)
      //   res.send(items);
      // })
    })
}

module.exports = {
  updateClassification,
  deleteClassification,
  getClassification,
  updateArticle,
  getArticleList,
  getArticleDetail,
  getBaiduNews,
  getNewsDetail
}