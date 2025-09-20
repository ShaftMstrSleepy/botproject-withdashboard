module.exports = {
  apps: [
    {
      name: "siren-dashboard",
      script: "src/server.js",
      // 👇 Force-load .env at startup
      node_args: "-r dotenv/config",
      env: {
        DOTENV_CONFIG_PATH: "/opt/botproject-withdashboard/siren-dashboard/.env",
        MONGO_URI: process.env.MONGO_URI,
        BOT_TOKEN: process.env.BOT_TOKEN,
        SESSION_SECRET: process.env.SESSION_SECRET,
        OWNER_IDS: process.env.OWNER_IDS,
        NODE_ENV: "production"
      }
    }
  ]
};