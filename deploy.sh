#!/bin/bash

# Pull the latest changes from the repository
git pull

# Build and start the Docker containers
docker-compose down
docker-compose build
docker-compose up -d

# Show the running containers
docker ps

echo "Deployment completed successfully!"