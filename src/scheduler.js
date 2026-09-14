// Exportamos la función principal de FCFS
export function simularFCFS(procesos, cs) {
    let gantt = [];
    let stats = [];
    let tiempoActual = 0;

    // Clonar y ordenar por Tiempo de Llegada
    let listos = [...procesos].sort((a, b) => a.tl - b.tl);

    listos.forEach((p, index) => {
        if (tiempoActual < p.tl) {
            gantt.push({ tipo: 'idle', duracion: p.tl - tiempoActual, inicio: tiempoActual, fin: p.tl });
            tiempoActual = p.tl;
        }

        let inicioProc = tiempoActual;
        tiempoActual += p.tr;
        gantt.push({ tipo: 'proceso', id: p.id, color: p.color, duracion: p.tr, inicio: inicioProc, fin: tiempoActual });

        let tret = tiempoActual - p.tl;
        let te = tret - p.tr;
        stats.push({ id: p.id, tf: tiempoActual, tret: tret, te: te });

        if (cs > 0 && index < listos.length - 1) {
            let inicioCs = tiempoActual;
            tiempoActual += cs;
            gantt.push({ tipo: 'cs', duracion: cs, inicio: inicioCs, fin: tiempoActual });
        }
    });

    return { gantt, estadisticas: stats };
}