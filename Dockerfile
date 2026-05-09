FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "server/src/index.js"]
