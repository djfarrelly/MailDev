
/**
 * MailDev - send.js -- send a few emails for testing
 *
 * Run this to send emails to port 1025 for testing MailDev during development
 *   node test/scripts/send.js
 */
const path = require('path')
const fs = require('fs')
const nodemailer = require('nodemailer')

// https://github.com/minimaxir/big-list-of-naughty-strings
// const blns = require('blns');

var blns = fs.readFileSync(path.join(__dirname, './resources/blns.txt'))
var utf8sampler = fs.readFileSync(path.join(__dirname, './resources/utf-8-sampler.html'))
// var utf8demo = fs.readFileSync(path.join(__dirname, './resources/utf-8-demo.html'))
// var utf8quickbrown = fs.readFileSync(path.join(__dirname, './resources/utf-8-quickbrown.html'))

// Create a transport with MailDev's default receiving port
var transporter = nodemailer.createTransport({
  port: 1025,
  ignoreTLS: true
})

// Messages list
var messages = [

  // Email w/ simple attachment and basic header
  {
    from: 'Angelo Pappas <angelo.pappas@fbi.gov>',
    to: 'Johnny Utah <johnny.utah@fbi.gov>',
    subject: 'The ex-presidents are surfers',
    headers: {
      'X-some-header': 1000
    },
    text: 'The wax at the bank was surfer wax!!!',
    html: '<!DOCTYPE html><html><head></head><body>' +
          '<script type=\'text/javascript\'>alert("Hello World")</script>' +
          '<p>The wax at the bank was surfer wax!!!</p>' +
          '</body></html>',
    attachments: [
      { fileName: 'notes.txt', content: 'Info on surf board wax', contentType: 'text/plain' }
    ]
  },

  // Email w/ simple attachment and basic header
  {
    from: 'Angelo Pappas <angelo.pappas@fbi.gov>',
    to: [ 'Johnny Long Name Utah <johnny.long.email.address.utah@fbi.gov>', 'Johnny Utah <johnny.utah@fbi.gov>', 'Bodhi <bodhi@gmail.com>' ],
    subject: 'Look at it! It\'s a once in a lifetime opportunity, man! Let me go out there and let me get one wave, just one wave before you take me in.',
    headers: {
      'X-some-header': 1000
    },
    text: 'Look at it! It\'s a once in a lifetime opportunity, man! Let me go out there and let me get one wave, just one wave before you take me in. I mean, come on man, where I am I gonna go? Cliffs on both sides! I\'m not gonna paddle my way to New Zealand! Come on, compadre. Come on!\n'.repeat(100),
    html: '<!DOCTYPE html><html><head></head><body>' +
          '<p>Look at it! It\'s a once in a lifetime opportunity, man! Let me go out there and let me get one wave, just one wave before you take me in. I mean, come on man, where I am I gonna go? Cliffs on both sides! I\'m not gonna paddle my way to New Zealand! Come on, compadre. Come on!</p>'.repeat(100) +
          '</body></html>'
  },

  // Plain text email
  {
    from: 'Johnny Utah <johnny.utah@fbi.gov>',
    to: 'Angelo Pappas <angelo.pappas@fbi.gov>',
    subject: 'You were right.',
    text: 'They are surfers.'
  },

  // HTML email w/ image
  {
    from: 'Bodhi <bodhi@gmail.com>',
    to: 'Johnny Utah <johnny.utah@fbi.gov>',
    subject: 'The ultimate price',
    text: 'If you want the ultimate, you\'ve got to be willing to pay the ultimate price. \nIt\'s not tragic to die doing what you love.',
    html: '<!DOCTYPE html><html><head></head><body style="background:#eee;font-family:sans-serif;padding:2em 2em">' +
          '<h1>Point Break</h1>' +
          '<img src="http://farm8.staticflickr.com/7337/11784709785_bbed9bae7d_m.jpg">' +
          '<p>If you want the ultimate, you\'ve got to be willing to pay the ultimate price. <br>It\'s not tragic to die doing what you love.</p>' +
          '<p><strong>- Bodhi</strong></p>' +
          '</body></html>'
  },

  // Email w/ embedded image
  {
    from: 'Johnny Utah <johnny.utah@fbi.gov>',
    to: 'Bodhi <bodhi@gmail.com>',
    subject: 'Where\'s Tyler?',
    html: 'Here she is:<br><img src="cid:image"/>',
    attachments: [
      {
        filename: 'tyler.jpg',
        path: path.join(__dirname, '/../test/tyler.jpg'),
        cid: 'image'
      }
    ]
  },

  // Another email w/ embedded image, with same cid
  {
    from: 'Bodhi <bodhi@gmail.com>',
    to: 'Johnny Utah <johnny.utah@fbi.gov>',
    subject: 'Big wave coming',
    html: 'You need to catch this!<br><img src="cid:image"/>',
    attachments: [
      {
        filename: 'wave.jpg',
        path: path.join(__dirname, '/../test/wave.jpg'),
        cid: 'image'
      }
    ]
  },

  // Email with mutliple to, cc & bcc
  {
    from: 'Bodhi <bodhi@gmail.com>',
    to: ['Johnny First <johnny.first@fbi.gov>', 'Johnny Second <johnny.second@fbi.gov>'],
    cc: ['Johnny Third <johnny.third@fbi.gov>', 'Johnny Fourth <johnny.fourth@fbi.gov>'],
    bcc: ['Johnny Fifth <johnny.fifth@fbi.gov>', 'Johnny Sixth <johnny.sixth@fbi.gov>'],
    subject: '100% pure adrenaline!',
    text: 'This is stimulating, but we\'re out of here.'
  },

  // Email with big list of naughty strings
  {
    from: 'Bodhi <bodhi@gmail.com>',
    to: 'Johnny Utah <johnny.utah@fbi.gov>',
    subject: 'Naughty!',
    text: blns,
    html: '<!DOCTYPE html><html><head></head><body>' + blns + '</body></html>'
  },

  //
  {
    from: 'Bodhi <bodhi@gmail.com>',
    to: 'Johnny Utah <johnny.utah@fbi.gov>',
    subject: 'Have a sample of this',
    text: utf8sampler,
    html: utf8sampler
  },

  // Another email with custom group header
  {
    from: 'FatMancho <fat@mancho.com>',
    to: 'Jason Patric <jason.patric@times.com>',
    subject: 'Hells Kitchen',
    headers: {
      'X-maildev-group': 'group1'
    },
    html: 'You want a Rolls-Royce, you don\'t come here, no no. You go to England, or wherever the .... they make it.'
  },

  // Another email with custom group header
  {
    from: 'FatMancho <fat@mancho.com>',
    to: 'Jason Patric <jason.patric@times.com>',
    subject: 'Hells Kitchen',
    headers: {
      'X-maildev-group': 'group1'
    },
    html: 'You want a Rolls-Royce, you don\'t come here, no no. You go to England, or wherever the .... they make it.'
  }

  //
  /*
  {
    from: 'Bodhi <bodhi@gmail.com>',
    to: 'Johnny Utah <johnny.utah@fbi.gov>',
    subject: 'UTF-8 demo',
    text: utf8demo,
    html: utf8demo
  },

  //
  {
    from: 'Bodhi <bodhi@gmail.com>',
    to: 'Johnny Utah <johnny.utah@fbi.gov>',
    subject: 'UTF-8 quickbrown',
    text: utf8quickbrown,
    html: utf8quickbrown
  },

  //
  {
    from: 'Bodhi <bodhi@gmail.com>',
    to: 'Johnny Utah <johnny.utah@fbi.gov>',
    subject: 'UTF-8 subject / Я могу есть / ᛁᚳ᛫ᛗᚨᚷ᛫ᚷᛚᚨᛋ / 𐌼𐌰𐌲 𐌲𐌻𐌴𐍃 𐌹̈𐍄𐌰𐌽 / Μπορώ να φάω / 私はガ / ฉันกินก / 我能吞下 / ฉันกินก / ཤེལ་སྒོ་ཟ་ནས་ / אני יכול / მინას ვჭამ / لا يؤلمني / Mogę jeść szkło / Tsésǫʼ yishą́ągo / ⡍⠜⠇⠑⠹ ⠺',
    text: 'This test is only for subject.'
  }
  */

]

function sendEmails (logErrors) {
  messages.forEach(function (message) {
    transporter.sendMail(message, function (err, info) {
      if (logErrors && err) { return console.log('Test email error: ', err) }
      console.log('Test email sent: ' + info.response)
    })
  })
}

// Run once if called directly, otherwise export
if (require.main === module) { sendEmails(true) } else { module.exports = sendEmails }
