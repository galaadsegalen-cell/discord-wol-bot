FROM node:18-slim

RUN apt-get update && apt-get install -y tailscale net-tools

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

CMD tailscaled & sleep 5 && tailscale up --authkey=$TAILSCALE_AUTHKEY && npm start
