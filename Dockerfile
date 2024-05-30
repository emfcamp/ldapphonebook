FROM node:22-alpine

WORKDIR /app

ADD package.json package-lock.json /app/
ADD patches/ /app/patches/

RUN npm install --production -y

ADD . .

CMD []
