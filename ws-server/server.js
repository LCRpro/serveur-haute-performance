const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let humanCount = 10;
let interval = 1000;
let intervals = [];
let sockets = [];

// 👉 On démarre Express
const server = app.listen(port, () => {
  console.log(`✅ WebSocket server listening on ws://localhost:${port}`);
});

// 👉 On attache WebSocket au serveur Express
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  sockets.push(ws);
  ws.on('close', () => {
    sockets = sockets.filter(s => s !== ws);
  });
});

app.post('/config', (req, res) => {
  humanCount = Number(req.body.humans || 10);
  interval = Number(req.body.interval || 1000); // en ms directement
  console.log(`✅ WebSocket: ${humanCount} humains / ${interval}ms`);

  // Clear existing
  intervals.forEach(clearInterval);
  intervals = [];

  for (let i = 0; i < humanCount; i++) {
    intervals[i] = setInterval(() => {
      const data = {
        id: 'ws-' + i,
        x: Math.random() * 400,
        y: Math.random() * 400,
        timestamp: Date.now()
      };
      const msg = JSON.stringify(data);
      sockets.forEach(ws => ws.readyState === 1 && ws.send(msg));
    }, interval);
  }

  res.sendStatus(200);
});
