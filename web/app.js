/**
 * Energy Analytics - Frontend Logic
 * Функціонал: автоматичне завантаження JSON через ngrok (порт 5003)
 * та візуалізація даних за допомогою Chart.js.
 */

let GLOBAL_DATA = null;
let CHART_INSTANCES = {};

// !!! ВСТАВТЕ СЮДИ ВАШУ АКТУАЛЬНУ АДРЕСУ NGROK !!!
const SERVER_URL = "https://supercrowned-emmett-superserious.ngrok-free.dev/";

document.addEventListener('DOMContentLoaded', () => {
    // Перше завантаження при відкритті
    fetchData();

    // Автоматичне фонове оновлення даних кожні 30 хвилин (1800000 мс)
    // Це дозволяє сайту підтягнути оновлення, які сервер робить о 17:00
    setInterval(fetchData, 1800000);
});

/**
 * Головна функція отримання даних з віддаленого сервера
 */
async function fetchData() {
    console.log("⏳ Спроба отримати свіжі дані з сервера...");
    try {
        // Додаємо мітку часу ?t=, щоб браузер не кешував старий файл
        const response = await fetch(`${SERVER_URL}/data.json?t=${new Date().getTime()}`, {
            headers: {
                "ngrok-skip-browser-warning": "true" // ОБОВ'ЯЗКОВО: ігноруємо заставку ngrok
            }
        });

        if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);

        const data = await response.json();
        GLOBAL_DATA = data;

        // Оновлюємо текст із часом останнього оновлення в HTML
        const timeElem = document.getElementById('lastUpdatedTime');
        if (timeElem) {
            timeElem.innerText = data.lastUpdated || "--.--.---- --:--";
        }

        // Ініціалізуємо вибір місяця та малюємо графіки
        initMonthSelector(data);
        console.log("✅ Дані успішно завантажені та відображені");

    } catch (err) {
        console.error("❌ Помилка завантаження даних:", err);
        const timeElem = document.getElementById('lastUpdatedTime');
        if (timeElem) {
            timeElem.innerText = "Сервер недоступний";
        }
    }
}

/**
 * Створення списку місяців на основі наявних дат у файлі
 */
function initMonthSelector(data) {
    const select = document.getElementById('monthSelect');
    if (!select) return;

    const allDates = new Set();
    data.stations.forEach(st => {
        st.full_history.forEach(day => {
            if (day.date) {
                // Вирізаємо рік та місяць (YYYY-MM)
                allDates.add(day.date.substring(0, 7));
            }
        });
    });

    const sortedMonths = Array.from(allDates).sort().reverse();
    const currentSelection = select.value;

    select.innerHTML = '';

    if (sortedMonths.length === 0) {
        select.innerHTML = '<option>Дані відсутні</option>';
        return;
    }

    sortedMonths.forEach(monthKey => {
        const option = document.createElement('option');
        option.value = monthKey;

        // Форматуємо дату для відображення (наприклад, "Жовтень 2025")
        const dateObj = new Date(monthKey + '-01');
        const label = dateObj.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
        option.innerText = label.charAt(0).toUpperCase() + label.slice(1);

        select.appendChild(option);
    });

    // Якщо раніше вже було щось вибрано, намагаємось зберегти вибір
    if (currentSelection && sortedMonths.includes(currentSelection)) {
        select.value = currentSelection;
    } else {
        select.value = sortedMonths[0];
    }

    // Оновлюємо подію при зміні місяця
    select.onchange = (e) => updateDashboard(e.target.value);

    // Малюємо дашборд для вибраного місяця
    updateDashboard(select.value);
}

/**
 * Оновлення карток та графіків для конкретного місяця
 */
function updateDashboard(monthKey) {
    const grid = document.getElementById('dashboardGrid');
    if (!grid) return;
    grid.innerHTML = '';

    let totalProfit = 0;
    let bestStation = { name: '-', val: -Infinity };

    GLOBAL_DATA.stations.forEach((st, idx) => {
        // Фільтруємо історію тільки за вибраний місяць
        const monthData = st.full_history.filter(d => d.date.startsWith(monthKey));

        let profitSum = 0;
        const labels = [];
        const values = [];

        monthData.forEach(d => {
            const dayProfit = d.income - d.expense;
            profitSum += dayProfit;

            // Дані для графіка: день (DD) та прибуток
            labels.push(d.date.substring(8, 10));
            values.push(dayProfit);
        });

        totalProfit += profitSum;
        if (profitSum > bestStation.val) {
            bestStation = { name: st.name, val: profitSum };
        }

        // Рендеримо картку об'єкта
        const card = document.createElement('div');
        card.className = 'station-card';
        card.innerHTML = `
            <div class="card-header">
                <span>${st.name}</span>
                <span class="station-profit" style="color: ${profitSum >= 0 ? '#27ae60' : '#e74c3c'}">
                    ${(profitSum / 1000).toFixed(1)} тис. грн
                </span>
            </div>
            <div class="chart-wrapper">
                <canvas id="c-${idx}"></canvas>
            </div>
        `;
        grid.appendChild(card);

        // Малюємо графік у створеній картці
        renderChart(`c-${idx}`, labels, values);
    });

    // Оновлюємо підсумкові показники в шапці
    const totalElem = document.getElementById('totalProfit');
    const bestElem = document.getElementById('bestStation');

    if (totalElem) totalElem.innerText = (totalProfit / 1000000).toFixed(4);
    if (bestElem) bestElem.innerText = bestStation.name;
}

/**
 * Логіка малювання графіка ліній (Chart.js)
 */
function renderChart(id, labels, data) {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Якщо графік вже існував (при зміні місяця), видаляємо старий об'єкт
    if (CHART_INSTANCES[id]) {
        CHART_INSTANCES[id].destroy();
    }

    CHART_INSTANCES[id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data.map(v => v / 1000), // Переводимо в тисячі для читабельності
                borderColor: '#E67E22',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: {
                    target: 'origin',
                    above: 'rgba(39, 174, 96, 0.1)', // Зелений для прибутку
                    below: 'rgba(231, 76, 60, 0.1)'  // Червоний для збитків
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    intersect: false,
                    mode: 'index',
                    callbacks: {
                        label: (context) => `${context.raw.toFixed(1)} тис. грн`
                    }
                }
            },
            scales: {
                x: { display: true, grid: { display: false } },
                y: { display: false }
            }
        }
    });
}