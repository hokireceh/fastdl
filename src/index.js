require("dotenv").config();
const express = require("express");
const app = express();
const { Bot, Browser } = require("./config");
const { connectDB, getModels } = require("./config/database");
const { initQueue } = require("./queue");
const { log, domainCleaner, extractShortCode } = require("./utils");
const { MESSSAGE } = require("./constants");
const { sendMessage } = require("./telegramActions");
const { isValidInstaUrl } = require("./utils/helper");
const { addOrUpdateUser } = require("./utils/addOrUpdateUser");

let ContentRequest;

// Set the server to listen on port 5000
const PORT = process.env.PORT || 5000;

// Listen for any kind of message. There are different kinds of messages.
Bot.onText(/^\/start/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userName = msg?.from?.username || "";
    const firstName = msg.from.first_name;
    let welcomeMessage = MESSSAGE.WELCOME.replace(
        "firstName",
        msg.from.first_name
    );

    // Send a welcome message to the chat
    await sendMessage({
        chatId,
        requestedBy: { userName, firstName },
        message: welcomeMessage,
    });
});

Bot.onText(/^https:\/\/www\.instagram\.com(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const userMessage = msg.text;
    const userName = msg?.from?.username || "";
    const firstName = msg?.from?.first_name || "";
    let isURL =
        msg.entities &&
        msg.entities.length > 0 &&
        msg.entities[0].type === "url";
    // Process user message
    if (isURL) {
        let requestUrl = userMessage;
        let urlResponse = isValidInstaUrl(requestUrl);
        log("urlResponse: ", urlResponse);
        if (!urlResponse.success || !urlResponse.shortCode) {
            // If domain cleaner fails, exit early
            log("return from here as shortCode not found");
            return;
        }
        const newRequest = {
            chatId,
            requestUrl,
            shortCode: urlResponse.shortCode,
            requestedByUserName: userName,
            requestedByFirstName: firstName,
            messageId: messageId,
        };

        try {
            // Save the request to the database
            await ContentRequest.create(newRequest);

            await addOrUpdateUser(String(chatId), userName, firstName);
        } catch (error) {
            log("Error saving content request:", error);
        }
    }
});

// Check for Master Backend configuration [OPTIONAL]
// Check if the module is being run directly
if (require.main === module) {
    app.listen(PORT, async () => {
        log(`Insta saver running at http://localhost:${PORT}`);

        try {
            // Connect to PostgreSQL
            await connectDB();
            const models = getModels();
            ContentRequest = models.ContentRequest;

            // Open Browser
            await Browser.Open();

            // Initialize the job queue
            await initQueue(models);
        } catch (error) {
            log("Error during startup:", error);
        }
    });
} else {
    // Export the app instance for importing
    module.exports = app;
}

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Insta Saver Bot" });
});

app.get("/test", (req, res) => {
    res.json({ message: "Bot is Online!!" });
});

// Handle shutdown gracefully
process.on("SIGINT", async () => {
    // Open Browser
    await Browser.Close();
    process.exit(0);
});
