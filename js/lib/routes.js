'use strict'

/**
 * MailDev - routes.js
 */
const express = require('express')
const pkg = require('../package.json')

const emailRegexp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

module.exports = function (app, mailserver, basePathname) {
  var router = express.Router()

  // Get all emails
  router.get('/email', function (req, res) {
    mailserver.getAllEmail(function (err, emailList) {
      if (err) return res.status(404).json([])

      res.json(emailList)
    })
  })

  // Get single email
  router.get('/email/:id', function (req, res) {
    mailserver.getEmail(req.params.id, function (err, email) {
      if (err) return res.status(404).json({ error: err.message })

       // Mark the email as 'read'
      email.read = true

      res.json(email)
    })
  })

  // Delete all emails
  router.delete('/email/all', function (req, res) {
    mailserver.deleteAllEmail(function (err) {
      if (err) return res.status(500).json({ error: err.message })

      res.json(true)
    })
  })

  // Delete email by id
  router.delete('/email/:id', function (req, res) {
    mailserver.deleteEmail(req.params.id, function (err) {
      if (err) return res.status(500).json({ error: err.message })

      res.json(true)
    })
  })

  // Get Email HTML
  router.get('/email/:id/html', function (req, res) {
    // Use the headers over hostname to include any port
    var baseUrl = req.headers.host + (req.baseUrl || '')

    mailserver.getEmailHTML(req.params.id, baseUrl, function (err, html) {
      if (err) return res.status(404).json({ error: err.message })

      res.send(html)
    })
  })

  // Serve Attachments
  router.get('/email/:id/attachment/:filename', function (req, res) {
    mailserver.getEmailAttachment(req.params.id, req.params.filename, function (err, contentType, readStream) {
      if (err) return res.status(404).json('File not found')

      res.contentType(contentType)
      readStream.pipe(res)
    })
  })

  // Serve email.eml
  router.get('/email/:id/download', function (req, res) {
    mailserver.getEmailEml(req.params.id, function (err, contentType, filename, readStream) {
      if (err) return res.status(404).json('File not found')

      res.setHeader('Content-disposition', 'attachment; filename=' + filename)
      res.contentType(contentType)
      readStream.pipe(res)
    })
  })

  // Get email source from .eml file
  router.get('/email/:id/source', function (req, res) {
    mailserver.getRawEmail(req.params.id, function (err, readStream) {
      if (err) return res.status(404).json('File not found')
      readStream.pipe(res)
    })
  })

  // Get any config settings for display
  router.get('/config', function (req, res) {
    res.json({
      version: pkg.version,
      smtpPort: mailserver.port,
      isOutgoingEnabled: mailserver.isOutgoingEnabled(),
      outgoingHost: mailserver.getOutgoingHost()
    })
  })

  // Relay the email
  router.post('/email/:id/relay/:relayTo?', function (req, res) {
    mailserver.getEmail(req.params.id, function (err, email) {
      if (err) return res.status(404).json({ error: err.message })

      if (req.params.relayTo) {
        if (emailRegexp.test(req.params.relayTo)) {
          email.to = [{address: req.params.relayTo}]
          email.envelope.to = [{ address: req.params.relayTo, args: false }]
        } else {
          return res.status(400).json({ error: 'Incorrect email address provided :' + req.params.relayTo })
        }
      }

      mailserver.relayMail(email, function (err) {
        if (err) return res.status(500).json({ error: err.message })

        res.json(true)
      })
    })
  })

  app.use(basePathname, router)
}
