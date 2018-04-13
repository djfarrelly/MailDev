/* global describe, it */
'use strict'
const spawn = require('child_process').spawn
const path = require('path')
const expect = require('expect')

const bin = path.join(__dirname, '../bin/maildev')

describe('cli', () => {
  it('should shutdown with SIGTERM signal', (done) => {
    const maildev = spawn(bin)
    maildev.on('close', (code, signal) => {
      expect(signal).toBe('SIGTERM')
      done()
    })
    maildev.kill('SIGTERM')
  })

  it('should shutdown with SIGINT signal', (done) => {
    const maildev = spawn(bin)
    maildev.on('close', (code, signal) => {
      expect(signal).toBe('SIGINT')
      done()
    })
    maildev.kill('SIGINT')
  })
})
