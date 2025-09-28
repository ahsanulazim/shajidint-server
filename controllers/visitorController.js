import { getRange } from "../utils/dateRange.js";
import client from "../config/database.js";

const visitorCollection = client.db("shajidint").collection("visitor");
// Track visit
export const trackVisit = async (req, res) => {
  const { deviceType } = req.body;
  const visitedAt = new Date();

  await visitorCollection.insertOne({ deviceType, visitedAt });
  res.status(201).json({ message: "Visitor tracked" });
};

// Get visitor stats
export const getVisitorStats = async (req, res) => {
  const [daily, monthly, yearly, deviceBreakdown] = await Promise.all([
    visitorCollection.countDocuments({ visitedAt: getRange("daily") }),
    visitorCollection.countDocuments({ visitedAt: getRange("monthly") }),
    visitorCollection.countDocuments({ visitedAt: getRange("yearly") }),
    visitorCollection.aggregate([
      { $group: { _id: "$deviceType", count: { $sum: 1 } } },
    ]).toArray(),
  ]);

  res.json({ daily, monthly, yearly, deviceBreakdown });
};