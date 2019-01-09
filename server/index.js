/**
 * @authors shenxiaoxia
 * @date  2019/1/9
 * @module AI
 */


/*const param = qs.stringify({
  'grant_type': 'client_credentials',
  'client_id': 'fudQpTmGxhgNZiD84jfKHOF5',
  'client_secret': 'yXxEPskk6Re49yXVo4dXGm6og68gWR05'
});*/

var https = require('https')
var qs = require('querystring')
//用express搭建的服务器
var express = require('express')
var app = express()
var fs = require('fs')
var bodyParser = require('body-parser')

/*
 每次启动时都会 请求 /access 接口，从而获取新的access_token，或者可以 持久化数据，保存在json文件里，
 每隔一个月更新一次，因为每隔一个月给的access_token都会不一样
*/
var access_token = ''

const param = qs.stringify({
  'grant_type': 'client_credentials',
  'client_id': 'fudQpTmGxhgNZiD84jfKHOF5',
  'client_secret': 'yXxEPskk6Re49yXVo4dXGm6og68gWR05'
})

//这是我要对比的图片，写的时候有一个问题就是png的图片和jpg的图片不能对比，所以我都替换成png图片了
var bitmap = fs.readFileSync('./images/my03.png')
//图片转为 base64格式
var base64str1 = new Buffer(bitmap).toString('base64')

//bodyParser.urlencoded 限制了提交的大小不超过 50mb
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }))

//我的html，js放在server文件夹下
app.use(express.static('/server'))

app.post('/access', function (req, res) {
  https.get(
    {
      hostname: 'aip.baidubce.com',
      path: '/oauth/2.0/token?' + param,
      agent: false
    },
    function (res) {
      res.setEncoding('utf8')
      res.on('data',function (data) {
        //取得access_token
        access_token = JSON.parse(data).access_token
      })
    }
  )
})

//这是 html界面 post请求 的judge
app.post('/judge', function (req, res) {
  const options = {
    host: 'aip.baidubce.com',
    path: '/rest/2.0/face/v3/match?access_token="'+access_token+'"',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  //这里还有很多参数，我都没写，具体的看官网
  /*
      从html界面传回来的数据req.body.img，然后用正则来格式化，
      replace(/\s/g, "+")这个是把任何的Unicode空白符转化为 +
      replace(/^data:image\/\w+\Wbase64,/, "") 再把字符串开头的data:image/png;base64 删除
      ^ 匹配字符串的开头，
      \/匹配/
      \w+ 匹配任何ASCII字符组成的单词
      \W  匹配任何非ASCII字符

  */
  const contents = JSON.stringify([
    {
      image: base64str1,
      image_type: "BASE64",
    }, {
      image: req.body.img.replace(/\s/g, "+").replace(/^data:image\/\w+\Wbase64,/, ""),
      image_type: "BASE64",
    }
  ])

  const req_baidu = https.request(options, function (res_baidu) {
    res_baidu.setEncoding('utf8')
    res_baidu.on('data', function (chunk) {
      //百度返回来的数据，有得分，直接发给html，在html中处理
      res.send(chunk)
    })

  })
  req_baidu.write(contents)
  req_baidu.end()

})
//服务在3302端口
var server = app.listen(3302, function () {
  console.log('服务器已开启 listening at http://%s','localhost:3302');
})



