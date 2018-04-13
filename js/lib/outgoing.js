'use strict'

/**
 * MailDev - outgoing.js
 */

const SMTPConnection = require('smtp-connection')
const wildstring = require('wildstring')
const async = require('async')
const fs = require('fs')
const logger = require('./logger')

wildstring.caseSensitive = false

var config = {
  autoRelay: false
}

// The SMTP connection client
let client
let emailQueue

/**
 * Outgoing exports
 */

const outgoing = module.exports = {}

outgoing.setup = function (host, port, user, pass, secure) {
  // defaults
  port = port || (secure ? 465 : 25)
  host = host || 'localhost'
  secure = secure || false

  config.host = host
  config.port = port
  config.user = user
  config.pass = pass
  config.secure = secure

  this._createClient()

  // Create a queue to sent out the emails
  // We use a queue so we don't run into concurrency issues
  emailQueue = async.queue(relayWorker, 1)
}

outgoing._createClient = function () {
  try {
    client = new SMTPConnection({
      port: config.port,
      host: config.host,
      secure: config.secure,
      auth: (config.pass && config.user)
            ? { user: config.user, pass: config.pass }
            : false,
      tls: { rejectUnauthorized: false },
      debug: true
    })

    logger.info(
      'MailDev outgoing SMTP Server %s:%d (user:%s, pass:%s, secure:%s)',
      config.host,
      config.port,
      config.user,
      config.pass ? '####' : config.pass,
      config.secure ? 'yes' : 'no'
    )
  } catch (err) {
    logger.error('Error during configuration of SMTP Server for outgoing email', err)
  }
}

outgoing.close = function () {
  if (this.isEnabled()) { client.close() }
}

outgoing.isEnabled = function () {
  return !!client
}

outgoing.getOutgoingHost = function () {
  return config.host
}

outgoing.isAutoRelayEnabled = function () {
  return config.autoRelay
}

outgoing.setAutoRelayMode = function (enabled, rules, emailAddress) {
  if (!client) {
    config.autoRelay = false
    logger.info('Outgoing mail not configured - Auto relay mode ignored')
    return
  }

  if (rules) {
    if (typeof rules === 'string') {
      try {
        rules = JSON.parse(fs.readFileSync(rules, 'utf8'))
      } catch (err) {
        logger.error('Error reading config file at ' + rules)
        throw err
      }
    }

    if (Array.isArray(rules)) {
      config.autoRelayRules = rules
    }
  }

  config.autoRelay = enabled

  if (enabled && emailAddress) {
    config.autoRelayAddress = emailAddress
  }

  if (config.autoRelay) {
    const msg = ['Auto-Relay mode on']
    if (config.autoRelayAddress) {
      msg.push('Relaying all emails to ' + config.autoRelayAddress)
    }
    if (config.autoRelayRules) {
      msg.push('Relay rules: ' + JSON.stringify(config.autoRelayRules))
    }
    logger.info(msg.join(', '))
  }
}

outgoing.relayMail = function (emailObject, emailStream, isAutoRelay, callback) {
  emailQueue.push({
    emailObject: emailObject,
    emailStream: emailStream,
    isAutoRelay: isAutoRelay,
    callback: callback
  })
}

function relayMail (emailObject, emailStream, isAutoRelay, done) {
  if (!client) { return done(new Error('Outgoing mail not configured')) }

  if (isAutoRelay && config.autoRelayAddress) {
    emailObject.to = [{ address: config.autoRelayAddress }]
    emailObject.envelope.to = [{ address: config.autoRelayAddress, args: false }]
  }

  // Fallback to the object if the address key isn't defined
  const getAddress = function (addressObj) {
    return typeof addressObj.address !== 'undefined' ? addressObj.address : addressObj
  }

  const mailSendCallback = function (err) {
    if (err) {
      logger.error('Outgoing client login error: ', err)
      return done(err)
    }

    let recipients = emailObject.envelope.to.map(getAddress)
    const sender = getAddress(emailObject.envelope.from)

    if (isAutoRelay && config.autoRelayRules) {
      recipients = getAutoRelayableRecipients(recipients)
    }

    // Fail silently with auth relay mode on
    if (recipients.length === 0) {
      return done('Email had no recipients')
    }

    client.send({
      from: sender,
      to: recipients
    }, emailStream, function (err) {
      client.quit()
      outgoing._createClient()

      if (err) {
        logger.error('Mail Delivery Error: ', err)
        return done(err)
      }

      logger.log('Mail Delivered: ', emailObject.subject)

      return done()
    })
  }

  var mailConnectCallback = function (err) {
    if (err) {
      logger.error('Outgoing connection error: ', err)
      return done(err)
    }

    if (client.options.auth) {
      client.login(client.options.auth, mailSendCallback)
    } else {
      mailSendCallback(err)
    }
  }

  client.connect(mailConnectCallback)
}

function relayWorker (task, callback) {
  const relayCallback = function (err, result) {
    task.callback && task.callback(err, result)
    callback(err, result)
  }

  relayMail(task.emailObject, task.emailStream, task.isAutoRelay, relayCallback)
}

function getAutoRelayableRecipients (recipients) {
  return recipients.filter(function (email) {
    return validateAutoRelayRules(email)
  })
}

function validateAutoRelayRules (email) {
  if (!config.autoRelayRules) {
    return true
  }

  return config.autoRelayRules.reduce(function (result, rule) {
    const toMatch = rule.allow || rule.deny || ''
    const isMatch = wildstring.match(toMatch, email)

     // Override previous rule if it matches
    return isMatch
            ? (!!rule.allow)
            : result
  }, true)
}
