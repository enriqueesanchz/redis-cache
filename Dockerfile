FROM node
WORKDIR /redis-cache
RUN npm init -y
RUN npm install redis knex express pg swagger-ui-express swagger-jsdoc
COPY index.js populate.js swagger.js ./

ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_PORT
ARG POSTGRES_IP
ARG REDIS_IP
ARG REDIS_PORT
ENV POSTGRES_USER=${POSTGRES_USER}
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ENV POSTGRES_IP=${POSTGRES_IP}
ENV POSTGRES_PORT=${POSTGRES_PORT}
ENV REDIS_IP=${REDIS_IP}
ENV REDIS_PORT=${REDIS_PORT}

CMD ["node", "index"]