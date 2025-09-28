import admin from "../firebase/firebaseAdmin.js";
import client from "../config/database.js";

const userCollection = client.db("shajidint").collection("Users");

// Create new user
export const createUser = async (req, res) => {
    const { name, email, phone, role, designation, password } = req.body;
    try {
        await admin.auth().createUser({ email, password, displayName: name });
        await userCollection.insertOne({ name, email, phone, role, designation });
        res.status(200).send({ success: true });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).send({ success: false, message: "Failed to create user" });
    }
};

// Get single user
export const getUser = async (req, res) => {
    const email = req.params.email;
    const user = await userCollection.findOne({ email });
    res.send(user);
};

// Get all users
export const getAllUsers = async (req, res) => {
    const users = await userCollection.find().toArray();
    res.send(users);
};

// Update user
export const updateUser = async (req, res) => {
    const email = req.params.email;
    const updatedData = req.body;
    try {
        const result = await userCollection.updateOne({ email }, { $set: updatedData });
        if (result.modifiedCount > 0) {
            res.status(200).send({ success: true, message: "User updated" });
        } else {
            res.status(404).send({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).send({ success: false, message: "Internal server error" });
    }
};

// Upload profile image (req.file আসবে multer থেকে)
export const uploadUserImage = async (req, res) => {
    const email = req.params.email;
    const imageBuffer = req.file?.buffer;

    try {
        const existingUser = await userCollection.findOne({ email });
        if (!existingUser) {
            return res.status(404).send({ success: false, message: "User not found" });
        }

        // পুরনো image delete
        if (existingUser.deleteUrl) {
            try {
                const delRes = await fetch(existingUser.deleteUrl);
                if (!delRes.ok) throw new Error("Delete failed");
            } catch (err) {
                console.warn("Failed to delete old image:", err.message);
            }
        }

        let imageUrl = "";
        let deleteUrl = "";

        if (imageBuffer) {
            const base64Image = imageBuffer.toString("base64");
            const formData = new URLSearchParams();
            formData.append("image", base64Image);

            const imgbbRes = await fetch(
                `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
                { method: "POST", body: formData }
            );

            const imgbbData = await imgbbRes.json();
            if (!imgbbData?.success) {
                return res.status(500).send({ success: false, message: "ImgBB upload failed" });
            }

            imageUrl = imgbbData.data.url;
            deleteUrl = imgbbData.data.delete_url;
        }

        await userCollection.updateOne(
            { email },
            { $set: { profilePic: imageUrl, deleteUrl, updatedAt: new Date() } }
        );

        res.status(200).send({ success: true, profilePic: imageUrl });
    } catch (error) {
        console.error("Profile update failed:", error);
        res.status(500).send({ success: false, error: error.message });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    const email = req.params.email;
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().deleteUser(userRecord.uid);

        const result = await userCollection.deleteOne({ email });
        if (result.deletedCount > 0) {
            res.send({ success: true, message: "User deleted successfully" });
        } else {
            res.send({ success: false, message: "User not found in MongoDB" });
        }
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).send({ success: false, message: "Failed to delete user" });
    }
};