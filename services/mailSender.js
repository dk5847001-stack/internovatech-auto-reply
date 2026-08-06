const BREVO_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
const REPLY_TO_EMAIL = "contact@internovatech.in";
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const PUBLIC_BASE_URL =
    process.env.PUBLIC_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.RENDER_EXTERNAL_HOSTNAME
        ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
        : "");

const LOGO_URL =
    process.env.LOGO_URL ||
    (PUBLIC_BASE_URL
        ? `${PUBLIC_BASE_URL.replace(/\/$/, "")}/assets/brand-logo-email.png`
        : "") ||
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhXsfCtQ07icafhDTAW7Y17qVGYgNzky_kaqsKugCvi4ewKepdc9k7TYXOD-YrWA38oGxqsdnNtqXYWFw_3ze0ngn78_puqlb3c647OHdFNT7UgPL72_Im5zdJB0L-YT3PQQTzi7QpD68lm-OXiZsAMnymD3OgeDzLjwmhrkkLjwhXFPfSudsCiF7Pg1Yib/s200/1000070116.png";

function escapeHtml(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function stripHtml(html = "") {
    return String(html)
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<li[^>]*>/gi, "- ")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#039;/gi, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function isHtml(content = "") {
    return /<(p|div|span|br|ul|ol|li|table|thead|tbody|tr|td|th|h[1-6]|strong|b|em|i|a)\b[^>]*>/i.test(
        String(content)
    );
}

function removeGreeting(content = "") {
    return String(content)
        .replace(
            /^\s*(?:<p[^>]*>|<div[^>]*>|<br\s*\/?>|\s)*\s*(?:hello|hi|hey|dear(?:\s+(?:user|candidate|customer|sir|madam|team|internovatech team))?)\s*[,!.-]*\s*(?:<\/p>|<\/div>|<br\s*\/?>|\s)*/i,
            ""
        )
        .replace(
            /^\s*(?:hello|hi|hey|dear(?:\s+(?:user|candidate|customer|sir|madam|team|internovatech team))?)\s*[,!.-]*\s*/i,
            ""
        )
        .trim();
}

function removeSignature(content = "") {
    return String(content)
        .replace(
            /(?:\s|<br\s*\/?>|<\/?p[^>]*>|<\/?div[^>]*>|<\/?strong>|<\/?b>)*(?:regards|thanks|thank you|best regards|sincerely)\s*[,.-]*(?:\s|<br\s*\/?>|<\/?p[^>]*>|<\/?div[^>]*>|<\/?strong>|<\/?b>)*(?:internovatech(?:\s+(?:support\s+)?team)?|internovatech\s+team)?\s*$/i,
            ""
        )
        .replace(
            /(?:\s|<br\s*\/?>|<\/?p[^>]*>|<\/?div[^>]*>|<\/?strong>|<\/?b>)*internovatech\s+(?:support\s+)?team\s*$/i,
            ""
        )
        .trim();
}

function normalizeContent(content = "") {
    const cleaned = removeSignature(removeGreeting(content));

    if (isHtml(cleaned)) {
        return cleaned;
    }

    return escapeHtml(cleaned).replace(/\r?\n/g, "<br>");
}

function createTemplate(content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>InternovaTech Support</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#374151;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#f4f7fb;margin:0;padding:0;">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 18px 45px rgba(17,24,39,0.14);">
                    <tr>
                        <td align="center" style="background:#111827;padding:30px 24px 26px;">
                            <img src="${LOGO_URL}" width="88" height="88" alt="InternovaTech" style="display:block;width:88px;height:88px;border-radius:50%;border:3px solid #374151;">
                            <h1 style="margin:16px 0 6px;color:#ffffff;font-size:26px;line-height:1.25;font-weight:700;">InternovaTech 🚀</h1>
                            <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.5;">AI Support Assistant</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 30px;color:#374151;font-size:15px;line-height:1.75;">
                            <p style="margin:0 0 18px;">Hello,</p>
                            <div style="margin:0 0 26px;">${content}</div>
                            <p style="margin:0;">Regards,<br><strong>InternovaTech Support Team</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background:#111827;padding:22px 24px;color:#ffffff;font-size:13px;line-height:1.7;">
                            <strong style="font-size:15px;">InternovaTech</strong><br>
                            <a href="mailto:info@internovatech.in" style="color:#e5e7eb;text-decoration:none;">info@internovatech.in</a><br>
                            <a href="https://www.internovatech.in" style="color:#e5e7eb;text-decoration:none;">www.internovatech.in</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function buildPayload({ to, subject, text, inReplyTo = null }) {
    const message = text || "Thank you for contacting InternovaTech.";
    const content = normalizeContent(message);
    const htmlContent = createTemplate(content);
    const textContent = stripHtml(htmlContent);

    const payload = {
        sender: {
            name: process.env.BREVO_NAME,
            email: process.env.BREVO_EMAIL
        },
        replyTo: {
            email: REPLY_TO_EMAIL
        },
        to: [
            {
                email: to
            }
        ],
        subject,
        htmlContent,
        textContent
    };

    if (inReplyTo) {
        payload.headers = {
            "In-Reply-To": inReplyTo,
            References: inReplyTo
        };
    }

    return payload;
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function parseBrevoResponse(response) {
    const rawBody = await response.text();

    if (!rawBody) {
        return {};
    }

    try {
        return JSON.parse(rawBody);
    } catch {
        return {
            message: rawBody
        };
    }
}

async function sendBrevoRequest(payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(BREVO_EMAIL_URL, {
            method: "POST",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "api-key": process.env.BREVO_API_KEY
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeout);
    }
}

async function sendMail({ to, subject, text, inReplyTo = null }) {
    const payload = buildPayload({
        to,
        subject,
        text,
        inReplyTo
    });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
        try {
            const response = await sendBrevoRequest(payload);
            const result = await parseBrevoResponse(response);

            if (response.ok) {
                console.log("✅ Email Sent", result.messageId || "");
                return result;
            }

            const errorMessage = JSON.stringify(result);

            if (RETRY_STATUSES.has(response.status) && attempt < MAX_RETRIES) {
                const delay = 2 ** (attempt - 1) * 1_000;
                console.warn(
                    `Retry... Brevo returned ${response.status}. Attempt ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`
                );
                await wait(delay);
                continue;
            }

            const error = new Error(`Brevo returned ${response.status}: ${errorMessage}`);
            error.retryable = false;
            throw error;
        } catch (err) {
            const isTimeout = err.name === "AbortError";

            if (err.retryable !== false && attempt < MAX_RETRIES) {
                const delay = 2 ** (attempt - 1) * 1_000;
                console.warn(
                    `Retry... ${isTimeout ? "Brevo request timed out" : err.message}. Attempt ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`
                );
                await wait(delay);
                continue;
            }

            console.error(
                "❌ Brevo API Error:",
                isTimeout ? "Request timed out after 30 seconds" : err.message
            );
            throw err;
        }
    }

    throw new Error("Brevo API Error: retry loop exited unexpectedly");
}

module.exports = sendMail;
