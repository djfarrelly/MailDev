/* global describe, it */
'use strict'
const expect = require('expect')
const auth = require('../lib/auth')

describe('auththentication middleware', () => {
  it('should return a function', () => {
    const middleware = auth('user', 'password')
    expect(middleware).toBeA(Function)
  })

  it('should return Unauthorized without authorization headers', () => {
    const middleware = auth('user', 'password')
    const fakeRequest = {
      headers: {}
    }
    const fakeResponse = {
      statusCode: null,
      setHeader: expect.createSpy(),
      send: expect.createSpy()
    }

    middleware(fakeRequest, fakeResponse)

    expect()
    expect(fakeResponse.setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Basic realm="Authentication required"'
    )
    expect(fakeResponse.send).toHaveBeenCalled()
  })

  it('should return Unauthorized with incorrect authorization username and password', () => {
    const middleware = auth('user', 'password')
    const fakeRequest = {
      headers: {
        authorization: `Basic ${Buffer.from('not:correct').toString('base64')}`
      }
    }
    const fakeResponse = {
      statusCode: null,
      setHeader: expect.createSpy(),
      send: expect.createSpy()
    }

    middleware(fakeRequest, fakeResponse)

    expect()
    expect(fakeResponse.setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Basic realm="Authentication required"'
    )
    expect(fakeResponse.send).toHaveBeenCalled()
  })

  it('should call next function with valid username and password', (done) => {
    const middleware = auth('user', 'password')
    const fakeRequest = {
      headers: {
        authorization: `Basic ${Buffer.from('user:password').toString('base64')}`
      }
    }
    const fakeResponse = {
      statusCode: null,
      setHeader: function () {},
      send: function () {}
    }

    middleware(fakeRequest, fakeResponse, done)
  })
})
