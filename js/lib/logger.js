'use strict'

/**
 * MailDev - logger.js
 */

let logLevel = 1

module.exports = {}

/**
 * Initialize the logger
 */

module.exports.setLevel = function (level) {
  logLevel = level
}

/**
 * The info method will always log to the console
 */

module.exports.info = function () {
  if (logLevel > 0) { console.info.apply(console, arguments) }
};

/**
 * Extend the basic console.x functions, checking if the logging is on
 */

['log', 'dir', 'warn', 'error'].forEach(function (fn) {
  module.exports[ fn ] = function () {
    if (logLevel > 1) {
      console[ fn ].apply(console, arguments)
    }
  }
})
