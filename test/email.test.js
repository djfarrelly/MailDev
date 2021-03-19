/* global describe, it */
'use strict'

/**
 * MailDev - email.js -- test the email output
 */

const assert = require('assert')
const fs = require('fs')
const http = require('http')
const path = require('path')
const nodemailer = require('nodemailer')

const MailDev = require('../index.js')

const defaultMailDevOpts = {
  silent: true
}

const defaultNodemailerOpts = {
  port: 1025,
  ignoreTLS: true
}

describe('email', function () {
  it('should stripe javascript from emails', function (done) {
    const maildev = new MailDev(defaultMailDevOpts)
    const transporter = nodemailer.createTransport(defaultNodemailerOpts)

    const email = {
      from: 'johnny.utah@fbi.gov',
      to: 'bodhi@gmail.com',
      subject: 'Test cid replacement #1',
      text: 'The wax at the bank was surfer wax!!!',
      html: '<!DOCTYPE html><html><head></head><body>' +
            '<script type=\'text/javascript\'>alert("Hello World")</script>' +
            '<p>The wax at the bank was surfer wax!!!</p>' +
            '</body></html>'
    }

    maildev.on('new', function (email) {
      maildev.getEmailHTML(email.id, function (_, html) {
        assert.strictEqual(html, '<!DOCTYPE html><html><head></head><body><p>The wax at the bank was surfer wax!!!</p></body></html>')
        maildev.close(function () {
          maildev.removeAllListeners()
          transporter.close()
          done()
        })
      })
    })

    maildev.listen(function (err) {
      if (err) return done(err)
      transporter.sendMail(email)
    })
  })

  it('should handle embedded images with cid', function (done) {
    const maildev = new MailDev(defaultMailDevOpts)
    const transporter = nodemailer.createTransport(defaultNodemailerOpts)

    const email1Opts = {
      from: 'johnny.utah@fbi.gov',
      to: 'bodhi@gmail.com',
      subject: 'Test cid replacement #1',
      html: '<img src="cid:image"/>',
      attachments: [
        {
          filename: 'tyler.jpg',
          path: path.join(__dirname, 'tyler.jpg'),
          cid: 'image'
        }
      ]
    }

    const email2Opts = {
      from: 'johnny.utah@fbi.gov',
      to: 'bodhi@gmail.com',
      subject: 'Test cid replacement #2',
      html: '<img src="cid:image"/>',
      attachments: [
        {
          filename: 'wave.jpg',
          path: path.join(__dirname, 'wave.jpg'),
          cid: 'image'
        }
      ]
    }

    let seenEmails = 0

    maildev.on('new', function (email) {
      // Simple replacement to root url
      maildev.getEmailHTML(email.id, function (_, html) {
        const attachmentFilename = (email.subject.endsWith('#1')) ? 'tyler.jpg' : 'wave.jpg'
        assert.strictEqual(html, '<html><head></head><body><img src="/email/' + email.id + '/attachment/' + attachmentFilename + '"></body></html>')

        // Pass baseUrl
        maildev.getEmailHTML(email.id, 'localhost:8080', function (_, html) {
          assert.strictEqual(html, '<html><head></head><body><img src="//localhost:8080/email/' + email.id + '/attachment/' + attachmentFilename + '"></body></html>')

          // Check contents of attached/embedded files
          http.get('http://localhost:1080/email/' + email.id + '/attachment/' + attachmentFilename, function (res) {
            if (res.statusCode !== 200) {
              done(new Error('Failed to get attachment: ' + res.statusCode))
            }
            let data = ''
            res.setEncoding('binary')
            res.on('data', function (chunk) {
              data += chunk
            })
            res.on('end', function () {
              const fileContents = fs.readFileSync(path.join(__dirname, attachmentFilename), 'binary')
              assert.strictEqual(data, fileContents)

              seenEmails++
              if (seenEmails === 2) {
                maildev.close(function () {
                  maildev.removeAllListeners()
                  transporter.close()
                  done()
                })
              }
            })
          }).on('error', function (err) {
            done(err)
          })
        })
      })
    })

    maildev.listen(function (err) {
      if (err) return done(err)
      transporter.sendMail(email1Opts)
      transporter.sendMail(email2Opts)
    })
  })
})
