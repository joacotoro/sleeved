FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install --prefix server && npm install --prefix client
RUN npm run build --prefix client
RUN npm run build --prefix server

EXPOSE 3000

CMD ["node", "server/dist/src/index.js"]
