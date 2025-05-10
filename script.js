const STORAGE_KEY = "stat-tracker";
const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  stats: {},
  actions: {},
  history: {}, // np. "2025-05-10": { "Siłownia": true }
  lastProcessedWeek: null
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  render();
}

function getWeekNumber(dateStr) {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - start) / 86400000) + 1) / 7);
}

function updateStatsIfNewWeek() {
  const currentWeek = getWeekNumber(today);
  if (data.lastProcessedWeek === currentWeek) return;

  const lastWeek = currentWeek - 1;
  for (const [actionName, config] of Object.entries(data.actions)) {
    const count = Object.entries(data.history)
      .filter(([date, record]) => getWeekNumber(date) === lastWeek && record[actionName])
      .length;

    const stat = config.stat;
    if (!data.stats[stat]) continue;

    if (count < config.min) {
      data.stats[stat] = Math.max(0, data.stats[stat] - 1);
    } else if (count >= config.target) {
      data.stats[stat] += 1;
    }
    // else: count >= min but < target → no change
  }

  data.lastProcessedWeek = currentWeek;
  save();
}


function toggleAction(date, actionName) {
  data.history[date] = data.history[date] || {};
  data.history[date][actionName] = !data.history[date][actionName];
  save();
}

function render() {
  const statContainer = document.getElementById("stats");
  statContainer.innerHTML = "<h2>📈 Statystyki</h2>";
  for (const [name, value] of Object.entries(data.stats)) {
    statContainer.innerHTML += `<p><strong>${name}</strong>: ${value} pkt</p>`;
  }

  const actionContainer = document.getElementById("actions");
  actionContainer.innerHTML = "<h2>✅ Dzienny tracker</h2>";
  for (const [actionName] of Object.entries(data.actions)) {
    const markedToday = data.history[today]?.[actionName];
    const markedYest = data.history[yesterday]?.[actionName];

    actionContainer.innerHTML += `
      <p><strong>${actionName}</strong></p>
      <button onclick="toggleAction('${today}','${actionName}')">
        Dziś: ${markedToday ? "✅" : "❌"}
      </button>
      <button onclick="toggleAction('${yesterday}','${actionName}')">
        Wczoraj: ${markedYest ? "✅" : "❌"}
      </button>
    `;
  }

  // Update select options for new actions
  const select = document.getElementById("action-stat");
  select.innerHTML = "";
  Object.keys(data.stats).forEach(stat => {
    const opt = document.createElement("option");
    opt.value = stat;
    opt.textContent = stat;
    select.appendChild(opt);
  });
}

function addStat() {
  const name = document.getElementById("new-stat").value.trim();
  if (!name || data.stats[name]) return alert("Nieprawidłowa lub istniejąca statystyka.");
  data.stats[name] = 10;
  save();
}

function addAction() {
  const name = document.getElementById("action-name").value.trim();
  const stat = document.getElementById("action-stat").value;
  const min = parseInt(document.getElementById("action-min").value);
  const target = parseInt(document.getElementById("action-target").value);

  if (!name || !stat || isNaN(min) || isNaN(target) || data.actions[name]) {
    return alert("Wprowadź poprawne dane.");
  }

  data.actions[name] = { stat, min, target };
  save();
}

function simulateWeek() {
  data.lastProcessedWeek = null;
  updateStatsIfNewWeek();
}

updateStatsIfNewWeek();
render();

