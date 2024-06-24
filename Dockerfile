FROM registry.access.redhat.com/ubi8/nodejs-16:1-139
WORKDIR $HOME
COPY package*.json ./
COPY . .
RUN npm install
EXPOSE 3000
EXPOSE 3001

CMD ["node", "app.js"]
