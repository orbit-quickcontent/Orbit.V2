FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy codebase and generate Prisma Client
COPY . .
RUN npx prisma generate

EXPOSE 5000
EXPOSE 3003

CMD ["npm", "run", "start"]
