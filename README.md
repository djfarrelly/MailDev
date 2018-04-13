# MailDev

[![Build Status](https://api.travis-ci.org/djfarrelly/MailDev.svg)](https://travis-ci.org/djfarrelly/MailDev)
[![codecov](https://codecov.io/gh/djfarrelly/MailDev/branch/master/graph/badge.svg)](https://codecov.io/gh/djfarrelly/MailDev)
[![NPM Version](https://img.shields.io/npm/v/maildev.svg)](https://www.npmjs.com/package/maildev)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**MailDev** is a simple way to test your project's generated emails during development with an easy to use web interface that runs on your machine built on top of [Node.js](http://www.nodejs.org). It also contains a [POP3](https://en.wikipedia.org/wiki/POP3) and [IMAP](https://en.wikipedia.org/wiki/IMAP) server, thanks to [dovecot](https://www.dovecot.org/).

![MailDev Screenshot](https://github.com/djfarrelly/MailDev/blob/gh-pages/images/screenshot-2015-03-29.png?raw=true)

## Install & Run

    $ npm install -g maildev
    $ maildev

If you want to use MailDev with [Docker](https://www.docker.com/), you can use the
[**djfarrelly/maildev** image on Docker Hub](https://registry.hub.docker.com/u/djfarrelly/maildev/).
For a guide for usage with Docker,
[checkout the docs](https://github.com/djfarrelly/MailDev/blob/master/docs/docker.md).

    $ docker run -p 1080:80 -p 1025:25 djfarrelly/maildev

For convenient use with Grunt, try [grunt-maildev](https://github.com/xavierpriour/grunt-maildev).

## Usage

    maildev [options]

      -h, --help                      output usage information
      -V, --version                   output the version number
      -s, --smtp <port>               SMTP port to catch emails [1025]
      -w, --web <port>                Port to run the Web GUI [1080]
      --ip <ip address>               IP Address to bind SMTP service to
      --outgoing-host <host>          SMTP host for outgoing emails
      --outgoing-port <port>          SMTP port for outgoing emails
      --outgoing-user <user>          SMTP user for outgoing emails
      --outgoing-pass <password>      SMTP password for outgoing emails
      --outgoing-secure               Use SMTP SSL for outgoing emails
      --auto-relay [email]            Use auto-relay mode. Optional relay email address
      --auto-relay-rules <file>       Filter rules for auto relay mode
      --incoming-user <user>          SMTP user for incoming emails
      --incoming-pass <pass>          SMTP password for incoming emails
      --web-ip <ip address>           IP Address to bind HTTP service to, defaults to --ip
      --web-user <user>               HTTP user for GUI
      --web-pass <password>           HTTP password for GUI
      --base-pathname <path>          base path for URLs
      --disable-web                   Disable the use of the web interface. Useful for unit testing
      --hide-extensions <extensions>  Comma separated list of SMTP extensions to NOT advertise
                                      (STARTTLS, SMTPUTF8, PIPELINING, 8BITMIME)
      -o, --open                      Open the Web GUI after startup
      -v, --verbose
      --silent

## API

MailDev can be used in your Node.js application. For more info view the
[API docs](https://github.com/djfarrelly/MailDev/blob/master/docs/api.md).

```javascript
const MailDev = require('maildev')

const maildev = new MailDev()

maildev.listen()

maildev.on('new', function (email) {
  // We got a new email!
})
```

MailDev also has a **REST API**. For more info
[view the docs](https://github.com/djfarrelly/MailDev/blob/master/docs/rest.md).

## Outgoing email

Maildev optionally supports selectively relaying email to an outgoing SMTP server.  If you configure outgoing
email with the --outgoing-* options you can click "Relay" on an individual email to relay through MailDev out
to a real SMTP service that will *actually* send the email to the recipient.

  Example:

    $ maildev --outgoing-host smtp.gmail.com \
              --outgoing-secure \
              --outgoing-user 'you@gmail.com' \
              --outgoing-pass '<pass>'

## IMAP and POP

To use IMAP and/or POP3, just point your prefered to Mail Client to

- host: `localhost`
- user: `node`
- password: `password`
- port:
  - 110 (POP3)
  - 143 (IMAP)

Make sure you disable any kind of encryption

### Auto relay mode

Enabling the auto relay mode will automatically send each email to it's recipient
without the need to click the "Relay" button mentioned above.
The outgoing email options are required to enable this feature.

Optionally you may pass an single email address which Maildev will forward all
emails to instead of the original recipient. For example, using
`--auto-relay you@example.com` will forward all emails to that address
automatically.

Additionally, you can pass a valid json file with additional configuration for
what email addresses you would like to `allow` or `deny`. The last matching
rule in the array will be the rule MailDev will follow.

  Example:

    $ maildev --outgoing-host smtp.gmail.com \
              --outgoing-secure \
              --outgoing-user 'you@gmail.com' \
              --outgoing-pass '<pass>' \
              --auto-relay \
              --auto-relay-rules file.json

  Rules example file:
```javascript
[
	{ "allow": "*" },
	{ "deny":  "*@test.com" },
	{ "allow": "ok@test.com" },
	{ "deny":  "*@utah.com" },
	{ "allow": "johnny@utah.com" }
]
```
  This would allow `angelo@fbi.gov`, `ok@test.com`, `johnny@utah.com`, but deny
  `bodhi@test.com`.

## Configure your project

Configure your application to send emails via port `1025` and open `localhost:1080` in your browser.

**Nodemailer (v1.0+)**

```javascript
const transport = nodemailer.createTransport({
  port: 1025,
  ignoreTLS: true,
  // other settings...
})
```

**Nodemailer (v0.7)**

```javascript
const transport = nodemailer.createTransport('SMTP', {
  port: 1025,
  // other settings...
})
```

**Django** -- Add `EMAIL_PORT = 1025` in your settings file [[source]](https://docs.djangoproject.com/en/dev/ref/settings/#std:setting-EMAIL_PORT)

**Rails** -- config settings:

```ruby
config.action_mailer.delivery_method = :smtp
    config.action_mailer.smtp_settings = {
        :address => "localhost",
        :port => 1025
    }
```

**Drupal** -- Install and configure [SMTP](https://www.drupal.org/project/smtp) module or use a library like [SwiftMailer](http://swiftmailer.org/).

## Features

* Toggle between HTML, plain text views as well as view email headers
* Test Responsive Emails w/ resizeable preview pane available for 320/480/600px screen sizes
* Ability to receive and view email attachments
* Websockets keep the interface in sync once emails are received
* Command line interface for configuring SMTP and Web interface ports
* Ability to relay email to an upstream SMTP server

## Ideas

If you're using MailDev and you have a great idea, I'd love to hear it. If you're not using MailDev because it lacks a feature, I'd love to hear that too. Add an issue to the repo [here](https://github.com/djfarrelly/MailDev/issues/new) or contact me on [twitter](http://www.twitter.com/djfarrelly).

## Contributing

Any help on MailDev would be awesome. There is plenty of room for improvement. Feel free to [create a Pull Request](https://github.com/djfarrelly/MailDev/issues/new) from small to big changes.

To run **MailDev** during development:

    npm install
    npm run dev

The "dev" task will run MailDev using nodemon and restart automatically when
changes are detected. On `*.scss` file save, the css will also be recompiled.
Using `test/send.js`, a few test emails will be sent every time the application
restarts.

The project uses the [JavaScript Standard coding style](https://standardjs.com).
To lint your code before submitting your PR, run `npm run lint`.

To run the test suite:

    $ npm test

## [Changelog](https://github.com/djfarrelly/MailDev/releases)

## Thanks

**MailDev** is built on using great open source projects including
[Express](http://expressjs.com),
[AngularJS](http://angularjs.org/),
[Font Awesome](http://fontawesome.io/) and two great projects from
[Andris Reinman](https://github.com/andris9):
[smtp-server](https://github.com/nodemailer/smtp-server)
and [mailparser](https://github.com/nodemailer/mailparser).
Many thanks to Andris as his projects are the backbone of this app and to
[MailCatcher](http://mailcatcher.me/) for the inspiration.
[dovecot](https://www.dovecot.org/) for the [POP3](https://en.wikipedia.org/wiki/POP3) and [IMAP](https://en.wikipedia.org/wiki/IMAP) support

Additionally, thanks to all the awesome [contributors](https://github.com/djfarrelly/MailDev/graphs/contributors)
to the project.

## License

MIT
