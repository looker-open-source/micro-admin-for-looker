FROM node:14

#Create directory
WORKDIR /usr/src/app

#Install dependencies
COPY package*.json ./
RUN npm install

#Copy app source
COPY . .

#Run
EXPOSE 8080
WORKDIR ./server
CMD ["node", "index.js"]
