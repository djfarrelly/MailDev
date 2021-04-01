# REST API

MailDev provides an easily consumable REST API accessible at `localhost:1080`
unless configured otherwise. All data is returned as JSON unless specified.

## Example email response

Get all emails:

  $ curl 'http://localhost:1080/email'

Returns:

```json
[{
  "id":"XwgKAxto",
  "time":"2014-10-05T19:02:09.156Z",
  "from":[{
    "address":"angelo.pappas@fbi.gov",
    "name":"Angelo Pappas"
  }],
  "to":[{
    "address":"johnny.utah@fbi.gov",
    "name":"Johnny Utah"
  }],
  "subject":"The ex-presidents are surfers",
  "text":"The wax at the bank was surfer wax!!!",
  "html":"<!DOCTYPE html><html><head></head><body><p>The wax at the bank was surfer wax!!!</p></body></html>",
  "headers":{
    "content-type":"multipart/mixed; boundary=\"---sinikael-?=_1-14125357291310.1947895612102002\"",
    "from":"Angelo Pappas <angelo.pappas@fbi.gov>",
    "to":"Johnny Utah <johnny.utah@fbi.gov>",
    "subject":"The ex-presidents are surfers",
    "x-some-header":"1000",
    "x-mailer":"nodemailer (1.3.0; +http://www.nodemailer.com; SMTP/0.1.13[client:1.0.0])",
    "date":"Sun, 05 Oct 2014 19:02:09 +0000",
    "message-id":"<1412535729142-cc4cb0f1-41b96073-6ac4bee1@fbi.gov>",
    "mime-version":"1.0"
  },
  "read":false,
  "messageId":"1412535729142-cc4cb0f1-41b96073-6ac4bee1@fbi.gov",
  "priority":"normal",
  "attachments":[{
    "contentType":"text/plain",
    "contentDisposition":"attachment",
    "fileName":"attachment-1.txt",
    "generatedFileName":"attachment-1.txt",
    "contentId":"0958713110a99ea2afc3b117c9d5feb3@mailparser",
    "stream":{
      "domain":null,
      "_events":{},
      "_maxListeners":10,
      "writable":true,
      "checksum":{"_binding":{}},
      "length":0,
      "charset":"UTF-8",
      "current":""
    },
    "checksum":"d41d8cd98f00b204e9800998ecf8427e"
  }],
  "envelope":{
    "from":"angelo.pappas@fbi.gov",
    "to":["johnny.utah@fbi.gov"],
    "host":"djf-3.local",
    "remoteAddress":"127.0.0.1"
  }
}]
```

## Endpoints

**GET    /email** - Get all emails

**DELETE /email/all** - Delete all emails

**GET    /email/:id** - Get a given email by id

**DELETE /email/:id** - Delete a given email by id

**GET    /email/:id/html** - Get a given emails html body

**GET    /email/:id/attachment/:filename** - Get a given email's file attachment.

**POST   /email/:id/relay** - If configured, relay a given email to it's real
"to" address.

**GET    /config** - Get the application configuration.

**GET    /healthz** - Health check

## Filtering

The **GET    /email** endpoint does allow simple filtering. Every field content of the returned payload can be used to only return desired emails. Nested objects can be defined by using a dot syntax (`headers.to=value`).

For example:

```GET email?subject="Big wave coming" # only emails with the exact subject```

```GET email?headers.some-header="some-value"&subject=test # only emails with the exact subject and header value```
