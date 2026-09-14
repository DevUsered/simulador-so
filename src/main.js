import { simularFCFS } from './scheduler.js';

const colores = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
let contadorProcesos = 1;

// Escuchar el click del botón Simular
document.getElementById('btn-simular').addEventListener('click', () => {
    const cs = parseInt(document.getElementById('cs').value) || 0;
    const algoritmo = document.getElementById('algoritmo').value;
    
    // Leer tabla del HTML (simplificado para el ejemplo)
    const filas = document.querySelectorAll('#tabla-procesos tbody tr');
    let procesos = Array.from(filas).map((fila, index) => ({
        id: fila.cells[0].innerText,
        tl: parseInt(fila.querySelector('.tl').value) || 0,
        tr: parseInt(fila.querySelector('.tr').value) || 1,
        color: colores[index % colores.length]
    }));

    let resultado;
    if (algoritmo === 'FCFS') {
        resultado = simularFCFS(procesos, cs);
    }

    if (resultado) {
        renderizar(resultado.gantt, resultado.estadisticas);
    }
});

function renderizar(gantt, stats) {
    // Aquí va la lógica para inyectar los divs del Gantt en el HTML
    // (Exactamente igual a la función renderizar del ejemplo anterior)
    console.log("Gantt generado:", gantt);
    console.log("Estadísticas:", stats);
}