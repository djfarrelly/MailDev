module.exports.options = [
  // flag, environment variable, description, default value, function
  ['-s, --smtp <port>', 'MAILDEV_SMTP_PORT', 'SMTP port to catch emails', '1025'],
  ['-w, --web <port>', 'MAILDEV_WEB_PORT', 'Port to run the Web GUI', '1080'],
  ['--mail-directory <path>', 'MAILDEV_MAIL_DIRECTORY', 'Directory for persisting mails'],
  ['--https', 'MAILDEV_HTTPS', 'Switch from http to https protocol', false],
  ['--https-key <file>', 'MAILDEV_HTTPS_KEY', 'The file path to the ssl private key'],
  ['--https-cert <file>', 'MAILDEV_HTTPS_CERT', 'The file path to the ssl cert file'],
  ['--ip <ip address>', 'MAILDEV_IP', 'IP Address to bind SMTP service to', '0.0.0.0'],
  ['--outgoing-host <host>', 'MAILDEV_OUTGOING_HOST', 'SMTP host for outgoing emails'],
  ['--outgoing-port <port>', 'MAILDEV_OUTGOING_PORT', 'SMTP port for outgoing emails'],
  ['--outgoing-user <user>', 'MAILDEV_OUTGOING_USER', 'SMTP user for outgoing emails'],
  ['--outgoing-pass <password>', 'MAILDEV_OUTGOING_PASS', 'SMTP password for outgoing emails'],
  ['--outgoing-secure', 'MAILDEV_OUTGOING_SECURE', 'Use SMTP SSL for outgoing emails', false],
  ['--auto-relay [email]', 'MAILDEV_AUTO_RELAY', 'Use auto-relay mode. Optional relay email address'],
  ['--auto-relay-rules <file>', 'MAILDEV_AUTO_RELAY_RULES', 'Filter rules for auto relay mode'],
  ['--incoming-user <user>', 'MAILDEV_INCOMING_USER', 'SMTP user for incoming emails'],
  ['--incoming-pass <pass>', 'MAILDEV_INCOMING_PASS', 'SMTP password for incoming emails'],
  ['--web-ip <ip address>', 'MAILDEV_WEB_IP', 'IP Address to bind HTTP service to, defaults to --ip'],
  ['--web-user <user>', 'MAILDEV_WEB_USER', 'HTTP user for GUI'],
  ['--web-pass <password>', 'MAILDEV_WEB_PASS', 'HTTP password for GUI'],
  ['--base-pathname <path>', 'MAILDEV_BASE_PATHNAME', 'Base path for URLs'],
  ['--disable-web', 'MAILDEV_DISABLE_WEB', 'Disable the use of the web interface. Useful for unit testing', false],
  ['--hide-extensions <extensions>',
    'MAILDEV_HIDE_EXTENSIONS',
    'Comma separated list of SMTP extensions to NOT advertise (SMTPUTF8, PIPELINING, 8BITMIME)',
    [],
    function (val) {
      return val.split(',')
    }
  ],
  ['-o, --open', null, 'Open the Web GUI after startup'],
  ['-v, --verbose'],
  ['--silent'],
  ['--log-mail-contents', 'Log a JSON representation of each incoming email']
]

module.exports.appendOptions = function (program, options) {
  return options.reduce(function (chain, option) {
    const flag = option[0]
    const envVariable = option[1]
    const description = option[2]
    const defaultValue = process.env[envVariable] || option[3]
    const fn = option[4]
    if (fn) {
      return chain.option(flag, description, fn, defaultValue)
    }
    return chain.option(flag, description, defaultValue)
  }, program)
}
