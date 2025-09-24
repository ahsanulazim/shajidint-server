import express from "express";
import cors from "cors";
import multer from "multer";
import admin from "./firebaseAdmin.js";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// use middleware

const allowedOrigins = [
  "http://localhost:3000",
  "https://shajidint.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //My Code Starts

    //MongoDB Collection
    const userCollection = client.db("shajidint").collection("Users");
    const msgCollection = client.db("shajidint").collection("Msgs");

    // add new user to mongo and firebase

    app.post("/users", async (req, res) => {
      const { name, email, phone, role, designation, password } = req.body;

      try {
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        });

        // Save metadata in MongoDB
        const user = {
          name,
          email,
          phone,
          role,
          designation,
        };

        const result = await userCollection.insertOne(user);

        res.status(200).send({
          success: true,
        });
      } catch (error) {
        res.status(500).send({ success: false });
      }
    });

    //find a user
    app.get("/loginuser/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      res.send(user);
    });

    // get all users information
    app.get("/users", async (req, res) => {
      const user = await userCollection.find().toArray();
      res.send(user);
    });

    // Update user data by email
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const updatedData = req.body;

      try {
        const result = await userCollection.updateOne(
          { email: email },
          { $set: updatedData }
        );

        if (result.modifiedCount > 0) {
          res
            .status(200)
            .send({ success: true, message: "User updated successfully" });
        } else {
          res.status(404).send({
            success: false,
            message: "User not found or no changes made",
          });
        }
      } catch (error) {
        console.error("Update error:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });

    //Upload user image by email
    const storage = multer.memoryStorage();
    const upload = multer({ storage });

    app.put(
      "/users/:email/image",
      upload.single("profilePic"),
      async (req, res) => {
        const email = req.params.email;
        const imageBuffer = req.file?.buffer;

        try {
          const existingUser = await userCollection.findOne({ email });
          if (!existingUser) {
            return res
              .status(404)
              .send({ success: false, message: "User not found" });
          }

          // delete old image if exists
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

            // IMPORTANT: use URLSearchParams body, not JSON
            const formData = new URLSearchParams();
            formData.append("image", base64Image);

            const imgbbRes = await fetch(
              `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
              { method: "POST", body: formData }
            );

            const imgbbData = await imgbbRes.json();
            if (!imgbbData?.success) {
              return res
                .status(500)
                .send({ success: false, message: "ImgBB upload failed" });
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
      }
    );

    //delete an user

    app.delete("/users/:email", async (req, res) => {
      const email = req.params.email;

      try {
        // 1. Delete from Firebase Auth
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().deleteUser(userRecord.uid);

        // 2. Delete from MongoDB
        const result = await userCollection.deleteOne({ email });

        if (result.deletedCount > 0) {
          res.send({ success: true, message: "User deleted successfully" });
        } else {
          res.send({ success: false, message: "User not found in MongoDB" });
        }
      } catch (error) {
        console.error("Delete error:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to delete user" });
      }
    });

    //Post a massage

    app.post("/msg", async (req, res) => {
      const { name, email, phone, company, query } = req.body;
      try {
        const inquiry = {
          name,
          email,
          phone,
          company,
          query,
          sendDate: new Date().toLocaleString("en-BD", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        };

        const result = await msgCollection.insertOne(inquiry);

        res.status(200).send({
          success: true,
        });
      } catch (error) {
        res.status(500).send({ success: false });
      }
    });

    // get all Massages

    app.get("/msgs", async (req, res) => {
      const msgs = await msgCollection.find().toArray();
      res.send(msgs);
    });

    //Delete a massage

    app.delete("/msgs/:_id", async (req, res) => {
      const _id = req.params._id;

      try {
        // Delete from MongoDB
        const result = await msgCollection.deleteOne({
          _id: new ObjectId(_id),
        });

        if (result.deletedCount > 0) {
          res.send({ success: true, message: "Massage deleted successfully" });
        } else {
          res.send({ success: false, message: "Massage not found in MongoDB" });
        }
      } catch (error) {
        console.error("Delete error:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to delete Massage" });
      }
    });

    //My Code Ends
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    app.get("/", (req, res) => {
      res.send("Hello World!");
    });

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
