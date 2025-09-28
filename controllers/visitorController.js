import client from "../config/database.js";
import { UAParser } from "ua-parser-js";

const visitorCollection = client.db("shajidint").collection("Visitors");

// Track visit
export const trackVisit = async (req, res) => {
  try {
    const userAgent = req.headers["user-agent"];
    if (!userAgent) {
      console.warn("Missing user-agent header");
      return res
        .status(400)
        .send({ success: false, message: "Missing user-agent" });
    }

    const ua = new UAParser(userAgent);
    const deviceType = ua.device.type || "desktop";
    const browser = ua.browser.name || "unknown";

    const now = new Date();

    const doc = {
      device: deviceType,
      browser,
      visitDate: now,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };

    console.log("Visitor tracking doc:", doc);

    const result = await visitorCollection.insertOne(doc);
    console.log("MongoDB insert result:", result);

    res.send({ success: true });
  } catch (err) {
    console.error("Visitor track error:", err.message);
    res
      .status(500)
      .send({ success: false, message: "visitor Error ," + err.message });
  }
};

// Get visitor stats (date-wise + device-wise)
export const getVisitorStats = async (req, res) => {
  try {
    // Date-wise stats
    const dateStats = await visitorCollection
      .aggregate([
        {
          $group: {
            _id: { year: "$year", month: "$month", day: "$day" },
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

    // Device-wise stats
    const deviceStats = await visitorCollection
      .aggregate([
        {
          $group: {
            _id: "$device",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    res.send({ dateStats, deviceStats });
  } catch (err) {
    console.error("Visitor stats error:", err);
    res.status(500).send({ success: false });
  }
};
