export function simularFCFS(procesos, ctxt) {
    let gantt = [];
    let stats = [];
    let tiempoActual = 0;
    
    // El sistema operativo arranca (cobra contexto inicial solo si empieza en 0)
    if (ctxt > 0) {
        gantt.push({ tipo: 'cs', duracion: ctxt, inicio: 0, fin: ctxt, razon: 'Arranque del SO' });
        tiempoActual = ctxt;
    }

    let listos = [...procesos].sort((a, b) => a.tlleg !== b.tlleg ? a.tlleg - b.tlleg : a.id.localeCompare(b.id));
    let ultimoProcesoId = null;
    let esPrimerProceso = true;

    listos.forEach((p) => {
        if (tiempoActual < p.tlleg) {
            gantt.push({ tipo: 'idle', duracion: p.tlleg - tiempoActual, inicio: tiempoActual, fin: p.tlleg, razon: "CPU inactiva." });
            tiempoActual = p.tlleg;
            ultimoProcesoId = null;
        }

        if (esPrimerProceso) { ultimoProcesoId = p.id; esPrimerProceso = false; }

        if (ultimoProcesoId !== null && ultimoProcesoId !== p.id && ctxt > 0) {
            let inicioCs = tiempoActual;
            tiempoActual += ctxt;
            gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoActual, razon: `Cambio de contexto.` });
        }

        let inicioProc = tiempoActual;
        tiempoActual += p.teje;
        
        gantt.push({ tipo: 'proceso', id: p.id, color: p.color, duracion: p.teje, inicio: inicioProc, fin: tiempoActual, razon: `Se ejecuta ${p.id}`, esFinal: true });

        // ✨ FÓRMULA UNIVERSAL
        let tret = tiempoActual - p.tlleg; 
        let tesp = tret - p.teje;          
        stats.push({ id: p.id, tf: tiempoActual, tret, tesp });

        ultimoProcesoId = p.id;
    });

    return { gantt, stats };
}

export function simularSJF(procesos, ctxt) {
    let gantt = [];
    let stats = [];
    let tiempoActual = 0;

    let pendientes = [...procesos];
    let ultimoProcesoId = null;

    while (pendientes.length > 0) {
        let disponibles = pendientes.filter(p => p.tlleg <= tiempoActual);

        if (disponibles.length > 0) {
            disponibles.sort((a, b) => {
                if (a.teje !== b.teje) return a.teje - b.teje; 
                if (a.tlleg !== b.tlleg) return a.tlleg - b.tlleg; 
                return a.id.localeCompare(b.id); 
            });

            let p = disponibles[0];

            if (ultimoProcesoId !== null && ultimoProcesoId !== p.id && ctxt > 0) {
                let inicioCs = tiempoActual;
                tiempoActual += ctxt;
                gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoActual, razon: 'Cambio de contexto' });
            }

            let inicioProc = tiempoActual;
            tiempoActual += p.teje;

            gantt.push({ tipo: 'proceso', id: p.id, color: p.color, duracion: p.teje, inicio: inicioProc, fin: tiempoActual, razon: `Se ejecuta ${p.id}`, esFinal: true });

            let tret = tiempoActual - p.tlleg; 
            let tesp = tret - p.teje;          
            stats.push({ id: p.id, tf: tiempoActual, tret, tesp });

            pendientes = pendientes.filter(x => x.id !== p.id);
            ultimoProcesoId = p.id;
        } else {
            let proximo = [...pendientes].sort((a, b) => a.tlleg - b.tlleg)[0];
            gantt.push({ tipo: 'idle', duracion: proximo.tlleg - tiempoActual, inicio: tiempoActual, fin: proximo.tlleg, razon: 'CPU inactiva' });
            tiempoActual = proximo.tlleg;
            ultimoProcesoId = null;
        }
    }

    return { gantt, stats };
}

export function simularPR(procesos, ctxt) {
    let gantt = [];
    let stats = [];
    let tiempoActual = 0;
    
    if (ctxt > 0) {
        gantt.push({ tipo: 'cs', duracion: ctxt, inicio: 0, fin: ctxt, razon: 'Arranque del SO' });
        tiempoActual = ctxt;
    }

    let pendientes = [...procesos];
    let ultimoProcesoId = null;
    let esPrimerProceso = true;

    while (pendientes.length > 0) {
        let disponibles = pendientes.filter(p => p.tlleg <= tiempoActual);

        if (disponibles.length > 0) {
            disponibles.sort((a, b) => {
                if (a.prio !== b.prio) return b.prio - a.prio; 
                if (a.tlleg !== b.tlleg) return a.tlleg - b.tlleg; 
                return a.id.localeCompare(b.id); 
            });

            let p = disponibles[0];

            if (esPrimerProceso) { ultimoProcesoId = p.id; esPrimerProceso = false; }

            if (ultimoProcesoId !== null && ultimoProcesoId !== p.id && ctxt > 0) {
                let inicioCs = tiempoActual;
                tiempoActual += ctxt;
                gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoActual, razon: `Cambio de contexto.` });
            }

            let inicioProc = tiempoActual;
            tiempoActual += p.teje;

            gantt.push({ tipo: 'proceso', id: p.id, color: p.color, duracion: p.teje, inicio: inicioProc, fin: tiempoActual, razon: `Se ejecuta ${p.id}`, esFinal: true });

            // ✨ FÓRMULA UNIVERSAL
            let tret = tiempoActual - p.tlleg; 
            let tesp = tret - p.teje;          
            stats.push({ id: p.id, tf: tiempoActual, tret, tesp });

            pendientes = pendientes.filter(x => x.id !== p.id);
            ultimoProcesoId = p.id;
        } else {
            let proximo = [...pendientes].sort((a, b) => a.tlleg - b.tlleg)[0];
            gantt.push({ tipo: 'idle', duracion: proximo.tlleg - tiempoActual, inicio: tiempoActual, fin: proximo.tlleg, razon: "CPU inactiva." });
            tiempoActual = proximo.tlleg;
            ultimoProcesoId = null;
        }
    }

    return { gantt, stats };
}

export function simularRR(procesos, ctxt, quantum) {
    let gantt = [];
    let stats = [];
    let tiempoActual = 0;
    
    if (ctxt > 0) {
        gantt.push({ tipo: 'cs', duracion: ctxt, inicio: 0, fin: ctxt, razon: 'Arranque del SO' });
        tiempoActual = ctxt;
    }
    
    let pendientes = procesos.map(p => ({ ...p, tejeRestante: p.teje }));
    pendientes.sort((a, b) => a.tlleg !== b.tlleg ? a.tlleg - b.tlleg : a.id.localeCompare(b.id));

    let cola = [];
    let indexLlegadas = 0;
    let ultimoProcesoId = null;
    let esPrimerProceso = true;

    const encolarLlegadas = (hastaTiempo, estrictoMenor = false) => {
        while (indexLlegadas < pendientes.length) {
            let llega = pendientes[indexLlegadas].tlleg;
            if (estrictoMenor ? llega < hastaTiempo : llega <= hastaTiempo) {
                cola.push(pendientes[indexLlegadas]);
                indexLlegadas++;
            } else break;
        }
    };

    encolarLlegadas(tiempoActual, false);

    while (cola.length > 0 || indexLlegadas < pendientes.length) {
        if (cola.length === 0) {
            let proximo = pendientes[indexLlegadas];
            gantt.push({ tipo: 'idle', duracion: proximo.tlleg - tiempoActual, inicio: tiempoActual, fin: proximo.tlleg, razon: "CPU Inactiva." });
            tiempoActual = proximo.tlleg;
            ultimoProcesoId = null;
            encolarLlegadas(tiempoActual, false);
        }

        let p = cola.shift(); 

        if (esPrimerProceso) { ultimoProcesoId = p.id; esPrimerProceso = false; }

        if (ultimoProcesoId !== null && ultimoProcesoId !== p.id && ctxt > 0) {
            let inicioCs = tiempoActual;
            tiempoActual += ctxt;
            gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoActual, razon: `Cambio de Contexto` });
            encolarLlegadas(tiempoActual, false); 
        }

        let tiempoEjecucion = Math.min(p.tejeRestante, quantum);
        let inicioProc = tiempoActual;
        tiempoActual += tiempoEjecucion;
        p.tejeRestante -= tiempoEjecucion;

        let termino = p.tejeRestante === 0;
        gantt.push({
             tipo: 'proceso', id: p.id, color: p.color, duracion: tiempoEjecucion,
             inicio: inicioProc, fin: tiempoActual, razon: `Ejecuta ${p.id}`, esFinal: termino
        });

        encolarLlegadas(tiempoActual, true);

        if (!termino) {
            cola.push(p);
        } else {
            // ✨ FÓRMULA UNIVERSAL
            let tret = tiempoActual - p.tlleg;
            let tesp = tret - p.teje;
            stats.push({ id: p.id, tf: tiempoActual, tret, tesp });
        }

        encolarLlegadas(tiempoActual, false);
        ultimoProcesoId = p.id;
    }

    return { gantt, stats };
}

export function simularMLQ(procesos, ctxt, quantums) {
    let gantt = [];
    let stats = [];
    let globalTicket = 0; 

    // Mantenemos p.tlleg (Llegada original) intacta para la estadística final
    let procesosActivos = procesos.map(p => ({
        ...p,
        tejeRestante: p.teje,
        tllegCola: p.tlleg, 
        ticket: 0 
    }));

    let numColas = quantums.length;
    
    for (let q = 0; q < numColas; q++) {
        let quantum = quantums[q];
        let sobrantesSiguienteCola = [];
        let ultimoProcesoId = null;

        procesosActivos.sort((a, b) => {
            if (a.tllegCola !== b.tllegCola) return a.tllegCola - b.tllegCola;
            if (a.ticket !== b.ticket) return a.ticket - b.ticket;
            return a.id.localeCompare(b.id);
        });
        
        let tiempoQ = 0;
        if (q === 0) {
            if (ctxt > 0) {
                gantt.push({ tipo: 'cs', duracion: ctxt, inicio: 0, fin: ctxt, colaExec: 1, razon: 'Arranque SO' });
                tiempoQ = ctxt;
            }
        } else {
            tiempoQ = procesosActivos.length > 0 ? procesosActivos[0].tllegCola : 0;
        }
        
        let cola = [];
        let indexLlegadas = 0;
        let primerTiempoCaida = null; 
        let esPrimerProcesoDeLaCola = true;

        const encolar = (hastaTiempo, estrictoMenor = false) => {
            while (indexLlegadas < procesosActivos.length) {
                let llega = procesosActivos[indexLlegadas].tllegCola;
                if (estrictoMenor ? llega < hastaTiempo : llega <= hastaTiempo) {
                    cola.push(procesosActivos[indexLlegadas]);
                    indexLlegadas++;
                } else break;
            }
        };

        encolar(tiempoQ, false);

        while (cola.length > 0 || indexLlegadas < procesosActivos.length) {
            if (cola.length === 0) {
                let proximo = procesosActivos[indexLlegadas];
                let inicioIdle = tiempoQ;
                tiempoQ = proximo.tllegCola;
                gantt.push({ tipo: 'idle', duracion: tiempoQ - inicioIdle, inicio: inicioIdle, fin: tiempoQ, colaExec: q + 1, razon: 'Inactiva' });
                ultimoProcesoId = null; 
                encolar(tiempoQ, false);
            }

            let p = cola.shift();

            if (esPrimerProcesoDeLaCola) { ultimoProcesoId = p.id; esPrimerProcesoDeLaCola = false; }

            if (ultimoProcesoId !== null && ultimoProcesoId !== p.id && ctxt > 0) {
                let inicioCs = tiempoQ;
                tiempoQ += ctxt;
                gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoQ, colaExec: q + 1, razon: 'Cambio de contexto' });
                encolar(tiempoQ, false); 
            }

            let tiempoEjecucion = Math.min(p.tejeRestante, quantum);
            let inicioProc = tiempoQ;
            
            tiempoQ += tiempoEjecucion;
            p.tejeRestante -= tiempoEjecucion;

            let termino = p.tejeRestante === 0;
            let seQuedaEnMismaCola = !termino && (p.tejeRestante <= quantum);

            gantt.push({
                tipo: 'proceso', id: p.id, color: p.color, duracion: tiempoEjecucion,
                inicio: inicioProc, fin: tiempoQ, razon: termino ? `Termina Q${q+1}` : `Agota Quantum`, esFinal: termino, colaExec: q + 1
            });

            encolar(tiempoQ, true);

            if (termino) {
                let tret = tiempoQ - p.tlleg;
                let tesp = tret - p.teje;
                stats.push({ id: p.id, tf: tiempoQ, tret, tesp });
            } else if (seQuedaEnMismaCola) {
                p.tllegCola = tiempoQ; 
                p.ticket = ++globalTicket; 
                cola.push(p); 
            } else {
                p.tllegCola = tiempoQ;
                p.ticket = ++globalTicket; 
                sobrantesSiguienteCola.push(p);
            }

            encolar(tiempoQ, false);
            ultimoProcesoId = p.id;
        }
        
        procesosActivos = [...sobrantesSiguienteCola];
        if (procesosActivos.length === 0) break;
    }

    // 3. LA COLA FINAL FCFS
    if (procesosActivos.length > 0) {
        let qFCFS = numColas + 1;
        let ultimoProcesoId = null;
        
        procesosActivos.sort((a, b) => {
            if (a.tllegCola !== b.tllegCola) return a.tllegCola - b.tllegCola;
            if (a.ticket !== b.ticket) return a.ticket - b.ticket;
            return a.id.localeCompare(b.id);
        });
        
        let tiempoQ = procesosActivos.length > 0 ? procesosActivos[0].tllegCola : 0;
        let cola = [];
        let indexLlegadas = 0;
        let esPrimerProcesoDeLaCola = true;

        const encolar = (hastaTiempo) => {
            while (indexLlegadas < procesosActivos.length) {
                if (procesosActivos[indexLlegadas].tllegCola <= hastaTiempo) {
                    cola.push(procesosActivos[indexLlegadas]);
                    indexLlegadas++;
                } else break;
            }
        };

        encolar(tiempoQ);

        while (cola.length > 0 || indexLlegadas < procesosActivos.length) {
            if (cola.length === 0) {
                let proximo = procesosActivos[indexLlegadas];
                let inicioIdle = tiempoQ;
                tiempoQ = proximo.tllegCola;
                gantt.push({ tipo: 'idle', duracion: tiempoQ - inicioIdle, inicio: inicioIdle, fin: tiempoQ, colaExec: qFCFS, razon: 'Inactiva' });
                ultimoProcesoId = null;
                encolar(tiempoQ);
            }

            let p = cola.shift();

            if (esPrimerProcesoDeLaCola) { ultimoProcesoId = p.id; esPrimerProcesoDeLaCola = false; }
            
            if (ultimoProcesoId !== null && ultimoProcesoId !== p.id && ctxt > 0) {
                let inicioCs = tiempoQ;
                tiempoQ += ctxt;
                gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoQ, colaExec: qFCFS, razon: 'Cambio de contexto' });
                encolar(tiempoQ);
            }

            let tiempoEjecucion = p.tejeRestante; 
            let inicioProc = tiempoQ;
            
            tiempoQ += tiempoEjecucion;
            p.tejeRestante = 0;

            gantt.push({
                tipo: 'proceso', id: p.id, color: p.color, duracion: tiempoEjecucion,
                inicio: inicioProc, fin: tiempoQ, razon: `Termina en FCFS`, esFinal: true, colaExec: qFCFS
            });

            let tret = tiempoQ - p.tlleg;
            let tesp = tret - p.teje;
            stats.push({ id: p.id, tf: tiempoQ, tret, tesp });

            encolar(tiempoQ);
            ultimoProcesoId = p.id;
        }
    }

    gantt.sort((a, b) => a.colaExec - b.colaExec || a.inicio - b.inicio);
    return { gantt, stats };
}