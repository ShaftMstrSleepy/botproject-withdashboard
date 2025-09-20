module.exports = {
  apps: [{
    name: 'siren-bot',
    script: 'siren-main/index.js',
    env: {
      NODE_ENV: 'production'
    }
  }]
};