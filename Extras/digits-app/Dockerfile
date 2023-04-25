FROM node:alpine3.17

ARG API_URL=replaceurl
ARG API_HOST=replacehost

ENV API_URL=$API_URL
ENV API_HOST=$API_HOST

WORKDIR /app
COPY ./source/package*.json ./
RUN npm install

COPY ./source .

EXPOSE 3000

CMD ["npm", "start"]