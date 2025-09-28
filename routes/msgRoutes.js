import express from "express";
import { createMsg, getMsgs, getMsgById, getMsgStats, getMsgStatsSummary, deleteMsg } from "../controllers/msgController.js";

const router = express.Router();

router.post("/", createMsg);
router.get("/", getMsgs);
router.get("/:id", getMsgById);
router.get("/stats/all", getMsgStats);
router.get("/stats/summary", getMsgStatsSummary);
router.delete("/:id", deleteMsg);

export default router;