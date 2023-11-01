# Caching Timescaledb with Redis

## Beggining

- Create the containers

``` bash
docker compose up -d
```

- Create table products

``` bash
docker exec timescaledb psql -c 'create table solar_plants (timestamp timestamp with time zone default now(), id smallint, kw real, temp real);'
```

- Populate table products

``` bash
docker exec nodejs node populate
```

- Curl localhost:3333

```bash
curl localhost:3333
```

### Api docs

Api docs are generated using Swagger in /api-docs

## Benchmark

``` bash
apt install nodejs
apt install npm
npm i autocannon -g
```

### Without Redis as cache

``` bash
autocannon localhost:3333/no-redis
autocannon localhost:3333/no-redis/filter
```

### With Redis as cache

``` bash
autocannon localhost:3333
autocannon localhost:3333/filter
```

Aprox. there will be x10 requests

## Remove experiment

``` bash
docker compose down
docker compose rm
docker rmi redis-cache-nodejs
```
