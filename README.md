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

## Benchmark

TODO: no-redis

``` bash
apt install nodejs
apt install npm
npm i autocannon -g
```

### Without Redis as cache

TODO: no-redis

``` bash
autocannon localhost:3333/no-redis
```

### With Redis as cache

``` bash
autocannon localhost:3333
```

## Remove experiment

``` bash
docker compose down
docker compose rm
docker rmi redis-cache-nodejs
```
