
/**
 * MailDev - index.js
 *
 * Author: Dan Farrelly <daniel.j.farrelly@gmail.com>
 * Licensed under the MIT License.
 */

const program = require('commander')
const async = require('async')
const pkg = require('./package.json')
const web = require('./lib/web')
const mailserver = require('./lib/mailserver')
const logger = require('./lib/logger')
const { options, appendOptions } = require('./lib/options')

module.exports = function (config) {
  const version = pkg.version

  if (!config) {
    // CLI
    config = appendOptions(program.version(version), options)
      .parse(process.argv)
  }

  if (config.verbose) {
    logger.setLevel(2)
  } else if (config.silent) {
    logger.setLevel(0)
  }

  // Start the Mailserver
  mailserver.create(
    config.smtp,
    config.ip,
    config.mailDirectory,
    config.incomingUser,
    config.incomingPass,
    config.hideExtensions
  )

  if (
    config.outgoingHost ||
    config.outgoingPort ||
    config.outgoingUser ||
    config.outgoingPass ||
    config.outgoingSecure
  ) {
    mailserver.setupOutgoing(
      config.outgoingHost,
      parseInt(config.outgoingPort),
      config.outgoingUser,
      config.outgoingPass,
      config.outgoingSecure
    )
  }

  if (config.autoRelay) {
    const emailAddress = typeof config.autoRelay === 'string' ? config.autoRelay : null
    mailserver.setAutoRelayMode(true, config.autoRelayRules, emailAddress)
  }

  if (config.mailDirectory) {
    mailserver.loadMailsFromDirectory()
  }

  // Start the web server
  if (!config.disableWeb) {
    const secure = {
      https: config.https,
      cert: config.httpsCert,
      key: config.httpsKey
    }

    // Default to run on same IP as smtp
    const webIp = config.webIp ? config.webIp : config.ip

    web.start(
      config.web,
      webIp,
      mailserver,
      config.webUser,
      config.webPass,
      config.basePathname,
      secure
    )

    if (config.open) {
      const open = require('opn')
      open('http://' + (config.ip === '0.0.0.0' ? 'localhost' : config.ip) + ':' + config.web)
    }

    // Close the web server when the mailserver closes
    mailserver.on('close', web.close)
  }

  if (config.logMailContents) {
    mailserver.on('new', function (mail) {
      const mailContents = JSON.stringify(mail, null, 2)
      logger.info(`Received the following mail contents:\n${mailContents}`)
    })
  }

  function shutdown () {
    logger.info(`Received shutdown signal, shutting down now...`)
    async.parallel([
      mailserver.close,
      web.close
    ], function () {
      process.exit(0)
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  return mailserver
}
