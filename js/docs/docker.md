# Docker

MailDev works quite conveniently with [Docker](https://www.docker.com/) for
your development setup. You can use the
[`djfarrelly/maildev`](https://registry.hub.docker.com/u/djfarrelly/maildev/)
image on Docker Hub or pull this repo down and build an image yourself using
the included Dockerfile. Here is a short guide on how to use MailDev with Docker.

## Simple usage

To get MailDev up and running quickly, run a new container using the image.
If you don't have the image on your machine, Docker will pull it. Let's name
it "maildev" and publish the interface on port `1080`:

```
$ docker run -p 1080:80 --name maildev djfarrelly/maildev
```

Now the MailDev UI will be running at port `1080` on your virtual machine
(or machine if you're running Linux). For example if your Docker host VM is
running at `192.168.99.100`, you can head over to `http://192.168.99.100:1080`
to visit the interface.

Let's say you're using [nodemailer](https://github.com/nodemailer/nodemailer)
in your Node.js app running in another container. Let's link your app's
container with MailDev:

```
$ docker run -p 8080:80 --link maildev yourimage
```

From within your app's container, Docker will expose some helpful environment
variables. `MAILDEV_PORT_25_TCP_ADDR` and `MAILDEV_PORT_25_TCP_PORT` can be
used to send your emails. Sending them here will result in them being captured
by MailDev. Here's an example of using these with Nodemailer:

```js
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  // In Node, environment variables are available on process.env
  host: process.env.MAILDEV_PORT_25_TCP_ADDR, // ex. 172.17.0.10
  port: process.env.MAILDEV_PORT_25_TCP_PORT, // ex. 25
  // We add this setting to tell nodemailer the host isn't secure during dev:
  ignoreTLS: true
})

// Now when your send an email, it will show up in the MailDev interface
transporter.sendMail({ /* from, to, etc... */ }, function (error, info) { // ...
```

The above example could apply for any app in any language using the available
environment variables to configure how to send email.

## Advanced usage

*Needs documentation for how to use cli arguments*

## Docker Compose

*Needs documentation for simple usage with Docker Compose*
