/* global app */

/**
 * Main App Controller -- Manage all emails visible in the list
 */

app.controller('MainCtrl', [
  '$scope', '$rootScope', '$http', 'Email', '$route', '$location',
  function ($scope, $rootScope, $http, Email, $route, $location) {
    $scope.items = []
    $scope.configOpen = false
    $scope.currentItemId = null
    $scope.autoShow = false
    $scope.unreadItems = 0

    var countUnread = function () {
      $scope.unreadItems = $scope.items.filter(function (email) {
        return !email.read
      }).length
    }

    // Load all emails
    var loadData = function () {
      $scope.items = Email.query()
      $scope.items.$promise.then(function () {
        countUnread()
      })
    }

    $rootScope.$on('Refresh', function (e, d) {
      loadData()
    })

    $rootScope.$on('$routeChangeSuccess', function (e, route) {
      if (route.params) {
        $scope.currentItemId = route.params.itemId
      }
    })

    var refreshTimeout = null
    $rootScope.$on('newMail', function (e, newEmail) {
      // update model
      $scope.items.push(newEmail)
      countUnread()

      // update DOM at most 5 times per second
      if (!refreshTimeout) {
        refreshTimeout = setTimeout(function () {
          refreshTimeout = null
          if ($scope.autoShow === true) {
            $location.path('/email/' + newEmail.id)
          }
          $scope.$apply()
        }, 200)
      }
    })

    $rootScope.$on('deleteMail', function (e, email) {
      if (email.id === 'all') {
        $rootScope.$emit('Refresh')
        $location.path('/')
      } else {
        var idx = $scope.items.reduce(function (p, c, i) {
          if (p !== 0) return p
          return c.id === email.id ? i : 0
        }, 0)

        var nextIdx = $scope.items.length === 1 ? null
                      : idx === 0 ? idx + 1 : idx - 1
        if (nextIdx !== null) {
          $location.path('/email/' + $scope.items[nextIdx].id)
        } else {
          $location.path('/')
        }

        $scope.items.splice(idx, 1)
        countUnread()
        $scope.$apply()
      }
    })

    // Click event handlers
    $scope.markRead = function (email) {
      email.read = true
      countUnread()
    }

    $scope.showConfig = function () {
      $scope.configOpen = !$scope.configOpen
    }

    $scope.toggleAutoShow = function () {
      $scope.autoShow = !$scope.autoShow
    }

    // Initialize the view
    loadData()

    $http({method: 'GET', url: 'config'})
      .success(function (data) {
        $rootScope.config = data
        $scope.config = data
      })
  }
])

/**
 * Navigation Controller
 */

app.controller('NavCtrl', [
  '$scope', '$rootScope', '$location', 'Email',
  function ($scope, $rootScope, $location, Email) {
    $scope.refreshList = function () {
      $rootScope.$emit('Refresh')
    }

    $scope.deleteAll = function () {
      Email.delete({ id: 'all' })
    }
  }
])
