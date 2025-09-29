import { ObjectId } from "mongodb";
import client from "../config/database.js";

const msgCollection = client.db("shajidint").collection("Msgs");

// Create message
export const createMsg = async (req, res) => {
  const { name, email, phone, company, query } = req.body;
  try {
    const inquiry = {
      name,
      email,
      phone,
      company,
      read: false,
      query,
      sendDateFormatted: new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
      ),
      sendDate: new Date().toLocaleString("en-BD", {
        timeZone: "Asia/Dhaka",
        dateStyle: "medium",
        timeStyle: "short",
      }),
    };
    await msgCollection.insertOne(inquiry);
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Create msg error:", error);
    res.status(500).send({ success: false });
  }
};

// Get all messages
export const getMsgs = async (req, res) => {
  const msgs = await msgCollection.find().toArray();
  res.send(msgs);
};

// Get single message
export const getMsgById = async (req, res) => {
  const id = req.params.id;
  const result = await msgCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
};

// Get stats (daily counts)
export const getMsgStats = async (req, res) => {
  try {
    const stats = await msgCollection
      .aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$sendDateFormatted" },
              month: { $month: "$sendDateFormatted" },
              day: { $dayOfMonth: "$sendDateFormatted" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day",
              },
            },
            count: 1,
            _id: 0,
          },
        },
        { $sort: { date: 1 } },
      ])
      .toArray();

    res.send(stats);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).send({ success: false, message: "Failed to fetch stats" });
  }
};

// Get stats summary (last 30 days vs previous 30 days)
export const getMsgStatsSummary = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(today.getDate() - 60);

    const currentCount = await msgCollection.countDocuments({
      sendDateFormatted: { $gte: thirtyDaysAgo },
    });

    const previousCount = await msgCollection.countDocuments({
      sendDateFormatted: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const percentChange =
      previousCount === 0
        ? currentCount > 0
          ? 100
          : 0
        : Math.round(((currentCount - previousCount) / previousCount) * 100);

    res.send({ currentCount, previousCount, percentChange });
  } catch (error) {
    console.error("Stats summary error:", error);
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch stats summary" });
  }
};

// Delete message
export const deleteMsg = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await msgCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount > 0) {
      res.send({ success: true, message: "Message deleted successfully" });
    } else {
      res.send({ success: false, message: "Message not found" });
    }
  } catch (error) {
    console.error("Delete msg error:", error);
    res.status(500).send({ success: false, message: "Failed to delete msg" });
  }
};

//Mask As Read Massage

export const msgRead = async (req, res) => {
  const { massage } = req.params;
  try {
    await msgCollection.updateOne(
      { _id: new ObjectId(massage) },
      { $set: { read: true } }
    );
    res.send({ success: true });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).send({ success: false });
  }
};
