const FORMS_ENDPOINT =
  "https://forms.guest.usercontent.microsoft/formapi/api/72f988bf-86f1-41af-91ab-2d7cd011db47/users/2df6ab41-6666-4c70-9f70-b7dca880707a/forms('v4j5cvGGr0GRqy180BHbR0Gr9i1mZnBMn3C33KiAcHpUMDFESVkxVkFLOFE4V01PQVpNRDBKUzJSSy4u')/responses";

const QUESTION_IDS = {
  title: "rc6aa145d26104ed9aeaceb8282cb2e85",
  name: "r43626855b1c047659ac22f785e94337e",
  role: "r1f30de950755410fbacf923a996c7136",
  company: "rd94cb67ee6d8442786f841c5237504b1",
  microsoftContact: "r226fa0d9e0bc45ca8df24ed1ce45234d",
  email: "ra38c0750cc884614aaa82652f6735540",
  mobile: "r861b15983d49494ea05ef93ef7988f3c",
  interests: "racb2ad772023460b8202c6da431a9e36",
  dietary: "r4223e65f66164108bf58ad06c257dc8c"
};

const requiredFields = [
  "title",
  "name",
  "role",
  "company",
  "microsoftContact",
  "email",
  "mobile",
  "interests"
];

const seenEmails = new Set();

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function json(status, body) {
  return {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}

module.exports = async function register(context, req) {
  if (req.method === "OPTIONS") {
    context.res = {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    };
    return;
  }

  const body = req.body || {};
  const registration = {
    title: clean(body.title),
    name: clean(body.name),
    role: clean(body.role),
    company: clean(body.company),
    microsoftContact: clean(body.microsoftContact),
    email: clean(body.email).toLowerCase(),
    mobile: clean(body.mobile),
    interests: clean(body.interests),
    dietary: clean(body.dietary),
    submittedAt: clean(body.submittedAt) || new Date().toISOString()
  };

  const missing = requiredFields.filter((field) => !registration[field]);
  if (missing.length > 0) {
    context.res = json(400, { error: "missing_required_fields", missing });
    return;
  }

  if (seenEmails.has(registration.email)) {
    context.res = json(409, { error: "already_registered" });
    return;
  }

  const answers = [
    { questionId: QUESTION_IDS.title, answer1: registration.title },
    { questionId: QUESTION_IDS.name, answer1: registration.name },
    { questionId: QUESTION_IDS.role, answer1: registration.role },
    { questionId: QUESTION_IDS.company, answer1: registration.company },
    { questionId: QUESTION_IDS.microsoftContact, answer1: registration.microsoftContact },
    { questionId: QUESTION_IDS.email, answer1: registration.email },
    { questionId: QUESTION_IDS.mobile, answer1: registration.mobile },
    { questionId: QUESTION_IDS.interests, answer1: registration.interests },
    { questionId: QUESTION_IDS.dietary, answer1: registration.dietary }
  ];

  const formsPayload = {
    startDate: new Date(Date.now() - 60_000).toISOString(),
    submitDate: registration.submittedAt,
    answers: JSON.stringify(answers)
  };

  const formsResponse = await fetch(FORMS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formsPayload)
  });

  if (!formsResponse.ok) {
    const text = await formsResponse.text();
    context.log.error(`Microsoft Forms submission failed: ${formsResponse.status} ${text}`);
    context.res = json(502, { error: "forms_submission_failed" });
    return;
  }

  seenEmails.add(registration.email);
  context.res = json(200, { ok: true });
};
