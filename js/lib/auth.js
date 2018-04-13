'use strict'

/**
 * MailDev - auth.js
 */

module.exports = function (user, password) {
  return function (req, res, next) {
    var auth
    if (req.headers.authorization) {
      auth = Buffer.from(req.headers.authorization.substring(6), 'base64').toString().split(':')
    }

    if (!auth || auth[0] !== user || auth[1] !== password) {
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Basic realm="Authentication required"')
      res.send('Unauthorized')
    } else {
      next()
    }
  }
}
