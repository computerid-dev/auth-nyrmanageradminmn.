const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const HIDDEN = new Set(["server.js", "env-setup.txt", "package.json", "README.txt", "firestore.rules"]);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json"
};

// Baca pasangan "Key:" dan "Value:" dari env-setup.txt untuk tes lokal.
function loadEnvSetup() {
  let text;
  try { text = fs.readFileSync(path.join(__dirname, "env-setup.txt"), "utf8"); } catch { return; }
  let key = null;
  for (const line of text.split(/\r?\n/)) {
    const k = line.match(/^Key:\s*(\S+)/);
    const v = line.match(/^Value:\s*(.*)$/);
    if (k) key = k[1];
    else if (v && key) {
      if (!(key in process.env)) process.env[key] = v[1].trim();
      key = null;
    }
  }
}
loadEnvSetup();

const proxy = require("./muchineko-auth-manager/proxy/proxy.js");

http.createServer((req, res) => {
  const pathname = decodeURIComponent(req.url.split("?")[0]);
  if (pathname === "/api/config") return proxy(req, res);

  let file = path.join(__dirname, pathname);
  if (!file.startsWith(__dirname) || HIDDEN.has(path.basename(file))) {
    res.statusCode = 404;
    return res.end("Not found");
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");

  fs.readFile(file, (err, data) => {
    if (err) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(data);
  });
}).listen(PORT, () => console.log(`Buka http://localhost:${PORT}`));
