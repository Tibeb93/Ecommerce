import express from "express";
import Category from "../models/Category.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const categories = await Category.find().sort({ name: 1 }).select("_id name").lean();
  res.json(categories.map((c) => ({ id: c._id, name: c.name })));
});

export default router;
