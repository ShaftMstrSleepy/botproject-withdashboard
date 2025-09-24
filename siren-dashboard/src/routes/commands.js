// src/routes/commands.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const baseCommands = [
    { name: "Status", toggleable: false },
    { name: "Help", toggleable: false },
    { name: "Plutus Balance", toggleable: false }
  ];

  const staffCommands = [
    "Add Staff", "Ban", "Demote", "Mute", "Promote",
    "Remove Staff", "Set Rank", "Staff Help",
    "Staff Info", "Un-Ban", "Un-Mute", "Warn"
  ].map(name => ({ name, toggleable: true }));

  const customRoleCommands = [
    "Add Custom Role", "Add Co Owner", "Claim Role",
    "Custom Role", "Custom Role Add", "Custom Role Take",
    "List Roles", "Purge Role", "Role",
    "Role Members", "Transfer Role"
  ].map(name => ({
    name,
    toggleable: name === "Add Custom Role" // only this one can have permissions set
  }));

  res.render("commands", {
    baseCommands,
    staffCommands,
    customRoleCommands
  });
});

export default router;