let GLOBAL_DATA = null;
let CHART_INSTANCES = {};

// !!! ВСТАВТЕ СЮДИ АКТУАЛЬНУ АДРЕСУ NGROK !!!
const SERVER_URL = "https://supercrowned-emmett-superserious.ngrok-free.dev/";

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setInterval(fetchData, 1800000); // Оновлення кожні 30 хв
});

async function fetchData() {
    try {
        // Звертаємося до нового ендпоінту
        const response = await fetch(`${SERVER_URL}/api/energy_analytics_new_data?t=${new Date().getTime()}`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        const data = await response.json();
        GLOBAL_DATA = data;
        document.getElementById('lastUpdatedTime').innerText = data.lastUpdated;
        initMonthSelector(data);
    } catch (err) {
        console.error("Сервер недоступний за новим ендпоінтом");
        document.getElementById('lastUpdatedTime').innerText = "Помилка зв'язку";
    }
}

// Решта функцій (initMonthSelector, updateDashboard, renderChart) залишаються без змін
function initMonthSelector(data) {
    const select = document.getElementById('monthSelect');
    const allDates = new Set();
    data.stations.forEach(st => st.full_history.forEach(day => day.date && allDates.add(day.date.substring(0, 7))));
    const sortedMonths = Array.from(allDates).sort().reverse();
    select.innerHTML = '';
    sortedMonths.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.innerText = new Date(m + '-01').toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
        select.appendChild(opt);
    });
    select.onchange = (e) => updateDashboard(e.target.value);
    if (sortedMonths.length > 0) updateDashboard(sortedMonths[0]);
}

function updateDashboard(monthKey) {
    const grid = document.getElementById('dashboardGrid');
    grid.innerHTML = '';
    let totalProfit = 0, best = { name: '-', val: -Infinity };
    GLOBAL_DATA.stations.forEach((st, idx) => {
        const monthData = st.full_history.filter(d => d.date.startsWith(monthKey));
        let profit = 0; const labels = [], values = [];
        monthData.forEach(d => {
            const diff = d.income - d.expense;
            profit += diff; labels.push(d.date.substring(8, 10)); values.push(diff);
        });
        totalProfit += profit;
        if (profit > best.val) best = { name: st.name, val: profit };
        const card = document.createElement('div');
        card.className = 'station-card';
        card.innerHTML = `<div class="card-header"><span>${st.name}</span><span class="station-profit" style="color: ${profit >= 0 ? '#27ae60' : '#e74c3c'}">${(profit/1000).toFixed(1)} тис.</span></div><div class="chart-wrapper"><canvas id="c-${idx}"></canvas></div>`;
        grid.appendChild(card);
        renderChart(`c-${idx}`, labels, values);
    });
    document.getElementById('totalProfit').innerText = (totalProfit / 1000000).toFixed(4);
    document.getElementById('bestStation').innerText = best.name;
}

function renderChart(id, labels, data) {
    const ctx = document.getElementById(id).getContext('2d');
    if (CHART_INSTANCES[id]) CHART_INSTANCES[id].destroy();
    CHART_INSTANCES[id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data.map(v => v / 1000),
                borderColor: '#E67E22',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: { target: 'origin', above: 'rgba(39, 174, 96, 0.1)', below: 'rgba(231, 76, 60, 0.1)' }
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: true, grid: { display: false } }, y: { display: false } } }
    });
}