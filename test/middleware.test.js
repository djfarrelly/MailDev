/* global describe, it, before, after */
'use strict'

/**
 * MailDev - middleware.js -- test using MailDev as middleware
 */

const assert = require('assert')
const path = require('path')
const nodemailer = require('nodemailer')
const express = require('express')
const proxyMiddleware = require('http-proxy-middleware')
const got = require('got')

const MailDev = require('../index.js')

const defaultNodemailerOpts = {
  port: 1025,
  ignoreTLS: true
}

describe('middleware', function () {
  var server
  var maildev

  before(function (done) {
    const app = express()

    app.get('/', function (req, res) {
      res.send('root')
    })

    maildev = new MailDev({
      silent: true,
      basePathname: '/maildev'
    })

    // proxy all maildev requests to the maildev app
    const proxy = proxyMiddleware('/maildev', {
      target: 'http://localhost:1080',
      ws: true,
      logLevel: 'silent'
    })

    // Maildev available at the specified route '/maildev'
    app.use(proxy)

    server = app.listen(8080, function (_) {
      maildev.listen(done)
    })
  })

  after(function (done) {
    maildev.close(function () {
      maildev.removeAllListeners()
      server.close(done)
    })
  })

  it('should run as middleware in another express app', function (done) {
    // Request to the express app
    got('http://localhost:8080/')
      .then(function (res) {
        assert.strictEqual(res.body, 'root')
        return got('http://localhost:8080/maildev/email')
          .then(function (res) {
            assert.strictEqual(res.statusCode, 200)

            const json = JSON.parse(res.body)
            assert(Array.isArray(json))

            done()
          })
          .catch(done)
      })
      .catch(done)
  })

  it('should serve email attachments with working urls', function (done) {
    const transporter = nodemailer.createTransport(defaultNodemailerOpts)

    const emailOpts = {
      from: 'johnny.utah@fbi.gov',
      to: 'bodhi@gmail.com',
      subject: 'Test cid replacement for use w/ middleware',
      html: '<img src="cid:12345"/>',
      attachments: [
        {
          filename: 'tyler.jpg',
          path: path.join(__dirname, '/tyler.jpg'),
          cid: '12345'
        }
      ]
    }

    transporter.sendMail(emailOpts)

    maildev.on('new', function (email) {
      got(`http://localhost:8080/maildev/email/${email.id}/html`)
        .then(function (res) {
          assert.strictEqual(
            res.body,
            `<html><head></head><body><img src="//localhost:8080/maildev/email/${email.id}/attachment/tyler.jpg"></body></html>`
          )
          maildev.removeAllListeners()
          done()
        })
        .catch(done)
    })
  })
})
