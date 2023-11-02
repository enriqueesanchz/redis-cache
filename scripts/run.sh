#!/bin/bash

docker compose up -d
sleep 7
docker exec timescaledb psql -c 'create table solar_plants (timestamp timestamp with time zone default now(), id smallint, kw real, temp real);'
docker exec timescaledb psql -c "SELECT create_hypertable('solar_plants', 'timestamp');"
docker exec nodejs node populate
