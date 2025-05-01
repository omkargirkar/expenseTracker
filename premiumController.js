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
      SELECT u.username, SUM(e.amount) AS total_expense
      FROM users u
      LEFT JOIN expenses e ON u.id = e.userId
      GROUP BY u.id
      ORDER BY total_expense DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Leaderboard error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
