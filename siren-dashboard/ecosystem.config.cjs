module.exports = {
  apps: [
    {
      name: "siren-dashboard",
      script: "src/server.js",
      // 👇 Force-load .env at startup
      node_args: "-r dotenv/config",
      env: {
        NODE_ENV: "production",
        DOTENV_CONFIG_PATH: "/opt/botproject-withdashboard/siren-dashboard/.env",
        MONGO_URI: process.env.MONGO_URI,
        BOT_TOKEN: process.env.BOT_TOKEN,
        SESSION_SECRET: process.env.SESSION_SECRET,
        OWNER_IDS: process.env.OWNER_IDS,
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
        DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
        CALLBACK_URL: process.env.CALLBACK_URL,
        PORT: process.env.PORT,
        BOT_AVATAR_URL: process.env.BOT_AVATAR_URL,
        BASE_URL: process.env.BASE_URL
      }
    }
  ]
};