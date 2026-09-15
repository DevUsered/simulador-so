import { simularFCFS, simularSJF, simularRR} from './scheduler.js';

const colores = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#14B8A6', '#8B5CF6'];

const inputNumProcesos = document.getElementById('num-procesos');
const tbodyEntradas = document.querySelector('#tabla-entradas tbody');
const btnSimular = document.getElementById('btn-simular');

// ---- LÓGICA PARA MOSTRAR/OCULTAR EL QUANTUM ----
const selectAlgoritmo = document.getElementById('algoritmo');
const contenedorQuantum = document.getElementById('contenedor-quantum');

// ---- LÓGICA PARA OCULTAR/MOSTRAR EL PANEL ----
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
    if (e.target.value === 'RR') {
        // Si elige Round Robin, mostramos el campo
        contenedorQuantum.style.display = 'flex'; 
    } else {
        // Para FCFS o SJF, lo ocultamos
        contenedorQuantum.style.display = 'none'; 
    }
});

function obtenerLetra(index) { return String.fromCharCode(65 + index); }

function generarGrilla() {
    const num = parseInt(inputNumProcesos.value) || 0;
    tbodyEntradas.innerHTML = ''; 

    for (let i = 0; i < num; i++) {
        const letra = obtenerLetra(i);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; color: #1E293B; background-color: ${colores[i % colores.length]}30; border-radius: 6px;">${letra}</td>
            <td><input type="number" class="teje input-grid" value="1" min="1"></td>
            <td><input type="number" class="tlleg input-grid" value="0" min="0"></td>
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
        
        // Agrupamos primero toda la columna 'teje' y luego toda la columna 'tlleg'
        const inputsTeje = Array.from(tbodyEntradas.querySelectorAll('.teje'));
        const inputsTlleg = Array.from(tbodyEntradas.querySelectorAll('.tlleg'));
        const todosLosInputs = [...inputsTeje, ...inputsTlleg];
        
        const currentIndex = todosLosInputs.indexOf(e.target);
        
        if (currentIndex > -1 && currentIndex < todosLosInputs.length - 1) {
            todosLosInputs[currentIndex + 1].focus();
            todosLosInputs[currentIndex + 1].select();
        } else if (currentIndex === todosLosInputs.length - 1) {
            btnSimular.focus();
        }
    }
});

// ---- VARIABLES PARA EL MODO DEBUG ----
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
        if (isNaN(teje) || teje <= 0) hayErrores = true;
        if (isNaN(tlleg) || tlleg < 0) tlleg = 0; 
        procesos.push({ id: obtenerLetra(index), teje, tlleg, color: colores[index % colores.length] });
    });

    if (hayErrores) return alert("⚠️ ¡Cuidado! El Tiempo de Ejecución (Teje) debe ser mayor a 0.");

    let resultado;
    if (algoritmo === 'FCFS'){ 
      resultado = simularFCFS(procesos, ctxt);
    }else if(algoritmo === 'SJF'){
      resultado = simularSJF(procesos, ctxt);
    }else if(algoritmo === 'RR'){
      const quantum = parseInt(document.getElementById('quantum').value) || 2;
      resultado = simularRR(procesos, ctxt, quantum);
    }

    if (resultado) {
        if (esDebug) {
            iniciarModoDebug(resultado.gantt, resultado.stats, procesos);
        } else {
            document.getElementById('btn-siguiente-paso').style.display = 'none';
            document.getElementById('consola-debug').style.display = 'none';
            renderizarResultados(resultado.gantt, resultado.stats, procesos);
        }
    }
});

// ---- FUNCIONES DEL MODO PASO A PASO (DEBUG) ----
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
            actualizarVistaDebug();
        }
    });

    nuevoBtnRet.addEventListener('click', () => {
        if (pasoActual > 0) {
            pasoActual--;
            actualizarVistaDebug();
        }
    });

    actualizarVistaDebug();
}

function actualizarVistaDebug() {
    const contenedor = document.getElementById('gantt-container');
    const consola = document.getElementById('consola-debug');
    consola.style.display = 'block';
    
    let duracionHastaAhora = pasoActual > 0 ? pasosGantt[pasoActual - 1].fin : 0;
    let anchoMinimo = Math.max(100, duracionHastaAhora * 40); 

    let htmlTimeline = `
        <div class="gantt-timeline" id="gantt-timeline" style="min-width: ${anchoMinimo}px; transition: min-width 0.3s ease;">
            <div class="timeline-start">
                <div class="tick-solid"></div>
                <div class="time">${pasosGantt.length > 0 ? pasosGantt[0].inicio : 0}</div>
            </div>
    `;

    for (let i = 0; i < pasoActual; i++) {
        const bloque = pasosGantt[i];
        const algoritmoActual = document.getElementById('algoritmo').value; 
        
        let label = bloque.tipo === 'proceso' ? bloque.id : (bloque.tipo === 'idle' ? 'Vacío' : '');
        let colorFondo = '';
        let colorTexto = '';
        let claseExtra = '';
        let claseTexto = '';

        if (bloque.tipo === 'proceso') {
            colorFondo = `background-color: ${bloque.color};`;
            colorTexto = bloque.color;
            if (bloque.esFinal && algoritmoActual === 'RR') claseTexto = 'text-finished';
        } else if (bloque.tipo === 'idle') {
            colorFondo = `background-color: #E2E8F0;`;
            colorTexto = '#94A3B8';
            claseExtra = 'block-idle';
        } else if (bloque.tipo === 'cs') {
            claseExtra = 'block-cs';
        }

        let llegadasHTML = '';
        procesosGlobales.forEach(p => {
            if (p.tlleg >= bloque.inicio && p.tlleg < bloque.fin) {
                let porcentaje = ((p.tlleg - bloque.inicio) / bloque.duracion) * 100;
                llegadasHTML += `
                    <div class="arrival-marker ${i === pasoActual - 1 ? 'animar-entrada' : ''}" style="left: ${porcentaje}%;">
                        <div class="tick-dashed"></div>
                        <div class="arrival-time">${p.tlleg}</div>
                        <span class="arrival-label">${p.id}</span>
                    </div>
                `;
            }
        });

        let claseAnimacion = (i === pasoActual - 1) ? 'animar-entrada' : '';

        htmlTimeline += `
            <div class="timeline-segment ${claseAnimacion}" style="flex-grow: ${bloque.duracion}">
                <div class="segment-label ${claseTexto}" style="color: ${colorTexto}">${label}</div>
                <div class="segment-bar ${claseExtra}" style="${colorFondo}"></div>
                ${llegadasHTML}
                <div class="segment-end">
                    <div class="tick-solid"></div>
                    <div class="time">${bloque.fin}</div>
                </div>
            </div>
        `;
    }

    htmlTimeline += `</div>`;
    contenedor.innerHTML = htmlTimeline;

    // ---- MAGIA: CÁMARA SINCRONIZADA CON LA ANIMACIÓN ----
    const contenedorScroll = document.querySelector('.gantt-container');
    if (contenedorScroll) {
        const startScroll = contenedorScroll.scrollLeft;
        const targetScroll = contenedorScroll.scrollWidth - contenedorScroll.clientWidth; 
        
        if (targetScroll > startScroll) {
            const duration = 500; // Sincronizado con los 0.5s del CSS
            const startTime = performance.now();

            function animateScroll(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Función matemática ease-out (Frena suave al llegar)
                const easeProgress = progress * (2 - progress); 
                
                contenedorScroll.scrollLeft = startScroll + (targetScroll - startScroll) * easeProgress;

                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            }
            requestAnimationFrame(animateScroll);
        }
    }

    // 3. Generar mensaje explicativo de la consola
    if (pasoActual === 0) {
        consola.innerHTML = `> 🔵 <b>Simulación lista.</b> Esperando iniciar el primer paso...`;
    } else {
        const bloqueActual = pasosGantt[pasoActual - 1];
        
        let icono = bloqueActual.tipo === 'proceso' ? '🟢' : (bloqueActual.tipo === 'cs' ? '⚙️' : '💤');
        let msj = `> [${bloqueActual.inicio} - ${bloqueActual.fin}] ${icono} ${bloqueActual.razon}`;

        let llegadas = procesosGlobales.filter(p => p.tlleg >= bloqueActual.inicio && p.tlleg < bloqueActual.fin);
        if (llegadas.length > 0) {
            let nombres = llegadas.map(p => p.id).join(', ');
            msj += `<br>   📥 <i>¡Atención! Durante este tiempo, llega a la cola el proceso: <b>${nombres}</b>.</i>`;
        }

        consola.innerHTML = msj;
    }

    // 4. Control de estado de Botones y Estadísticas
    const btnRet = document.getElementById('btn-retroceder-paso');
    const btnSig = document.getElementById('btn-siguiente-paso');
    const tbodyStats = document.querySelector('#tabla-estadisticas tbody');

    btnRet.disabled = pasoActual === 0;
    btnRet.style.opacity = pasoActual === 0 ? '0.5' : '1';

    if (pasoActual === pasosGantt.length) {
        consola.innerHTML += `<br>> ✅ <b>Simulación completada.</b> Los cálculos finales están en la tabla de estadísticas.`;
        btnSig.disabled = true;
        btnSig.innerText = 'Finalizado ✔️';
        btnSig.style.opacity = '0.5';

        let sumaTret = 0, sumaTesp = 0;
        statsGlobales.sort((a, b) => a.id.localeCompare(b.id)).forEach(s => {
            sumaTret += s.tret;
            sumaTesp += s.tesp;
            tbodyStats.innerHTML += `<tr><td style="font-weight: bold;">${s.id}</td><td>${s.tret}</td><td>${s.tesp}</td></tr>`;
        });
        document.getElementById('promedio-tret').innerText = (sumaTret / statsGlobales.length).toFixed(2);
        document.getElementById('promedio-tesp').innerText = (sumaTesp / statsGlobales.length).toFixed(2);
    } else {
        btnSig.disabled = false;
        btnSig.innerText = 'Siguiente Paso ➡️';
        btnSig.style.opacity = '1';
        tbodyStats.innerHTML = ''; 
    }
}

function renderizarResultados(gantt, stats, procesosOriginales) {
    const contenedorGantt = document.getElementById('gantt-container');
    const tbodyStats = document.querySelector('#tabla-estadisticas tbody');
    tbodyStats.innerHTML = '';

    if (gantt.length === 0) return;

    let duracionTotal = gantt.length > 0 ? gantt[gantt.length - 1].fin : 0;
    let anchoMinimo = Math.max(100, duracionTotal * 40); 

    let htmlTimeline = `
        <div class="gantt-timeline" id="gantt-timeline" style="min-width: ${anchoMinimo}px;">
            <div class="timeline-start">
                <div class="tick-solid"></div>
                <div class="time">${gantt.length > 0 ? gantt[0].inicio : 0}</div>
            </div>
    `;

    gantt.forEach(bloque => {
        const algoritmoActual = document.getElementById('algoritmo').value;
        
        let label = bloque.tipo === 'proceso' ? bloque.id : (bloque.tipo === 'idle' ? 'Vacío' : '');
        let colorFondo = '';
        let colorTexto = '';
        let claseExtra = '';
        let claseTexto = '';

        if (bloque.tipo === 'proceso') {
            colorFondo = `background-color: ${bloque.color};`;
            colorTexto = bloque.color;
            if (bloque.esFinal && algoritmoActual === 'RR') claseTexto = 'text-finished';
        } else if (bloque.tipo === 'idle') {
            colorFondo = `background-color: #E2E8F0;`;
            colorTexto = '#94A3B8';
            claseExtra = 'block-idle';
        } else if (bloque.tipo === 'cs') {
            claseExtra = 'block-cs';
        }

        let llegadasHTML = '';
        procesosOriginales.forEach(p => {
            if (p.tlleg >= bloque.inicio && p.tlleg < bloque.fin) {
                let porcentaje = ((p.tlleg - bloque.inicio) / bloque.duracion) * 100;
                llegadasHTML += `
                    <div class="arrival-marker" style="left: ${porcentaje}%;">
                        <div class="tick-dashed"></div>
                        <div class="arrival-time">${p.tlleg}</div>
                        <span class="arrival-label">${p.id}</span>
                    </div>
                `;
            }
        });

        htmlTimeline += `
            <div class="timeline-segment" style="flex-grow: ${bloque.duracion}">
                <div class="segment-label ${claseTexto}" style="color: ${colorTexto}">${label}</div>
                <div class="segment-bar ${claseExtra}" style="${colorFondo}"></div>
                ${llegadasHTML}
                <div class="segment-end">
                    <div class="tick-solid"></div>
                    <div class="time">${bloque.fin}</div>
                </div>
            </div>
        `;
    });

    htmlTimeline += `</div>`; 
    contenedorGantt.innerHTML = timelineHTML;

    let sumaTret = 0, sumaTesp = 0;
    stats.sort((a, b) => a.id.localeCompare(b.id)).forEach(s => {
        sumaTret += s.tret;
        sumaTesp += s.tesp;
        tbodyStats.innerHTML += `<tr><td style="font-weight: bold;">${s.id}</td><td>${s.tret}</td><td>${s.tesp}</td></tr>`;
    });

    document.getElementById('promedio-tret').innerText = (sumaTret / stats.length).toFixed(2);
    document.getElementById('promedio-tesp').innerText = (sumaTesp / stats.length).toFixed(2);
}