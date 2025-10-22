import User from "../models/userModel.js";
import Postcard from "../models/postcardModel.js";

/**
 * GET /api/stats/overview
 * Returns global system statistics
 */
export const getSystemStats = async (req, res) => {
  try {
    // Basic totals
    const totalUsers = await User.countDocuments();
    const totalPostcards = await Postcard.countDocuments();

    // Postcard statuses
    const sentCount = await Postcard.countDocuments({ status: "sent" });
    const receivedCount = await Postcard.countDocuments({ status: "received" });
    const requestedCount = await Postcard.countDocuments({ status: "requested" });

    // Ensure "in transit" count is never negative
    const traveling = Math.max(0, sentCount - receivedCount);

    // Top sending countries
    const topCountries = await Postcard.aggregate([
      { $group: { _id: "$sender_country", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      totals: {
        users: totalUsers,
        postcards: totalPostcards,
        requested: requestedCount,
        sent: sentCount,
        received: receivedCount,
        in_transit: traveling
      },
      topCountries
    });
  } catch (err) {
    console.error("Error getting system stats:", err);
    res.status(500).json({ success: false, message: "Server error fetching stats" });
  }
};
