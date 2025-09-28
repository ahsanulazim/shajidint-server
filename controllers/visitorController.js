import client from "../config/database.js";
import UAParser from "ua-parser-js";

const visitorCollection = client.db("shajidint").collection("Visitors");

// Track visit
export const trackVisit = async (req, res) => {
    try {
        const ua = new UAParser(req.headers["user-agent"]);
        const deviceType = ua.device.type || "desktop"; // default desktop
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

        await visitorCollection.insertOne(doc);
        res.send({ success: true });
    } catch (err) {
        console.error("Visitor track error:", err);
        res.status(500).send({ success: false });
    }
};

// Get visitor stats (date-wise + device-wise)
export const getVisitorStats = async (req, res) => {
    try {
        // Date-wise stats
        const dateStats = await visitorCollection.aggregate([
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
        ]).toArray();

        // Device-wise stats
        const deviceStats = await visitorCollection.aggregate([
            {
                $group: {
                    _id: "$device",
                    count: { $sum: 1 },
                },
            },
        ]).toArray();

        res.send({ dateStats, deviceStats });
    } catch (err) {
        console.error("Visitor stats error:", err);
        res.status(500).send({ success: false });
    }
};