const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");

const Email = require("../models/Email");

const replyEngine = require("./replyEngine");
const sendMail = require("./mailSender");

const {
    getConversation,
    saveConversation
} = require("./conversationService");

const INBOX = "INBOX";
const RECONNECT_DELAY_MS = 5_000;

let client = null;
let listenerStarted = false;
let reconnecting = false;
let processingEmail = false;

function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getSafeEmail(value = "") {
    return String(value || "")
        .toLowerCase()
        .trim();
}

function createClient() {
    return new ImapFlow({
        host: process.env.IMAP_HOST,
        port: Number(process.env.IMAP_PORT || 993),
        secure: true,
        auth: {
            user: process.env.IMAP_EMAIL,
            pass: process.env.IMAP_PASSWORD
        },
        maxIdleTime: 25 * 60 * 1000,
        logger: false,
        tls: {
            rejectUnauthorized: false
        }
    });
}

async function cleanupClient() {
    if (!client) {
        return;
    }

    const oldClient = client;

    oldClient.removeAllListeners();

    try {
        await oldClient.logout();
    } catch {}

    if (client === oldClient) {
        client = null;
    }
}

function attachListeners(imapClient) {
    imapClient.removeAllListeners("error");
    imapClient.removeAllListeners("close");
    imapClient.removeAllListeners("exists");

    imapClient.on("error", (error) => {
        console.error("❌ IMAP Error:", error.message);

        if (listenerStarted) {
            reconnect();
        }
    });

    imapClient.on("close", () => {
        console.log("⚠️ Connection Closed");

        if (listenerStarted) {
            reconnect();
        }
    });

    imapClient.on("exists", async () => {
        await handleNewEmail(imapClient);
    });
}

async function connectIMAP() {
    try {
        await cleanupClient();

        client = createClient();
        attachListeners(client);

        await client.connect();
        console.log("✅ Connected to IMAP");

        await client.mailboxOpen(INBOX);
        console.log("📩 Inbox Opened");
    } catch (error) {
        console.error("❌ IMAP Connection Failed:", error.message);
        throw error;
    }
}

async function reconnect() {
    if (reconnecting) {
        return;
    }

    reconnecting = true;

    try {
        await delay(RECONNECT_DELAY_MS);

        console.log("🔄 Reconnecting...");

        await connectIMAP();

        console.log("👂 Listening...");
    } catch (error) {
        console.error("❌ Reconnect Failed:", error.message);

        if (listenerStarted) {
            reconnecting = false;
            reconnect();
            return;
        }
    } finally {
        reconnecting = false;
    }
}

async function getLatestUid(imapClient) {
    const status = await imapClient.status(INBOX, {
        uidNext: true
    });

    return status.uidNext ? status.uidNext - 1 : null;
}

async function handleNewEmail(imapClient) {
    if (processingEmail) {
        console.log("⚠️ Email processing already in progress");
        return;
    }

    processingEmail = true;

    let lock;

    try {
        console.log("📨 New Email");

        lock = await imapClient.getMailboxLock(INBOX);

        const uid = await getLatestUid(imapClient);

        if (!uid) {
            console.log("⚠️ Unable to detect latest email UID");
            return;
        }

        await processEmail(uid, imapClient);
    } catch (error) {
        console.error("❌ Listener Error:", error.message);
    } finally {
        if (lock) {
            lock.release();
        }

        processingEmail = false;
    }
}

async function processEmail(uid, imapClient = client) {
    try {
        if (!imapClient) {
            console.log("⚠️ IMAP client unavailable");
            return;
        }

        const message = await imapClient.fetchOne(
            uid,
            {
                source: true
            },
            {
                uid: true
            }
        );

        if (!message) {
            console.log("⚠️ Email not found");
            return;
        }

        const parsed = await simpleParser(message.source);
        const sender = parsed.from?.value?.[0];

        if (!sender) {
            console.log("⚠️ Sender not found");
            return;
        }

        const senderEmail = getSafeEmail(sender.address);
        const ownEmail = getSafeEmail(process.env.IMAP_EMAIL);

        if (!senderEmail) {
            console.log("⚠️ Sender email missing");
            return;
        }

        const senderName = sender.name || "User";

        if (senderEmail === ownEmail) {
            console.log("🤖 Ignoring own email");
            return;
        }

        const subject = parsed.subject || "No Subject";
        const text = parsed.text || "";

        console.log("\n📩 New Email");
        console.log("From:", senderEmail);
        console.log("Subject:", subject);

        const exists = await Email.findOne({
            uid
        });

        if (exists) {
            console.log("⚠️ Already Processed");
            return;
        }

        const conversation = await getConversation(senderEmail);
        const history = conversation ? conversation.messages : [];

        const generatedReply = await replyEngine({
            name: senderName,
            email: senderEmail,
            subject,
            message: text,
            history
        });

        let replySubject = "Re: " + subject;
        let replyMessage = "";

        if (typeof generatedReply === "object" && generatedReply !== null) {
            replySubject = generatedReply.subject || replySubject;
            replyMessage = generatedReply.message || "";
        } else {
            replyMessage = String(generatedReply || "");
        }

        if (!replyMessage) {
            console.log("⚠️ No reply generated");
            return;
        }

        await sendMail({
            to: senderEmail,
            subject: replySubject,
            text: replyMessage
        });

        console.log("📤 Reply Sent");

        await saveConversation({
            email: senderEmail,
            name: senderName,
            subject,
            userMessage: text,
            botReply: replyMessage
        });

        await Email.create({
            uid,
            sender: senderEmail,
            senderName,
            subject,
            message: text,
            replySent: true,
            reply: replyMessage
        });

        console.log("✅ Email Completed");
    } catch (error) {
        console.error("❌ Processing Error:", error.message);
    }
}

async function startListener() {
    if (listenerStarted) {
        console.log("⚠️ Listener already running");
        return;
    }

    await connectIMAP();

    listenerStarted = true;

    console.log("👂 Listening...");
}

module.exports = startListener;
