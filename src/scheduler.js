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