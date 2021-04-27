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
}]).service('Group', ['$resource', function ($resource) {
  return $resource('group/:id', { id: '' }, {
    get: {
      method: 'GET',
      isArray: true
    }
  })
}]).service('Favicon', [function () {
  const favicon = document.getElementById('favicon')
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const bufferImage = new window.Image()

  var lastUnreadCount = 0
  const faviconSize = 16
  const pos = {
    x: faviconSize - faviconSize / 3,
    y: faviconSize - faviconSize / 3
  }

  bufferImage.src = './favicon.ico'
  bufferImage.onload = function () {
    setUnreadCount(lastUnreadCount)
  }

  canvas.width = canvas.height = faviconSize

  const drawCircle = function (ctx, pos) {
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, faviconSize / 2.4, 0, 2 * Math.PI)
    ctx.fillStyle = '#d00'
    ctx.fill()
    ctx.stroke()
  }

  const drawText = function (ctx, pos, text) {
    ctx.font = 'bold 9px "helvetica", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(text, pos.x, pos.y)
  }

  const setUnreadCount = function (unreadCount) {
    lastUnreadCount = unreadCount
    if (unreadCount === 0) {
      favicon.href = bufferImage.src
      return
    }

    context.drawImage(bufferImage, 0, 0, faviconSize, faviconSize)
    drawCircle(context, pos)
    drawText(context, pos, unreadCount)

    favicon.href = canvas.toDataURL('image/png')
  }

  return {
    setUnreadCount: setUnreadCount
  }
}])
