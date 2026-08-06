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

const WEBSITE_URL = process.env.WEBSITE_URL || "https://www.internovatech.in";
const CTA_URL = process.env.CTA_URL || WEBSITE_URL;

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
        .replace(/&#128640;/g, "")
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
<body style="margin:0;padding:0;background:#0f1115;font-family:Arial,Helvetica,sans-serif;color:#f3f4f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#0f1115;margin:0;padding:0;">
        <tr>
            <td align="center" style="padding:28px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#111317;border-radius:18px;overflow:hidden;border:1px solid #242832;">
                    <tr>
                        <td align="center" style="padding:28px 26px 18px;background:#171a21;">
                            <img src="${LOGO_URL}" width="76" height="76" alt="InternovaTech" style="display:block;width:76px;height:76px;border-radius:18px;border:1px solid #2f3542;">
                            <h1 style="margin:14px 0 4px;color:#ffffff;font-size:25px;line-height:1.25;font-weight:700;">InternovaTech &#128640;</h1>
                            <p style="margin:0;color:#aeb6c4;font-size:14px;line-height:1.5;">AI Support Assistant</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 26px 24px;background:#171a21;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
                                <tr>
                                    <td align="center" style="padding:28px 20px 24px;background:#ffffff;">
                                        <img src="${LOGO_URL}" width="96" height="96" alt="InternovaTech" style="display:block;width:96px;height:96px;border-radius:22px;">
                                        <p style="margin:18px 0 6px;color:#111827;font-size:22px;line-height:1.25;font-weight:700;">Smart support for your digital journey</p>
                                        <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">Web development, automation, AI solutions, and technical assistance from InternovaTech.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding:16px 18px;background:#ff7a35;color:#ffffff;font-size:18px;line-height:1.35;font-weight:700;">
                                        Fast response. Clear guidance. Reliable support.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:4px 30px 30px;color:#e5e7eb;font-size:16px;line-height:1.65;">
                            <p style="margin:0 0 18px;color:#ffffff;font-size:17px;font-weight:700;">Hello,</p>
                            <div style="margin:0 0 28px;color:#e5e7eb;">${content}</div>
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;margin:0 0 28px;">
                                <tr>
                                    <td align="center">
                                        <a href="${CTA_URL}" target="_blank" style="display:block;background:#ff7a35;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;line-height:1;padding:17px 24px;border-radius:9px;">Visit InternovaTech</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0;color:#e5e7eb;">Regards,<br><strong style="color:#ffffff;">InternovaTech Support Team</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background:#0b0d10;padding:24px 24px 28px;color:#c9ced8;font-size:13px;line-height:1.8;border-top:1px solid #242832;">
                            <strong style="font-size:16px;color:#ffffff;">InternovaTech</strong><br>
                            <a href="mailto:info@internovatech.in" style="color:#d8dce5;text-decoration:none;">info@internovatech.in</a><br>
                            <a href="${WEBSITE_URL}" style="color:#d8dce5;text-decoration:none;">www.internovatech.in</a>
                            <p style="margin:18px 0 0;color:#8f98a8;font-size:12px;line-height:1.6;">You are receiving this email because you contacted InternovaTech support.</p>
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
                console.log("Email Sent", result.messageId || "");
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
                "Brevo API Error:",
                isTimeout ? "Request timed out after 30 seconds" : err.message
            );
            throw err;
        }
    }

    throw new Error("Brevo API Error: retry loop exited unexpectedly");
}

module.exports = sendMail;
