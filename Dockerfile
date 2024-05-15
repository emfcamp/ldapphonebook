FROM node:22-alpine

WORKDIR /app

ADD package.json /app/package.json

RUN npm install --production -y

ADD . .

CMD []
