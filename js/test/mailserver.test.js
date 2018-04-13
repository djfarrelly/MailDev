/* global describe, it */
'use strict'

/**
 * MailDev - mailserver.js -- test the mailserver options
 */

const assert = require('assert')
const SMTPConnection = require('smtp-connection')
const expect = require('expect')

const MailDev = require('../index.js')

describe('mailserver', function () {
  describe('smtp error handling', function () {
    it('Error should be thrown, because listening to server did not work', function (done) {
      const maildev = new MailDev({
        silent: true,
        disableWeb: true
      })
      let spy = expect.createSpy()
      spy = expect.spyOn(process, 'emit')
      maildev.smtp.emit('error', { address: 'someAddress', port: 11111 })

      expect(spy).toHaveBeenCalled()
      spy.restore()
      maildev.close(done)
    })
  })

  describe('smtp authentication', function () {
    it('should require authentication', function (done) {
      const maildev = new MailDev({
        incomingUser: 'bodhi',
        incomingPass: 'surfing',
        silent: true,
        disableWeb: true
      })

      maildev.listen(function (err) {
        if (err) return done(err)

        const connection = new SMTPConnection({
          port: maildev.port,
          host: maildev.host,
          tls: {
            rejectUnauthorized: false
          }
        })

        connection.connect(function (err) {
          if (err) return done(err)

          const envelope = {
            from: 'angelo.pappas@fbi.gov',
            to: 'johnny.utah@fbi.gov'
          }

          connection.send(envelope, 'They are surfers.', function (err) {
            // This should return an error since we're not authenticating
            assert.notEqual(typeof err, 'undefined')
            assert.equal(err.code, 'EENVELOPE')

            connection.close()
            maildev.close(done)
          })
        })
      })
    })

    it('should authenticate', function (done) {
      const maildev = new MailDev({
        incomingUser: 'bodhi',
        incomingPass: 'surfing',
        silent: true,
        disableWeb: true
      })

      maildev.listen(function (err) {
        if (err) return done(err)

        const connection = new SMTPConnection({
          port: maildev.port,
          host: maildev.host,
          tls: {
            rejectUnauthorized: false
          }
        })

        connection.connect(function (err) {
          if (err) return done(err)

          connection.login({
            user: 'bodhi',
            pass: 'surfing'
          }, function (err) {
            assert.equal(err, null, 'Login should not return error')

            const envelope = {
              from: 'angelo.pappas@fbi.gov',
              to: 'johnny.utah@fbi.gov'
            }

            connection.send(envelope, 'They are surfers.', function (err, info) {
              if (err) return done(err)

              assert.notEqual(typeof info, 'undefined')
              assert.equal(info.accepted.length, 1)
              assert.equal(info.rejected.length, 0)

              connection.close()
              maildev.close(done)
            })
          })
        })
      })
    })
  })
})
