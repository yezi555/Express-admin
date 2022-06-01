const express = require('express');
const router = express.Router();
const multer = require('multer')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 这里是在server端要放图片的目录
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    // 这里是对文件重命名
    cb(null, file.originalname)
  }
})
var upload = multer({ storage: storage })

router.post('/upload', upload.single('file'), (req, res, next) => {
  const { path } = req.file
  console.log('上传---', path)

  let paths = path.replace('\public/', '/')
  res.send({ message: 'success', fileurl: paths })
  //返回在server端存放的路径
})


module.exports = router;