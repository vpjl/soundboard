// Serveur local pour le contrôle à distance (2e appareil).
// Sert l'app statique (comme serve-iphone.js) ET relaie de petits messages
// JSON en WebSocket entre les appareils d'une même "room", sans dépendance
// npm (implémentation WebSocket minimale, RFC 6455, messages texte non
// fragmentés uniquement — largement suffisant pour des commandes de pads).
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const port = 5175;
const types = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
};

const WS_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function localIp() {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return "ADRESSE_IP_DU_MAC";
}

// ---- Serveur de fichiers statiques (repris de serve-iphone.js) ----
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

// ---- Relais WebSocket par "room" ----
// Chaque room est juste un Set de sockets ; le serveur ne fait que
// retransmettre le texte reçu aux autres membres de la même room, sans
// jamais interpréter ni stocker le contenu des messages.
const rooms = new Map();

function roomFor(code) {
  if (!rooms.has(code)) rooms.set(code, new Set());
  return rooms.get(code);
}

function encodeTextFrame(payload) {
  const data = Buffer.from(payload, "utf8");
  const len = data.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, data]);
}

function sendText(socket, payload) {
  try {
    socket.write(encodeTextFrame(payload));
  } catch {
    // Socket déjà fermée : rien à faire, le nettoyage se fait via l'event "close".
  }
}

function broadcast(code, sender, payload) {
  const peers = rooms.get(code);
  if (!peers) return;
  for (const socket of peers) {
    if (socket !== sender) sendText(socket, payload);
  }
}

function leaveRoom(code, socket) {
  const peers = rooms.get(code);
  if (!peers) return;
  peers.delete(socket);
  if (!peers.size) rooms.delete(code);
}

// Décode les frames WebSocket entrantes (toujours masquées côté client),
// avec un buffer accumulateur car un frame peut arriver en plusieurs
// morceaux TCP (ou plusieurs frames dans un seul morceau).
function attachFrameParser(socket, onMessage, onClose) {
  let buffer = Buffer.alloc(0);

  function tryParse() {
    for (;;) {
      if (buffer.length < 2) return;
      const firstByte = buffer[0];
      const secondByte = buffer[1];
      const opcode = firstByte & 0x0f;
      const masked = Boolean(secondByte & 0x80);
      let payloadLen = secondByte & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (buffer.length < offset + 2) return;
        payloadLen = buffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLen === 127) {
        if (buffer.length < offset + 8) return;
        payloadLen = Number(buffer.readBigUInt64BE(offset));
        offset += 8;
      }

      if (payloadLen > 1_000_000) {
        // Frame anormalement grosse pour ce relais (messages de commande minuscules) : on coupe.
        socket.destroy();
        return;
      }

      let maskKey = null;
      if (masked) {
        if (buffer.length < offset + 4) return;
        maskKey = buffer.subarray(offset, offset + 4);
        offset += 4;
      }

      if (buffer.length < offset + payloadLen) return; // frame incomplète : on attend la suite

      let payload = buffer.subarray(offset, offset + payloadLen);
      if (masked) {
        payload = Buffer.from(payload); // copie avant démasquage (subarray partage la mémoire du buffer)
        for (let i = 0; i < payload.length; i += 1) payload[i] ^= maskKey[i % 4];
      }

      buffer = buffer.subarray(offset + payloadLen);

      if (opcode === 0x8) {
        onClose();
        return;
      }
      if (opcode === 0x1) onMessage(payload.toString("utf8"));
      // ping(0x9)/pong(0xA)/binaire(0x2)/continuation(0x0) ignorés : ce relais
      // ne transporte que de petits messages texte non fragmentés.
    }
  }

  socket.on("data", (chunk) => {
    buffer = buffer.length ? Buffer.concat([buffer, chunk]) : chunk;
    tryParse();
  });
  socket.on("close", onClose);
  socket.on("error", onClose);
}

server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const room = (url.searchParams.get("room") || "default").trim().toUpperCase().slice(0, 12) || "default";

  const accept = crypto.createHash("sha1").update(key + WS_MAGIC).digest("base64");
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
    "Upgrade: websocket\r\n" +
    "Connection: Upgrade\r\n" +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );

  const peers = roomFor(room);
  peers.add(socket);
  let closed = false;
  const handleClose = () => {
    if (closed) return;
    closed = true;
    leaveRoom(room, socket);
  };

  attachFrameParser(socket, (message) => broadcast(room, socket, message), handleClose);
});

server.listen(port, "0.0.0.0", () => {
  const ip = localIp();
  console.log(`Contrôle à distance — ouvrir sur les deux appareils : http://${ip}:${port}`);
  console.log(`(relais WebSocket sur le même port, room dans les réglages de l'app)`);
});
