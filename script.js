// Variables globales para las instancias de los gráficos
let histogramChart, polygonChart, ogiveChart, paretoChart;

/**
 * Función de redondeo personalizada:
 * Redondea al alza si el decimal es mayor a 0.5, de lo contrario trunca.
 * @param {number} val - Valor a redondear.
 * @returns {number} Valor redondeado.
 */
function customRound(val) {
    return (val - Math.floor(val) > 0.5) ? Math.ceil(val) : Math.floor(val);
}

/**
 * Genera 20 números aleatorios entre 0 y 99 y los procesa.
 */
function generateRandomData() {
    const rand = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
    document.getElementById('dataInput').value = rand.join(', ');
    processData();
}

/**
 * Genera conjuntos A y B aleatorios para operaciones de conjuntos.
 */
function generateRandomSets() {
    const genSet = () => Array.from({ length: 5 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * 20)).join(', ');
    document.getElementById('setA').value = genSet();
    document.getElementById('setB').value = genSet();
    calculateSets();
}

/**
 * Genera valores n y r aleatorios para combinatoria.
 */
function generateRandomComb() {
    const n = 5 + Math.floor(Math.random() * 11); // Entre 5 y 15
    const r = 1 + Math.floor(Math.random() * n);
    document.getElementById('combN').value = n;
    document.getElementById('combR').value = r;
}

/**
 * Genera y muestra un diagrama de tallo y hoja basado en los datos.
 * @param {Array<number>} data - Conjunto de datos ordenados.
 */
function renderStemLeaf(data) {
    const stems = {};
    data.forEach(num => {
        const s = Math.floor(num / 10); // El tallo es la decena
        const l = Math.floor(num % 10); // La hoja es la unidad
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

/**
 * Punto de entrada principal para procesar los datos ingresados por el usuario.
 */
function processData() {
    const input = document.getElementById('dataInput').value;
    if (!input) return;

    // Limpieza y ordenamiento de datos
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

/**
 * Calcula y muestra estadísticas descriptivas básicas.
 * @param {Array<number>} data - Conjunto de datos.
 */
function renderStats(data) {
    const n = data.length;
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const min = data[0];
    const max = data[n - 1];
    const range = max - min;

    // Método de Raíz Cuadrada para k con redondeo personalizado
    const k = customRound(Math.sqrt(n)) || 1;
    const amplitude = customRound(range / k) || 1;

    // Cálculo de la Mediana
    let median;
    if (n % 2 === 0) {
        median = (data[n / 2 - 1] + data[n / 2]) / 2;
    } else {
        median = data[Math.floor(n / 2)];
    }

    // Cálculo de la Moda (puede ser bimodal o multimodal)
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

    // Actualización de la interfaz
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

/**
 * Genera los intervalos y calcula las frecuencias fi, fr, Fi, Fr.
 * @param {Array<number>} data - Conjunto de datos ordenados.
 * @returns {Array<Object>} Tabla de frecuencias.
 */
function calculateFrequency(data) {
    const n = data.length;
    const min = data[0];
    const max = data[n - 1];
    const range = max - min;

    // Método de Raíz Cuadrada para k con redondeo personalizado
    const k = customRound(Math.sqrt(n)) || 1;

    // Amplitud calculada automáticamente
    const amplitude = customRound(range / k) || 1;

    const tempIntervals = [];
    let currentLower = min;
    let totalFi = 0;

    // Primera pasada: calcular fi y totalFi real manejando límites
    for (let i = 0; i < k; i++) {
        const lower = currentLower;
        const upper = lower + amplitude;
        const binData = data.filter(v => v >= lower && v <= upper);
        const fi = binData.length;
        totalFi += fi;

        tempIntervals.push({ lower, upper, fi });
        currentLower = upper + 1; // El siguiente intervalo empieza después del límite actual
    }

    // Segunda pasada: calcular fr y Fi/Fr acumulados
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

/**
 * Renderiza la tabla de frecuencias en el HTML.
 * @param {Array<Object>} freqTable - Datos de la tabla de frecuencias.
 */
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

/**
 * Crea y actualiza los gráficos (Histograma, Polígono, Ojiva y Pareto) usando Chart.js.
 * @param {Array<Object>} freqTable - Datos para los gráficos.
 */
function renderCharts(freqTable) {
    const labels = freqTable.map(r => r.label);
    const dataFi = freqTable.map(r => r.fi);
    const dataFiCum = freqTable.map(r => r.Fi);

    // Configuración del Histograma
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

    // Configuración del Polígono de Frecuencias
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

    // Configuración de la Ojiva
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

    // Configuración del Diagrama de Pareto
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
/**
 * Realiza operaciones de conjuntos (unión, intersección, diferencia).
 */
function calculateSets() {
    const aRaw = document.getElementById('setA').value.split(',').map(x => x.trim()).filter(x => x !== "");
    const bRaw = document.getElementById('setB').value.split(',').map(x => x.trim()).filter(x => x !== "");
    const setA = new Set(aRaw);
    const setB = new Set(bRaw);

    // Unión A ∪ B
    const union = new Set([...setA, ...setB]);
    // Intersección A ∩ B
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    // Diferencia A - B
    const diffAB = new Set([...setA].filter(x => !setB.has(x)));
    // Diferencia B - A
    const diffBA = new Set([...setB].filter(x => !setA.has(x)));

    // Actualización de la interfaz
    document.getElementById('set-a-echo').innerText = `{ ${[...setA].join(', ')} }`;
    document.getElementById('set-b-echo').innerText = `{ ${[...setB].join(', ')} }`;
    document.getElementById('set-union').innerText = `{ ${[...union].join(', ')} }`;
    document.getElementById('set-inter').innerText = `{ ${[...intersection].join(', ')} }`;
    document.getElementById('set-diff-ab').innerText = `{ ${[...diffAB].join(', ')} }`;
    document.getElementById('set-diff-ba').innerText = `{ ${[...diffBA].join(', ')} }`;
}

// Probability logic
/**
 * Calcula la probabilidad simple P(A) = Favorables / Totales.
 */
function calcSimpleProb() {
    const fav = parseFloat(document.getElementById('probFav').value);
    const tot = parseFloat(document.getElementById('probTotal').value);
    if (tot === 0 || isNaN(fav) || isNaN(tot)) return;

    const prob = fav / tot;
    const perc = (prob * 100).toFixed(2);
    document.getElementById('simpleProbRes').innerText = `P(A) = ${fav}/${tot} = ${prob.toFixed(4)} = ${perc}%`;
}

// Combinatorics logic
/**
 * Calcula el factorial de un número n.
 * @param {number} n - Número entero no negativo.
 * @returns {number} Factorial de n.
 */
function factorial(n) {
    if (n < 0) return 0;
    if (n === 0) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

/**
 * Calcula y muestra el factorial de n.
 */
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

/**
 * Calcula y muestra permutaciones nPr.
 */
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

/**
 * Calcula y muestra combinaciones nCr.
 */
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
/**
 * Genera ejemplos aleatorios para el diagrama de árbol.
 */
function generateRandomTreeData() {
    const examples = [
        ["Moneda", "Sol/Águila", "Dado", "1/2/3", "Turno", "A/B"],
        ["Color", "Rojo/Verde", "Talla", "S/M", "Textura", "Liso/Rayas"],
        ["Comida", "Fruta/Galleta", "Bebida", "Agua/Jugo", "", ""],
        ["Clima", "Sol/Lluvia", "Viento", "Calma/Fuerte", "Día", "Hoy/Mañana"],
        ["Sorteo", "1/2", "Grupo", "A/B", "Ronda", "Final/Semi"]
    ];

    // 20% de probabilidad de generar un ejemplo con muchos datos (hasta 25)
    if (Math.random() < 0.2) {
        const largeData = Array.from({ length: 25 }, (_, i) => `D${i + 1}`).join('/');
        document.getElementById('treeName1').value = "Nivel 1 (Máximo)";
        document.getElementById('treeEv1').value = largeData;
        document.getElementById('treeName2').value = "Nivel 2 (2 opciones)";
        document.getElementById('treeEv2').value = "X/Y";
        document.getElementById('treeName3').value = "";
        document.getElementById('treeEv3').value = "";
    } else {
        const rand = examples[Math.floor(Math.random() * examples.length)];
        document.getElementById('treeName1').value = rand[0];
        document.getElementById('treeEv1').value = rand[1];
        document.getElementById('treeName2').value = rand[2];
        document.getElementById('treeEv2').value = rand[3];
        document.getElementById('treeName3').value = rand[4] || "";
        document.getElementById('treeEv3').value = rand[5] || "";
    }
    generateTree();
}

/**
 * Genera un diagrama de árbol textual basado en dos eventos.
 */
function generateTree() {
    const n1 = document.getElementById('treeName1').value.trim() || "Opcion 1";
    const ev1 = document.getElementById('treeEv1').value || "A/B";
    const n2 = document.getElementById('treeName2').value.trim() || "Opcion 2";
    const ev2 = document.getElementById('treeEv2').value || "X/Y";
    const n3 = document.getElementById('treeName3').value.trim() || "Opcion 3";
    const ev3 = document.getElementById('treeEv3').value || "";

    const parts1 = ev1.split('/').map(x => x.trim()).filter(x => x !== "").slice(0, 25);
    const parts2 = ev2.split('/').map(x => x.trim()).filter(x => x !== "").slice(0, 25);
    const parts3 = ev3 ? ev3.split('/').map(x => x.trim()).filter(x => x !== "").slice(0, 25) : [];

    // --- Resumen dinámico ---
    const summaryDiv = document.getElementById('treeSummary');
    let totalComb = parts1.length * parts2.length;
    if (parts3.length > 0) totalComb *= parts3.length;

    let summaryHtml = `
        <div class="mb-2"><strong>1) Opciones:</strong><br>${n1}<br>${n2}${parts3.length > 0 ? `<br>${n3}` : ''}</div>
        <div class="mb-2"><strong>2) Datos de las opciones:</strong><br>
            ${n1}: ${parts1.length}<br>
            ${n2}: ${parts2.length}
            ${parts3.length > 0 ? `<br>${n3}: ${parts3.length}` : ''}
        </div>
        <div class="mb-0"><strong>3) Multiplicar numeros de los datos:</strong><br>
            ${parts1.length} x ${parts2.length}${parts3.length > 0 ? ` x ${parts3.length}` : ''} = <strong>${totalComb} combinaciones</strong>
        </div>
    `;
    summaryDiv.innerHTML = summaryHtml;
    summaryDiv.style.display = 'block';

    let diagram = "Inicio\n";
    if (n1) diagram += `└── [${n1}]\n`;

    parts1.forEach((p1, idx1) => {
        const isLast1 = idx1 === parts1.length - 1;
        const prefix0 = n1 ? "    " : "";
        diagram += `${prefix0}${isLast1 ? "└── " : "├── "}${p1}\n`;

        const prefix1 = prefix0 + (isLast1 ? "    " : "│   ");

        if (parts2.length > 0) {
            if (n2) diagram += `${prefix1}└── [${n2}]\n`;

            parts2.forEach((p2, idx2) => {
                const isLast2 = idx2 === parts2.length - 1;
                const prefix1_2 = prefix1 + (n2 ? "    " : "");
                diagram += `${prefix1_2}${isLast2 ? "└── " : "├── "}${p2}\n`;

                const prefix2 = prefix1_2 + (isLast2 ? "    " : "│   ");
                if (parts3.length > 0) {
                    if (n3) diagram += `${prefix2}└── [${n3}]\n`;
                    parts3.forEach((p3, idx3) => {
                        const isLast3 = idx3 === parts3.length - 1;
                        const prefix2_2 = prefix2 + (n3 ? "    " : "");
                        diagram += `${prefix2_2}${isLast3 ? "└── " : "├── "}${p3}\n`;
                    });
                }
            });
        }
    });
    document.getElementById('treeDiagram').innerText = diagram;
}

// Init with some data
/**
 * Inicialización al cargar la ventana: Genera datos de ejemplo predeterminados.
 */
window.onload = () => {
    document.getElementById('dataInput').value = "10, 12, 12, 15, 18, 20, 22, 22, 22, 25, 30, 32, 35, 35, 38, 40, 42, 45, 48, 50";
    processData();
};
