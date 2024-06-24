#!/bin/bash

docker build -t ibmicpcoc/qod-api:1.1.0 .
docker tag ibmicpcoc/qod-api:1.1.0 ibmicpcoc/qod-api:latest
docker push ibmicpcoc/qod-api:1.1.0
docker push ibmicpcoc/qod-api:latest
