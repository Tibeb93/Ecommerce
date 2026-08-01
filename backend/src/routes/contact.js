import express from "express";
import { isNonEmptyString, isValidEmail, toSafeTrimmed } from "../utils/validators.js";
import { sendContactForm } from "../utils/email.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;
  const cleanName = toSafeTrimmed(name);
  const cleanEmail = toSafeTrimmed(email);
  const cleanSubject = toSafeTrimmed(subject) || "Contact Form";
  const cleanMessage = toSafeTrimmed(message);

  if (!isNonEmptyString(cleanName, 2, 100)) return res.status(400).json({ message: "Name must be 2-100 characters" });
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ message: "Invalid email" });
  if (!isNonEmptyString(cleanMessage, 10, 2000)) return res.status(400).json({ message: "Message must be 10-2000 characters" });

  try {
    await sendContactForm(cleanName, cleanEmail, cleanSubject, cleanMessage);
    res.json({ message: "Message sent successfully!" });
  } catch {
    res.status(500).json({ message: "Failed to send message" });
  }
});

export default router;
