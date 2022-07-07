# CV Builder
Tool for creating a professional-looking resume using a LaTeX backend.
For a live version visit [gratiscv.com](https://gratiscv.com).

![Screenshot of website](https://github.com/ethergeus/cvbuilder/blob/main/assets/screenshot.png?raw=true)

## Features
The tool allows you to fill in typical information that belongs on a resume including basic personal details, education history, job experience and internships and compiles it into a professional-looking PDF using a LaTeX backend.

![Screenshot of website](https://github.com/ethergeus/cvbuilder/blob/main/assets/ui.png?raw=true)

For information persistence one can log in using their Google account, the information filled in will then be saved to a database.

## Installation
The container can either be built, or pulled from a repository:
```bash
# Build the image yourself:
git clone https://github.com/ethergeus/cvbuilder.git
cd cvbuilder
docker build .

# Pull from Docker Hub:
docker pull ethergeus/cvbuilder

# Pull from GitHub container registry:
docker pull ghcr.io/ethergeus/cvbuilder
```

## Configuration
There is a template for the `.env` file and `.msmtprc` file, for environment variables and mail credentials called `.env-template` and `.msmtprc-template` respectively. The container uses `msmtp` to send emails via `php`. For full documentation on `msmtp` visit the [Debian Wiki](https://wiki.debian.org/msmtp).

Modify the `docker-compose.yml` configuration file to suit your needs, the provided `docker-compose.yml` assumes there's an `nginx` docker container and frontend network that handles the incoming requests on port 80 and 443.
