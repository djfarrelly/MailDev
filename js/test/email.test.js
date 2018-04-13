/* global describe, it */
'use strict'

/**
 * MailDev - email.js -- test the email output
 */

const assert = require('assert')
const path = require('path')
const nodemailer = require('nodemailer')

const MailDev = require('../index.js')

const defaultMailDevOpts = {
  silent: true,
  disableWeb: true
}

const defaultNodemailerOpts = {
  port: 1025,
  ignoreTLS: true
}

describe('email', function () {
  it('should handle embedded images with cid', function (done) {
    const maildev = new MailDev(defaultMailDevOpts)
    const transporter = nodemailer.createTransport(defaultNodemailerOpts)

    const emailOpts = {
      from: 'johnny.utah@fbi.gov',
      to: 'bodhi@gmail.com',
      subject: 'Test cid replacement',
      html: '<img src="cid:12345"/>',
      attachments: [
        {
          filename: 'tyler.jpg',
          path: path.join(__dirname, '/tyler.jpg'),
          cid: '12345'
        }
      ]
    }

    maildev.on('new', function (email) {
      // Simple replacement to root url
      maildev.getEmailHTML(email.id, function (_, html) {
        assert.equal(html, '<img src="/email/' + email.id + '/attachment/tyler.jpg"/>')

        // Pass baseUrl
        maildev.getEmailHTML(email.id, 'localhost:8080', function (_, html) {
          assert.equal(html, '<img src="//localhost:8080/email/' + email.id + '/attachment/tyler.jpg"/>')

          maildev.close(function () {
            maildev.removeAllListeners()
            transporter.close()
            done()
          })
        })
      })
    })

    maildev.listen(function (err) {
      if (err) return done(err)
      transporter.sendMail(emailOpts)
    })
  })
})
