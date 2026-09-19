export function simularFCFS(procesos, ctxt) {
    let gantt = [];
    let stats = [];
    let tiempoActual = 0;
    let listos = [...procesos].sort((a, b) => a.tlleg - b.tlleg);

    listos.forEach((p, index) => {
        if (tiempoActual < p.tlleg) {
            gantt.push({ tipo: 'idle', duracion: p.tlleg - tiempoActual, inicio: tiempoActual, fin: p.tlleg, razon: "La CPU está sin uso esperando a que llegue algún proceso a la cola de listos." });
            tiempoActual = p.tlleg;
        }

        let inicioProc = tiempoActual;
        tiempoActual += p.teje;
        
        // Explicación específica de FCFS
        let msj = `Se ejecuta <b>${p.id}</b> por ser el primero en la cola (Llegó en t=${p.tlleg}).`;
        
        gantt.push({ tipo: 'proceso', id: p.id, color: p.color, duracion: p.teje, inicio: inicioProc, fin: tiempoActual, razon: msj, esFinal: true });

        let tret = tiempoActual - p.tlleg; 
        let tesp = tret - p.teje;          
        stats.push({ id: p.id, tf: tiempoActual, tret, tesp });

        if (ctxt > 0 && index < listos.length - 1) {
            let inicioCs = tiempoActual;
            tiempoActual += ctxt;
            gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoActual, razon: `El S.O. realiza un cambio de contexto (${ctxt} ut).` });
        }
    });

    return { gantt, stats };
}

export function simularSJF(procesos, ctxt) {
    let gantt = [];
    let stats = [];
    let tiempoActual = 0;
    let pendientes = [...procesos];

    while (pendientes.length > 0) {
        let disponibles = pendientes.filter(p => p.tlleg <= tiempoActual);

        if (disponibles.length > 0) {
            disponibles.sort((a, b) => {
                if (a.teje !== b.teje) return a.teje - b.teje; 
                if (a.tlleg !== b.tlleg) return a.tlleg - b.tlleg; 
                return a.id.localeCompare(b.id); 
            });

            let p = disponibles[0];

            // ---- MAGIA: EXPLICACIÓN ESPECÍFICA DE SJF ----
            let msj = "";
            if (disponibles.length === 1) {
                msj = `La cola solo tiene a <b>${p.id}</b>. Toma la CPU al ser el único disponible.`;
            } else {
                let competidores = disponibles.slice(1).map(x => `${x.id}(Tr=${x.teje})`).join(', ');
                msj = `En cola están: <b>${p.id}</b> y [${competidores}]. Se elige a <b>${p.id}</b> por tener el tiempo de ejecución más corto (${p.teje} ut).`;
            }

            let inicioProc = tiempoActual;
            tiempoActual += p.teje;

            gantt.push({ tipo: 'proceso', id: p.id, color: p.color, duracion: p.teje, inicio: inicioProc, fin: tiempoActual, razon: msj, esFinal: true });

            let tret = tiempoActual - p.tlleg; 
            let tesp = tret - p.teje;          
            stats.push({ id: p.id, tf: tiempoActual, tret, tesp });

            pendientes = pendientes.filter(x => x.id !== p.id);

            if (ctxt > 0 && pendientes.length > 0) {
                let inicioCs = tiempoActual;
                tiempoActual += ctxt;
                gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoActual, razon: `El S.O. realiza un cambio de contexto (${ctxt} ut).` });
            }
        } else {
            let proximo = [...pendientes].sort((a, b) => a.tlleg - b.tlleg)[0];
            gantt.push({ tipo: 'idle', duracion: proximo.tlleg - tiempoActual, inicio: tiempoActual, fin: proximo.tlleg, razon: "La cola de listos está vacía. CPU inactiva esperando llegadas." });
            tiempoActual = proximo.tlleg;
        }
    }

    return { gantt, stats };
}
export function simularRR(procesos, ctxt, quantum) {
    let gantt = [];
    let stats = [];
    let tiempoActual = 0;
    
    // Clonamos agregando la variable "tejeRestante" para saber cuánto le falta
    let pendientes = procesos.map(p => ({ ...p, tejeRestante: p.teje }));
    pendientes.sort((a, b) => a.tlleg !== b.tlleg ? a.tlleg - b.tlleg : a.id.localeCompare(b.id));

    let cola = [];
    let indexLlegadas = 0;

    // Función interna para meter a la cola a los que van llegando en el tiempo actual
    const encolarLlegadas = (hastaTiempo) => {
        while (indexLlegadas < pendientes.length && pendientes[indexLlegadas].tlleg <= hastaTiempo) {
            cola.push(pendientes[indexLlegadas]);
            indexLlegadas++;
        }
    };

    encolarLlegadas(tiempoActual);

    while (cola.length > 0 || indexLlegadas < pendientes.length) {
        if (cola.length === 0) {
            let proximo = pendientes[indexLlegadas];
            gantt.push({ tipo: 'idle', duracion: proximo.tlleg - tiempoActual, inicio: tiempoActual, fin: proximo.tlleg, razon: "CPU Inactiva. Esperando que llegue un proceso." });
            tiempoActual = proximo.tlleg;
            encolarLlegadas(tiempoActual);
        }

        // Sacamos al primero de la fila
        let p = cola.shift(); 

        // Calculamos cuánto tiempo se va a ejecutar (lo que le falte o el Quantum, lo que sea menor)
        let tiempoEjecucion = Math.min(p.tejeRestante, quantum);
        let inicioProc = tiempoActual;
        tiempoActual += tiempoEjecucion;
        p.tejeRestante -= tiempoEjecucion;

        // Armamos la explicación
        let msj = p.tejeRestante > 0
            ? `<b>${p.id}</b> consume su Quantum (${tiempoEjecucion} ut). Aún le faltan ${p.tejeRestante} ut, por lo que vuelve al final de la cola.`
            : `<b>${p.id}</b> se ejecuta por ${tiempoEjecucion} ut y <b>termina</b> por completo su ejecución.`;

        let procesoTermino = (p.tejeRestante === 0)
        gantt.push({
             tipo: 'proceso', 
             id: p.id,
              color: p.color, 
              duracion: tiempoEjecucion,
               inicio: inicioProc, 
               fin: tiempoActual, 
               razon: msj,
            esFinal: procesoTermino
            });

        encolarLlegadas(tiempoActual);

        // Luego, si el proceso actual no ha terminado, lo mandamos al final de la fila
        if (p.tejeRestante > 0) {
            cola.push(p);
        } else {
            let tret = tiempoActual - p.tlleg;
            let tesp = tret - p.teje;
            stats.push({ id: p.id, tf: tiempoActual, tret, tesp });
        }

        // Cambio de contexto (Solo si hay alguien más esperando en la cola)
        if (ctxt > 0 && cola.length > 0) {
            let inicioCs = tiempoActual;
            tiempoActual += ctxt;
            gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoActual, razon: `El S.O. pausa el proceso y hace Cambio de Contexto (${ctxt} ut).` });
            
            // Revisamos si alguien llegó durante el cambio de contexto
            encolarLlegadas(tiempoActual); 
        }
    }

    return { gantt, stats };
}
export function simularPR(procesos, ctxt) {
    let gantt = [];
    let stats = [];
    let tiempoActual = 0;
    let pendientes = [...procesos];

    while (pendientes.length > 0) {
        let disponibles = pendientes.filter(p => p.tlleg <= tiempoActual);

        if (disponibles.length > 0) {
            // Ordenar por prioridad (MAYOR número = MAYOR prioridad)
            disponibles.sort((a, b) => {
                // ¡AQUÍ ESTÁ EL CAMBIO! b.prio - a.prio pone los números más grandes primero
                if (a.prio !== b.prio) return b.prio - a.prio; 
                // Desempate 1: El que llegó primero
                if (a.tlleg !== b.tlleg) return a.tlleg - b.tlleg; 
                // Desempate 2: Orden alfabético
                return a.id.localeCompare(b.id); 
            });

            let p = disponibles[0];

            let msj = "";
            if (disponibles.length === 1) {
                msj = `La cola solo tiene a <b>${p.id}</b>. Toma la CPU al ser el único disponible.`;
            } else {
                let competidores = disponibles.slice(1).map(x => `${x.id}(Pr=${x.prio})`).join(', ');
                msj = `En cola están: <b>${p.id}</b> y [${competidores}]. Se elige a <b>${p.id}</b> por tener la prioridad más alta (Nivel: ${p.prio}).`;
            }

            let inicioProc = tiempoActual;
            tiempoActual += p.teje;

            gantt.push({ tipo: 'proceso', id: p.id, color: p.color, duracion: p.teje, inicio: inicioProc, fin: tiempoActual, razon: msj, esFinal: true });

            let tret = tiempoActual - p.tlleg; 
            let tesp = tret - p.teje;          
            stats.push({ id: p.id, tf: tiempoActual, tret, tesp });

            pendientes = pendientes.filter(x => x.id !== p.id);

            if (ctxt > 0 && pendientes.length > 0) {
                let inicioCs = tiempoActual;
                tiempoActual += ctxt;
                gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoActual, razon: `El S.O. realiza un cambio de contexto (${ctxt} ut).` });
            }
        } else {
            let proximo = [...pendientes].sort((a, b) => a.tlleg - b.tlleg)[0];
            gantt.push({ tipo: 'idle', duracion: proximo.tlleg - tiempoActual, inicio: tiempoActual, fin: proximo.tlleg, razon: "La cola de listos está vacía. CPU inactiva esperando llegadas." });
            tiempoActual = proximo.tlleg;
        }
    }

    return { gantt, stats };
}
export function simularMLQ(procesos, ctxt, quantums) {
    let gantt = [];
    let stats = [];

    // 1. Preparar estado inicial
    let procesosActivos = procesos.map(p => ({
        ...p,
        tejeRestante: p.teje,
        tllegCola: p.tlleg // En Q1, llegan en su Tlleg original
    }));

    let numColas = quantums.length;
    
    // 2. Resolver cada cola de forma independiente (Pipeline)
    for (let q = 0; q < numColas; q++) {
        let quantum = quantums[q];
        let sobrantesSiguienteCola = [];
        let tiempoQ = 0; // Reloj independiente exclusivo para esta cola
        let ultimoProcesoId = null; // Para controlar si aplicamos cambio de contexto

        procesosActivos.sort((a, b) => a.tllegCola !== b.tllegCola ? a.tllegCola - b.tllegCola : a.id.localeCompare(b.id));
        let pendientes = [...procesosActivos];

        while (pendientes.length > 0) {
            let disponibles = pendientes.filter(p => p.tllegCola <= tiempoQ);

            if (disponibles.length > 0) {
                let p = disponibles[0];

                // REGLA DE CAMBIO DE CONTEXTO: Solo se aplica si el proceso actual es DIFERENTE al último que se ejecutó
                if (ultimoProcesoId !== null && ultimoProcesoId !== p.id && ctxt > 0) {
                    let inicioCs = tiempoQ;
                    tiempoQ += ctxt;
                    gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoQ, colaExec: q + 1, razon: 'Cambio de contexto' });
                    
                    // Al avanzar el tiempo por el ctxt, recalculamos quién está disponible
                    disponibles = pendientes.filter(x => x.tllegCola <= tiempoQ);
                    p = disponibles[0]; // Tomamos al primero (puede seguir siendo el mismo u otro que haya llegado)
                }

                let tiempoEjecucion = Math.min(p.tejeRestante, quantum);
                let inicioProc = tiempoQ;
                tiempoQ += tiempoEjecucion;
                p.tejeRestante -= tiempoEjecucion;

                let termino = p.tejeRestante === 0;
                // REGLA DE RETENCIÓN: Si no ha terminado y lo que le falta es <= al quantum actual, se queda en esta misma cola
                let seQuedaEnMismaCola = !termino && (p.tejeRestante <= quantum);

                gantt.push({
                    tipo: 'proceso', id: p.id, color: p.color, duracion: tiempoEjecucion,
                    inicio: inicioProc, fin: tiempoQ,
                    razon: termino ? `Termina en Q${q+1}` : (seQuedaEnMismaCola ? `Retenido en Q${q+1} (restante <= Q)` : `Agota Quantum en Q${q+1}`),
                    esFinal: termino, colaExec: q + 1
                });

                pendientes = pendientes.filter(x => x.id !== p.id);

                if (termino) {
                    let tret = tiempoQ - p.tlleg;
                    let tesp = tret - p.teje;
                    stats.push({ id: p.id, tf: tiempoQ, tret, tesp });
                } else if (seQuedaEnMismaCola) {
                    // Da otra vuelta en ESTA MISMA cola (se va al final de la fila actualizando su tiempo de llegada)
                    p.tllegCola = tiempoQ;
                    pendientes.push(p);
                    pendientes.sort((a, b) => a.tllegCola !== b.tllegCola ? a.tllegCola - b.tllegCola : a.id.localeCompare(b.id));
                } else {
                    // Cae a la SIGUIENTE cola. Su tiempo de llegada abajo es exactamente el tiempo de salida de aquí
                    p.tllegCola = tiempoQ; 
                    sobrantesSiguienteCola.push(p);
                }

                // Guardamos el ID del proceso que acaba de usar la CPU
                ultimoProcesoId = p.id;

            } else {
                // Si no hay nadie disponible, la CPU queda inactiva hasta que llegue el próximo
                let proximo = pendientes[0];
                let inicioIdle = tiempoQ;
                tiempoQ = proximo.tllegCola;
                gantt.push({ tipo: 'idle', duracion: tiempoQ - inicioIdle, inicio: inicioIdle, fin: tiempoQ, colaExec: q + 1, razon: 'Inactiva' });
                
                // Reiniciamos el último proceso porque la CPU se apagó (al despertar no cobra ctxt inmediatamente en la teoría clásica)
                ultimoProcesoId = null; 
            }
        }
        
        // Lo que sobró y no se retuvo, pasa a la siguiente cola
        procesosActivos = [...sobrantesSiguienteCola];
        if (procesosActivos.length === 0) break;
    }

    // 3. LA COLA FINAL FCFS (Si agotaron todos los quantums de todas las colas)
    if (procesosActivos.length > 0) {
        let qFCFS = numColas + 1;
        let tiempoQ = 0;
        let ultimoProcesoId = null;
        
        procesosActivos.sort((a, b) => a.tllegCola !== b.tllegCola ? a.tllegCola - b.tllegCola : a.id.localeCompare(b.id));
        let pendientes = [...procesosActivos];

        while (pendientes.length > 0) {
            let disponibles = pendientes.filter(p => p.tllegCola <= tiempoQ);

            if (disponibles.length > 0) {
                let p = disponibles[0];
                
                if (ultimoProcesoId !== null && ultimoProcesoId !== p.id && ctxt > 0) {
                    let inicioCs = tiempoQ;
                    tiempoQ += ctxt;
                    gantt.push({ tipo: 'cs', duracion: ctxt, inicio: inicioCs, fin: tiempoQ, colaExec: qFCFS, razon: 'Cambio de contexto FCFS' });
                    disponibles = pendientes.filter(x => x.tllegCola <= tiempoQ);
                    p = disponibles[0];
                }

                let tiempoEjecucion = p.tejeRestante; // En FCFS corre todo lo que le falta hasta terminar
                let inicioProc = tiempoQ;
                tiempoQ += tiempoEjecucion;
                p.tejeRestante = 0;

                gantt.push({
                    tipo: 'proceso', id: p.id, color: p.color, duracion: tiempoEjecucion,
                    inicio: inicioProc, fin: tiempoQ, razon: `Termina en cola FCFS final`, esFinal: true, colaExec: qFCFS
                });

                pendientes = pendientes.filter(x => x.id !== p.id);

                let tret = tiempoQ - p.tlleg;
                let tesp = tret - p.teje;
                stats.push({ id: p.id, tf: tiempoQ, tret, tesp });

                ultimoProcesoId = p.id;
            } else {
                let proximo = pendientes[0];
                let inicioIdle = tiempoQ;
                tiempoQ = proximo.tllegCola;
                gantt.push({ tipo: 'idle', duracion: tiempoQ - inicioIdle, inicio: inicioIdle, fin: tiempoQ, colaExec: qFCFS, razon: 'Inactiva' });
                ultimoProcesoId = null;
            }
        }
    }

    gantt.sort((a, b) => a.inicio - b.inicio);
    return { gantt, stats };
}