const REQUIRED_FIELDS = [
  "title",
  "name",
  "role",
  "company",
  "msft-contact",
  "email",
  "mobile",
  "interests"
];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = async function register(context, req) {
  const webhookUrl = process.env.REGISTRATION_WEBHOOK_URL;
  if (!webhookUrl) {
    context.log.error("REGISTRATION_WEBHOOK_URL app setting is not configured.");
    context.res = {
      status: 503,
      jsonBody: { error: "registration_not_configured" }
    };
    return;
  }

  const body = req.body || {};
  const missing = REQUIRED_FIELDS.filter((field) => !clean(body[field]));
  if (missing.length > 0 || !isValidEmail(clean(body.email))) {
    context.res = {
      status: 400,
      jsonBody: { error: "invalid_registration", missing }
    };
    return;
  }

  const submission = {
    title: clean(body.title),
    name: clean(body.name),
    role: clean(body.role),
    company: clean(body.company),
    primaryMicrosoftContact: clean(body["msft-contact"]),
    email: clean(body.email),
    mobile: clean(body.mobile),
    interests: clean(body.interests),
    dietaryRequirements: clean(body.dietary),
    submittedAt: clean(body.submittedAt) || new Date().toISOString(),
    page: "World Aviation Festival Executive Briefing"
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission)
  });

  if (!response.ok) {
    context.log.error(`Registration webhook failed with ${response.status}.`);
    context.res = {
      status: 502,
      jsonBody: { error: "registration_webhook_failed" }
    };
    return;
  }

  context.res = {
    status: 200,
    jsonBody: { ok: true }
  };
};
