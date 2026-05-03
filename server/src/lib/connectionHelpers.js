import mongoose from "mongoose";
import { Connection } from "../models/Connection.js";

export async function hasAcceptedConnection(userIdA, userIdB) {
  const a = new mongoose.Types.ObjectId(userIdA);
  const b = new mongoose.Types.ObjectId(userIdB);
  const doc = await Connection.findOne({
    status: "accepted",
    $or: [
      { from: a, to: b },
      { from: b, to: a },
    ],
  });
  return Boolean(doc);
}
