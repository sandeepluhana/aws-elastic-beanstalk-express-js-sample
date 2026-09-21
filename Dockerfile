# App image: small Node 16 base, production deps only, non-root runtime
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
ENV NODE_ENV=production PORT=8080
EXPOSE 8080
USER node
CMD ["node", "app.js"]
