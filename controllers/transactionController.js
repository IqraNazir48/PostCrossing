import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";
import Postcard from "../models/postcardModel.js";

/**
 * GET /api/transactions
 * Query params:
 *  - type: request|send|receive
 *  - actor: username
 *  - sender: username
 *  - receiver: username
 *  - pc_id: PK-1
 *  - date_from: ISO date (inclusive)
 *  - date_to: ISO date (inclusive)
 *  - page: number (default 1)
 *  - limit: number (default 10, max 100)
 *  - sort: createdAt or -createdAt
 */
export const getTransactions = async (req, res) => {
  try {
    const {
      type,
      actor,
      sender,
      receiver,
      pc_id,
      date_from,
      date_to,
      page = 1,
      limit = 10,
      sort = "-createdAt"
    } = req.query;

    const filter = {};

    // Filter by type
    if (type) {
      const t = type.toLowerCase();
      if (!["request", "send", "receive"].includes(t)) {
        return res.status(400).json({ message: "Invalid type. Allowed: request, send, receive" });
      }
      filter.type = t;
    }

    // Filter by pc_id (string match)
    if (pc_id) {
      filter.pc_id = pc_id;
    }

    // Date range filter (based on transaction timestamp)
    if (date_from || date_to) {
      filter.timestamp = {};
      if (date_from) {
        const dFrom = new Date(date_from);
        if (isNaN(dFrom)) return res.status(400).json({ message: "Invalid date_from" });
        filter.timestamp.$gte = dFrom;
      }
      if (date_to) {
        const dTo = new Date(date_to);
        if (isNaN(dTo)) return res.status(400).json({ message: "Invalid date_to" });
        // include the whole day of date_to by setting to end of day:
        dTo.setHours(23,59,59,999);
        filter.timestamp.$lte = dTo;
      }
    }

    // Resolve usernames to user ids for actor / sender / receiver
    const userLookups = [];
    if (actor) userLookups.push({ key: "actor", username: actor });
    if (sender) userLookups.push({ key: "sender", username: sender });
    if (receiver) userLookups.push({ key: "receiver", username: receiver });

    for (const u of userLookups) {
      const found = await User.findOne({ username: u.username });
      if (!found) {
        return res.status(404).json({ message: `${u.key} user not found: ${u.username}` });
      }
      if (u.key === "actor") filter.actor_id = found._id;
      if (u.key === "sender") filter.sender_id = found._id;
      if (u.key === "receiver") filter.receiver_id = found._id;
    }

    // Pagination and limits
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * perPage;

    // Count total
    const total = await Transaction.countDocuments(filter);

    // Fetch transactions with population
    const transactions = await Transaction.find(filter)
      .populate("actor_id", "username country email")
      .populate("sender_id", "username country")
      .populate("receiver_id", "username country")
      .populate("postcard_id", "pc_id status")
      .sort(sort)
      .skip(skip)
      .limit(perPage)
      .lean();

    // response metadata
    const totalPages = Math.ceil(total / perPage);

    res.status(200).json({
      total,
      page: pageNum,
      perPage,
      totalPages,
      transactions
    });
  } catch (err) {
    console.error("Error fetching transactions (filtered):", err);
    res.status(500).json({ message: "Server error while fetching transactions" });
  }
};
