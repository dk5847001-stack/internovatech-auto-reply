// services/replyEngine.js
// Offline production-ready reply engine for InternovaTech.

const COMPANY = {
  name: "InternovaTech",
  supportName: "InternovaTech Support Team",
  email: "info@internovatech.in",
  website: "www.internovatech.in",
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
  "have", "i", "in", "is", "it", "my", "of", "on", "or", "our", "please",
  "pls", "plz", "sir", "mam", "maam", "team", "that", "the", "this", "to",
  "we", "you", "your", "me", "mera", "meri", "mere", "ka", "ki", "ke",
  "ko", "hai", "hain", "hu", "ho", "kya", "se", "main", "mein",
]);

const LANGUAGE_HINTS = {
  hindi: [
    "aap", "apka", "apki", "apke", "batao", "bataiye", "bheja", "bhejiye",
    "chahiye", "dhanyawad", "dikhat", "dikkat", "hoga", "hogaya", "kaise",
    "kab", "karna", "kardo", "kare", "karenge", "kariye", "koi", "kripya",
    "kyu", "kyun", "mila", "mili", "nahi", "nahin", "paisa", "paise",
    "prapt", "samajh", "sakta", "sakti", "shukriya", "thik", "theek",
    "jaldi", "madad", "bataye", "batayen", "karwana", "hua", "huwa",
  ],
  english: [
    "about", "account", "application", "assist", "available", "certificate",
    "details", "email", "help", "internship", "invoice", "issue", "login",
    "payment", "please", "program", "project", "received", "refund",
    "registration", "support", "training", "update", "verify",
  ],
};

const SENTIMENT_KEYWORDS = {
  angry: [
    "angry", "bad service", "cheated", "fraud", "irritated", "not acceptable",
    "pathetic", "scam", "useless", "worst", "gussa", "bekar", "galat",
  ],
  frustrated: [
    "again and again", "fed up", "frustrated", "many times", "no response",
    "not working", "still not", "tired", "bar bar", "baar baar", "pareshan",
  ],
  confused: [
    "confused", "do not understand", "guide me", "how can", "how to",
    "i don't know", "not sure", "samajh nahi", "kaise", "kya karu",
  ],
  urgent: [
    "asap", "immediate", "immediately", "important", "today", "urgent",
    "within today", "jaldi", "turant", "abhi", "aaj",
  ],
  thankful: [
    "appreciate", "thank you", "thanks", "thnx", "grateful", "dhanyawad",
    "shukriya", "thanku",
  ],
  happy: [
    "awesome", "excellent", "glad", "good", "great", "happy", "nice",
    "perfect", "wonderful", "badhiya", "bahut accha",
  ],
  apologetic: [
    "apologize", "apology", "sorry", "maafi", "maf", "maaf",
  ],
  excited: [
    "excited", "looking forward", "congratulations", "congrats", "eager",
    "interested", "utsuk",
  ],
  impatient: [
    "waiting", "why delay", "delay", "late", "kab milega", "kitna time",
  ],
  polite: [
    "kindly", "please", "request", "would you", "kripya", "nivedan",
  ],
};

const STATUS_KEYWORDS = [
  "status", "update", "track", "progress", "pending", "approved", "selected",
  "rejected", "shortlisted", "waiting", "kab tak", "kaha tak", "kya hua",
];

const CORRECTION_KEYWORDS = [
  "correct", "correction", "change", "edit", "mistake", "wrong", "update",
  "name correction", "email change", "phone update", "spelling", "galat",
  "sahi", "badalna", "badal do", "sudhar",
];

const INTENT_DEFINITIONS = [
  {
    id: "greeting",
    priority: 70,
    keywords: [
      "hi", "hello", "hey", "hii", "good morning", "good afternoon",
      "good evening", "good night", "namaste", "namaskar",
    ],
    avoidWhen: [
      "certificate", "payment", "refund", "login", "internship", "project",
      "job", "complaint", "issue", "problem",
    ],
    followUps: ["can you help", "need help", "assist", "guide"],
    template: buildGreetingReply,
  },
  {
    id: "thanks",
    priority: 72,
    keywords: [
      "thank you", "thanks", "thanku", "thnx", "appreciate", "grateful",
      "dhanyawad", "shukriya",
    ],
    template: buildThanksReply,
  },
  {
    id: "who_are_you",
    priority: 69,
    keywords: [
      "who are you", "what can you do", "are you bot", "tell me about you",
      "tum kaun", "aap kaun", "kya kar sakte",
    ],
    template: buildWhoAreYouReply,
  },
  {
    id: "company_info",
    priority: 68,
    keywords: [
      "about internovatech", "company information", "company info",
      "tell me about internovatech", "what is internovatech", "address",
      "location", "contact number", "office hours", "website", "email id",
    ],
    template: buildCompanyInfoReply,
  },
  {
    id: "internship_training",
    priority: 90,
    keywords: [
      "internship", "intern", "training", "industrial training",
      "summer internship", "winter internship", "program", "domain",
      "full stack", "web development", "data analytics", "artificial intelligence",
      "machine learning", "software development", "python internship",
      "java internship", "mern", "react internship", "node internship",
      "internship chahiye", "training chahiye", "internship ke bare",
    ],
    synonyms: ["enroll", "apply", "join", "registration", "course"],
    template: buildInternshipReply,
  },
  {
    id: "registration_enrollment",
    priority: 88,
    keywords: [
      "registration", "register", "enrollment", "enrolment", "enroll",
      "admission", "apply", "application", "join", "seat", "batch",
      "kaise join", "kaise apply", "form", "signup for program",
    ],
    template: buildRegistrationReply,
  },
  {
    id: "certificate",
    priority: 95,
    keywords: [
      "certificate", "certification", "completion certificate",
      "internship certificate", "training certificate", "certificate not received",
      "certificate nahi mila", "certificate kab", "verify certificate",
      "certificate download", "certificate issue",
    ],
    template: buildCertificateReply,
  },
  {
    id: "certificate_correction",
    priority: 99,
    keywords: [
      "certificate correction", "name correction", "wrong name", "name wrong",
      "spelling mistake", "certificate name", "incorrect certificate",
      "email correction", "duration correction", "certificate me galat",
    ],
    requiredAny: CORRECTION_KEYWORDS,
    template: buildCertificateCorrectionReply,
  },
  {
    id: "offer_letter",
    priority: 94,
    keywords: [
      "offer letter", "offerletter", "joining letter", "selection letter",
      "letter of offer", "offer letter not received", "offer letter nahi",
      "internship offer", "training offer",
    ],
    template: buildOfferLetterReply,
  },
  {
    id: "completion_letter",
    priority: 91,
    keywords: [
      "completion letter", "experience letter", "completion proof",
      "internship completion", "training completion", "completion mail",
    ],
    template: buildCompletionLetterReply,
  },
  {
    id: "lor",
    priority: 89,
    keywords: [
      "lor", "letter of recommendation", "recommendation letter",
      "reference letter", "recommend me", "recommendation",
    ],
    template: buildLorReply,
  },
  {
    id: "payment",
    priority: 93,
    keywords: [
      "payment", "paid", "transaction", "upi", "receipt", "invoice",
      "payment screenshot", "fees", "fee", "amount", "payment pending",
      "payment failed", "payment not updated", "razorpay", "bank transfer",
      "paisa", "paise", "bhugtan",
    ],
    template: buildPaymentReply,
  },
  {
    id: "refund",
    priority: 96,
    keywords: [
      "refund", "money back", "return payment", "cancel and refund",
      "refund status", "refund request", "paisa wapas", "paise wapas",
    ],
    template: buildRefundReply,
  },
  {
    id: "invoice_receipt",
    priority: 91,
    keywords: [
      "invoice", "receipt", "bill", "payment receipt", "fee receipt",
      "tax invoice", "transaction receipt", "rasid", "bill chahiye",
    ],
    template: buildInvoiceReply,
  },
  {
    id: "account_login",
    priority: 92,
    keywords: [
      "login", "signin", "sign in", "account", "dashboard login",
      "cannot login", "can't login", "login issue", "account locked",
      "profile", "username", "registered email", "login nahi",
    ],
    template: buildAccountReply,
  },
  {
    id: "password_otp",
    priority: 94,
    keywords: [
      "password", "forgot password", "reset password", "otp", "verification",
      "email verification", "verify email", "password reset", "otp not received",
      "code not received", "password bhul", "otp nahi",
    ],
    template: buildPasswordOtpReply,
  },
  {
    id: "course_access",
    priority: 89,
    keywords: [
      "course access", "dashboard access", "access not given", "module locked",
      "video not opening", "material", "study material", "course content",
      "portal access", "access nahi",
    ],
    template: buildCourseAccessReply,
  },
  {
    id: "assignment_assessment",
    priority: 88,
    keywords: [
      "assignment", "task", "assessment", "exam", "test", "quiz", "result",
      "marks", "submission", "deadline", "attendance", "attendance issue",
      "submit", "project submission",
    ],
    template: buildAssignmentReply,
  },
  {
    id: "project",
    priority: 90,
    keywords: [
      "project", "project report", "abstract", "documentation", "source code",
      "github", "repository", "repo", "synopsis", "ppt", "presentation",
      "final year project", "minor project", "major project", "project help",
    ],
    template: buildProjectReply,
  },
  {
    id: "technical_stack",
    priority: 86,
    keywords: [
      "react", "node", "node.js", "mongodb", "express", "javascript", "python",
      "java", "c++", "sql", "html", "css", "bootstrap", "tailwind", "api",
      "authentication", "jwt", "database", "frontend", "backend", "mern",
      "deployment", "docker", "aws", "cloud", "devops", "ssl", "hosting",
      "domain", "seo", "digital marketing", "ai", "machine learning",
    ],
    template: buildTechnicalStackReply,
  },
  {
    id: "job_career",
    priority: 87,
    keywords: [
      "resume", "cv", "job", "career", "placement", "opening", "vacancy",
      "hiring", "interview", "hr", "intern job", "full time", "part time",
      "job chahiye", "placement support",
    ],
    template: buildCareerReply,
  },
  {
    id: "application_status",
    priority: 91,
    keywords: [
      "application status", "internship status", "selection", "selected",
      "rejection", "rejected", "waiting list", "shortlisted", "status of",
      "result of application", "mera status",
    ],
    requiredAny: STATUS_KEYWORDS,
    template: buildApplicationStatusReply,
  },
  {
    id: "deadline_extension",
    priority: 91,
    keywords: [
      "extension", "extend", "deadline extension", "duration extension",
      "late submission", "more time", "deadline", "last date", "time extend",
      "samay badha", "date badha",
    ],
    template: buildExtensionReply,
  },
  {
    id: "meeting_schedule",
    priority: 84,
    keywords: [
      "meeting", "schedule", "call", "availability", "appointment",
      "demo", "discussion", "connect", "google meet", "zoom", "teams",
      "kab baat", "meeting fix",
    ],
    template: buildMeetingReply,
  },
  {
    id: "pricing_discount",
    priority: 86,
    keywords: [
      "pricing", "price", "cost", "fees", "fee structure", "discount",
      "offer", "coupon", "scholarship", "charges", "kitna fees", "price kya",
    ],
    template: buildPricingReply,
  },
  {
    id: "business",
    priority: 86,
    keywords: [
      "partnership", "collaboration", "business proposal", "client inquiry",
      "freelancing", "custom software", "website development", "app development",
      "software development", "proposal", "quotation", "agency", "vendor",
    ],
    template: buildBusinessReply,
  },
  {
    id: "complaint_bug",
    priority: 97,
    keywords: [
      "complaint", "issue", "problem", "bug", "website issue", "not working",
      "error", "failed", "broken", "unable", "technical issue", "problem hai",
      "dikkat", "dikhat", "bug report",
    ],
    avoidWhen: [
      "otp", "password", "login", "certificate", "payment", "refund",
      "invoice", "receipt", "offer letter", "project", "internship status",
      "application status",
    ],
    template: buildComplaintReply,
  },
  {
    id: "feedback",
    priority: 75,
    keywords: [
      "feedback", "suggestion", "review", "improve", "idea", "recommendation",
      "experience", "sujhav",
    ],
    template: buildFeedbackReply,
  },
  {
    id: "wishes",
    priority: 66,
    keywords: [
      "congratulations", "congrats", "birthday wishes", "happy birthday",
      "festival wishes", "happy diwali", "happy holi", "happy new year",
      "good luck", "best wishes",
    ],
    template: buildWishesReply,
  },
  {
    id: "apology",
    priority: 73,
    keywords: [
      "sorry", "apology", "apologize", "my mistake", "maaf", "maf kijiye",
    ],
    template: buildApologyReply,
  },
  {
    id: "casual",
    priority: 55,
    keywords: [
      "how are you", "nice", "awesome", "great", "tell me a joke",
      "can you help me", "i need assistance", "i am confused", "please guide me",
      "help me", "support me",
    ],
    template: buildCasualReply,
  },
];

const FOLLOW_UP_PATTERNS = [
  {
    id: "certificate",
    patterns: ["when will i receive it", "when will i get it", "kab milega", "kab tak milega", "receive it", "get it"],
  },
  {
    id: "payment",
    patterns: ["is it updated", "payment update", "verify it", "check it", "confirm it", "ho gaya kya"],
  },
  {
    id: "project",
    patterns: ["send it", "source code", "report bhi", "documentation bhi", "github link"],
  },
  {
    id: "registration_enrollment",
    patterns: ["how to join", "next step", "what next", "kaise join", "form kaha"],
  },
];

function generateReply(input = {}) {
  const parsed = parseInput(input);
  const cleanedHistory = cleanHistory(parsed.history);
  const context = mergeContext(parsed, cleanedHistory);
  const language = detectLanguage(context.combined);
  const sentiment = detectSentiment(context.combined);
  const greeting = detectGreeting(context.currentText);
  const previousIntent = getPreviousIntent(cleanedHistory);
  const detected = detectIntent(context, previousIntent);
  const subject = buildReplySubject(parsed.subject, detected.intent, language);
  const message = formatReply({
    blocks: detected.intent.template({
      input: parsed,
      context,
      language,
      sentiment,
      greeting,
      intent: detected.intent,
      confidence: detected.confidence,
      previousIntent,
    }),
    input: parsed,
    context,
    language,
    sentiment,
    greeting,
    intent: detected.intent,
  });

  return createReplyObject(subject, message);
}

function parseInput(input) {
  if (typeof input === "string") {
    return cleanInput({ subject: "", message: input, history: [] });
  }

  if (!input || typeof input !== "object") {
    return cleanInput({ subject: "", message: "", history: [] });
  }

  return cleanInput({
    name: input.name || "",
    email: input.email || "",
    subject: input.subject || "",
    message: input.message || input.text || input.body || "",
    history: input.history || [],
  });
}

function cleanInput(input) {
  return {
    name: stringValue(input.name),
    email: stringValue(input.email),
    subject: stringValue(input.subject),
    message: stringValue(input.message),
    history: Array.isArray(input.history) ? input.history : [],
  };
}

function cleanHistory(history) {
  return history
    .filter(Boolean)
    .slice(-12)
    .map((item) => {
      if (typeof item === "string") {
        return { role: "unknown", text: item };
      }

      const text = [
        item.userMessage,
        item.message,
        item.botReply,
        item.reply,
        item.text,
        item.subject,
      ]
        .filter(Boolean)
        .map(stringValue)
        .join(" ");

      return {
        role: item.role || item.sender || "unknown",
        text,
        subject: stringValue(item.subject || ""),
      };
    })
    .filter((item) => item.text.trim().length > 0);
}

function mergeContext(input, history) {
  const currentText = `${input.subject} ${input.message}`.trim();
  const historyText = history.map((item) => `${item.subject} ${item.text}`).join(" ");
  const combined = `${currentText} ${historyText}`.trim();
  const normalized = normalize(combined);

  return {
    currentText,
    historyText,
    combined,
    normalized,
    tokens: tokenize(normalized),
    history,
    isFollowUp: history.length > 0 && isLikelyFollowUp(currentText),
  };
}

function normalize(value = "") {
  return stringValue(value)
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9@.+#\s-]/g, " ")
    .replace(/\b(plz|pls)\b/g, "please")
    .replace(/\b(thnx|thanx|thanku)\b/g, "thanks")
    .replace(/\b(certificat|certficate|cerificate|certifcate)\b/g, "certificate")
    .replace(/\b(internshp|intrnship|intership)\b/g, "internship")
    .replace(/\b(paymant|paymet|pyment)\b/g, "payment")
    .replace(/\b(recipt|reciept)\b/g, "receipt")
    .replace(/\b(log in|signin)\b/g, "login")
    .replace(/\b(passward|pasword)\b/g, "password")
    .replace(/\b(otp code)\b/g, "otp")
    .replace(/\b(git hub)\b/g, "github")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function detectLanguage(text = "") {
  const normalized = normalize(text);
  const hindiScore = countMatches(normalized, LANGUAGE_HINTS.hindi);
  const englishScore = countMatches(normalized, LANGUAGE_HINTS.english);
  const strongHindiMarker = containsAny(normalized, [
    "chahiye", "nahi", "nahin", "kab", "kaise", "mera", "meri", "mujhe",
    "aap", "apka", "apki", "bhejiye", "bataiye", "jaldi", "paisa", "paise",
  ]);

  if (hindiScore >= 1 && strongHindiMarker) return "hinglish";
  if (hindiScore >= 2 && englishScore >= 2) return "hinglish";
  if (hindiScore > englishScore) return "hinglish";
  return "english";
}

function detectGreeting(text = "") {
  const normalized = normalize(text);
  if (containsAny(normalized, ["good morning"])) return "morning";
  if (containsAny(normalized, ["good afternoon"])) return "afternoon";
  if (containsAny(normalized, ["good evening"])) return "evening";
  if (containsAny(normalized, ["good night"])) return "night";
  if (containsAny(normalized, ["hi", "hello", "hey", "hii", "namaste", "namaskar"])) return "hello";
  return "default";
}

function detectSentiment(text = "") {
  const normalized = normalize(text);
  const scores = {};

  Object.entries(SENTIMENT_KEYWORDS).forEach(([sentiment, words]) => {
    scores[sentiment] = countMatches(normalized, words);
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length || ranked[0][1] === 0) {
    return { primary: "neutral", scores };
  }

  return { primary: ranked[0][0], scores };
}

function detectIntent(context, previousIntent) {
  const currentNormalized = normalize(context.currentText);
  const combinedNormalized = context.normalized;
  let candidates = INTENT_DEFINITIONS.map((intent) => {
    const score = scoreIntent(intent, currentNormalized, combinedNormalized, context, previousIntent);
    return { intent, score };
  });

  candidates = candidates.sort((a, b) => b.score - a.score || b.intent.priority - a.intent.priority);
  const best = candidates[0];

  if (!best || best.score < 8) {
    const followUpIntent = inferFollowUpIntent(currentNormalized, previousIntent);
    if (followUpIntent) {
      return {
        intent: followUpIntent,
        confidence: 0.62,
        score: 11,
      };
    }

    return {
      intent: {
        id: "fallback",
        priority: 10,
        template: buildFallbackReply,
      },
      confidence: 0.35,
      score: 0,
    };
  }

  return {
    intent: best.intent,
    confidence: confidenceFromScore(best.score),
    score: best.score,
  };
}

function scoreIntent(intent, currentNormalized, combinedNormalized, context, previousIntent) {
  let score = 0;
  const keywordHits = matchedKeywords(currentNormalized, intent.keywords || []);
  const contextHits = matchedKeywords(combinedNormalized, intent.keywords || []);
  const synonymHits = matchedKeywords(currentNormalized, intent.synonyms || []);

  score += keywordHits.length * 12;
  score += contextHits.length * (context.isFollowUp ? 4 : 1);
  score += synonymHits.length * 5;
  score += intent.priority / 10;

  if (intent.requiredAny && !containsAny(currentNormalized, intent.requiredAny)) {
    score -= 18;
  }

  if (intent.avoidWhen && containsAny(currentNormalized, intent.avoidWhen) && keywordHits.length <= 1) {
    score -= 20;
  }

  if (previousIntent && previousIntent === intent.id && context.isFollowUp) {
    score += 10;
  }

  if (intent.id === "greeting" && currentNormalized.split(" ").length > 8) {
    score -= 18;
  }

  if (isSpecificIssueIntent(intent.id) && containsAny(currentNormalized, ["issue", "problem", "help", "not working", "unable"])) {
    score += 8;
  }

  return Math.max(0, score);
}

function matchedKeywords(text, keywords = []) {
  return keywords.filter((keyword) => keywordMatches(text, keyword));
}

function keywordMatches(text, keyword) {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return false;
  if (normalizedKeyword.includes(" ")) return text.includes(normalizedKeyword);
  const boundary = new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`, "i");
  if (boundary.test(text)) return true;
  return normalizedKeyword.length > 4 && text.includes(normalizedKeyword);
}

function containsAny(text, words = []) {
  const normalized = normalize(text);
  return words.some((word) => keywordMatches(normalized, word));
}

function countMatches(text, words = []) {
  return words.reduce((total, word) => total + (keywordMatches(text, word) ? 1 : 0), 0);
}

function isGeneralInfoQuery(text = "") {
  const normalized = normalize(text);
  return containsAny(normalized, [
    "want to know", "know about", "tell me about", "information about",
    "details about", "what is", "explain", "about certificate", "certificate details",
    "certificate ke bare", "certificate ke baare", "jankari", "jaankari",
  ]);
}

function isSpecificIssueIntent(intentId) {
  return [
    "password_otp",
    "account_login",
    "certificate",
    "certificate_correction",
    "payment",
    "refund",
    "invoice_receipt",
    "course_access",
    "assignment_assessment",
    "project",
    "application_status",
    "offer_letter",
    "completion_letter",
  ].includes(intentId);
}

function pickVariant(options, key = "") {
  if (!Array.isArray(options) || options.length === 0) return "";
  const index = Math.abs(hashText(key)) % options.length;
  return options[index];
}

function hashText(value = "") {
  const text = stringValue(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return hash;
}

function confidenceFromScore(score) {
  if (score >= 55) return 0.96;
  if (score >= 40) return 0.88;
  if (score >= 25) return 0.76;
  if (score >= 15) return 0.64;
  return 0.48;
}

function inferFollowUpIntent(currentNormalized, previousIntent) {
  const patternMatch = FOLLOW_UP_PATTERNS.find((item) => containsAny(currentNormalized, item.patterns));
  const id = patternMatch ? patternMatch.id : previousIntent;
  if (!id) return null;
  return INTENT_DEFINITIONS.find((intent) => intent.id === id) || null;
}

function getPreviousIntent(history) {
  const recent = history
    .slice()
    .reverse()
    .map((item) => normalize(item.text))
    .join(" ");

  if (!recent) return null;

  const best = INTENT_DEFINITIONS
    .map((intent) => ({
      id: intent.id,
      score: matchedKeywords(recent, intent.keywords || []).length * 10 + intent.priority / 10,
    }))
    .sort((a, b) => b.score - a.score)[0];

  return best && best.score > 10 ? best.id : null;
}

function isLikelyFollowUp(text = "") {
  const normalized = normalize(text);
  const wordCount = normalized.split(" ").filter(Boolean).length;
  return wordCount <= 14 || containsAny(normalized, [
    "it", "that", "same", "above", "previous", "again", "still", "kab",
    "when", "what next", "next step", "update", "status",
  ]);
}

function formatReply({ blocks, input, context, language, sentiment, greeting, intent }) {
  const lines = Array.isArray(blocks) ? blocks : [String(blocks || "")];
  const variantKey = `${intent.id}:${context.currentText}:${context.history.length}`;
  const greetingHtml = buildOpening(language, sentiment, greeting, intent, variantKey);
  const closingHtml = buildClosing(language, sentiment, intent, variantKey);
  const body = lines
    .filter(Boolean)
    .map((line) => {
      const clean = String(line).trim();
      if (!clean) return "";
      if (clean.startsWith("<")) return clean;
      return `<p>${escapeHtml(clean)}</p>`;
    })
    .filter(Boolean)
    .join("\n\n");

  return [greetingHtml, body, closingHtml].filter(Boolean).join("\n\n").trim();
}

function buildOpening(language, sentiment, greeting, intent, variantKey) {
  const shortIntentOpenings = new Set(["greeting", "thanks", "wishes", "apology", "casual"]);
  if (shortIntentOpenings.has(intent.id)) {
    return language === "hinglish" ? "<p>Hello,</p>" : "<p>Hello,</p>";
  }

  if (language === "hinglish") {
    if (sentiment.primary === "angry" || sentiment.primary === "frustrated") {
      return pickVariant([
        "<p>Hello,</p>\n\n<p>Humein samajh aa raha hai ki yeh situation frustrating ho sakti hai. Aapki concern ko priority ke saath review kiya jayega.</p>",
        "<p>Hello,</p>\n\n<p>Aapki problem noted hai. Hum isko seriously handle karenge aur clear next steps share karenge.</p>",
      ], variantKey);
    }
    if (sentiment.primary === "thankful") {
      return pickVariant([
        "<p>Hello,</p>\n\n<p>Aapka message receive hua. Thank you for sharing this with InternovaTech.</p>",
        "<p>Hello,</p>\n\n<p>Thanks for writing back. Hum aapki request check kar rahe hain.</p>",
      ], variantKey);
    }
    if (greeting === "night") {
      return "<p>Hello,</p>";
    }
    return pickVariant([
      "<p>Hello,</p>",
      "<p>Hi,</p>",
      "<p>Hello,</p>\n\n<p>Aapki query note kar li gayi hai.</p>",
    ], variantKey);
  }

  if (sentiment.primary === "angry" || sentiment.primary === "frustrated") {
    return pickVariant([
      "<p>Hello,</p>\n\n<p>We understand this may be frustrating. Your concern has been noted and we will help you with it carefully.</p>",
      "<p>Hello,</p>\n\n<p>We have noted the issue. We will review it seriously and guide you with the next action.</p>",
    ], variantKey);
  }
  if (sentiment.primary === "urgent") {
    return pickVariant([
      "<p>Hello,</p>\n\n<p>We have noted the urgency of your request.</p>",
      "<p>Hello,</p>\n\n<p>Your request looks time-sensitive, so we are sharing the most useful next steps first.</p>",
    ], variantKey);
  }
  if (sentiment.primary === "thankful") {
    return pickVariant([
      "<p>Hello,</p>\n\n<p>Thank you for your message. We are glad to assist you.</p>",
      "<p>Hello,</p>\n\n<p>Thanks for writing to us. We will help you with this.</p>",
    ], variantKey);
  }

  return pickVariant([
    "<p>Hello,</p>",
    "<p>Hi,</p>",
    "<p>Hello,</p>\n\n<p>We have reviewed your query.</p>",
  ], variantKey);
}

function buildClosing(language, sentiment, intent, variantKey) {
  if (["thanks", "wishes", "apology"].includes(intent.id)) {
    return "";
  }

  if (language === "hinglish") {
    if (sentiment.primary === "urgent") {
      return pickVariant([
        "<p>Requested details milte hi hum priority ke saath check karke update denge.</p>",
        "<p>Aap details send kar dijiye; hum isko priority par review karenge.</p>",
      ], variantKey);
    }
    return pickVariant([
      "<p>Details share karne ke baad team aapko exact status ya next step bata degi.</p>",
      "<p>Agar screenshot/reference available ho, to usse verification faster ho jayegi.</p>",
      "<p>Aap required details reply me bhej sakte hain; hum uske basis par process guide karenge.</p>",
    ], variantKey);
  }

  if (sentiment.primary === "urgent") {
    return pickVariant([
      "<p>Please share the requested details, and we will review your request on priority.</p>",
      "<p>Once we receive the details, we will check this on priority and update you.</p>",
    ], variantKey);
  }
  return pickVariant([
    "<p>Once you share the required details, the team can confirm the exact status or next step.</p>",
    "<p>If you have a screenshot or reference ID, please include it so verification can be faster.</p>",
    "<p>You can reply with the requested details, and we will guide you based on the records.</p>",
  ], variantKey);
}

function buildReplySubject(originalSubject, intent, language) {
  const cleanSubject = stringValue(originalSubject).trim();
  if (cleanSubject && /^re:/i.test(cleanSubject)) return cleanSubject;
  if (cleanSubject) return `Re: ${cleanSubject}`;

  const label = {
    greeting: "Support from InternovaTech",
    internship_training: "InternovaTech Internship and Training Details",
    registration_enrollment: "InternovaTech Registration Assistance",
    certificate: "InternovaTech Certificate Assistance",
    certificate_correction: "InternovaTech Certificate Correction Assistance",
    offer_letter: "InternovaTech Offer Letter Assistance",
    completion_letter: "InternovaTech Completion Letter Assistance",
    lor: "InternovaTech LOR Request Assistance",
    payment: "InternovaTech Payment Assistance",
    refund: "InternovaTech Refund Assistance",
    invoice_receipt: "InternovaTech Invoice and Receipt Assistance",
    account_login: "InternovaTech Account Assistance",
    password_otp: "InternovaTech OTP and Password Assistance",
    course_access: "InternovaTech Course Access Assistance",
    assignment_assessment: "InternovaTech Assignment and Assessment Assistance",
    project: "InternovaTech Project Assistance",
    technical_stack: "InternovaTech Technical Guidance",
    job_career: "InternovaTech Career Assistance",
    application_status: "InternovaTech Application Status Assistance",
    deadline_extension: "InternovaTech Extension Request Assistance",
    meeting_schedule: "InternovaTech Meeting Assistance",
    pricing_discount: "InternovaTech Pricing Assistance",
    business: "Business Inquiry with InternovaTech",
    complaint_bug: "InternovaTech Support Issue Assistance",
    feedback: "Feedback for InternovaTech",
    fallback: "InternovaTech Support Assistance",
  }[intent.id] || "InternovaTech Support Assistance";

  return language === "hinglish" ? `Re: ${label}` : `Re: ${label}`;
}

function createReplyObject(subject, message) {
  const reply = { subject, message };
  Object.defineProperty(reply, "toString", {
    value: () => message,
    enumerable: false,
  });
  Object.defineProperty(reply, "valueOf", {
    value: () => message,
    enumerable: false,
  });
  Object.defineProperty(reply, Symbol.toPrimitive, {
    value: () => message,
    enumerable: false,
  });
  return reply;
}

function buildGreetingReply({ language }) {
  if (language === "hinglish") {
    return [
      "Bilkul, hum aapki help kar sakte hain.",
      "Aap apni query ya requirement thodi detail me share kar dijiye. Jaise internship, certificate, payment, project, account access, job, ya technical issue se related ho, hum uske hisaab se next steps guide karenge.",
      "Agar aap pehle se registered hain, to registered email ID bhi mention kar dena helpful rahega.",
    ];
  }

  return [
    "We will be happy to help you.",
    "Please share your query or requirement in a little detail. You can ask about internships, training, certificates, offer letters, payments, projects, account access, career support, business inquiries, or technical issues.",
    "If you are already registered with us, sharing your registered email ID will help us locate your records faster.",
  ];
}

function buildThanksReply({ language }) {
  if (language === "hinglish") {
    return [
      "You're welcome. Humein khushi hai ki hum aapki help kar paaye.",
      "Agar aapko certificate, training, payment, project, dashboard, ya kisi bhi process me further assistance chahiye, aap yahi par details share kar sakte hain.",
      "Hum aapko clear next steps ke saath guide kar denge.",
    ];
  }
  return [
    "You are most welcome. We are glad we could help.",
    "If you need any further assistance with certificates, training, payments, projects, dashboard access, or any other process, you can share the details here.",
    "We will guide you with the next steps.",
  ];
}

function buildWhoAreYouReply({ language }) {
  if (language === "hinglish") {
    return [
      "Main InternovaTech ka support assistant hoon, jo email queries ko understand karke quick guidance provide karta hai.",
      "Main internship, training, certificate, offer letter, payment, refund, project, dashboard access, career, technical issue, aur business inquiry jaise topics par help kar sakta hoon.",
      "Aap apna concern detail me bata dijiye. Agar query account ya document se related hai, to registered email ID bhi share kar dijiye.",
    ];
  }
  return [
    "I am the InternovaTech support assistant, designed to understand email queries and provide quick, practical guidance.",
    "I can help with internships, training, certificates, offer letters, payments, refunds, projects, dashboard access, career questions, technical issues, and business inquiries.",
    "Please share your concern in detail. If your query is related to an account or document, include your registered email ID as well.",
  ];
}

function buildCompanyInfoReply({ language }) {
  if (language === "hinglish") {
    return [
      "InternovaTech practical training, internship programs, project support, software development, and technology services par kaam karta hai.",
      "Hum students aur professionals ko real-world skills build karne me help karte hain, including Full Stack Development, AI, Machine Learning, Data Analytics, Cloud, and modern web technologies.",
      `Aap official communication ke liye ${COMPANY.email} ya ${COMPANY.website} use kar sakte hain. Specific query ho to details share kar dijiye, hum uske hisaab se guide karenge.`,
    ];
  }
  return [
    "InternovaTech works across practical training, internship programs, project support, software development, and technology services.",
    "We help students and professionals build real-world skills in Full Stack Development, AI, Machine Learning, Data Analytics, Cloud, and modern web technologies.",
    `For official communication, you can use ${COMPANY.email} or visit ${COMPANY.website}. If you have a specific query, please share the details and we will guide you accordingly.`,
  ];
}

function buildInternshipReply({ language }) {
  if (language === "hinglish") {
    return [
      "InternovaTech me internship aur training programs practical learning par focused hote hain.",
      "<p>Common domains include:</p><ul><li>Full Stack Web Development</li><li>React, Node.js, Express, and MongoDB</li><li>Python, Java, C++, and SQL</li><li>Artificial Intelligence and Machine Learning</li><li>Data Analytics and Software Development</li></ul>",
      "Aap apna preferred domain, current qualification, duration preference, aur registered email/phone share kar dijiye. Uske basis par hum suitable program aur joining steps bata denge.",
    ];
  }
  return [
    "InternovaTech internship and training programs are focused on practical, project-based learning.",
    "<p>Common domains include:</p><ul><li>Full Stack Web Development</li><li>React, Node.js, Express, and MongoDB</li><li>Python, Java, C++, and SQL</li><li>Artificial Intelligence and Machine Learning</li><li>Data Analytics and Software Development</li></ul>",
    "Please share your preferred domain, current qualification, duration preference, and contact details. Based on that, we will guide you with the suitable program and joining steps.",
  ];
}

function buildRegistrationReply({ language }) {
  if (language === "hinglish") {
    return [
      "Registration/enrollment ke liye hum aapko step-by-step guide kar denge.",
      "Please apna full name, email ID, phone number, preferred domain, and preferred duration share kar dijiye. Agar aapne already form fill kiya hai, to registered email ID ya application reference bhi bhej dijiye.",
      "Details verify hone ke baad team aapko batch availability, fee/payment process, and onboarding instructions share karegi.",
    ];
  }
  return [
    "We can guide you through the registration and enrollment process step by step.",
    "Please share your full name, email ID, phone number, preferred domain, and preferred duration. If you have already filled out a form, include your registered email ID or application reference.",
    "After verification, the team will share batch availability, payment instructions, and onboarding details.",
  ];
}

function buildCertificateReply({ language, context }) {
  const followUp = context.isFollowUp;
  const generalInfo = isGeneralInfoQuery(context.currentText);
  const missing = containsAny(context.currentText, [
    "not received", "did not receive", "not get", "not got", "nahi mila",
    "nahin mila", "kab milega", "when will", "still waiting", "pending",
  ]);

  if (language === "hinglish") {
    if (generalInfo && !missing) {
      return [
        "InternovaTech certificate generally program completion and record verification ke baad issue hota hai.",
        "<p>Certificate ke liye usually yeh points check hote hain:</p><ul><li>Enrollment/registration record</li><li>Training or internship completion status</li><li>Assignment/project submission, agar applicable ho</li><li>Correct name, email, domain, and duration details</li></ul>",
        "Agar aap certificate status check karna chahte hain, to registered email ID, full name, domain, and batch/duration share kar dijiye. Team records match karke exact update de degi.",
      ];
    }

    return [
      followUp
        ? "Aapke certificate follow-up ko humne note kar liya hai."
        : missing
          ? "Aapka certificate not received concern noted hai. Iske liye hum records verify karenge."
          : "Certificate request ke liye hum aapki details verify karenge.",
      "<p>Please yeh details share kar dijiye:</p><ul><li>Registered email ID</li><li>Full name used during registration</li><li>Internship/training domain</li><li>Batch or duration</li><li>Payment or enrollment proof, agar available ho</li></ul>",
      "Verification ke baad certificate status confirm kiya jayega. Agar certificate already processed hai, team download/resend details share karegi; agar pending hai, expected timeline update ki jayegi.",
    ];
  }

  if (generalInfo && !missing) {
    return [
      "InternovaTech certificates are generally issued after program completion and record verification.",
      "<p>The team usually verifies:</p><ul><li>Enrollment or registration record</li><li>Training/internship completion status</li><li>Assignment or project submission, if applicable</li><li>Correct name, email, domain, and duration details</li></ul>",
      "If you want to check your certificate status, please share your registered email ID, full name, domain, and batch/duration. The team will match the records and confirm the exact update.",
    ];
  }

  return [
    followUp
      ? "We have noted your follow-up regarding the certificate."
      : missing
        ? "We have noted that you have not received your certificate yet."
        : "For certificate-related requests, we first verify your registration and completion details.",
    "<p>Please share the following details:</p><ul><li>Registered email ID</li><li>Full name used during registration</li><li>Internship or training domain</li><li>Batch or duration</li><li>Payment or enrollment proof, if available</li></ul>",
    "After verification, we will confirm the certificate status. If it has already been processed, the team will share the download or resend details; if it is pending, we will update you with the expected timeline.",
  ];
}

function buildCertificateCorrectionReply({ language }) {
  if (language === "hinglish") {
    return [
      "Certificate correction request receive ho gayi hai. Hum updated certificate issue karne se pehle records verify karenge.",
      "<p>Please yeh details bhej dijiye:</p><ul><li>Registered email ID</li><li>Current certificate copy or certificate ID</li><li>Incorrect detail</li><li>Correct detail exactly as it should appear</li><li>Valid proof, agar name/email/duration correction hai</li></ul>",
      "Verification ke baad correction request process hogi. Please correct spelling clearly mention karein taaki updated certificate me error repeat na ho.",
    ];
  }
  return [
    "We have received your certificate correction request. We will verify the records before issuing an updated certificate.",
    "<p>Please send:</p><ul><li>Registered email ID</li><li>Current certificate copy or certificate ID</li><li>Incorrect detail</li><li>Correct detail exactly as it should appear</li><li>Valid proof if the correction is for name, email, or duration</li></ul>",
    "Once verified, the correction request will be processed. Please mention the correct spelling clearly to avoid repeating the error on the updated certificate.",
  ];
}

function buildOfferLetterReply({ language }) {
  if (language === "hinglish") {
    return [
      "Offer letter ke liye hum aapki enrollment/application details verify karenge.",
      "Please registered email ID, full name, selected domain, application date, and payment/enrollment proof share kar dijiye agar available ho.",
      "Verification ke baad agar aap eligible/registered hain, team offer letter resend ya issue status update karegi.",
    ];
  }
  return [
    "For offer letter requests, we will verify your enrollment or application details.",
    "Please share your registered email ID, full name, selected domain, application date, and payment/enrollment proof if available.",
    "After verification, if you are eligible or registered, the team will resend the offer letter or update you on its issuing status.",
  ];
}

function buildCompletionLetterReply({ language }) {
  if (language === "hinglish") {
    return [
      "Completion letter request ke liye training/internship completion records verify kiye jayenge.",
      "Please registered email ID, full name, domain, batch duration, project/assignment completion status, and certificate ID agar available ho share kar dijiye.",
      "Records match hone ke baad team completion letter status ya required pending steps bata degi.",
    ];
  }
  return [
    "For a completion letter request, we need to verify your training or internship completion records.",
    "Please share your registered email ID, full name, domain, batch duration, project/assignment completion status, and certificate ID if available.",
    "Once the records match, the team will update you on the completion letter status or any pending steps required from your side.",
  ];
}

function buildLorReply({ language }) {
  if (language === "hinglish") {
    return [
      "LOR request ko hum review kar sakte hain, lekin approval performance, completion, conduct, and project quality ke basis par hota hai.",
      "Please apna registered email ID, internship domain, batch duration, completed project details, and reason for LOR share kar dijiye.",
      "Team eligibility verify karke aapko next steps ya additional requirement inform karegi.",
    ];
  }
  return [
    "We can review your LOR request, but approval depends on performance, completion status, conduct, and project quality.",
    "Please share your registered email ID, internship domain, batch duration, completed project details, and the reason you need the LOR.",
    "The team will verify eligibility and inform you of the next steps or any additional requirement.",
  ];
}

function buildPaymentReply({ language }) {
  if (language === "hinglish") {
    return [
      "Payment query ke liye hum transaction details verify karenge.",
      "<p>Please yeh details share karein:</p><ul><li>Registered email ID</li><li>Transaction ID / UPI reference number</li><li>Payment date and amount</li><li>Payment screenshot</li><li>Program/domain name</li></ul>",
      "Agar amount debit hua hai but dashboard/enrollment update nahi hua, to verification ke baad status update kar diya jayega.",
    ];
  }
  return [
    "For payment-related queries, we will verify the transaction details.",
    "<p>Please share:</p><ul><li>Registered email ID</li><li>Transaction ID or UPI reference number</li><li>Payment date and amount</li><li>Payment screenshot</li><li>Program or domain name</li></ul>",
    "If the amount was debited but your dashboard or enrollment has not been updated, we will update the status after verification.",
  ];
}

function buildRefundReply({ language }) {
  if (language === "hinglish") {
    return [
      "Refund request receive ho gayi hai. Refund eligibility company policy, program status, and payment verification ke basis par review hoti hai.",
      "Please registered email ID, transaction ID, payment screenshot, amount, payment date, and refund reason share kar dijiye.",
      "Team details verify karke eligibility, expected timeline, ya alternate resolution ke baare me update karegi.",
    ];
  }
  return [
    "We have received your refund request. Refund eligibility is reviewed based on company policy, program status, and payment verification.",
    "Please share your registered email ID, transaction ID, payment screenshot, amount, payment date, and reason for the refund request.",
    "The team will verify the details and update you regarding eligibility, expected timeline, or an alternate resolution.",
  ];
}

function buildInvoiceReply({ language }) {
  if (language === "hinglish") {
    return [
      "Invoice/receipt request ke liye payment records verify karna zaroori hai.",
      "Please registered email ID, full name, transaction ID, payment date, amount, and program/domain name share kar dijiye.",
      "Verification ke baad team receipt/invoice issue ya resend kar degi.",
    ];
  }
  return [
    "For invoice or receipt requests, we need to verify the payment records.",
    "Please share your registered email ID, full name, transaction ID, payment date, amount, and program/domain name.",
    "After verification, the team will issue or resend the receipt/invoice.",
  ];
}

function buildAccountReply({ language }) {
  if (language === "hinglish") {
    return [
      "Account ya login issue ke liye hum technical verification karenge.",
      "Please registered email ID, issue screenshot, device/browser details, and exact error message share kar dijiye.",
      "Aap meanwhile browser cache clear karke, incognito mode me try karke, aur stable internet connection par login retry kar sakte hain.",
    ];
  }
  return [
    "For account or login issues, we will perform technical verification.",
    "Please share your registered email ID, issue screenshot, device/browser details, and the exact error message shown on the screen.",
    "Meanwhile, you can try clearing your browser cache, using incognito mode, and retrying on a stable internet connection.",
  ];
}

function buildPasswordOtpReply({ language }) {
  if (language === "hinglish") {
    return [
      "Password reset, OTP, ya email verification issue ke liye hum aapki registered details check karenge.",
      "Please registered email ID, issue type, time of OTP request, and screenshot/error message share kar dijiye.",
      "Spam/junk folder bhi check kar lijiye. Agar OTP expire ho gaya hai, kuch time baad fresh OTP request karein.",
    ];
  }
  return [
    "For password reset, OTP, or email verification issues, we will check your registered details.",
    "Please share your registered email ID, issue type, time of OTP request, and screenshot/error message.",
    "Please also check your spam/junk folder. If the OTP has expired, request a fresh OTP after a short gap.",
  ];
}

function buildCourseAccessReply({ language }) {
  if (language === "hinglish") {
    return [
      "Course/dashboard access issue ko resolve karne ke liye enrollment and payment status verify karna hoga.",
      "Please registered email ID, selected program/domain, payment proof, and screenshot of dashboard issue share kar dijiye.",
      "Verification ke baad agar access pending hai, team activate/update karegi; agar technical issue hai, support team troubleshoot karegi.",
    ];
  }
  return [
    "To resolve course or dashboard access issues, we need to verify your enrollment and payment status.",
    "Please share your registered email ID, selected program/domain, payment proof, and a screenshot of the dashboard issue.",
    "After verification, if access is pending, the team will activate or update it; if it is a technical issue, the support team will troubleshoot it.",
  ];
}

function buildAssignmentReply({ language }) {
  if (language === "hinglish") {
    return [
      "Assignment, assessment, attendance, exam, ya result related query receive ho gayi hai.",
      "Please registered email ID, batch/domain, assignment or exam name, submission date, and screenshot/proof share kar dijiye.",
      "Team records verify karke pending status, correction, deadline, or result update ke next steps bata degi.",
    ];
  }
  return [
    "We have received your query related to assignment, assessment, attendance, exam, or result.",
    "Please share your registered email ID, batch/domain, assignment or exam name, submission date, and screenshot/proof.",
    "The team will verify the records and guide you regarding pending status, correction, deadline, or result update.",
  ];
}

function buildProjectReply({ language }) {
  if (language === "hinglish") {
    return [
      "Project, report, abstract, documentation, source code, ya GitHub related query ke liye hum aapko proper guidance denge.",
      "Please project title, technology stack, required deliverable, deadline, and current progress share kar dijiye.",
      "Agar aap InternovaTech program participant hain, to registered email ID and batch/domain bhi mention karein taaki team correct records ke saath assist kar sake.",
    ];
  }
  return [
    "For project, report, abstract, documentation, source code, or GitHub-related queries, we can guide you with the right next steps.",
    "Please share the project title, technology stack, required deliverable, deadline, and your current progress.",
    "If you are an InternovaTech program participant, include your registered email ID and batch/domain so the team can assist with the correct records.",
  ];
}

function buildTechnicalStackReply({ language }) {
  if (language === "hinglish") {
    return [
      "Aapki technical query receive ho gayi hai. InternovaTech web, app, backend, database, AI/ML, cloud, hosting, deployment, and SEO related guidance provide kar sakta hai.",
      "Please exact technology, problem statement, error screenshot/logs, expected output, and current implementation details share kar dijiye.",
      "Agar yeh project/internship task ka part hai, to project title and registered email ID bhi mention karein.",
    ];
  }
  return [
    "We have received your technical query. InternovaTech can help with web, app, backend, database, AI/ML, cloud, hosting, deployment, and SEO-related guidance.",
    "Please share the exact technology, problem statement, error screenshot/logs, expected output, and current implementation details.",
    "If this is part of a project or internship task, also mention the project title and registered email ID.",
  ];
}

function buildCareerReply({ language }) {
  if (language === "hinglish") {
    return [
      "Career, resume, job, placement, ya interview related query receive ho gayi hai.",
      "Please updated resume/CV, preferred role, skills, experience level, location preference, and portfolio/GitHub link share kar dijiye.",
      "Team profile review karke suitable guidance, improvement suggestions, ya available opportunity ke next steps bata degi.",
    ];
  }
  return [
    "We have received your query regarding career, resume, job, placement, or interview support.",
    "Please share your updated resume/CV, preferred role, skills, experience level, location preference, and portfolio/GitHub link.",
    "The team will review your profile and guide you with suitable suggestions, improvement points, or available opportunity next steps.",
  ];
}

function buildApplicationStatusReply({ language }) {
  if (language === "hinglish") {
    return [
      "Application/internship status check karne ke liye humein aapki application details verify karni hongi.",
      "Please registered email ID, full name, applied domain, application date, and any reference/application ID share kar dijiye.",
      "Verification ke baad team selected, pending, waiting list, rejected, ya additional requirement status clearly update karegi.",
    ];
  }
  return [
    "To check your application or internship status, we need to verify your application details.",
    "Please share your registered email ID, full name, applied domain, application date, and any reference/application ID.",
    "After verification, the team will clearly update you whether the status is selected, pending, waiting list, rejected, or requires additional information.",
  ];
}

function buildExtensionReply({ language }) {
  if (language === "hinglish") {
    return [
      "Deadline/duration extension request receive ho gayi hai. Approval reason, program rules, and current progress ke basis par review hota hai.",
      "Please registered email ID, domain/batch, current deadline, requested new deadline, reason for extension, and progress proof share kar dijiye.",
      "Team review ke baad approval, revised deadline, ya alternate instruction provide karegi.",
    ];
  }
  return [
    "We have received your deadline or duration extension request. Approval is reviewed based on reason, program rules, and current progress.",
    "Please share your registered email ID, domain/batch, current deadline, requested new deadline, reason for extension, and proof of progress.",
    "After review, the team will provide approval, a revised deadline, or alternate instructions.",
  ];
}

function buildMeetingReply({ language }) {
  if (language === "hinglish") {
    return [
      "Meeting/call schedule karne ke liye please purpose and preferred timing share kar dijiye.",
      "Please apna name, email, phone number, topic, preferred date/time slots, and meeting mode mention karein.",
      "Team availability check karke confirmation ya alternate slot share karegi.",
    ];
  }
  return [
    "To schedule a meeting or call, please share the purpose and your preferred timing.",
    "Please mention your name, email, phone number, topic, preferred date/time slots, and meeting mode.",
    "The team will check availability and share a confirmation or alternate slot.",
  ];
}

function buildPricingReply({ language }) {
  if (language === "hinglish") {
    return [
      "Pricing/fee/discount query ke liye exact program ya service identify karna zaroori hai.",
      "Please domain/program name, duration, student/professional status, and any coupon/scholarship reference share kar dijiye.",
      "Team current fee structure, available offers, and payment process ke details share karegi.",
    ];
  }
  return [
    "For pricing, fee, or discount queries, we need to identify the exact program or service first.",
    "Please share the domain/program name, duration, whether you are a student or professional, and any coupon/scholarship reference if available.",
    "The team will share the current fee structure, available offers, and payment process details.",
  ];
}

function buildBusinessReply({ language }) {
  if (language === "hinglish") {
    return [
      "Business, partnership, collaboration, freelancing, ya custom software inquiry ke liye thank you.",
      "Please company/name, contact details, project/service requirement, timeline, budget range if available, and expected outcome share kar dijiye.",
      "Team requirement review karke discussion, proposal, quotation, ya next call ke liye connect karegi.",
    ];
  }
  return [
    "Thank you for your business, partnership, collaboration, freelancing, or custom software inquiry.",
    "Please share your company/name, contact details, project/service requirement, timeline, budget range if available, and expected outcome.",
    "The team will review the requirement and connect for discussion, proposal, quotation, or the next call.",
  ];
}

function buildComplaintReply({ language, sentiment }) {
  if (language === "hinglish") {
    return [
      sentiment.primary === "angry" || sentiment.primary === "frustrated"
        ? "Aapki concern ko hum seriously le rahe hain."
        : "Aapka issue/complaint receive ho gaya hai.",
      "Please registered email ID, issue summary, screenshots, transaction/application details if relevant, and exact time/date of issue share kar dijiye.",
      "Team case review karke root cause, next action, and expected resolution update karegi.",
    ];
  }
  return [
    sentiment.primary === "angry" || sentiment.primary === "frustrated"
      ? "We are taking your concern seriously."
      : "We have received your issue or complaint.",
    "Please share your registered email ID, issue summary, screenshots, transaction/application details if relevant, and the exact time/date of the issue.",
    "The team will review the case and update you with the root cause, next action, and expected resolution.",
  ];
}

function buildFeedbackReply({ language }) {
  if (language === "hinglish") {
    return [
      "Feedback aur suggestions share karne ke liye thank you. Hum user experience improve karne ke liye feedback ko seriously consider karte hain.",
      "Please suggestion ko thoda detail me share karein, including kis service/program/page/process se related hai.",
      "Team review karke useful improvements ke liye internally forward karegi.",
    ];
  }
  return [
    "Thank you for sharing your feedback or suggestion. We take feedback seriously to improve the user experience.",
    "Please share the suggestion in a little more detail, including the service, program, page, or process it relates to.",
    "The team will review it and forward useful improvements internally.",
  ];
}

function buildWishesReply({ language }) {
  if (language === "hinglish") {
    return [
      "Aapke kind wishes ke liye thank you.",
      "InternovaTech ki taraf se bhi aapko best wishes. Hum aapke learning aur career journey me support karne ke liye hamesha ready hain.",
      "Agar koi query ya requirement ho, to details share kar dijiye.",
    ];
  }
  return [
    "Thank you for your kind wishes.",
    "Best wishes from InternovaTech as well. We are always ready to support your learning and career journey.",
    "If you have any query or requirement, please share the details.",
  ];
}

function buildApologyReply({ language }) {
  if (language === "hinglish") {
    return [
      "No problem, aap tension na lein.",
      "Agar aap kisi correction, missed detail, delayed response, ya process issue ke baare me batana chahte hain, to updated details share kar dijiye.",
      "Hum latest information ke basis par aapko guide kar denge.",
    ];
  }
  return [
    "No problem, please do not worry.",
    "If you want to clarify a correction, missed detail, delayed response, or process issue, please share the updated information.",
    "We will guide you based on the latest details.",
  ];
}

function buildCasualReply({ language }) {
  if (language === "hinglish") {
    return [
      "Main theek hoon, thank you. Aap bataiye, main aapki kaise help kar sakta hoon?",
      "Aap internship, certificate, payment, project, account, career, ya business requirement se related query share kar sakte hain.",
      "Agar aap confused hain, bas apni situation short me bata dijiye. Main next steps simple way me explain kar dunga.",
    ];
  }
  return [
    "I am doing well, thank you. How can I help you today?",
    "You can ask about internships, certificates, payments, projects, account access, career support, or business requirements.",
    "If you are confused, just share your situation briefly and I will explain the next steps in a simple way.",
  ];
}

function buildFallbackReply({ language, context }) {
  const hasHistory = context.history.length > 0;
  if (language === "hinglish") {
    return [
      hasHistory
        ? "Aapka follow-up message receive ho gaya hai, lekin exact requirement clear karne ke liye thodi aur information chahiye."
        : "Aapka message receive ho gaya hai. Hum aapki query ko understand karke assist karna chahte hain.",
      "Please apni request ko thoda detail me share karein, jaise yeh internship, certificate, payment, project, account, technical issue, career, ya business inquiry se related hai.",
      "Agar available ho, to registered email ID, screenshot, transaction/application reference, ya relevant document bhi mention kar dijiye.",
    ];
  }
  return [
    hasHistory
      ? "We have received your follow-up message, but we need a little more information to understand the exact requirement."
      : "We have received your message and would like to assist you properly.",
    "Please share your request in a little more detail, such as whether it is related to internship, certificate, payment, project, account access, technical issue, career, or business inquiry.",
    "If available, include your registered email ID, screenshot, transaction/application reference, or any relevant document details.",
  ];
}

function escapeHtml(value = "") {
  return stringValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stringValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && value.message) return stringValue(value.message);
  return String(value);
}

module.exports = generateReply;
module.exports.generateReply = generateReply;
