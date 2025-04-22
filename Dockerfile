FROM --platform=${BUILDPLATFORM} node:18-alpine AS node_amd64
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "node","src/index.js" ]
