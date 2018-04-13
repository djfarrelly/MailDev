
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

module.exports = function (config) {
  const version = pkg.version

  if (!config) {
    // CLI
    config = program
      .version(version)
      .option('-s, --smtp <port>', 'SMTP port to catch emails [1025]', '1025')
      .option('-w, --web <port>', 'Port to run the Web GUI [1080]', '1080')
      .option('--ip <ip address>', 'IP Address to bind SMTP service to', '0.0.0.0')
      .option('--outgoing-host <host>', 'SMTP host for outgoing emails')
      .option('--outgoing-port <port>', 'SMTP port for outgoing emails')
      .option('--outgoing-user <user>', 'SMTP user for outgoing emails')
      .option('--outgoing-pass <password>', 'SMTP password for outgoing emails')
      .option('--outgoing-secure', 'Use SMTP SSL for outgoing emails')
      .option('--auto-relay [email]', 'Use auto-relay mode. Optional relay email address')
      .option('--auto-relay-rules <file>', 'Filter rules for auto relay mode')
      .option('--incoming-user <user>', 'SMTP user for incoming emails')
      .option('--incoming-pass <pass>', 'SMTP password for incoming emails')
      .option('--web-ip <ip address>', 'IP Address to bind HTTP service to, defaults to --ip')
      .option('--web-user <user>', 'HTTP user for GUI')
      .option('--web-pass <password>', 'HTTP password for GUI')
      .option('--base-pathname <path>', 'base path for URLs')
      .option('--disable-web', 'Disable the use of the web interface. Useful for unit testing')
      .option('--hide-extensions <extensions>',
        'Comma separated list of SMTP extensions to NOT advertise (STARTTLS, SMTPUTF8, PIPELINING, 8BITMIME)',
        function (val) { return val.split(',') }
      )
      .option('-o, --open', 'Open the Web GUI after startup')
      .option('-v, --verbose')
      .option('--silent')
      .parse(process.argv)
  }

  if (config.verbose) {
    logger.setLevel(2)
  } else if (config.silent) {
    logger.setLevel(0)
  }

  // Start the Mailserver & Web GUI
  mailserver.create(config.smtp, config.ip, config.incomingUser, config.incomingPass, config.hideExtensions)

  if (config.outgoingHost ||
      config.outgoingPort ||
      config.outgoingUser ||
      config.outgoingPass ||
      config.outgoingSecure) {
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

  if (!config.disableWeb) {
    // Default to run on same IP as smtp
    const webIp = config.webIp ? config.webIp : config.ip
    web.start(config.web, webIp, mailserver, config.webUser, config.webPass, config.basePathname)

    if (config.open) {
      const open = require('open')
      open('http://' + (config.ip === '0.0.0.0' ? 'localhost' : config.ip) + ':' + config.web)
    }

    // Close the web server when the mailserver closes
    mailserver.on('close', web.close)
  }

  function shutdown () {
    logger.info(`Recieved shutdown signal, shutting down now...`)
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
