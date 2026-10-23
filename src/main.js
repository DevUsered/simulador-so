import { simularFCFS, simularSJF, simularRR, simularPR, simularMLQ } from './scheduler.js';

// Colores pastel idénticos a los de la imagen
const colores = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1'];

document.querySelector('#tabla-entradas thead').innerHTML = `
    <tr>
        <th>Proc</th>
        <th>Tej</th>
        <th>Tlleg</th>
        <th class="col-prio" style="display: none;">Prio</th>
    </tr>
`;
document.querySelector('#tabla-estadisticas tbody').innerHTML = ``;

const inputNumProcesos = document.getElementById('num-procesos');
const tbodyEntradas = document.querySelector('#tabla-entradas tbody');
const btnSimular = document.getElementById('btn-simular');
const selectAlgoritmo = document.getElementById('algoritmo');
const contenedorQuantum = document.getElementById('contenedor-quantum');
const contenedorMLQ = document.getElementById('contenedor-mlq');
const btnToggle = document.getElementById('btn-toggle');
const layoutMain = document.querySelector('.layout-main');

btnToggle.addEventListener('click', () => {
    layoutMain.classList.toggle('sidebar-oculta');
    const spanText = btnToggle.querySelector('span');
    
    if (layoutMain.classList.contains('sidebar-oculta')) {
        spanText.innerHTML = 'Mostrar Panel';
    } else {
        spanText.innerHTML = 'Ampliar Vista';
    }
});

selectAlgoritmo.addEventListener('change', (e) => {
    const columnasPrio = document.querySelectorAll('.col-prio');

    contenedorQuantum.style.display = (e.target.value === 'RR') ? 'flex' : 'none'; 
    contenedorMLQ.style.display = (e.target.value === 'MLQ') ? 'block' : 'none'; 

    columnasPrio.forEach(col => {
        col.style.display = (e.target.value === 'PR') ? 'table-cell' : 'none';
    });
});

const inputNumColasMLQ = document.getElementById('num-colas-mlq');
const mlqQuantumsContainer = document.getElementById('mlq-quantums-container');

function generarInputsMLQ() {
    let numColas = parseInt(inputNumColasMLQ.value) || 3;
    if (numColas < 2) numColas = 2; 
    
    mlqQuantumsContainer.innerHTML = '';
    
    for (let i = 1; i < numColas; i++) {
        let qValor = Math.pow(2, i); 
        mlqQuantumsContainer.innerHTML += `
            <div class="form-group">
                <label>Q${i}</label>
                <input type="number" class="input-clean" value="${qValor}" min="1">
            </div>
        `;
    }
    mlqQuantumsContainer.innerHTML += `
        <div class="form-group">
            <label>Q${numColas}</label>
            <div class="fcfs-label">FCFS</div>
        </div>
    `;
}
inputNumColasMLQ.addEventListener('input', generarInputsMLQ);
generarInputsMLQ(); 

selectAlgoritmo.dispatchEvent(new Event('change'));

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
            <td>
                <div class="letra-proceso" style="background-color: ${colores[i % colores.length]}1A; border: 1px solid ${colores[i % colores.length]}40; color: ${colores[i % colores.length]};">
                    ${letra}
                </div>
            </td>
            <td><input type="number" class="td-input teje" value="1" min="1"></td>
            <td><input type="number" class="td-input tlleg" value="0" min="0"></td>
            <td class="col-prio" style="display: ${mostrarPrio};"><input type="number" class="td-input prio" value="1" min="1"></td>
        `;
        tbodyEntradas.appendChild(tr);
    }
}

inputNumProcesos.addEventListener('input', generarGrilla);
generarGrilla();

tbodyEntradas.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        
        const inputsTeje = Array.from(tbodyEntradas.querySelectorAll('.teje'));
        const inputsTlleg = Array.from(tbodyEntradas.querySelectorAll('.tlleg'));
        const inputsPrio = Array.from(tbodyEntradas.querySelectorAll('.prio'));
        
        const todosLosInputs = [...inputsTeje, ...inputsTlleg, ...inputsPrio];
        
        const currentIndex = todosLosInputs.indexOf(e.target);
        if (currentIndex > -1) {
            let nextIndex = currentIndex + 1;
            while (nextIndex < todosLosInputs.length && todosLosInputs[nextIndex].closest('td').style.display === 'none') {
                nextIndex++;
            }
            
            if (nextIndex < todosLosInputs.length) {
                todosLosInputs[nextIndex].focus();
                todosLosInputs[nextIndex].select();
            } else {
                btnSimular.focus();
            }
        }
    }
});

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
      const inputsQ = Array.from(document.querySelectorAll('#mlq-quantums-container input'));
      let quantums = inputsQ.map(inp => parseInt(inp.value)).filter(v => !isNaN(v) && v > 0);
      if(quantums.length === 0) quantums = [2, 4]; 
      resultado = simularMLQ(procesos, ctxt, quantums);
    }

    if (resultado) {
        if (esDebug) {
            document.getElementById('controles-debug').style.display = 'flex';
            document.getElementById('consola-debug').style.display = 'block';
            document.getElementById('btn-siguiente-paso').style.display = 'inline-block';
            
            iniciarModoDebug(resultado.gantt, resultado.stats, procesos);
        } else {
            document.getElementById('controles-debug').style.display = 'none';
            document.getElementById('consola-debug').style.display = 'none';
            document.getElementById('btn-siguiente-paso').style.display = 'none';
            
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

function renderizarMotorGrafico(ganttData, procesos, esResultadoFinal, stats) {
    const contenedor = document.getElementById('gantt-container');
    const algoritmoActual = document.getElementById('algoritmo').value; 
    let qArray = Array.from(document.querySelectorAll('#mlq-quantums-container input'));
    
    let totalColas = 1;
    if (algoritmoActual === 'MLQ') {
        totalColas = ganttData.length > 0 ? Math.max(...ganttData.map(b => b.colaExec || 1)) : 1;
    }

    let htmlFinal = `<div style="display: flex; flex-direction: column; padding: 60px 250px 20px 40px;">`; 

    for (let q = 1; q <= totalColas; q++) {
        let bloquesCarril = ganttData.filter(b => {
            if (algoritmoActual === 'MLQ') {
                return b.colaExec === q; 
            }
            return true;
        });

        if (bloquesCarril.length === 0 && ganttData.length > 0) continue; 

        let llegadasDeEstaCola = [];
        if (q === 1) {
            procesos.forEach(p => llegadasDeEstaCola.push({ id: p.id, t: p.tlleg }));
        } else {
            ganttData.forEach(b => {
                if (b.colaExec === q - 1 && b.tipo === 'proceso' && !b.esFinal && !b.razon.includes('Retenido')) {
                    llegadasDeEstaCola.push({ id: b.id, t: b.fin });
                }
            });
        }

        let marcasExistentes = new Set();
        bloquesCarril.forEach(b => {
            marcasExistentes.add(b.inicio);
            marcasExistentes.add(b.fin);
        });

        let maxApiladosCola = 0;
        let conteoLlegadas = {};
        llegadasDeEstaCola.forEach(l => {
            conteoLlegadas[l.t] = (conteoLlegadas[l.t] || 0) + 1;
            if (conteoLlegadas[l.t] > maxApiladosCola) {
                maxApiladosCola = conteoLlegadas[l.t];
            }
        });
        
        let margenInferior = 40 + (maxApiladosCola * 16);
        let nombreCola = algoritmoActual === 'MLQ' ? (q > qArray.length ? 'FCFS' : `Q${q}`) : 'CPU';
        
        htmlFinal += `
            <div style="display: flex; align-items: flex-end; position: relative; width: max-content; margin-bottom: ${margenInferior}px;">
                <div style="position: absolute; left: -40px; font-weight: 700; color: var(--brand-blue); font-size: 0.9rem; bottom: 0;">${nombreCola}</div>
                <div style="position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: #CBD5E1; z-index: 0;"></div>
        `;

        if (bloquesCarril.length > 0) {
            htmlFinal += `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center; margin-right: 2px;">
                    <div style="height: 6px; border-left: 1px solid #111827;"></div>
                    <div style="font-size: 0.75rem; font-weight: 600; margin-top: 2px; color: #111827;">${bloquesCarril[0].inicio}</div>
                </div>
            `;
        }

        for (let idx = 0; idx < bloquesCarril.length; idx++) {
            let bloque = bloquesCarril[idx];
            
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
                ? 'text-decoration: line-through 2px solid; opacity: 0.6;' 
                : '';

            let barraHTML = '';
            if (bloque.tipo === 'proceso') {
                barraHTML = `<div style="background-color: ${bloque.color}; width: 100%; height: 6px; border-radius: 3px; position: relative; z-index: 5;"></div>`;
            } else if (isCS) {
                barraHTML = `<div style="width: 100%; height: 8px; background: repeating-linear-gradient(-45deg, transparent, transparent 3px, #CBD5E1 3px, #CBD5E1 4px); z-index: 5;"></div>`;
            } else if (isIdle) {
                barraHTML = `<div style="width: 100%; height: 4px; background: transparent; z-index: 5;"></div>`;
            }

            let llegadasHTML = '';
            let llegadasPorTiempo = {};
            
            let llegadasEnEsteBloque = llegadasDeEstaCola.filter(l => l.t >= bloque.inicio && l.t < bloque.fin);
            
            llegadasEnEsteBloque.forEach(l => {
                if(!llegadasPorTiempo[l.t]) llegadasPorTiempo[l.t] = [];
                llegadasPorTiempo[l.t].push(l.id);
            });

            for (const [tiempoStr, letras] of Object.entries(llegadasPorTiempo)) {
                let tiempo = parseInt(tiempoStr);
                let porcentaje = ((tiempo - bloque.inicio) / bloque.duracion) * 100;
                
                let letrasHTML = letras.map(l => `<div style="font-size: 0.8rem; color: #64748B; font-weight: 600; line-height: 1.2;">${l}</div>`).join('');
                let numVisual = marcasExistentes.has(tiempo) 
                    ? '' 
                    : `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.65rem; color: #64748B; background: #FFFFFF; padding: 0 2px; z-index: 2;">${tiempo}</div>`;

                    llegadasHTML += `
                    <div style="position: absolute; left: ${porcentaje}%; top: 100%; display: flex; flex-direction: column; align-items: center; transform: translateX(-50%); z-index: 20; padding-top: 2px;">
                        <div style="position: relative; height: 26px; width: 24px; display: flex; justify-content: center;">
                            <div style="position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); border-left: 1.5px dashed #94A3B8; z-index: 1;"></div>
                            ${numVisual}
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center;">${letrasHTML}</div>
                    </div>
                `;
            }

            let minW = Math.max(bloque.duracion * 20, 25);
            
           htmlFinal += `
                <div style="flex-grow: ${bloque.duracion}; min-width: ${minW}px; display: flex; flex-direction: column; justify-content: flex-end; position: relative;">
                    <div style="text-align: center; font-weight: 700; margin-bottom: 5px; color: #111827; font-size: 0.9rem; ${estiloTexto}">${label}</div>
                    ${barraHTML}
                    ${llegadasHTML}
                    
                    <div style="position: absolute; right: 0; bottom: -20px; display: flex; flex-direction: column; align-items: center; transform: translateX(50%); z-index: 10;">
                        <div style="height: 6px; border-left: 1px solid #111827;"></div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #111827; margin-top: 2px;">${bloque.fin}</div>
                    </div>
                </div>
            `;
        }

        let bloquesDeProceso = bloquesCarril.filter(b => b.tipo === 'proceso');

        let listaColita = bloquesDeProceso.map(b => {
            let esActualDebug = (!esResultadoFinal && pasoActual > 0 && pasosGantt[pasoActual - 1] === b);
            if (b.esFinal) return `<span style="text-decoration: line-through 2px solid; opacity: 0.4;">${b.id}</span>`;
            if (!esResultadoFinal && !esActualDebug) return `<span style="opacity: 0.4;">${b.id}</span>`;
            return `<span>${b.id}</span>`;
        }).join(', ');

        if (bloquesDeProceso.length > 0) {
            htmlFinal += `
                <div style="position: absolute; right: -15px; bottom: 60px; transform: translateX(100%); font-size: 0.85rem; font-weight: 600; color: #64748B; white-space: nowrap;">
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
            if(consola) consola.innerHTML = `> 🔵 Simulación lista. Esperando iniciar...`;
        } else {
            const bloqueActual = pasosGantt[pasoActual - 1];
            let icono = bloqueActual.tipo === 'proceso' ? '🟢' : (bloqueActual.tipo === 'cs' ? '⚙️' : '💤');
            
            // ✨ BUG DE CONSOLA REPARADO CORRECTAMENTE SIN GUIONES EXTRA ✨
            let msj = `> [${bloqueActual.inicio} - ${bloqueActual.fin}] ${icono} ${bloqueActual.razon}`;
            if(consola) consola.innerHTML = msj;
        }

        if(btnRet) {
            btnRet.disabled = pasoActual === 0;
            btnRet.style.opacity = pasoActual === 0 ? '0.5' : '1';
        }

        if (pasoActual === pasosGantt.length) {
            if(consola) consola.innerHTML += `<br>> ✅ Simulación completada.`;
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
            if (tbodyStats) tbodyStats.innerHTML += `<tr><td style="font-weight: 600;">${s.id}</td><td>${s.tret}</td><td>${s.tesp}</td></tr>`;
        });
        document.getElementById('promedio-tret').innerText = (sumaTret / stats.length).toFixed(2);
        document.getElementById('promedio-tesp').innerText = (sumaTesp / stats.length).toFixed(2);
    }
}