const db = require('../db');
const Sib = require("sib-api-v3-sdk");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
require('dotenv').config();


exports.forgotPassword = async (req, res) => {
    console.log("inside forgot password")
    const { email } = req.body;
    console.log(email);

    try {
        // Check if user exists
        const [userResult] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (userResult.length === 0) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        const user=userResult[0];

        // Generate UUID
        const requestId = uuidv4();

        // Insert into forgotpasswordrequests
        await db.execute(
            'INSERT INTO forgotpasswordrequests (id, userId, isActive) VALUES (?, ?, ?)',
            [requestId, user.id, true]
        );

        // Configure Sendinblue
        const client = Sib.ApiClient.instance;
        const apiKey = client.authentications['api-key'];
        apiKey.apiKey = process.env.API_KEY;

        const transEmailApi = new Sib.TransactionalEmailsApi();

        const sender = {
            email: 'omkar.girkar18@gmail.com',
            name: 'Expense Tracker App'
        };

        const receivers = [{ email }];

        const resetLink = `http://localhost:3000/password/resetpassword/${requestId}`;

        await transEmailApi.sendTransacEmail({
            sender,
            to: receivers,
            subject: "Reset Your Password",
            htmlContent: `<p>Click the link to reset your password:</p>
                          <a href="${resetLink}">${resetLink}</a>`
        });

        res.status(200).json({ message: "Reset email sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getResetPasswordForm = async (req, res) => {
    console.log("inside get password form");
    const requestId = req.params.id;

    try {
        const [requests] = await db.execute('SELECT * FROM forgotpasswordrequests WHERE id = ?', [requestId]);

        if (requests.length === 0 || requests[0].isactive === 0) {
            return res.status(400).send("Invalid or expired link.");
        }

        res.sendFile('resetPassword.html', { root: './public' });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
};

exports.updatePassword = async (req, res) => {
    const requestId = req.params.id;
    const { newPassword } = req.body;

    try {
        const [requests] = await db.execute('SELECT * FROM forgotpasswordrequests WHERE id = ?', [requestId]);

        if (requests.length === 0 || requests[0].isactive === 0) {
            return res.status(400).json({ message: "Link is invalid or has expired" });
        }

        const userId = requests[0].userId;

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        await db.execute('UPDATE forgotpasswordrequests SET isactive = 0 WHERE id = ?', [requestId]);

        res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong while updating the password" });
    }
};
