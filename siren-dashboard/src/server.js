// src/server.js
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import expressLayouts from "express-ejs-layouts";

// Routes
import authRoutes from "./routes/auth.js";
import guildRoutes from "./routes/guilds.js";
import appealRoutes from "./routes/appeals.js";

// Mongo connection
import { connectDB } from "./config/db.js";

dotenv.config();
await connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ----- View engine & layouts -----
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout"); // default layout views/layout.ejs

// ----- Static assets (css, images, js) -----
app.use(express.static(path.join(__dirname, "../public")));

// ----- Session -----
app.use(
  session({
    name: "siren.sid",
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ✅ Make `user` (with animated avatar) & bot avatar available to ALL templates
app.use((req, res, next) => {
  // Logged-in user (from Discord OAuth)
  const u = req.session?.user;
  if (u) {
    // ensure we correctly build animated or static avatar URL
    const isAnimated = u.avatar && String(u.avatar).startsWith("a_");
    const ext = isAnimated ? "gif" : "png";
    const avatarURL = u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${ext}?size=128`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    res.locals.user = {
      id: u.id,
      username: u.username,
      global_name: u.global_name || u.username,
      avatarURL,
    };
  } else {
    res.locals.user = null;
  }

  // Bot avatar for the landing/login page
  res.locals.botAvatarURL =
    process.env.BOT_AVATAR_URL || "https://cdn.discordapp.com/embed/avatars/1.png";

  next();
});

// ----- Security & parsing -----
app.use(
  helmet({
    contentSecurityPolicy: false, // keep simple; allow external Discord images
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----- Rate limiting -----
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(limiter);

// ----- Routes -----
// If logged in, immediately send to /guilds.
// If not logged in, render home with minimal layout (no top bar/sidebar).
app.get("/", (req, res) => {
  if (req.session?.user) {
    return res.redirect("/guilds");
  }
  res.render("home", { layout: "layout_minimal" });
});

app.use("/auth", authRoutes);
app.use("/guilds", guildRoutes);
app.use("/appeals", appealRoutes);

// ----- Error handler -----
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).render("error", { message: "Something went wrong." });
});

// ----- Start server -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🌐 Dashboard running on http://localhost:${PORT}`)
);
