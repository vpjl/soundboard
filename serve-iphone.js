const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = process.cwd();
const port = 5174;
const types = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
};

function localIp() {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return "ADRESSE_IP_DU_MAC";
}

const server = http.createServer((req, res) => {
  let route = decodeURIComponent(req.url.split("?")[0]);
  if (route === "/") route = "/index.html";

  const file = path.normalize(path.join(root, route));
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Ouvrir sur iPhone : http://${localIp()}:${port}`);
});
