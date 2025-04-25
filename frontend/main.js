// Nouvelle structure de main.js avec 4 graphiques distincts :
// - Ligne live
// - Ligne 5s
// - Barres live
// - Barres 5s

let raceRunning = false;
let chartLive, chart5s;
let barChartLive, barChart5s;
let tickCount = 0;

let stats = {};
let latencyBuffer = { grpc: [], ws: [] };
let last5sStats = { grpc: null, ws: null };

function resetSimulation() {
  raceRunning = false;
  stats = {};
  latencyBuffer = { grpc: [], ws: [] };
  last5sStats = { grpc: null, ws: null };
  tickCount = 0;

  document.getElementById("sharedZone").innerHTML = "";
  document.getElementById("grpc-table").innerHTML = "";
  document.getElementById("ws-table").innerHTML = "";

  [chartLive, chart5s, barChartLive, barChart5s].forEach(c => c && c.destroy());
  chartLive = createLineChart("line-live", "Latence Live");
  chart5s = createLineChart("line-5s", "Latence Moyenne (5s)");
  barChartLive = createBarChart("bar-live");
  barChart5s = createBarChart("bar-5s");
}

function createOrMove(id, zone, x, y, symbol) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = 'car';
    el.textContent = symbol;
    zone.appendChild(el);
  }
  el.style.left = x + 'px';
  el.style.top = y + 'px';
}

function updateStats(car, timestamp) {
  const now = Date.now();
  if (!stats[car]) {
    stats[car] = {
      latencies: [],
      last: 0,
      count: 0,
      perSecond: 0,
      lastSecondTimestamp: 0
    };
  }
  const s = stats[car];
  const latency = now - timestamp;
  s.last = latency;
  s.latencies.push(latency);
  s.count++;

  const proto = car.startsWith("grpc") ? "grpc" : "ws";
  latencyBuffer[proto].push(latency);

  const currentSecond = Math.floor(now / 1000);
  s.perSecond = (s.lastSecondTimestamp !== currentSecond) ? 1 : s.perSecond + 1;
  s.lastSecondTimestamp = currentSecond;
}

function createLineChart(id, labelText) {
  const ctx = document.getElementById(id).getContext("2d");
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "gRPC", data: [], borderColor: "red", tension: 0.3, fill: false },
        { label: "WebSocket", data: [], borderColor: "blue", tension: 0.3, fill: false }
      ]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: { legend: { display: true }, title: { display: true, text: labelText } },
      scales: {
        y: { beginAtZero: true },
        x: { ticks: { autoSkip: true, maxTicksLimit: 10 } }
      }
    }
  });
}

function createBarChart(id) {
  const ctx = document.getElementById(id).getContext("2d");
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["gRPC", "WebSocket"],
      datasets: [{ label: "Latence moyenne (ms)", data: [0, 0], backgroundColor: ["green", "blue"] }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      animation: false,
      scales: { x: { beginAtZero: true } },
      plugins: { legend: { display: false } }
    }
  });
}

function statsAverageFor(protocol) {
  const entries = Object.entries(stats).filter(([id]) => id.startsWith(protocol));
  if (entries.length === 0) return null;
  let total = { last: 0, avg: 0, min: Infinity, max: -Infinity, perSecond: 0, count: 0 };
  for (const [_, s] of entries) {
    const avg = s.latencies.reduce((a, b) => a + b, 0) / s.latencies.length;
    const min = Math.min(...s.latencies);
    const max = Math.max(...s.latencies);
    total.last += s.last;
    total.avg += avg;
    total.min = Math.min(total.min, min);
    total.max = Math.max(total.max, max);
    total.perSecond += s.perSecond;
    total.count += s.count;
  }
  const n = entries.length;
  return { last: total.last / n, avg: total.avg / n, min: total.min, max: total.max, perSecond: total.perSecond / n, count: total.count };
}

function renderStatsAverage(protocol) {
  const snapshot = statsAverageFor(protocol);
  if (!snapshot) return;

  const html = `
    <tr class="bg-zinc-800">
      <td>${protocol.toUpperCase()}</td>
      <td>${snapshot.last.toFixed(1)} ms</td>
      <td>${snapshot.avg.toFixed(1)} ms</td>
      <td>${snapshot.min.toFixed(1)} ms</td>
      <td>${snapshot.max.toFixed(1)} ms</td>
      <td>${snapshot.perSecond.toFixed(1)}</td>
      <td>${snapshot.count}</td>
    </tr>
    <tr class="bg-zinc-700 text-xs text-gray-300 font-semibold border-t border-zinc-600">
      <td colspan="7" class="text-center">⏱ Moyenne sur les 5 dernières secondes</td>
    </tr>
    <tr class="bg-zinc-800">
      <td>${protocol.toUpperCase()} (5s)</td>
      <td>${(last5sStats[protocol]?.last || 0).toFixed(1)} ms</td>
      <td>${(last5sStats[protocol]?.avg || 0).toFixed(1)} ms</td>
      <td>${(last5sStats[protocol]?.min || 0).toFixed(1)} ms</td>
      <td>${(last5sStats[protocol]?.max || 0).toFixed(1)} ms</td>
      <td>${(last5sStats[protocol]?.perSecond || 0).toFixed(1)}</td>
      <td>${last5sStats[protocol]?.count || 0}</td>
    </tr>`;

  document.getElementById(protocol + "-table").innerHTML = html;
}

function start() {
  if (raceRunning) return;
  raceRunning = true;
  tickCount = 0;

  const humans = +document.getElementById('humans').value;
  const interval = +document.getElementById('interval').value;

  fetch('http://localhost:50051/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ humans, interval }) });
  fetch('http://localhost:3001/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ humans, interval }) });

  const sharedZone = document.getElementById('sharedZone');
  chartLive = createLineChart("line-live", "Latence Live");
  chart5s = createLineChart("line-5s", "Latence Moyenne (5s)");
  barChartLive = createBarChart("bar-live");
  barChart5s = createBarChart("bar-5s");

  const evt = new EventSource('http://localhost:50051/stream');
  evt.onmessage = e => {
    const d = JSON.parse(e.data);
    createOrMove(d.id, sharedZone, d.x, d.y, '🚗');
    updateStats(d.id, d.timestamp);
  };

  const ws = new WebSocket('ws://localhost:3001');
  ws.onmessage = e => {
    const d = JSON.parse(e.data);
    createOrMove(d.id, sharedZone, d.x, d.y, '🚙');
    updateStats(d.id, d.timestamp);
  };

  setInterval(() => {
    ["grpc", "ws"].forEach((proto, i) => {
      const values = latencyBuffer[proto];
      if (!values.length) return;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const label = `${(tickCount * interval).toFixed(0)}ms`;

      if (!chartLive.data.labels.includes(label)) chartLive.data.labels.push(label);
      if (!chart5s.data.labels.includes(label)) chart5s.data.labels.push(label);

      chartLive.data.datasets[i].data.push(+avg.toFixed(2));
      if (chartLive.data.datasets[i].data.length > 20) chartLive.data.datasets[i].data.shift();

      latencyBuffer[proto] = [];
      renderStatsAverage(proto);
    });
    chartLive.update();

    barChartLive.data.datasets[0].data = [chartLive.data.datasets[0].data.at(-1) || 0, chartLive.data.datasets[1].data.at(-1) || 0];
    barChartLive.update();
    tickCount++;
  }, interval);

  setInterval(() => {
    ["grpc", "ws"].forEach((proto, i) => {
      const snap = statsAverageFor(proto);
      if (snap) last5sStats[proto] = snap;

      const label = `${tickCount * interval}ms`;
      if (!chart5s.data.labels.includes(label)) chart5s.data.labels.push(label);
      chart5s.data.datasets[i].data.push(last5sStats[proto].avg.toFixed(2));
      if (chart5s.data.datasets[i].data.length > 20) chart5s.data.datasets[i].data.shift();
    });

    chart5s.update();
    barChart5s.data.datasets[0].data = [
      last5sStats.grpc ? last5sStats.grpc.avg.toFixed(2) : 0,
      last5sStats.ws ? last5sStats.ws.avg.toFixed(2) : 0
    ];
    barChart5s.update();
  }, 5000);
}

window.start = start;
window.resetSimulation = resetSimulation;