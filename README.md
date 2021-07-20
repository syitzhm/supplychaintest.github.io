# Network Insight Service
# Pre-requisites
- NodeJS 8.X
  - curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh
  - nano nodesource_setup.sh
  - sudo bash nodesource_setup.sh
  - sudo apt-get install -y nodejs
- sudo apt-get install -y node-gyp
# To start app:
1. clone this repo from github
2. cd to sc-insight.deevo.io
3. run: npm install
4. run: utils/get-remote-config.sh with appropriate parameters
6. run: npm start

  If it shows up: [API Server is running at http://localhost:3000/] means that api server is started up successfuly.
