'use strict'

/**
 * MailDev - mailserver.js
 */

const SMTPServer = require('smtp-server').SMTPServer
const MailParser = require('mailparser-mit').MailParser
const events = require('events')
const fs = require('fs')
const os = require('os')
const path = require('path')
const rimraf = require('rimraf')
const utils = require('./utils')
const logger = require('./logger')
const smtpHelpers = require('./helpers/smtp')
const outgoing = require('./outgoing')
const stripTags = utils.stripTags

const store = []
const eventEmitter = new events.EventEmitter()

const defaultPort = 1025
const defaultHost = '0.0.0.0'
const defaultMailDir = path.join(os.tmpdir(), `maildev-${process.pid.toString()}`)

/**
 * Mail Server exports
 */

const mailServer = module.exports = {}

mailServer.store = store

/**
 * SMTP Server stream and helper functions
 */

// Save an email object on stream end
function saveEmailToStore (id, isRead = false, envelope, parsedEmail) {
  const emlPath = path.join(mailServer.mailDir, id + '.eml')

  const stat = fs.statSync(emlPath)

  // serialize attachments without stream object
  const serializedAttachments = (
    parsedEmail.attachments && parsedEmail.attachments.length ? parsedEmail.attachments.map(attachment => {
      const { stream, ...remaining } = attachment
      return remaining
    }) : null
  )

  const { attachments, ...parsedEmailRemaining } = parsedEmail

  let serialized = utils.clone(parsedEmailRemaining)

  serialized.id = id
  serialized.time = parsedEmail.date ? parsedEmail.date : new Date()
  serialized.read = isRead
  serialized.envelope = envelope
  serialized.source = path.join(mailServer.mailDir, id + '.eml')
  serialized.size = stat.size
  serialized.sizeHuman = utils.formatBytes(stat.size)
  serialized.attachments = serializedAttachments

  store.push(serialized)

  logger.log('Saving email: %s, id: %s', parsedEmail.subject, id)

  if (outgoing.isAutoRelayEnabled()) {
    mailServer.relayMail(serialized, true, function (err) {
      if (err) logger.error('Error when relaying email', err)
    })
  }

  eventEmitter.emit('new', serialized)
}

// Save an attachment
function saveAttachment (id, attachment) {
  if (!fs.existsSync(path.join(mailServer.mailDir, id))) {
    fs.mkdirSync(path.join(mailServer.mailDir, id))
  }
  var output = fs.createWriteStream(path.join(mailServer.mailDir, id, attachment.contentId))
  attachment.stream.pipe(output)
}

/**
 *  Handle smtp-server onData stream
 */
function handleDataStream (stream, session, callback) {
  const id = utils.makeId()

  const emlStream = fs.createWriteStream(path.join(mailServer.mailDir, id + '.eml'))
  emlStream.on('open', function () {
    const parseStream = new MailParser({
      streamAttachments: true
    })

    parseStream.on('end', saveEmailToStore.bind(null, id, false, {
      from: session.envelope.mailFrom,
      to: session.envelope.rcptTo,
      host: session.hostNameAppearsAs,
      remoteAddress: session.remoteAddress
    }))
    parseStream.on('attachment', saveAttachment.bind(null, id))

    stream.pipe(emlStream)
    stream.pipe(parseStream)

    stream.on('end', function () {
      emlStream.end()
      callback(null, 'Message queued as ' + id)
    })
  })
}

/**
 * Delete everything in the mail directory
 */
function clearMailDir () {
  fs.readdir(mailServer.mailDir, function (err, files) {
    if (err) throw err

    files.forEach(function (file) {
      rimraf(path.join(mailServer.mailDir, file), function (err) {
        if (err) throw err
      })
    })
  })
}

/**
 * Create mail directory
 */

function createMailDir () {
  if (!fs.existsSync(mailServer.mailDir)) {
    fs.mkdirSync(mailServer.mailDir)
  }
  logger.info('MailDev using directory %s', mailServer.mailDir)
}

/**
 * Create and configure the mailserver
 */

mailServer.create = function (port, host, mailDir, user, password, hideExtensions) {
  mailServer.mailDir = mailDir || defaultMailDir
  createMailDir()

  const hideExtensionOptions = getHideExtensionOptions(hideExtensions)
  const smtpServerConfig = Object.assign({
    onAuth: smtpHelpers.createOnAuthCallback(user, password),
    onData: handleDataStream,
    logger: false,
    hideSTARTTLS: true,
    disabledCommands: (user && password) ? ['STARTTLS'] : ['AUTH']
  }, hideExtensionOptions)

  const smtp = new SMTPServer(smtpServerConfig)

  smtp.on('error', mailServer.onSmtpError)

  mailServer.port = port || defaultPort
  mailServer.host = host || defaultHost

  // testability requires this to be exposed.
  // otherwise we cannot test whether error handling works
  mailServer.smtp = smtp
}

const HIDEABLE_EXTENSIONS = [
  'STARTTLS', // Keep it for backward compatibility, but is overriden by hardcoded `hideSTARTTLS`
  'PIPELINING',
  '8BITMIME',
  'SMTPUTF8'
]

function getHideExtensionOptions (extensions) {
  if (!extensions) {
    return {}
  }
  return extensions.reduce(function (options, extension) {
    const ext = extension.toUpperCase()
    if (HIDEABLE_EXTENSIONS.indexOf(ext) > -1) {
      options[`hide${ext}`] = true
    } else {
      throw new Error(`Invalid hideable extension: ${ext}`)
    }
    return options
  }, {})
}

/**
 * Start the mailServer
 */

mailServer.listen = function (callback) {
  if (typeof callback !== 'function') callback = null

  // Listen on the specified port
  mailServer.smtp.listen(mailServer.port, mailServer.host, function (err) {
    if (err) {
      if (callback) {
        callback(err)
      } else {
        throw err
      }
    }

    if (callback) callback()

    logger.info('MailDev SMTP Server running at %s:%s', mailServer.host, mailServer.port)
  })
}

/**
 * Handle mailServer error
 */

mailServer.onSmtpError = function (err) {
  if (err.code === 'ECONNRESET' && err.syscall === 'read') {
    logger.warn(`Ignoring "${err.message}" error thrown by SMTP server. Likely the client connection closed prematurely. Full error details below.`)
    logger.error(err)
  } else throw err
}

/**
 * Stop the mailserver
 */

mailServer.close = function (callback) {
  mailServer.emit('close')
  mailServer.smtp.close(callback)
  outgoing.close()
}

/**
 * Extend Event Emitter methods
 * events:
 *   'new' - emitted when new email has arrived
 */

mailServer.on = eventEmitter.on.bind(eventEmitter)
mailServer.emit = eventEmitter.emit.bind(eventEmitter)
mailServer.removeListener = eventEmitter.removeListener.bind(eventEmitter)
mailServer.removeAllListeners = eventEmitter.removeAllListeners.bind(eventEmitter)

/**
 * Get an email by id
 */

mailServer.getEmail = function (id, done) {
  var email = store.filter(function (element) {
    return element.id === id
  })[0]

  if (email) {
    if (email.html) {
      email.html = stripTags(email.html, ['script'])
    }
    done(null, email)
  } else {
    done(new Error('Email was not found'))
  }
}

/**
 * Returns a readable stream of the raw email
 */

mailServer.getRawEmail = function (id, done) {
  mailServer.getEmail(id, function (err, email) {
    if (err) return done(err)

    done(null, fs.createReadStream(path.join(mailServer.mailDir, id + '.eml')))
  })
}

/**
 * Returns the html of a given email
 */

mailServer.getEmailHTML = function (id, baseUrl, done) {
  if (!done && typeof baseUrl === 'function') {
    done = baseUrl
    baseUrl = null
  }

  if (baseUrl) { baseUrl = '//' + baseUrl }

  mailServer.getEmail(id, function (err, email) {
    if (err) return done(err)

    var html = email.html

    if (!email.attachments) { return done(null, html) }

    var embeddedAttachments = email.attachments.filter(function (attachment) {
      return attachment.contentId
    })

    var getFileUrl = function (id, baseUrl, filename) {
      return (baseUrl || '') + '/email/' + id + '/attachment/' + encodeURIComponent(filename)
    }

    if (embeddedAttachments.length) {
      embeddedAttachments.forEach(function (attachment) {
        var regex = new RegExp('src=("|\')cid:' + attachment.contentId + '("|\')', 'g')
        var replacement = 'src="' + getFileUrl(id, baseUrl, attachment.generatedFileName) + '"'
        html = html.replace(regex, replacement)
      })
    }

    done(null, html)
  })
}

/**
 * Read single email
 */

// mailServer.readEmail = function (id, done) {
//  var email = store.filter(function (element) {
//    return element.id === id
//  })[0]
//  if (email) {
//    email.read  = true
//    done(null, email)
//  } else {
//    done(new Error('Email was not found'))
//  }
// }

/**
 * Read all emails
 */

mailServer.readAllEmail = function (done) {
  const allUnread = store.filter(function (element) {
    return !element.read
  })
  for (const email of allUnread) {
    email.read = true
  }
  done(null, allUnread.length)
}

/**
 * Get all email
 */

mailServer.getAllEmail = function (done) {
  done(null, store)
}

/**
 * Delete an email by id
 */

mailServer.deleteEmail = function (id, done) {
  var email = null
  var emailIndex = null

  store.forEach(function (element, index) {
    if (element.id === id) {
      email = element
      emailIndex = index
    }
  })

  if (emailIndex === null) {
    return done(new Error('Email not found'))
  }

  // delete raw email
  fs.unlink(path.join(mailServer.mailDir, id + '.eml'), function (err) {
    if (err) {
      logger.error(err)
    } else {
      eventEmitter.emit('delete', { id: id, index: emailIndex })
    }
  })

  if (email.attachments) {
    rimraf(path.join(mailServer.mailDir, id), function (err) {
      if (err) throw err
    })
  }

  logger.warn('Deleting email - %s', email.subject)

  store.splice(emailIndex, 1)

  done(null, true)
}

/**
 * Delete all emails in the store
 */

mailServer.deleteAllEmail = function (done) {
  logger.warn('Deleting all email')

  clearMailDir()
  store.length = 0
  eventEmitter.emit('delete', { id: 'all' })

  done(null, true)
}

/**
 * Returns the content type and a readable stream of the file
 */

mailServer.getEmailAttachment = function (id, filename, done) {
  mailServer.getEmail(id, function (err, email) {
    if (err) return done(err)

    if (!email.attachments || !email.attachments.length) {
      return done(new Error('Email has no attachments'))
    }

    var match = email.attachments.filter(function (attachment) {
      return attachment.generatedFileName === filename
    })[0]

    if (!match) {
      return done(new Error('Attachment not found'))
    }

    done(null, match.contentType, fs.createReadStream(path.join(mailServer.mailDir, id, match.contentId)))
  })
}

/**
 * Setup outgoing
 */
mailServer.setupOutgoing = function (host, port, user, pass, secure) {
  outgoing.setup(host, port, user, pass, secure)
}

mailServer.isOutgoingEnabled = function () {
  return outgoing.isEnabled()
}

mailServer.getOutgoingHost = function () {
  return outgoing.getOutgoingHost()
}

/**
 * Set Auto Relay Mode, automatic send email to recipient
 */

mailServer.setAutoRelayMode = function (enabled, rules, emailAddress) {
  outgoing.setAutoRelayMode(enabled, rules, emailAddress)
}

/**
 * Relay a given email, accepts a mail id or a mail object
 */

mailServer.relayMail = function (idOrMailObject, isAutoRelay, done) {
  if (!outgoing.isEnabled()) { return done(new Error('Outgoing mail not configured')) }

  // isAutoRelay is an option argument
  if (typeof isAutoRelay === 'function') {
    done = isAutoRelay
    isAutoRelay = false
  }

  // If we receive a email id, get the email object
  if (typeof idOrMailObject === 'string') {
    mailServer.getEmail(idOrMailObject, function (err, email) {
      if (err) return done(err)
      mailServer.relayMail(email, done)
    })
    return
  }

  var mail = idOrMailObject

  mailServer.getRawEmail(mail.id, function (err, rawEmailStream) {
    if (err) {
      logger.error('Mail Stream Error: ', err)
      return done(err)
    }

    outgoing.relayMail(mail, rawEmailStream, isAutoRelay, done)
  })
}

/**
 * Download a given email
 */
mailServer.getEmailEml = function (id, done) {
  mailServer.getEmail(id, function (err, email) {
    if (err) return done(err)

    var filename = email.id + '.eml'

    done(null, 'message/rfc822', filename, fs.createReadStream(path.join(mailServer.mailDir, id + '.eml')))
  })
}

mailServer.loadMailsFromDirectory = function () {
  var persistencePath = fs.realpathSync(mailServer.mailDir)
  fs.readdir(persistencePath, function (err, files) {
    if (err) {
      logger.error('Error during reading of the mailDir %s', persistencePath)
    } else {
      store.length = 0
      files.forEach(function (file) {
        var filePath = persistencePath + '/' + file
        if (path.parse(file).ext === '.eml') {
          fs.readFile(filePath, 'utf8', function (err, data) {
            if (err) {
              logger.error('Error during reading of the file %s', filePath)
            } else {
              var idMail = path.parse(file).name
              var parseStream = new MailParser({
                streamAttachments: true
              })
              logger.log('Restore mail %s', idMail)
              var envelope = { from: '', to: '', host: 'undefined', remoteAddress: 'undefined' }
              parseStream.on('from', function (from) {
                envelope.from = from
              })
              parseStream.on('to', function (to) {
                envelope.to = to
              })
              parseStream.on('end', saveEmailToStore.bind(null, idMail, true, envelope))
              parseStream.on('attachment', saveAttachment.bind(null, idMail))
              parseStream.write(data)
              parseStream.end()
            }
          })
        }
      })
    }
  })
}
