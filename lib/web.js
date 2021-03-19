'use strict'

/**
 * MailDev - web.js
 */

const express = require('express')
const cors = require('cors')
const http = require('http')
const https = require('https')
const fs = require('fs')
const socketio = require('socket.io')
const routes = require('./routes')
const auth = require('./auth')
const logger = require('./logger')
const path = require('path')

const web = module.exports = {}

/**
 * Keep record of all connections to close them on shutdown
 */
const connections = {}
let io

function handleConnection (socket) {
  const key = `${socket.remoteAddress}:${socket.remotePort}`
  connections[key] = socket
  socket.on('close', function () {
    delete connections[key]
  })
}

function closeConnections () {
  for (let key in connections) {
    connections[key].destroy()
  }
}

/**
 * WebSockets
 */

function emitNewMail (socket) {
  return function (email) {
    socket.emit('newMail', email)
  }
}

function emitDeleteMail (socket) {
  return function (email) {
    socket.emit('deleteMail', email)
  }
}

function webSocketConnection (mailserver) {
  return function onConnection (socket) {
    const newHandlers = emitNewMail(socket)
    const deleteHandler = emitDeleteMail(socket)
    mailserver.on('new', newHandlers)
    mailserver.on('delete', deleteHandler)

    function removeListeners () {
      mailserver.removeListener('new', newHandlers)
      mailserver.removeListener('delete', deleteHandler)
    }

    socket.on('disconnect', removeListeners)
  }
}

web.server = null

/**
 * Start the web server
 */

web.start = function (port, host, mailserver, user, password, basePathname, secure) {
  const app = express()
  if (secure.https) {
    if (fs.existsSync(secure.key) === false) {
      logger.error('Unable to find https secure key. Please specify key file via -https-key argument')
      return
    }
    if (fs.existsSync(secure.cert) === false) {
      logger.error('Unable to find https secure cert. Please specify cert file via -https-cert argument')
      return
    }
    const options = {
      key: fs.readFileSync(secure.key),
      cert: fs.readFileSync(secure.cert)
    }
    web.server = https.createServer(options, app)
  } else {
    web.server = http.createServer(app)
  }

  if (user && password) {
    app.use(auth(user, password))
  }

  if (!basePathname) {
    basePathname = '/'
  }

  io = socketio({ path: path.posix.join(basePathname, '/socket.io') })

  app.use(basePathname, express.static(path.join(__dirname, '../app')))

  app.use(cors())

  routes(app, mailserver, basePathname)

  io.attach(web.server, { cookie: false })
  io.on('connection', webSocketConnection(mailserver))

  port = port || 1080
  host = host || '0.0.0.0'

  web.server.listen(port, host)

  web.server.on('connection', handleConnection)

  logger.info('MailDev webapp running at http://%s:%s', host, port)
}

web.close = function (callback) {
  if (!web.server) {
    return callback()
  }
  closeConnections()
  io.close(callback)
}
