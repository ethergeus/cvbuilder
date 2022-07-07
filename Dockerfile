FROM node

RUN apt update && apt install -y ca-certificates msmtp mailutils texlive-full texlive-xetex

WORKDIR /home/node/app

COPY app .

RUN npm install

RUN chown -R node:node public/download
RUN mkdir -p resources/tex && chown -R node:node resources/tex

EXPOSE 3000

USER node
