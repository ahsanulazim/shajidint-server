import express from "express";
import { getNotification } from "../controllers/notificationController.js";

const router = express.Router();
router.get("/", getNotification);

export default router;
