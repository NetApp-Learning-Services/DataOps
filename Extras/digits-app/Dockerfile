FROM nginx:1.24.0-alpine

ARG API_URL = http://localhost:8080/v1/models/digits-recognizer:predict
ARG API_HOST = digits-recognizer.kubeflow-user-example-com.example.com

ENV API_URL = $API_URL
ENV API_HOST = $API_HOST

COPY ./source /usr/share/nginx/html