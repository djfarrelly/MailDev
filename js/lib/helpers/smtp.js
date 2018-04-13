'use strict'

const smtpHelpers = module.exports = {}

/**
 * Authorize callback for smtp server
 */
smtpHelpers.createOnAuthCallback = function (username, password) {
  return function onAuth (auth, session, callback) {
    if (auth.username && auth.password) {
      if (auth.username !== username || auth.password !== password) {
        return callback(new Error('Invalid username or password'))
      }
    }
    callback(null, { user: username })
  }
}
