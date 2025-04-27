const express = require('express');
const cors = require('cors');
const app = express();
const port = 50051;

app.use(cors());
app.use(express.json());

let clients = [];
let interval = 1000;
let humanCount = 10;
let intervals = [];

app.post('/config', (req, res) => {
  humanCount = Number(req.body.humans || 10);
  interval = Number(req.body.interval || 1000); 
  console.log(`✅ gRPC: ${humanCount} humains / ${interval}ms`);

  intervals.forEach(clearInterval);
  intervals = [];

  for (let i = 0; i < humanCount; i++) {
    intervals[i] = setInterval(() => {
      const data = {
        id: 'grpc-' + i,
        x: Math.random() * 400,
        y: Math.random() * 400,
        timestamp: Date.now()
      };
      const msg = `data: ${JSON.stringify(data)}\n\n`;
      clients.forEach(res => res.write(msg));
    }, interval);
  }

  res.sendStatus(200);
});

app.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  res.flushHeaders();
  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(r => r !== res);
  });
});

app.listen(port, () => {
  console.log(`✅ gRPC SSE server running on http://localhost:${port}`);
});
