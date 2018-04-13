/* global describe, it */
'use strict'
const expect = require('expect')
const SMTPServer = require('smtp-server').SMTPServer
const outgoing = require('../lib/outgoing')
const smptHelpers = require('../lib/helpers/smtp')

let lastPort = 1025
const getPort = () => lastPort++

describe('outgoing', () => {
  describe('setup', () => {
    it('should enable outgoing email', (done) => {
      const port = getPort()
      const smtpserver = new SMTPServer()
      smtpserver.listen(port, (err) => {
        expect(err).toNotExist()
        outgoing.setup()
        expect(outgoing.isEnabled()).toBe(true)
        outgoing.close()
        smtpserver.close(done)
      })
    })
  })

  describe('relayMail', () => {
    it('should send outgoing email', (done) => {
      const port = getPort()
      const email = {
        envelope: {
          to: ['reciever@test.com'],
          from: ['sender@test.com']
        },
        subject: 'Test email'
      }
      const message = 'A test email body'

      // When the email is full received we deem this successful
      const emailRecieved = (emailBody) => {
        // trim b/c new lines are added
        expect(emailBody.trim()).toBe(message)
        outgoing.close()
        smtpserver.close(done)
      }

      const smtpserver = new SMTPServer({
        authOptional: true,
        onData (stream, session, callback) {
          const chunks = []
          stream.on('data', (chunk) => chunks.push(chunk))
          stream.on('end', () => {
            emailRecieved(Buffer.concat(chunks).toString())
            callback()
          })
        }
      })
      smtpserver.listen(port, (err) => {
        expect(err).toNotExist()
        outgoing.setup(null, port)
        outgoing.relayMail(email, message, false, (err) => {
          expect(err).toNotExist()
          // emailRecieved should now be called to close this test
        })
      })
    })

    it('should handle authentication with outgoing smtp server', (done) => {
      const username = 'testuser'
      const password = 'testpassword'
      const port = getPort()
      const smtpserver = new SMTPServer({
        onAuth: smptHelpers.createOnAuthCallback(username, password)
      })
      smtpserver.listen(port, (err) => {
        expect(err).toNotExist()
        outgoing.setup(null, port, username, password)

        const email = {
          envelope: {
            to: ['reciever@test.com'],
            from: ['sender@test.com']
          },
          subject: 'Test email'
        }
        const message = 'A test email body'

        outgoing.relayMail(email, message, false, (err) => {
          expect(err).toNotExist()
          outgoing.close()
          smtpserver.close(done)
        })
      })
    })
  })
})
