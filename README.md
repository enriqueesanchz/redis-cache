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

- Create hypertable

```bash
docker exec timescaledb psql -c "SELECT create_hypertable('solar_plants', 'timestamp');"
```

- Populate table products

``` bash
docker exec nodejs node populate
```

- Create materialized views

``` bash
./scripts/hypertables.sh
```

- Curl localhost:3333

```bash
curl localhost:3333
```

### Api docs

Api docs are generated using Swagger in /api-docs
![REST API methods](https://raw.githubusercontent.com/enriqueesanchz/redis-cache/main/swagger.png)

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
