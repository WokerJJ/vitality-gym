/**
 * Controlador de Reportes - Frontend
 * Gimnasio Vitality
 */

const API_URL = '/api';

// Función fetch con manejo de errores 429
async function fetchConManejo(url, options = {}) {
    try {
        const response = await fetch(url, options);

        if (response.status === 429) {
            console.warn('Rate limit alcanzado. Esperando...');
            alert('Demasiadas peticiones. Por favor espere un momento.');
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error en fetch:', error);
        throw error;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Set fechas por defecto (último mes)
    const hoy = new Date();
    const mesPasado = new Date();
    mesPasado.setMonth(mesPasado.getMonth() - 1);

    document.getElementById('fecha_fin').valueAsDate = hoy;
    document.getElementById('fecha_inicio').valueAsDate = mesPasado;

    // Cargar reportes iniciales
    cargarReporteIngresos();
    cargarMembresiasPorVencer();
    cargarMembresiasMasVendidas();

    // Botón generar reporte
    document.getElementById('btnGenerarReporte').addEventListener('click', cargarReporteIngresos);
});

// Cargar reporte de ingresos
async function cargarReporteIngresos() {
    const fechaInicio = document.getElementById('fecha_inicio').value;
    const fechaFin = document.getElementById('fecha_fin').value;

    try {
        let url = `${API_URL}/reportes/ingresos`;
        if (fechaInicio && fechaFin) {
            url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
        }

        const result = await fetchConManejo(url);

        if (result && result.success) {
            // Actualizar resumen
            document.getElementById('total-ingresos').textContent = `$${formatearMoneda(result.resumen.total_general)}`;
            document.getElementById('total-transacciones').textContent = result.resumen.total_transacciones;

            // Renderizar tabla
            const tbody = document.getElementById('tabla-ingresos');
            if (result.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No hay datos para el período seleccionado</td></tr>`;
            } else {
                tbody.innerHTML = result.data.map(row => `
                    <tr>
                        <td>${formatearFecha(row.fecha)}</td>
                        <td><span class="badge badge-vitality badge-info">${row.metodo_pago}</span></td>
                        <td>${row.cantidad_transacciones}</td>
                        <td class="text-end text-success fw-bold">$${formatearMoneda(row.total)}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando reporte:', error);
    }
}

// Cargar membresías por vencer
async function cargarMembresiasPorVencer() {
    try {
        const result = await fetchConManejo(`${API_URL}/reportes/membresias`);

        if (result && result.success) {
            const tbody = document.getElementById('tabla-por-vencer');
            const porVencer = result.data.por_vencer;

            document.getElementById('membresias-vendidas').textContent =
                result.data.estadisticas.reduce((sum, e) => sum + parseInt(e.total_vendidas), 0);

            if (porVencer.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">No hay membresías por vencer</td></tr>`;
            } else {
                tbody.innerHTML = porVencer.slice(0, 10).map(m => `
                    <tr>
                        <td>${m.nombre_completo}</td>
                        <td>${formatearFecha(m.fecha_fin)}</td>
                        <td>
                            <span class="badge badge-vitality ${m.dias_restantes <= 3 ? 'badge-vencido' : 'badge-por-vencer'}">
                                ${m.dias_restantes} días
                            </span>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando por vencer:', error);
    }
}

// Cargar membresías más vendidas
async function cargarMembresiasMasVendidas() {
    try {
        const result = await fetchConManejo(`${API_URL}/reportes/ingresos?grupo=tipo`);

        if (result && result.success) {
            const tbody = document.getElementById('tabla-mas-vendidas');

            if (result.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">No hay datos</td></tr>`;
            } else {
                tbody.innerHTML = result.data.map(row => `
                    <tr>
                        <td>${row.tipo_membresia}</td>
                        <td><span class="badge badge-vitality badge-activo">${row.cantidad_vendidas}</span></td>
                        <td class="text-success fw-bold">$${formatearMoneda(row.total_recaudado)}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando más vendidas:', error);
    }
}

// Utilidades
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO').format(valor || 0);
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
}
