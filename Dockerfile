FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node backend/src ./src

ENV NODE_ENV=production
ENV PORT=5000

USER node

EXPOSE 5000

CMD ["npm", "start"]
