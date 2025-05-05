//expenseController.js

const db = require('../db');

// Create Expense
exports.addExpense = async (req, res) => {
    const { amount, description, category } = req.body;
    const userId = req.user.userId;
    const sql = 'INSERT INTO expenses (amount, description, category, userId) VALUES (?, ?, ?, ?)';
    try {
        const [result] = await db.query(sql, [amount, description, category, userId]);
        
        await db.execute(
            'UPDATE users SET totalExpense = totalExpense + ? WHERE id = ?',
            [amount, userId]
        );

        const [newExpense] = await db.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
        res.status(201).json(newExpense[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add expense' });
    }
};

// Get All Expenses
exports.getAllExpenses = async (req, res) => {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        // Fetch total count
        const [countResult] = await db.query('SELECT COUNT(*) AS total FROM expenses WHERE userId = ?', [userId]);
        const totalExpenses = countResult[0].total;

        // Fetch paginated data
        const [rows] = await db.query('SELECT * FROM expenses WHERE userId = ? LIMIT ? OFFSET ?', [userId, limit, offset]);

        res.json({ expenses: rows, totalExpenses });
    } catch (err) {
        console.error('Error fetching paginated expenses:', err);
        res.status(500).send('Failed to fetch expenses');
    }
};


exports.deleteExpense = async (req, res) => {
    console.log(req.params);
    const { id } = req.params;
    const userId = req.user.userId;
    const sql = 'DELETE FROM expenses WHERE id = ? AND userID=?';
    try {
         // Get the amount of the expense to be deleted
         const [expenseData] = await db.query('SELECT amount FROM expenses WHERE id = ? AND userId = ?', [id, userId]);

         if (expenseData.length === 0) {
             return res.status(403).json({ error: 'Not authorized to delete this expense' });
         }
 
        const amount = expenseData[0].amount;

        const [result] = await db.query(sql, [id,userId]);

        await db.execute(
            'UPDATE users SET totalExpense = totalExpense - ? WHERE id = ?',
            [amount, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ error: 'Not authorized to delete this expense' });
        }
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};
