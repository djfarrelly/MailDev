/* global app, angular */

/**
 * Main App Controller -- Manage all emails visible in the list
 */
var refreshTimeout = null
var notificationTimeout = null

app.controller('MainCtrl', [
  '$scope', '$rootScope', '$http', 'Email', 'Group', '$route', '$location', 'Favicon',
  function ($scope, $rootScope, $http, Email, Group, $route, $location, Favicon) {
    $scope.notificationsSupported = 'Notification' in window && window.isSecureContext

    $scope.itemsLoading = true
    $scope.items = []
    $scope.groups = []
    $scope.group = { id: 'default' }
    $scope.currentItemId = null
    $scope.unreadItems = 0
    $scope.navMoreOpen = false
    $scope.deleteAllSafeguard = true

    var settingsKey = 'maildevSettings'

    var saveSettings = function () {
      if (window.localStorage) {
        window.localStorage.setItem(settingsKey, JSON.stringify($scope.settings))
      }
    }

    var loadSettings = function (defaultSettings) {
      try {
        var settingsJSON = window.localStorage.getItem(settingsKey)
        return Object.assign({}, defaultSettings, JSON.parse(settingsJSON))
      } catch (err) {
        console.error('Error loading MailDev settings', err)
        return defaultSettings
      }
    }

    var defaultSettings = {
      notificationsEnabled: false,
      autoShowEnabled: false,
      darkThemeEnabled: false
    }
    $scope.settings = loadSettings(defaultSettings)

    var countUnread = function () {
      $scope.unreadItems = $scope.items.filter(function (email) {
        return !email.read
      }).length
      Favicon.setUnreadCount($scope.unreadItems)
    }
    const isGroupUndefined = function () {
      return $scope.group.id === 'default'
    }

    // Load all emails
    var loadData = function () {
      $scope.itemsLoading = true
      $scope.items = isGroupUndefined() ? Email.query() : Group.get({ id: $scope.group.id })
      $scope.items.$promise.then(function () {
        $scope.itemsLoading = false
        countUnread()
      })
    }

    var loadGroups = function () {
      $scope.groups = Group.query()
    }

    $rootScope.$on('Refresh', function (e, d) {
      loadData()
      loadGroups()
    })

    $rootScope.$on('$routeChangeSuccess', function (e, route) {
      if (route.params) {
        $scope.currentItemId = route.params.itemId
      }
    })

    $rootScope.$on('newMail', function (e, newEmail) {
      // update model
      $scope.items.push(newEmail)
      loadGroups()
      countUnread()

      // update DOM at most 5 times per second
      if (!refreshTimeout) {
        refreshTimeout = setTimeout(function () {
          refreshTimeout = null
          if ($scope.settings.autoShowEnabled) {
            $location.path('/email/' + newEmail.id)
          }
          $scope.$apply()
        }, 200)
      }

      // show notifications
      if (!notificationTimeout && $scope.settings.notificationsEnabled) {
        notificationTimeout = setTimeout(function () {
          notificationTimeout = null
        }, 2000)
        new window.Notification('MailDev', { body: newEmail.subject, icon: 'favicon.ico' })
          .addEventListener('click', function () {
            $location.path('/email/' + newEmail.id)
            $scope.$apply()
          })
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

        var nextIdx = $scope.items.length === 1 ? null : idx === 0 ? idx + 1 : idx - 1
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

    $scope.markCurrentAsRead = function () {
      if (!$scope.currentItemId) return
      if (!$scope.items || !$scope.items.length) return

      var filtered = $scope.items.filter(function (e) {
        return e.id === $scope.currentItemId
      })

      if (!filtered || !filtered.length) return

      var currentItem = filtered[0]

      currentItem.read = true

      countUnread()
    }

    $scope.$watch('group', function (val, oldVal) {
      loadData()
    }, false)

    $scope.$watch('currentItemId', function (val, oldVal) {
      $scope.markCurrentAsRead()
    }, false)

    $scope.$watch('items', function (val, oldVal) {
      $scope.markCurrentAsRead()
    }, true)

    $scope.markReadAll = function () {
      $http({
        method: 'PATCH',
        url: 'email/read-all'
      })
        .success(function (data, status) {
          for (var email of $scope.items) {
            email.read = true
          }
          countUnread()
        })
        .error(function (data) {
          window.alert('Read all failed: ' + data.error)
        })
    }

    $scope.headerNavStopPropagation = function ($event) {
      $event.stopPropagation()
    }

    $scope.toggleNavMore = function ($event) {
      $event.stopPropagation()
      $scope.navMoreOpen = !$scope.navMoreOpen
    }

    function hideNavMore (e) {
      $scope.$apply(function () {
        $scope.navMoreOpen = false
      })
    }

    function addHideNavMoreHandler (element) {
      angular.element(element)
        .off('click', hideNavMore)
        .on('click', hideNavMore)
    }

    addHideNavMoreHandler(window)

    $scope.toggleAutoShow = function () {
      $scope.settings.autoShowEnabled = !$scope.settings.autoShowEnabled
      saveSettings()
    }

    $scope.refreshList = function () {
      $rootScope.$emit('Refresh')
    }

    $scope.deleteAll = function () {
      var t
      if ($scope.deleteAllSafeguard) {
        $scope.deleteAllSafeguard = false
        t = setTimeout(function () {
          $scope.deleteAllSafeguard = true
          $scope.$apply()
        }, 2000)
        return
      }
      clearTimeout(t)
      $scope.deleteAllSafeguard = true
      if (!isGroupUndefined()) {
        Group.delete($scope.group)
        return
      }
      Email.delete({ id: 'all' })
    }

    $scope.toggleDarkTheme = function () {
      $scope.settings.darkThemeEnabled = !$scope.settings.darkThemeEnabled
      saveSettings()
    }

    $scope.toggleNotifications = function () {
      if ($scope.notificationsSupported && $scope.settings.notificationsEnabled) {
        $scope.settings.notificationsEnabled = false
        saveSettings()
        return
      }

      window.Notification.requestPermission()
        .then(function (permissions) {
          $scope.settings.notificationsEnabled = permissions === 'granted'
          saveSettings()
        })
        .catch(function () {
          window.alert('Unable to enable web notifications. See console for more information')
        })
    }

    // Initialize the view
    loadData()
    loadGroups()

    $http({ method: 'GET', url: 'config' })
      .success(function (data) {
        $rootScope.config = data
        $scope.config = data
      })
  }
])
