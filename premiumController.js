const db = require('../db');

exports.getLeaderboard = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Check if current user is premium
    const [[user]] = await db.execute("SELECT isPremium FROM users WHERE id = ?", [userId]);
    if (!user || user.isPremium !== 1) {
      return res.status(403).json({ message: "Access denied. Not a premium user." });
    }

    // Fetch users with their total expenses
    const [rows] = await db.execute(`
      SELECT users.username, users.totalExpense
      FROM users
      ORDER BY users.totalExpense DESC;
    `);

    res.json(rows);
  } catch (error) {
    console.error("Leaderboard error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
