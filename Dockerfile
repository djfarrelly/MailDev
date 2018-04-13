FROM node:6-alpine
MAINTAINER "Marcos Diez <marcos@unitron.com.br>"

ENV NODE_ENV production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD js/package.json /usr/src/app/

RUN apk update

RUN npm install && \
    npm prune && \
    npm cache clean \
    rm -rf /tmp/*

RUN apk add dovecot

ADD js /usr/src/app/

ADD dovecot /etc/dovecot

RUN mkdir /home/node/Maildir && \
    chown node /home/node/Maildir && \
    ln -s /tmp/maildev /home/node/Maildir/cur


COPY dumb-init /dumb-init
COPY run.sh /run.sh

EXPOSE 25 80 110 143

ENTRYPOINT ["/dumb-init", "--"]

CMD ["/bin/sh", "/run.sh"]
