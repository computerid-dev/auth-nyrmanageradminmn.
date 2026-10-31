const FIELDS = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "FIREBASE_AUTH_DOMAIN",
  projectId: "FIREBASE_PROJECT_ID",
  storageBucket: "FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
  appId: "FIREBASE_APP_ID"
};

module.exports = (req, res) => {
  const allowed = (process.env.ALLOWED_HOSTS || "localhost,127.0.0.1").split(",").map((h) => h.trim());
  const host = String(req.headers.host || "").split(":")[0];

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  if (!allowed.includes(host)) {
    res.statusCode = 403;
    return res.end(JSON.stringify({ error: "link tidak resmi" }));
  }

  const config = {};
  for (const [field, envName] of Object.entries(FIELDS)) {
    if (!process.env[envName]) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: `${envName} belum diset` }));
    }
    config[field] = process.env[envName];
  }
  res.end(JSON.stringify(config));
};
