/* global angular, app, prompt */

/**
 * Email item Controller -- The UI for the email pane
 */

app.controller('ItemCtrl', [
  '$scope', '$rootScope', '$routeParams', '$location', 'Email', '$http', '$cookies',
  function ($scope, $rootScope, $routeParams, $location, Email, $http, $cookies) {
    var iframe = null

    // Get the item data by route parameter
    var getItem = function () {
      Email.get({ id: $routeParams.itemId }, function (email) {
        $scope.item = new Email(email)

        if ($scope.item.html) {
          $scope.item.iframeUrl = 'email/' + $scope.item.id + '/html'
          prepIframe()
          $scope.panelVisibility = 'html'
        } else {
          $scope.htmlView = 'disabled'
          $scope.panelVisibility = 'plain'
        }
      }, function () {
        console.error('404: Email not found')
        $location.path('/')
      })
    }

    // Get email source
    var getSource = function () {
      if (typeof $scope.rawEmail === 'undefined') {
        $scope.rawEmail = 'email/' + $scope.item.id + '/source'
      }
    }

    // Prepares the iframe for interaction
    var prepIframe = function () {
      // Wait for iframe to load
      setTimeout(function () {
        var baseEl
        var head

        iframe = document.getElementsByTagName('iframe')[0]
        head = iframe.contentDocument.getElementsByTagName('head')[0]
        baseEl = iframe.contentDocument.createElement('base')

        // Append <base target="_blank" /> to <head> in the iframe so all links open in new window
        baseEl.setAttribute('target', '_blank')

        if (head) head.appendChild(baseEl)

        replaceMediaQueries()
        fixIframeHeight()

        addHideDropdownHanlder(iframe.contentDocument.getElementsByTagName('body')[0])
      }, 500)
    }

    // Updates the iframe height so it matches it's content
    // This prevents the iframe from having scrollbars
    var fixIframeHeight = function () {
      var body = iframe.contentDocument.getElementsByTagName('body')[0]
      var newHeight = body.scrollHeight

      iframe.height = newHeight
    }

    // Updates all media query rules to use 'width' instead of device width
    var replaceMediaQueries = function () {
      angular.forEach(iframe.contentDocument.styleSheets, function (styleSheet) {
        angular.forEach(styleSheet.cssRules, function (rule) {
          if (rule.media && rule.media.mediaText) {
            // TODO -- Add future warning if email doesn't use '[max|min]-device-width' media queries
            rule.media.mediaText = rule.media.mediaText.replace('device-width', 'width')
          }
        })
      })
    }

    // NOTE: This is kind of a hack to get these dropdowns working. Should be revisited in the future

    // Toggle a dropdown open/closed by toggling a class on the trigger itself
    $scope.toggleDropdown = function ($event, dropdownName) {
      $event.stopPropagation()
      $scope.dropdownOpen = dropdownName === $scope.dropdownOpen ? '' : dropdownName
    }

    function hideDropdown (e) {
      $scope.$apply(function () {
        $scope.dropdownOpen = ''
      })
    }

    function addHideDropdownHanlder (element) {
      angular.element(element)
        .off('click', hideDropdown)
        .on('click', hideDropdown)
    }

    function validateEmail (email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      return re.test(email)
    }

    addHideDropdownHanlder(window)

    // Toggle what format is viewable
    $scope.show = function (type) {
      if ((type === 'html' || type === 'attachments') && !$scope.item[type]) return
      if (type === 'source') getSource()

      $scope.panelVisibility = type
    }

    // Sends a DELETE request to the server
    $scope.delete = function (item) {
      Email.delete({ id: item.id })
    }

    // Updates iframe to have a width of newSize, i.e. '320px'
    $scope.resize = function (newSize) {
      iframe.style.width = newSize || '100%'
      fixIframeHeight()
      $scope.iframeSize = newSize
    }

    // Relay email to
    $scope.relayTo = function (item) {
      var lastRelayTo = $cookies.relayTo

      var relayTo = prompt('Please enter email address to relay', lastRelayTo)

      if (relayTo) {
        if (validateEmail(relayTo)) {
          $scope.relay(item, relayTo)
          $cookies.relayTo = relayTo
        } else {
          window.alert('The specified email address is not correct.')
        }
      }
    }

    // Relay email
    $scope.relay = function (item, relayTo) {
      if (!$rootScope.config.isOutgoingEnabled) {
        window.alert(
          'Relay feature has not been configured.\n' +
          'Run maildev --help for configuration info.'
        )
        return
      }

      if (

          window.confirm(
            'Are you sure you want to REALLY SEND email to ' +
            (relayTo || item.to.map(function (to) { return to.address }).join()) + ' through ' +
            $rootScope.config.outgoingHost + '?'
          )
        ) {
        $http({
          method: 'POST',
          url: 'email/' + item.id + '/relay' + (relayTo ? '/' + relayTo : '')
        })
          .success(function (data, status) {
            console.log('Relay result: ', data, status)
            window.alert('Relay successful')
          })
          .error(function (data) {
            window.alert('Relay failed: ' + data.error)
          })
      }
    }

    // Initialize the view by getting the email
    getItem()
  }
])
