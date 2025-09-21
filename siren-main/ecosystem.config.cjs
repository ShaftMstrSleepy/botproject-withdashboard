module.exports = {
  apps: [{
    name: 'siren-bot',
    script: 'siren-main/index.js',
    env: {
      NODE_ENV: 'production',
      BOT_TOKEN: process.env.BOT_TOKEN,
      SECRET_SESSION: process.env.SECRET_SESSION,
      MONGO_URI: process.env.MONGO_URI,
      OWNER_IDS: process.env.OWNER_IDS
    }
  }]
};