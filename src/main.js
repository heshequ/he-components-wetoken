const _ = require('lodash')
const mysql = require('he-mysql')
const request = require('request')

/**
 * request promise
 */
var http = function (url) {
  return new Promise(function(resolve, reject) {
    request(url, function (err, resp, body){
      if (err || resp.statusCode != 200) {
        reject('error')
      }
      resolve(body)
    })
  })
}

/**
 * 取accesstoken
 * @param Object db 连接mysql数据库时的配置项
 * @param String appid 微信公众号的appid
 * @param String secret 微信公众号的appsecret
 */
var getAccessToken = async function (db, appid, secret) {
  let time = _.now().toString().substr(0,10)

  //先判断当前的accesstoken是否超过1.5小时
  let tokendata = await mysql.query(db, ['select * from `token` where id=1'], null)
  if (time-5400 > tokendata[0][0].time) {
    try {
      let body = await http('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret)

      // 注意，返回的是字符串，要转换成json
      body = JSON.parse(body)

      // 存库，返回
      await mysql.query(db, ['update `token` set `token`=?, `time`=? where id=1'], [body.access_token, time])
      return body.access_token
    } catch (err) {
      throw err
    }
  } else {
    return tokendata[0][0].token
  }
}

/**
 * 取api_ticket
 * @param String accesstoken 连接mysql数据库时的配置项
 */
var getJSApiTicket = async function (accesstoken) {
  let body = await http('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + accesstoken + '&type=wx_card')

  // 注意，返回的是字符串，要转换成json
  body = JSON.parse(body)

  // 返回
  return body.ticket
}

/**
 * 导出
 */
exports.getAccessToken = getAccessToken
exports.getJSApiTicket = getJSApiTicket
