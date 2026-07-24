FROM nginx:1.25-alpine

RUN apk --no-cache add openssl

RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/self-signed.key \
      -out /etc/nginx/ssl/self-signed.crt \
      -subj "/C=US/ST=State/L=City/O=ParentalControl/CN=localhost"

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
