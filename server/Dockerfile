FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install -g typescript ts-node
COPY . .
CMD ["ts-node", "src/server.ts"]