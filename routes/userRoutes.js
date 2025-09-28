import express from "express";
import multer from "multer";
import {
    createUser,
    getUser,
    getAllUsers,
    updateUser,
    uploadUserImage,
    deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

// routes
router.post("/", createUser);
router.get("/:email", getUser);
router.get("/", getAllUsers);
router.put("/:email", updateUser);

// multer
router.put("/:email/image", upload.single("profilePic"), uploadUserImage);

router.delete("/:email", deleteUser);

export default router;