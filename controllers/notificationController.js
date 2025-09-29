import client from "../config/database.js";

const msgCollection = client.db("shajidint").collection("Msgs");

export const getNotification = async (req, res) => {
  const notification = await msgCollection
    .find()
    .sort({ sendDateFormatted: -1 })
    .toArray();
  res.send(notification);
};
