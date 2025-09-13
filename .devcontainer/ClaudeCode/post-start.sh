#!/bin/bash

# Configure Docker socket permissions
sudo chgrp docker /var/run/docker.sock
sudo chmod g+rw /var/run/docker.sock

# Add PeerTube host entry if not already present
if ! grep -q 'peertube.localhost' /etc/hosts; then
    # Find PeerTube container IP dynamically
    PEERTUBE_CONTAINER=$(docker ps -q --filter "name=peertube" 2>/dev/null)
    
    if [ -n "$PEERTUBE_CONTAINER" ]; then
        PEERTUBE_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$PEERTUBE_CONTAINER" 2>/dev/null | head -n1)
        if [ -n "$PEERTUBE_IP" ]; then
            echo "$PEERTUBE_IP peertube.localhost" | sudo tee -a /etc/hosts
            echo "Added PeerTube container IP $PEERTUBE_IP to /etc/hosts"
        else
            echo "Error: Could not get IP address from PeerTube container"
            exit 1
        fi
    else
        echo "Error: PeerTube container not found. Make sure PeerTube is running."
        exit 1
    fi
fi

# Add PeerTube CLI authentication
if [ -f ".devcontainer/ClaudeCode/.env" ]; then
    source .devcontainer/ClaudeCode/.env
    peertube-cli auth add -u "http://peertube.localhost:9000" -U "root" --password "$PEERTUBE_PASSWORD" 2>/dev/null || true
fi