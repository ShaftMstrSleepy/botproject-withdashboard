module.exports = {
  apps: [
    {
      name: "siren-bot",
      script: "./siren-main/index.js",
      env: {
        NODE_ENV: "production",
        BOT_TOKEN: process.env.BOT_TOKEN,
        MONGO_URI: process.env.MONGO_URI,
        SESSION_SECRET: process.env.SESSION_SECRET,
        OWNER_IDS: process.env.OWNER_IDS
      }
    },
    {
      name: "siren-dashboard",
      script: "./siren-dashboard/src/server.js",
      env: {
        NODE_ENV: 'production',
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
        DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
        CALLBACK_URL: process.env.CALLBACK_URL,
        PORT: process.env.PORT,
        MONGO_URI: process.env.MONGO_URI,
        SESSION_SECRET: process.env.SESSION_SECRET,
        BOT_AVATAR_URL: process.env.BOT_AVATAR_URL,
        BOT_TOKEN: process.env.BOT_TOKEN,
        BASE_URL: process.env.BASE_URL,
        OWNER_IDS: process.env.OWNER_IDS
      }
    }
  ]
};