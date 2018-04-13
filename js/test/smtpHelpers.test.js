/* global describe, it */
'use strict'
const expect = require('expect')
const smptHelpers = require('../lib/helpers/smtp')

describe('smtpHelpers', () => {
  describe('createOnAuthCallback', () => {
    it('should return a function', () => {
      const onAuth = smptHelpers.createOnAuthCallback('username', 'password')
      expect(onAuth).toBeA(Function)
    })

    it('onAuth function should correctly authenticate', (done) => {
      const onAuth = smptHelpers.createOnAuthCallback('username', 'password')
      onAuth({ username: 'username', password: 'password' }, {}, done)
    })

    it('onAuth function should reject incorrect username or password', (done) => {
      const onAuth = smptHelpers.createOnAuthCallback('username', 'password')
      onAuth({ username: 'false', password: 'password' }, {}, (err) => {
        expect(err).toBeA(Error)
        onAuth({ username: 'username', password: 'false' }, {}, (err) => {
          expect(err).toBeA(Error)
          done()
        })
      })
    })
  })
})
