/* global app */

/**
 * Email Resource
 */

app.service('Email', ['$resource', function ($resource) {
  return $resource('email/:id', { id: '' }, {
    update: {
      method: 'PUT',
      params: {}
    }
  })
}])
