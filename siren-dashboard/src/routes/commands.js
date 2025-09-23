// src/routes/commands.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  res.render("commands", {
    user: req.session.user || null
  });
});

export default router;