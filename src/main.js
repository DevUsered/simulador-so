import { simularFCFS, simularSJF, simularRR, simularPR, simularMLQ } from './scheduler.js';

const colores = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#14B8A6', '#8B5CF6'];

// ---- TÍTULOS DE LAS TABLAS COMO EN LA PIZARRA ----
document.querySelector('#tabla-entradas thead').innerHTML = `
    <tr>
        <th>Proc</th>
        <th>Tej</th>
        <th>Tlleg</th>
        <th class="col-prio" style="display: none;">Prio</th>
    </tr>
`;
document.querySelector('#tabla-estadisticas thead').innerHTML = `
    <tr>
        <th>Proc</th>
        <th>Tret</th>
        <th>Tes</th>
    </tr>
`;

const inputNumProcesos = document.getElementById('num-procesos');
const tbodyEntradas = document.querySelector('#tabla-entradas tbody');
const btnSimular = document.getElementById('btn-simular');

// ---- LÓGICA PARA MOSTRAR/OCULTAR CONTROLES ----
const selectAlgoritmo = document.getElementById('algoritmo');
const contenedorQuantum = document.getElementById('contenedor-quantum');
const btnToggle = document.getElementById('btn-toggle');
const layoutMain = document.querySelector('.layout');

btnToggle.addEventListener('click', () => {
    layoutMain.classList.toggle('sidebar-oculta');
    if (layoutMain.classList.contains('sidebar-oculta')) {
        btnToggle.innerHTML = '▶ Mostrar Panel';
    } else {
        btnToggle.innerHTML = '◀ Ocultar Panel';
    }
});

selectAlgoritmo.addEventListener('change', (e) => {
    const columnasPrio = document.querySelectorAll('.col-prio');
    const contenedorMLQ = document.getElementById('contenedor-mlq');

    contenedorQuantum.style.display = (e.target.value === 'RR') ? 'flex' : 'none'; 
    contenedorMLQ.style.display = (e.target.value === 'MLQ') ? 'flex' : 'none'; 

    columnasPrio.forEach(col => {
        col.style.display = (e.target.value === 'PR') ? 'table-cell' : 'none';
    })
});

function obtenerLetra(index) { return String.fromCharCode(65 + index); }

function generarGrilla() {
    const num = parseInt(inputNumProcesos.value) || 0;
    const algoritmoActual = document.getElementById('algoritmo').value;
    const mostrarPrio = algoritmoActual === 'PR' ? 'table-cell' : 'none';

    tbodyEntradas.innerHTML = ''; 

    for (let i = 0; i < num; i++) {
        const letra = obtenerLetra(i);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; color: #1E293B; background-color: ${colores[i % colores.length]}30; border-radius: 6px;">${letra}</td>
            <td><input type="number" class="teje input-grid" value="1" min="1"></td>
            <td><input type="number" class="tlleg input-grid" value="0" min="0"></td>
            <td class="col-prio" style="display: ${mostrarPrio};"><input type="number" class="prio input-grid" value="1" min="1"></td>
        `;
        tbodyEntradas.appendChild(tr);
    }
}

inputNumProcesos.addEventListener('input', generarGrilla);
generarGrilla();

// ---- NAVEGACIÓN VERTICAL CON ENTER ----
tbodyEntradas.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const inputsTeje = Array.from(tbodyEntradas.querySelectorAll('.teje'));
        const inputsTlleg = Array.from(tbodyEntradas.querySelectorAll('.tlleg'));
        const inputsPrio = Array.from(tbodyEntradas.querySelectorAll('.prio'));
        const todosLosInputs = [...inputsTeje, ...inputsTlleg, ...inputsPrio];
        
        const currentIndex = todosLosInputs.indexOf(e.target);
        if (currentIndex > -1 && currentIndex < todosLosInputs.length - 1) {
            todosLosInputs[currentIndex + 1].focus();
            todosLosInputs[currentIndex + 1].select();
        } else if (currentIndex === todosLosInputs.length - 1) {
            btnSimular.focus();
        }
    }
});

// ---- VARIABLES GLOBALES ----
let pasosGantt = [];
let pasoActual = 0;
let procesosGlobales = [];
let statsGlobales = [];

btnSimular.addEventListener('click', () => {
    const algoritmo = document.getElementById('algoritmo').value;
    const ctxt = parseInt(document.getElementById('ctxt').value) || 0;
    const esDebug = document.getElementById('modo-debug').checked; 
    
    const filas = document.querySelectorAll('#tabla-entradas tbody tr');
    let procesos = [];
    let hayErrores = false;

    filas.forEach((fila, index) => {
        let teje = parseInt(fila.querySelector('.teje').value);
        let tlleg = parseInt(fila.querySelector('.tlleg').value);
        let prio = parseInt(fila.querySelector('.prio').value) || 1;

        if (isNaN(teje) || teje <= 0) hayErrores = true;
        if (isNaN(tlleg) || tlleg < 0) tlleg = 0; 
        procesos.push({ id: obtenerLetra(index), teje, tlleg, prio, color: colores[index % colores.length] });
    });

    if (hayErrores) return alert("⚠️ ¡Cuidado! El Tiempo de Ejecución (Teje) debe ser mayor a 0.");

    let resultado;
    if (algoritmo === 'FCFS'){ resultado = simularFCFS(procesos, ctxt); }
    else if(algoritmo === 'SJF'){ resultado = simularSJF(procesos, ctxt); }
    else if(algoritmo === 'RR'){
      const quantum = parseInt(document.getElementById('quantum').value) || 2;
      resultado = simularRR(procesos, ctxt, quantum);
    }
    else if(algoritmo === 'PR'){ resultado = simularPR(procesos, ctxt); }
    else if(algoritmo === 'MLQ'){
      let valores = document.getElementById('mlq-quantums').value.split(',');
      let quantums = valores.map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0);
      if(quantums.length === 0) quantums = [2, 4, 8]; 
      resultado = simularMLQ(procesos, ctxt, quantums);
    }

    if (resultado) {
        if (esDebug) {
            iniciarModoDebug(resultado.gantt, resultado.stats, procesos);
        } else {
            document.getElementById('btn-siguiente-paso').style.display = 'none';
            document.getElementById('consola-debug').style.display = 'none';
            renderizarMotorGrafico(resultado.gantt, procesos, true, resultado.stats);
        }
    }
});

function iniciarModoDebug(gantt, stats, procesos) {
    pasosGantt = gantt;
    statsGlobales = stats;
    procesosGlobales = procesos;
    pasoActual = 0; 

    document.getElementById('controles-debug').style.display = 'flex';
    document.querySelector('#tabla-estadisticas tbody').innerHTML = '';
    document.getElementById('promedio-tret').innerText = "0.00";
    document.getElementById('promedio-tesp').innerText = "0.00";
    
    const btnSiguiente = document.getElementById('btn-siguiente-paso');
    const nuevoBtnSig = btnSiguiente.cloneNode(true);
    btnSiguiente.parentNode.replaceChild(nuevoBtnSig, btnSiguiente);
    
    const btnRetroceder = document.getElementById('btn-retroceder-paso');
    const nuevoBtnRet = btnRetroceder.cloneNode(true);
    btnRetroceder.parentNode.replaceChild(nuevoBtnRet, btnRetroceder);

    nuevoBtnSig.addEventListener('click', () => {
        if (pasoActual < pasosGantt.length) {
            pasoActual++;
            renderizarMotorGrafico(pasosGantt.slice(0, pasoActual), procesosGlobales, false, statsGlobales);
        }
    });

    nuevoBtnRet.addEventListener('click', () => {
        if (pasoActual > 0) {
            pasoActual--;
            renderizarMotorGrafico(pasosGantt.slice(0, pasoActual), procesosGlobales, false, statsGlobales);
        }
    });

    renderizarMotorGrafico([], procesosGlobales, false, statsGlobales);
}

// ---- MOTOR GRÁFICO (CON LLEGADAS EN TODAS LAS COLAS Y SIN PUNTITOS) ----
function renderizarMotorGrafico(ganttData, procesos, esResultadoFinal, stats) {
    const contenedor = document.getElementById('gantt-container');
    const algoritmoActual = document.getElementById('algoritmo').value; 
    let qArray = document.getElementById('mlq-quantums').value.split(',').filter(v => v.trim() !== '');
    
    let totalColas = 1;
    if (algoritmoActual === 'MLQ') {
        totalColas = ganttData.length > 0 ? Math.max(...ganttData.map(b => b.colaExec || 1)) : 1;
    }

    let htmlFinal = `<div style="display: flex; flex-direction: column; gap: 55px; padding: 40px 20px 20px 40px;">`;

    for (let q = 1; q <= totalColas; q++) {
        // Filtrar SOLO los bloques de esta cola
        let bloquesCarril = ganttData.filter(b => {
            if (algoritmoActual === 'MLQ') {
                return b.colaExec === q; 
            }
            return true;
        });

        if (bloquesCarril.length === 0 && ganttData.length > 0) continue; 

        // RASTREO INTELIGENTE DE LLEGADAS A ESTA COLA EXACTA
        let llegadasDeEstaCola = [];
        if (q === 1) {
            // En Q1 los procesos llegan en su tlleg original
            procesos.forEach(p => llegadasDeEstaCola.push({ id: p.id, t: p.tlleg }));
        } else {
            // En Q2, Q3, FCFS... llegan en el milisegundo exacto que cayeron de la cola anterior
            ganttData.forEach(b => {
                // Buscamos procesos que estaban en la cola de arriba, que NO hayan terminado (!esFinal) 
                // y que NO hayan sido retenidos en esa misma cola (!b.razon.includes('Retenido'))
                if (b.colaExec === q - 1 && b.tipo === 'proceso' && !b.esFinal && !b.razon.includes('Retenido')) {
                    llegadasDeEstaCola.push({ id: b.id, t: b.fin });
                }
            });
        }

        let nombreCola = algoritmoActual === 'MLQ' ? (q > qArray.length ? 'FCFS' : `Q${q}`) : 'CPU';

        // Estructura principal del carril (Alineado a la izquierda SIEMPRE)
        htmlFinal += `
            <div style="display: flex; align-items: flex-end; position: relative; width: max-content;">
                <div style="position: absolute; left: -40px; font-weight: bold; color: var(--primary); font-size: 0.95rem; bottom: 0;">${nombreCola}</div>
                <div style="position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: #64748B; z-index: 0;"></div>
        `;

        if (bloquesCarril.length > 0) {
            // Marca de inicio de esta cola
            htmlFinal += `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center; margin-right: 2px;">
                    <div style="height: 6px; border-left: 1px solid var(--text-main);"></div>
                    <div style="font-size: 0.75rem; font-weight: normal; margin-top: 2px; color: var(--text-main);">${bloquesCarril[0].inicio}</div>
                </div>
            `;
        }

        // Dibujo de los bloques
        for (let idx = 0; idx < bloquesCarril.length; idx++) {
            let bloque = bloquesCarril[idx];
            
            // Huecos internos dentro de la MISMA cola
            if (idx > 0) {
                let bloqueAnterior = bloquesCarril[idx - 1];
                if (bloque.inicio > bloqueAnterior.fin) {
                    let hueco = bloque.inicio - bloqueAnterior.fin;
                    let minWHueco = hueco * 20;
                    htmlFinal += `<div style="flex-grow: ${hueco}; min-width: ${minWHueco}px; background: transparent; border: none;"></div>`;
                }
            }

            let label = bloque.tipo === 'proceso' ? bloque.id : '';
            let isCS = bloque.tipo === 'cs';
            let isIdle = bloque.tipo === 'idle';

            let estiloTexto = (bloque.esFinal && bloque.tipo === 'proceso') 
                ? 'text-decoration: line-through 2px solid; opacity: 0.7; font-style: italic;' 
                : '';

            let barraHTML = '';
            if (bloque.tipo === 'proceso') {
                barraHTML = `<div style="background-color: ${bloque.color}; width: 100%; height: 4px; border-radius: 2px; position: relative; z-index: 5;"></div>`;
            } else if (isCS) {
                barraHTML = `<div style="width: 100%; height: 8px; background: repeating-linear-gradient(-45deg, transparent, transparent 3px, #64748B 3px, #64748B 4px); z-index: 5;"></div>`;
            } else if (isIdle) {
                barraHTML = `<div style="width: 100%; height: 4px; background: transparent; z-index: 5;"></div>`;
            }

            // LLEGADAS PARA TODAS LAS COLAS (Apiladas y con una rayita limpia sin puntitos)
            let llegadasHTML = '';
            let llegadasPorTiempo = {};
            
            // Evaluamos si en el tiempo de este bloque hubo alguna llegada a esta cola
            let llegadasEnEsteBloque = llegadasDeEstaCola.filter(l => l.t >= bloque.inicio && l.t < bloque.fin);
            
            llegadasEnEsteBloque.forEach(l => {
                if(!llegadasPorTiempo[l.t]) llegadasPorTiempo[l.t] = [];
                llegadasPorTiempo[l.t].push(l.id);
            });

            for (const [tiempoStr, letras] of Object.entries(llegadasPorTiempo)) {
                let tiempo = parseInt(tiempoStr);
                let porcentaje = ((tiempo - bloque.inicio) / bloque.duracion) * 100;
                
                let letrasHTML = letras.map(l => `<div style="font-size: 0.8rem; color: var(--text-main); font-weight: 700; line-height: 1.1;">${l}</div>`).join('');
                
                llegadasHTML += `
                    <div style="position: absolute; left: ${porcentaje}%; bottom: 8px; display: flex; flex-direction: column; align-items: center; transform: translateX(-50%); z-index: 20;">
                        <div style="display: flex; flex-direction: column-reverse; align-items: center; margin-bottom: 2px;">${letrasHTML}</div>
                        <!-- LÍNEA SÓLIDA CORTA Y LIMPIA (sin dashed) -->
                        <div style="height: 12px; border-left: 1.5px solid #94A3B8;"></div>
                        <div style="font-size: 0.65rem; color: #64748B; font-weight: normal; margin-top: 1px;">${tiempo}</div>
                    </div>
                `;
            }

            let minW = Math.max(bloque.duracion * 20, 25);
            
            htmlFinal += `
                <div style="flex-grow: ${bloque.duracion}; min-width: ${minW}px; display: flex; flex-direction: column; justify-content: flex-end; position: relative;">
                    <div style="text-align: center; font-weight: 800; margin-bottom: 3px; color: var(--text-main); font-size: 0.95rem; ${estiloTexto}">${label}</div>
                    ${barraHTML}
                    ${llegadasHTML}
                    
                    <div style="position: absolute; right: 0; bottom: -20px; display: flex; flex-direction: column; align-items: center; transform: translateX(50%); z-index: 10;">
                        <div style="height: 6px; border-left: 1px solid var(--text-main);"></div>
                        <div style="font-size: 0.75rem; font-weight: normal; color: var(--text-main); margin-top: 2px;">${bloque.fin}</div>
                    </div>
                </div>
            `;
        }

        // LISTA DE ESPERA (A LA DERECHA)
        let procesosUnicosEnCola = [...new Set(bloquesCarril.filter(b => b.tipo === 'proceso').map(b => b.id))];
        let listaColita = procesosUnicosEnCola.map(pid => {
            let estaEjecutandoAhora = (!esResultadoFinal && pasoActual > 0 && pasosGantt[pasoActual - 1].id === pid && pasosGantt[pasoActual - 1].colaExec === q);
            
            if (!estaEjecutandoAhora) {
                return `<span style="text-decoration: line-through 1.5px solid; opacity: 0.6;">${pid}</span>`;
            }
            return `<span>${pid}</span>`;
        }).join(', ');

        if (procesosUnicosEnCola.length > 0) {
            htmlFinal += `
                <div style="margin-left: 30px; margin-bottom: 2px; font-size: 0.95rem; font-weight: 800; color: var(--text-main); white-space: nowrap;">
                    ${listaColita}
                </div>
            `;
        }

        htmlFinal += `</div>`; 
    }
    
    htmlFinal += `</div>`;
    contenedor.innerHTML = htmlFinal;

    if (contenedor.scrollWidth > contenedor.clientWidth) {
        contenedor.scrollLeft = contenedor.scrollWidth;
    }

    const tbodyStats = document.querySelector('#tabla-estadisticas tbody');
    const consola = document.getElementById('consola-debug');
    const btnRet = document.getElementById('btn-retroceder-paso');
    const btnSig = document.getElementById('btn-siguiente-paso');

    if (!esResultadoFinal) {
        if (pasoActual === 0) {
            if(consola) consola.innerHTML = `> 🔵 <b>Simulación lista.</b> Esperando iniciar...`;
        } else {
            const bloqueActual = pasosGantt[pasoActual - 1];
            let icono = bloqueActual.tipo === 'proceso' ? '🟢' : (bloqueActual.tipo === 'cs' ? '⚙️' : '💤');
            let msj = `> [${bloqueActual.inicio} - ${bloqueActual.fin}] ${icono} ${bloqueActual.razon}`;
            if(consola) consola.innerHTML = msj;
        }

        if(btnRet) {
            btnRet.disabled = pasoActual === 0;
            btnRet.style.opacity = pasoActual === 0 ? '0.5' : '1';
        }

        if (pasoActual === pasosGantt.length) {
            if(consola) consola.innerHTML += `<br>> ✅ <b>Simulación completada.</b>`;
            if(btnSig) {
                btnSig.disabled = true; btnSig.innerText = 'Finalizado ✔️'; btnSig.style.opacity = '0.5';
            }
            mostrarEstadisticas(stats, tbodyStats); 
        } else {
            if(btnSig) {
                btnSig.disabled = false; btnSig.innerText = 'Siguiente Paso ➡️'; btnSig.style.opacity = '1';
            }
            if(tbodyStats) tbodyStats.innerHTML = '';
        }
    } else {
        mostrarEstadisticas(stats, tbodyStats); 
    }
}

function mostrarEstadisticas(stats, tbodyStats) {
    let sumaTret = 0, sumaTesp = 0;
    if (tbodyStats) tbodyStats.innerHTML = '';
    
    if (stats && stats.length > 0) {
        stats.sort((a, b) => a.id.localeCompare(b.id)).forEach(s => {
            sumaTret += s.tret; sumaTesp += s.tesp;
            if (tbodyStats) tbodyStats.innerHTML += `<tr><td style="font-weight: bold;">${s.id}</td><td>${s.tret}</td><td>${s.tesp}</td></tr>`;
        });
        document.getElementById('promedio-tret').innerText = (sumaTret / stats.length).toFixed(2);
        document.getElementById('promedio-tesp').innerText = (sumaTesp / stats.length).toFixed(2);
    }
}