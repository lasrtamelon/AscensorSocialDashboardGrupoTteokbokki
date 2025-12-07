import * as d3 from "d3";

// ------------------------------
// 🔌 Función para pedir datos a tu API
// ------------------------------
async function apiGet(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error HTTP " + res.status);
    return await res.json();
  } catch (err) {
    console.error("❌ API error:", err);
    return null;
  }
}

// ------------------------------
// Dibujar curva movilidad - DATOS
// ------------------------------
function drawCurva(datos) {
  const container = document.getElementById("grafica");
  container.innerHTML = ""; // limpiar antes de dibujar

  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 40, left: 50 };

  const svg = d3
    .select("#grafica")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(datos, (d) => d.centil_padres))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([
      d3.min(datos, (d) => d.centil_hijo) - 5,
      d3.max(datos, (d) => d.centil_hijo) + 5
    ])
    .range([height - margin.bottom, margin.top]);

  const line = d3
    .line()
    .x((d) => x(d.centil_padres))
    .y((d) => y(d.centil_hijo));

  // Ejes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(10));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Línea
  svg.append("path")
    .datum(datos)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Título
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Curva de Movilidad Nacional");
}

// ------------------------------
// Dibujar Gráfica de barras - RANKING
// ------------------------------
function drawBarChart(datos) {
  const container = document.getElementById("grafica2");
  container.innerHTML = ""; // SE DIBUJA EN OTRO DIV !!! 🔥

  const width = 700;
  const height = datos.length * 25 + 50;

  const svg = d3
    .select("#grafica2") // OJO AQUÍ, NO LA MISMA GRÁFICA 🔥
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(datos, (d) => d.centil_hijo)])
    .range([120, width - 40]);

  const y = d3
    .scaleBand()
    .domain(datos.map((d) => d.ccaa))
    .range([40, height])
    .padding(0.2);

  svg.append("g")
    .attr("transform", `translate(0,${40})`)
    .call(d3.axisLeft(y));

  svg.append("g")
    .attr("transform", `translate(0,${height - 10})`)
    .call(d3.axisBottom(x));

  svg.selectAll("rect")
    .data(datos)
    .enter()
    .append("rect")
    .attr("x", x(0))
    .attr("y", (d) => y(d.ccaa))
    .attr("width", (d) => x(d.centil_hijo) - x(0))
    .attr("height", y.bandwidth())
    .attr("fill", "steelblue");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Ranking CCAA – Centil Hijo");
}

// ------------------------------
// Dibujar Gráfica de Barras Apiladas - QUINTALES
// ------------------------------

function drawStackedQuintiles(datos) {
  const container = document.getElementById("grafica3");
  container.innerHTML = "";

  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 20, bottom: 40, left: 50 };

  const svg = d3
    .select("#grafica3")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const keys = ["rango_0_20", "rango_20_40", "rango_40_60", "rango_60_80", "rango_80_100"];

  const x = d3
    .scaleBand()
    .domain(datos.map((d) => d.quintil_padres))
    .range([margin.left, width - margin.right])
    .padding(0.3);

  const y = d3
    .scaleLinear()
    .domain([0, 100])
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal().domain(keys).range(d3.schemeSet2);

  const stacked = d3.stack().keys(keys)(datos);

  svg
    .selectAll("g.layer")
    .data(stacked)
    .enter()
    .append("g")
    .attr("fill", (d) => color(d.key))
    .selectAll("rect")
    .data((d) => d)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.data.quintil_padres))
    .attr("y", (d) => y(d[1]))
    .attr("height", (d) => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth());

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Distribución de Quintiles Nacionales");
}




// ------------------------------
// Inicializar dashboard
// ------------------------------
async function iniciar() {
  // Curva movilidad
  const curva = await apiGet("/api/nacional/curva");
  if (curva) drawCurva(curva);

  // Ranking CCAA 
  const ranking = await apiGet("/api/ccaa/ranking");
  if (ranking) drawBarChart(ranking);

  const quintiles = await apiGet("/api/quintiles/nacional");
  if (quintiles) drawStackedQuintiles(quintiles);

}

iniciar();
