/* global describe, it */
'use strict'
const expect = require('expect')
const utils = require('../lib/utils')

describe('utils', () => {
  describe('makeId', () => {
    it('should make an id 8 characters long', () => {
      expect(utils.makeId().length).toEqual(8)
    })

    it('should be alphanumeric', () => {
      const alphaNumericRegex = /^[a-z0-9]+$/i
      expect(utils.makeId()).toMatch(alphaNumericRegex)
    })
  })

  describe('filterEmails', () => {
    const emails = [
      { subject: 'Test', headers: { 'x-some-header': 1 } },
      { subject: 'Test' },
      { subject: 'Test2' }
    ]

    it('should filter by differect predicates', () => {
      expect(utils.filterEmails(emails, { subject: 'Test' }).length).toEqual(2)
      expect(utils.filterEmails(emails, { subject: 'Test2' }).length).toEqual(1)
      expect(utils.filterEmails(emails, { 'headers.x-some-header': 1 }).length).toEqual(1)
      expect(utils.filterEmails(emails, { subject: 'Test', 'headers.x-some-header': 1 }).length).toEqual(1)
      expect(utils.filterEmails(emails, { subject: 'Test', 'headers.x-some-header': 0 }).length).toEqual(0)
    })
  })
})
