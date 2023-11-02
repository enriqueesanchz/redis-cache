#!/bin/bash

docker compose down
docker compose rm
docker rmi redis-cache-nodejs
