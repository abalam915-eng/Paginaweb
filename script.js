let histogramChart, polygonChart, ogiveChart, paretoChart;

function customRound(val) {
    return (val - Math.floor(val) > 0.5) ? Math.ceil(val) : Math.floor(val);
}

function generateRandomData() {
    const rand = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
    document.getElementById('dataInput').value = rand.join(', ');
    processData();
}

function generateRandomSets() {
    const genSet = () => Array.from({ length: 5 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * 20)).join(', ');
    document.getElementById('setA').value = genSet();
    document.getElementById('setB').value = genSet();
    calculateSets();
}

function generateRandomComb() {
    const n = 5 + Math.floor(Math.random() * 11); // 5 to 15
    const r = 1 + Math.floor(Math.random() * n);
    document.getElementById('combN').value = n;
    document.getElementById('combR').value = r;
}

function renderStemLeaf(data) {
    const stems = {};
    data.forEach(num => {
        const s = Math.floor(num / 10);
        const l = Math.floor(num % 10);
        if (!stems[s]) stems[s] = [];
        stems[s].push(l);
    });

    let output = "Tallo | Hoja\n";
    output += "------|------\n";
    const sortedStems = Object.keys(stems).map(Number).sort((a, b) => a - b);

    if (sortedStems.length === 0) {
        output += "Sin datos";
    } else {
        sortedStems.forEach(s => {
            const leaves = stems[s].sort((a, b) => a - b).join(" ");
            output += `${s.toString().padStart(5, ' ')} | ${leaves}\n`;
        });
    }
    document.getElementById('stemLeaf').innerText = output;
}

function processData() {
    const input = document.getElementById('dataInput').value;
    if (!input) return;

    const data = input.split(',')
        .map(x => parseFloat(x.trim()))
        .filter(x => !isNaN(x))
        .sort((a, b) => a - b);

    if (data.length < 1) {
        alert("Favor de ingresar datos numéricos válidos.");
        return;
    }

    renderStats(data);
    const freq = calculateFrequency(data);
    renderTable(freq);
    renderCharts(freq);
    renderStemLeaf(data);
}

function renderStats(data) {
    const n = data.length;
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const min = data[0];
    const max = data[n - 1];
    const range = max - min;

    // Square Root method for k with custom rounding
    const k = customRound(Math.sqrt(n)) || 1;
    const amplitude = customRound(range / k) || 1;

    let median;
    if (n % 2 === 0) {
        median = (data[n / 2 - 1] + data[n / 2]) / 2;
    } else {
        median = data[Math.floor(n / 2)];
    }

    const counts = {};
    data.forEach(x => counts[x] = (counts[x] || 0) + 1);
    let maxFreq = 0;
    let modes = [];
    for (let key in counts) {
        if (counts[key] > maxFreq) {
            maxFreq = counts[key];
            modes = [key];
        } else if (counts[key] === maxFreq) {
            modes.push(key);
        }
    }
    const modeStr = (maxFreq > 1) ? modes.join(', ') : 'Ninguna';
    document.getElementById('stat-mean').innerText = mean.toFixed(2);
    document.getElementById('stat-median').innerText = median.toFixed(2);
    document.getElementById('stat-mode').innerText = modeStr;
    document.getElementById('stat-n').innerText = n;
    document.getElementById('stat-k-n').innerText = n;
    document.getElementById('stat-k').innerText = k;
    document.getElementById('stat-min').innerText = min;
    document.getElementById('stat-max').innerText = max;
    document.getElementById('stat-range').innerText = range;
    document.getElementById('stat-amp-formula').innerText = `${range} / ${k} = ${customRound(range / k)}`;
    document.getElementById('stat-amplitude').innerText = amplitude;
}

function calculateFrequency(data) {
    const n = data.length;
    const min = data[0];
    const max = data[n - 1];
    const range = max - min;

    // Square Root method for k with custom rounding
    const k = customRound(Math.sqrt(n)) || 1;

    // Strictly automatic amplitude
    const amplitude = customRound(range / k) || 1;

    const tempIntervals = [];
    let currentLower = min;
    let totalFi = 0;

    // First pass: calculate fi and totalFi
    for (let i = 0; i < k; i++) {
        const lower = currentLower;
        const upper = lower + amplitude;
        const binData = data.filter(v => v >= lower && v <= upper);
        const fi = binData.length;
        totalFi += fi;

        tempIntervals.push({ lower, upper, fi });
        currentLower = upper + 1;
    }

    // Second pass: calculate fr and accumulated Fi/Fr
    const intervals = [];
    let cumulative = 0;
    tempIntervals.forEach(item => {
        cumulative += item.fi;
        const midpoint = (item.lower + item.upper) / 2;
        intervals.push({
            label: `${item.lower}-${item.upper}`,
            midpoint: midpoint,
            fi: item.fi,
            fr: (item.fi * 100) / totalFi,
            Fi: cumulative,
            Fr: (cumulative * 100) / totalFi
        });
    });

    return intervals;
}

function renderTable(freqTable) {
    const tbody = document.getElementById('frequency-body');
    tbody.innerHTML = '';
    freqTable.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.label}</td>
            <td>${row.midpoint.toFixed(2)}</td>
            <td>${row.fi}</td>
            <td>${row.fr.toFixed(2)}%</td>
            <td>${row.Fi}</td>
            <td>${row.Fr.toFixed(2)}%</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCharts(freqTable) {
    const labels = freqTable.map(r => r.label);
    const dataFi = freqTable.map(r => r.fi);
    const dataFiCum = freqTable.map(r => r.Fi);

    // Histogram
    if (histogramChart) histogramChart.destroy();
    const ctxH = document.getElementById('histogramChart').getContext('2d');
    histogramChart = new Chart(ctxH, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frecuencia Absoluta (fi)',
                data: dataFi,
                backgroundColor: 'rgba(67, 97, 238, 0.5)',
                borderColor: '#4361ee',
                borderWidth: 1,
                barPercentage: 1,
                categoryPercentage: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Intervalos' } },
                y: { beginAtZero: true }
            }
        }
    });

    // Frequency Polygon
    if (polygonChart) polygonChart.destroy();
    const ctxPoly = document.getElementById('polygonChart').getContext('2d');
    polygonChart = new Chart(ctxPoly, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Polígono de Frecuencias',
                data: dataFi,
                borderColor: '#f72585',
                backgroundColor: 'rgba(247, 37, 133, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Intervalos' } },
                y: { beginAtZero: true }
            }
        }
    });

    // Ogive
    if (ogiveChart) ogiveChart.destroy();
    const ctxO = document.getElementById('ogiveChart').getContext('2d');
    ogiveChart = new Chart(ctxO, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frecuencia Acumulada (Fi)',
                data: dataFiCum,
                borderColor: '#4cc9f0',
                backgroundColor: 'rgba(76, 201, 240, 0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Intervalos' } }
            }
        }
    });

    // Pareto
    const paretoData = [...freqTable].sort((a, b) => b.fi - a.fi);
    const pLabels = paretoData.map(r => r.label);
    const pFi = paretoData.map(r => r.fi);
    const total = pFi.reduce((a, b) => a + b, 0);
    let currentCum = 0;
    const pCumPerc = pFi.map(v => {
        currentCum += v;
        return (currentCum / total) * 100;
    });

    if (paretoChart) paretoChart.destroy();
    const ctxP = document.getElementById('paretoChart').getContext('2d');
    paretoChart = new Chart(ctxP, {
        data: {
            labels: pLabels,
            datasets: [{
                label: 'Frecuencia',
                type: 'bar',
                data: pFi,
                backgroundColor: '#4361ee',
                order: 1
            }, {
                label: '% Acumulado',
                type: 'line',
                data: pCumPerc,
                borderColor: '#f72585',
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7,
                yAxisID: 'y1',
                order: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Intervalos' } },
                y: { beginAtZero: true },
                y1: {
                    position: 'right',
                    max: 100,
                    beginAtZero: true,
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// Sets logic
function calculateSets() {
    const aRaw = document.getElementById('setA').value.split(',').map(x => x.trim()).filter(x => x !== "");
    const bRaw = document.getElementById('setB').value.split(',').map(x => x.trim()).filter(x => x !== "");
    const setA = new Set(aRaw);
    const setB = new Set(bRaw);

    const union = new Set([...setA, ...setB]);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const diffAB = new Set([...setA].filter(x => !setB.has(x)));
    const diffBA = new Set([...setB].filter(x => !setA.has(x)));

    document.getElementById('set-a-echo').innerText = `{ ${[...setA].join(', ')} }`;
    document.getElementById('set-b-echo').innerText = `{ ${[...setB].join(', ')} }`;
    document.getElementById('set-union').innerText = `{ ${[...union].join(', ')} }`;
    document.getElementById('set-inter').innerText = `{ ${[...intersection].join(', ')} }`;
    document.getElementById('set-diff-ab').innerText = `{ ${[...diffAB].join(', ')} }`;
    document.getElementById('set-diff-ba').innerText = `{ ${[...diffBA].join(', ')} }`;
}

// Probability logic
function calcSimpleProb() {
    const fav = parseFloat(document.getElementById('probFav').value);
    const tot = parseFloat(document.getElementById('probTotal').value);
    if (tot === 0 || isNaN(fav) || isNaN(tot)) return;
    const prob = fav / tot;
    const perc = (prob * 100).toFixed(2);
    document.getElementById('simpleProbRes').innerText = `P(A) = ${fav}/${tot} = ${prob.toFixed(4)} = ${perc}%`;
}

// Combinatorics logic
function factorial(n) {
    if (n < 0) return 0;
    if (n === 0) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

function calcFact() {
    const n = parseInt(document.getElementById('combN').value);
    if (isNaN(n) || n < 0) return;
    const res = factorial(n);
    const html = `
        <div class="formula-container">
            <span>${n}!</span>
            <span>=</span>
            <span>${res.toLocaleString()}</span>
        </div>
    `;
    document.getElementById('formulaDisplay').innerHTML = html;
    document.getElementById('combResult').innerText = res.toLocaleString();
}

function calcPerm() {
    const n = parseInt(document.getElementById('combN').value);
    const r = parseInt(document.getElementById('combR').value);
    if (isNaN(n) || isNaN(r) || n < r) return;
    const res = factorial(n) / factorial(n - r);
    const diff = n - r;

    const html = `
        <div class="formula-container">
            <span><sub>${n}</sub>P<sub>${r}</sub></span>
            <span>=</span>
            <div class="fraction">
                <div class="num">${n}!</div>
                <div class="den">(${n} - ${r})!</div>
            </div>
            <span>=</span>
            <div class="fraction">
                <div class="num">${n}!</div>
                <div class="den">${diff}!</div>
            </div>
            <span>=</span>
            <span class="text-accent fw-bold">${res.toLocaleString()}</span>
        </div>
    `;
    document.getElementById('formulaDisplay').innerHTML = html;
    document.getElementById('combResult').innerText = res.toLocaleString();
}

function calcComb() {
    const n = parseInt(document.getElementById('combN').value);
    const r = parseInt(document.getElementById('combR').value);
    if (isNaN(n) || isNaN(r) || n < r) return;
    const res = factorial(n) / (factorial(r) * factorial(n - r));
    const diff = n - r;

    const html = `
        <div class="formula-container">
            <span><sub>${n}</sub>C<sub>${r}</sub></span>
            <span>=</span>
            <div class="fraction">
                <div class="num">${n}!</div>
                <div class="den">${r}! * (${n} - ${r})!</div>
            </div>
            <span>=</span>
            <div class="fraction">
                <div class="num">${n}!</div>
                <div class="den">${r}! * ${diff}!</div>
            </div>
            <span>=</span>
            <span class="text-accent fw-bold">${res.toLocaleString()}</span>
        </div>
    `;
    document.getElementById('formulaDisplay').innerHTML = html;
    document.getElementById('combResult').innerText = res.toLocaleString();
}

// Tree Diagram
function generateRandomTreeData() {
    const examples = [
        ["Sol/Águila", "Sol/Águila"],
        ["Rojo/Verde/Azul", "S/M/L"],
        ["Fruta/Galleta", "Agua/Jugo/Leche"],
        ["Éxito/Falla", "Día/Noche"],
        ["1/2/3", "A/B"]
    ];
    const rand = examples[Math.floor(Math.random() * examples.length)];
    document.getElementById('treeEv1').value = rand[0];
    document.getElementById('treeEv2').value = rand[1];
    generateTree();
}

function generateTree() {
    const ev1 = document.getElementById('treeEv1').value || "A/B";
    const ev2 = document.getElementById('treeEv2').value || "X/Y";
    const parts1 = ev1.split('/').map(x => x.trim());
    const parts2 = ev2.split('/').map(x => x.trim());

    let diagram = "Inicio\n";
    parts1.forEach(p1 => {
        diagram += `├── ${p1}\n`;
        parts2.forEach((p2, idx) => {
            const prefix = (idx === parts2.length - 1) ? "│   └── " : "│   ├── ";
            diagram += `${prefix}${p2}\n`;
        });
    });
    document.getElementById('treeDiagram').innerText = diagram;
}

// Init with some data
window.onload = () => {
    document.getElementById('dataInput').value = "10, 12, 12, 15, 18, 20, 22, 22, 22, 25, 30, 32, 35, 35, 38, 40, 42, 45, 48, 50";
    processData();
};
