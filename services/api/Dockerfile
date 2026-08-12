FROM node:20-alpine AS builder

WORKDIR /app

COPY services/api/package*.json ./
COPY services/api/prisma ./prisma/

RUN npm install

COPY services/api ./
RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
