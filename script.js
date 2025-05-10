const STORAGE_KEY = "advanced-tracker-v1";
const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

const defaultData = {
  stats: {
    Siła: 10,
    Wytrzymałość: 10,
    Dyscyplina: 10,
  },
  actions: {
    "Siłownia": { stat: "Siła", min: 1, max: 3 },
    "Bieganie": { stat: "Wytrzymałość", min: 2, max: 4 },
    "Medytacja": { stat: "Dyscyplina", min: 2, max: 6 }
  },
  logs: {}, // np. "2025-05-07": ["Siłownia", "Medytacja"]
  lastEvaluationWeek: null
};

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData;

// Zapis i render
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  render();
}

// Pobierz numer tygodnia
function getWeekNumber(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// Zapisz aktywność
function toggleAction(date, action) {
  if (!data.logs[date]) data.logs[date] = [];
  const list = data.logs[date];
  const index = list.indexOf(action);
  if (index >= 0) list.splice(index, 1);
  else list.push(action);
  save();
}

// Podsumowanie tygodnia
function evaluateWeek() {
  const currentWeek = getWeekNumber(today);
  const weekToEval = currentWeek - 1;
  if (data.lastEvaluationWeek === weekToEval) {
    alert("Tydzień już oceniony");
    return;
  }

  const counts = {};
  for (const [date, actions] of Object.entries(data.logs)) {
    if (getWeekNumber(date) === weekToEval) {
      for (const action of actions) {
        counts[action] = (counts[action] || 0) + 1;
      }
    }
  }

  for (const [actionName, config] of Object.entries(data.actions)) {
    const count = counts[actionName] || 0;
    const stat = config.stat;
    if (count < config.min) {
      data.stats[stat] = Math.max(0, data.stats[stat] - 1);
    } else if (count > config.max) {
      data.stats[stat] += 1;
    }
  }

  data.lastEvaluationWeek = weekToEval;
  save();
  alert("Podsumowano tydzień.");
}

// Rysowanie interfejsu
function render() {
  // Statystyki
  const statsList = document.getElementById("stats-list");
  statsList.innerHTML = "";
  for (const [name, value] of Object.entries(data.stats)) {
    const li = document.createElement("li");
    li.textContent = `${name}: ${value} pkt`;
    statsList.appendChild(li);
    renderStatSelect();
  }

  // Akcje dziś / wczoraj
  renderActions("actions-today", today);
  renderActions("actions-yesterday", yesterday);

  // Historia tygodnia
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "";
  const todayObj = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(todayObj.getTime() - i * 86400000).toISOString().split("T")[0];
    const dayDiv = document.createElement("div");
    dayDiv.className = "history-day";
    dayDiv.textContent = `${date}: ${(data.logs[date] || []).join(", ") || "Brak"}`;
    historyDiv.appendChild(dayDiv);
  }
}

// Przycisk do zaznaczania
function renderActions(containerId, date) {
  const ul = document.getElementById(containerId);
  ul.innerHTML = "";
  for (const action of Object.keys(data.actions)) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    const isDone = (data.logs[date] || []).includes(action);
    btn.textContent = `${isDone ? "✅" : "⬜"} ${action}`;
    btn.onclick = () => toggleAction(date, action);
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

// Dodawanie statystyki
function addStat() {
  const name = document.getElementById("new-stat-name").value.trim();
  if (!name || data.stats[name]) return alert("Nieprawidłowa lub już istniejąca statystyka.");
  data.stats[name] = 10;
  save();
}

// Dodawanie akcji
function addAction() {
  const name = document.getElementById("new-action-name").value.trim();
  const stat = document.getElementById("new-action-stat").value;
  const min = parseInt(document.getElementById("new-action-min").value);
  const max = parseInt(document.getElementById("new-action-max").value);

  if (!name || !stat || isNaN(min) || isNaN(max) || data.actions[name]) {
    return alert("Wprowadź poprawne dane i unikalną nazwę akcji.");
  }

  data.actions[name] = { stat, min, max };
  save();
}

// Aktualizuj listę statystyk w <select>
function renderStatSelect() {
  const select = document.getElementById("new-action-stat");
  if (!select) return;
  select.innerHTML = "";
  for (const stat of Object.keys(data.stats)) {
    const option = document.createElement("option");
    option.value = stat;
    option.textContent = stat;
    select.appendChild(option);
  }
}


render();

