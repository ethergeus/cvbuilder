FROM node

RUN apt update && apt install -y ca-certificates openssl gnutls-bin msmtp mailutils texlive texlive-xetex texlive-fonts-extra

WORKDIR /home/node/app

COPY app .

RUN npm install

RUN chown -R node:node public/download
RUN mkdir -p resources/tex && chown -R node:node resources/tex

EXPOSE 3000

USER node
