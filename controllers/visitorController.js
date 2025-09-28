import { getRange } from "../utils/dateRange.js";
import client from "../config/database.js";

const visitorCollection = client.db("shajidint").collection("visitor");
// Track visit
export const trackVisit = async (req, res) => {
  const { name } = req.body;
  const visitedAt = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
  );

  await visitorCollection.insertOne({ name, visitedAt });
  res.status(201).json({ message: "Visitor tracked" });
};

// Get visitor stats
export const getVisitorStats = async (req, res) => {
  const [daily, monthly, yearly, rawBreakdown] = await Promise.all([
    visitorCollection.countDocuments({ visitedAt: getRange("daily") }),
    visitorCollection.countDocuments({ visitedAt: getRange("monthly") }),
    visitorCollection.countDocuments({ visitedAt: getRange("yearly") }),
    visitorCollection
      .aggregate([
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            value: { $sum: 1 },
          },
        },
      ])
      .toArray(),
  ]);

  const deviceBreakdown = rawBreakdown.map((item) => ({
    id: item._id,
    name: item.name,
    value: item.value,
  }));

  res.json({ daily, monthly, yearly, deviceBreakdown });
};

//Monthy Visitor Compare

export const monthlyVisitor = async (req, res) => {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
  );
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [currentCount, lastCount] = await Promise.all([
    visitorCollection.countDocuments({
      visitedAt: { $gte: currentMonthStart, $lt: nextMonthStart },
    }),
    visitorCollection.countDocuments({
      visitedAt: { $gte: lastMonthStart, $lt: currentMonthStart },
    }),
  ]);

  const percentChange =
    lastCount === 0 ? 100 : ((currentCount - lastCount) / lastCount) * 100;

  res.json({ currentCount, lastCount, percentChange });
};
