FROM node:24.2.0-bookworm

# Install basic development tools
RUN apt update && apt install -y less man-db sudo

# Install Docker CLI
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
RUN echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
RUN apt-get update && apt-get install -y docker-ce-cli

# Install the Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Create docker group with GID 999 (this should match the host's docker GID)
RUN groupadd -g 999 docker

# Add node user to docker group
RUN usermod -aG docker node

# Ensure default `node` user has access to `sudo`
ARG USERNAME=node
RUN echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Set `DEVCONTAINER` environment variable to help with orientation
ENV DEVCONTAINER=true

# Install PeerTube CLI
RUN npm install -g @peertube/peertube-cli

# Add peertube.localhost to hosts file
# RUN 

