require("dotenv").config();

const express = require("express");

const connectDB = require("./config/db");
const startMailListener = require("./services/mailListener");

const app = express();

const PORT = process.env.PORT || 5000;

// Health Check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "InternovaTech Auto Reply Bot Running 🚀"
    });
});

(async () => {
    try {

        console.log("🚀 Starting InternovaTech Auto Reply Bot...");

        await connectDB();

        await startMailListener();

        app.listen(PORT, () => {
            console.log(`🌐 Server running on port ${PORT}`);
        });

    } catch (err) {

        console.error(err);

        process.exit(1);

    }
})();