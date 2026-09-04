/**
 * Controlador de Accesos - Frontend
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
    cargarAccesosHoy();
    // Actualizar cada 60 segundos (aumentado de 30)
    const intervalId = setInterval(cargarAccesosHoy, 60000);

    // Limpiar intervalo al salir de la página
    window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
    });

    // Enfocar input
    document.getElementById('identificacion_acceso').focus();

    // Event listener para el formulario
    document.getElementById('formAcceso').addEventListener('submit', validarAcceso);
});

// Validar acceso
async function validarAcceso(event) {
    event.preventDefault();

    const identificacion = document.getElementById('identificacion_acceso').value.trim();
    if (!identificacion) return;

    try {
        const result = await fetchConManejo(`${API_URL}/accesos/entrada`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificacion })
        });

        if (result) {
            mostrarResultado(result);
        }

        // Limpiar input y recargar tabla
        document.getElementById('identificacion_acceso').value = '';
        document.getElementById('identificacion_acceso').focus();
        cargarAccesosHoy();

    } catch (error) {
        console.error('Error validando acceso:', error);
        mostrarResultado({ success: false, tieneAcceso: false, message: 'Error de conexión' });
    }
}

// Mostrar resultado
function mostrarResultado(result) {
    const container = document.getElementById('resultado-acceso');
    const contenido = document.getElementById('resultado-contenido');

    container.style.display = 'block';

    if (result.tieneAcceso) {
        // Acceso permitido
        const membresia = result.membresia || {};
        const diasRestantes = membresia.fecha_fin ?
            Math.ceil((new Date(membresia.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

        contenido.innerHTML = `
            <div class="resultado-acceso">
                <div class="acceso-status permitido mb-3">
                    <i class="bi bi-check-lg"></i>
                </div>
                <h3 class="text-success mb-2">¡Acceso Permitido!</h3>
                <h4 class="text-white mb-3">${result.miembro?.nombre_completo || ''}</h4>
                ${result.membresia ? `
                    <div class="card card-vitality p-3 mb-3 w-100">
                        <div class="text-start">
                            <p class="mb-1"><strong class="text-success">Membresía:</strong> ${membresia.tipo_membresia}</p>
                            <p class="mb-1"><strong class="text-success">Vence:</strong> ${formatearFecha(membresia.fecha_fin)}</p>
                            <p class="mb-0"><strong class="text-success">Días restantes:</strong> ${diasRestantes}</p>
                        </div>
                    </div>
                ` : ''}
                <div class="text-muted mt-2">${new Date().toLocaleTimeString('es-ES')}</div>
            </div>
        `;
    } else {
        // Acceso denegado
        contenido.innerHTML = `
            <div class="resultado-acceso">
                <div class="acceso-status denegado mb-3">
                    <i class="bi bi-x-lg"></i>
                </div>
                <h3 class="text-danger mb-2">Acceso Denegado</h3>
                ${result.miembro ? `
                    <h5 class="text-white mb-3">${result.miembro.nombre_completo}</h5>
                    <div class="alert alert-danger-vitality">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        ${result.mensaje || 'No tiene membresía activa'}
                    </div>
                ` : `
                    <p class="text-muted">Miembro no encontrado</p>
                `}
            </div>
        `;
    }

    // Ocultar después de 5 segundos
    setTimeout(() => {
        container.style.display = 'none';
    }, 5000);
}

// Cargar accesos de hoy
async function cargarAccesosHoy() {
    try {
        const result = await fetchConManejo(`${API_URL}/accesos?hoy=true`);

        if (result && result.success) {
            renderizarAccesos(result.data);
        }
    } catch (error) {
        console.error('Error cargando accesos:', error);
    }
}

// Renderizar accesos
function renderizarAccesos(accesos) {
    document.getElementById('contador-hoy').textContent = accesos.length;
    const tbody = document.getElementById('tabla-accesos-hoy');

    if (accesos.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="4" class="text-center py-4 text-muted">No hay accesos registrados hoy</td></tr>
        `;
        return;
    }

    tbody.innerHTML = accesos.slice(0, 10).map(a => {
        const hora = new Date(a.fecha_hora_entrada).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
        <tr>
            <td><span class="text-success">${hora}</span></td>
            <td>${a.nombre_completo}</td>
            <td>${a.tipo_membresia || 'N/A'}</td>
            <td>
                <span class="badge badge-vitality ${a.validado ? 'badge-activo' : 'badge-vencido'}">
                    ${a.validado ? '✓ Válido' : '✗ Inválido'}
                </span>
            </td>
        </tr>
        `;
    }).join('');
}

// Utilidades
function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
}
