import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (_, res) => {
  const categories = db.prepare("SELECT id, name FROM categories ORDER BY name").all();
  res.json(categories);
});

export default router;
