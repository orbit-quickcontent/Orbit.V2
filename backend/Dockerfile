FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
