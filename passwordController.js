const db = require('../db');
const Sib = require("sib-api-v3-sdk");
require('dotenv').config();

exports.forgotPassword = async (req, res) => {
    console.log("inside forgot password")
    const { email } = req.body;
    console.log(email);

    try {
        // Check if user exists
        const [user] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Configure Sendinblue
        const client = Sib.ApiClient.instance;
        const apiKey = client.authentications['api-key'];
        apiKey.apiKey = process.env.API_KEY;;

        const transEmailApi = new Sib.TransactionalEmailsApi();

        const sender = {
            email: 'omkar.girkar18@gmail.com',
            name: 'Expense Tracker App'
        };

        const receivers = [{ email }];

        await transEmailApi.sendTransacEmail({
            sender,
            to: receivers,
            subject: "Reset Your Password",
            textContent: `You requested a password reset. This is just a demo message.`,
        });

        res.status(200).json({ message: "Reset email sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
