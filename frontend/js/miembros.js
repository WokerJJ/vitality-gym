/**
 * Controlador de Miembros - Frontend
 * Gimnasio Vitality
 */

const API_URL = '/api';
let miembrosData = [];
let modalInstance = null;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    modalInstance = new bootstrap.Modal(document.getElementById('modalMiembro'));
    cargarMiembros();

    // Búsqueda en tiempo real
    document.getElementById('busqueda').addEventListener('input', debounce(() => {
        cargarMiembros(document.getElementById('busqueda').value);
    }, 300));

    // Botón guardar
    document.getElementById('btnGuardarMiembro').addEventListener('click', guardarMiembro);

    // Event delegation para botones de editar/eliminar
    document.getElementById('tabla-miembros').addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.btn-editar');
        const btnEliminar = e.target.closest('.btn-eliminar');

        if (btnEditar) {
            const id = btnEditar.getAttribute('data-id');
            editarMiembro(id);
        } else if (btnEliminar) {
            const id = btnEliminar.getAttribute('data-id');
            eliminarMiembro(id);
        }
    });

    // Reset formulario al cerrar modal
    document.getElementById('modalMiembro').addEventListener('hidden.bs.modal', resetForm);
});

// Función fetch con manejo de errores
async function fetchConManejo(url, options = {}) {
    try {
        const response = await fetch(url, options);

        if (response.status === 429) {
            console.warn('Rate limit alcanzado. Esperando...');
            mostrarError('Demasiadas peticiones. Por favor espere un momento.');
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

// Cargar miembros
async function cargarMiembros(busqueda = '') {
    try {
        const url = busqueda ? `${API_URL}/miembros?busqueda=${encodeURIComponent(busqueda)}` : `${API_URL}/miembros`;
        const result = await fetchConManejo(url);

        if (result && result.success) {
            miembrosData = result.data;
            renderizarTabla(result.data);
        }
    } catch (error) {
        console.error('Error cargando miembros:', error);
    }
}

// Renderizar tabla
function renderizarTabla(miembros) {
    const tbody = document.getElementById('tabla-miembros');

    if (miembros.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="text-center py-4 text-muted">No se encontraron miembros</td></tr>
        `;
        return;
    }

    tbody.innerHTML = miembros.map(m => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="member-avatar me-2">${m.nombres.charAt(0)}${m.apellidos.charAt(0)}</div>
                    <div>${m.nombres} ${m.apellidos}</div>
                </div>
            </td>
            <td>${m.identificacion}</td>
            <td>
                <small><i class="bi bi-envelope"></i> ${m.email || 'N/A'}</small><br>
                <small><i class="bi bi-telephone"></i> ${m.telefono || 'N/A'}</small>
            </td>
            <td><span class="badge badge-vitality ${getBadgeClass(m.estado)}">${m.estado}</span></td>
            <td>${formatearFecha(m.fecha_registro)}</td>
            <td>
                <button class="btn btn-sm btn-vitality-outline me-1 btn-editar" data-id="${m.id_miembro}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${m.id_miembro}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Guardar miembro (crear o actualizar)
async function guardarMiembro() {
    const id = document.getElementById('id_miembro').value;
    const data = {
        identificacion: document.getElementById('identificacion').value,
        nombres: document.getElementById('nombres').value,
        apellidos: document.getElementById('apellidos').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        estado: document.getElementById('estado').value
    };

    try {
        const url = id ? `${API_URL}/miembros/${id}` : `${API_URL}/miembros`;
        const method = id ? 'PUT' : 'POST';

        const result = await fetchConManejo(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (result && result.success) {
            modalInstance.hide();
            resetForm();
            cargarMiembros();
            mostrarExito(id ? 'Miembro actualizado' : 'Miembro creado');
        } else if (result) {
            mostrarError(result.message);
        }
    } catch (error) {
        console.error('Error guardando miembro:', error);
        mostrarError('Error al guardar miembro');
    }
}

// Editar miembro
async function editarMiembro(id) {
    try {
        const result = await fetchConManejo(`${API_URL}/miembros/${id}`);

        if (result && result.success) {
            const m = result.data;
            document.getElementById('id_miembro').value = m.id_miembro;
            document.getElementById('identificacion').value = m.identificacion;
            document.getElementById('nombres').value = m.nombres;
            document.getElementById('apellidos').value = m.apellidos;
            document.getElementById('email').value = m.email || '';
            document.getElementById('telefono').value = m.telefono || '';
            document.getElementById('estado').value = m.estado;

            document.getElementById('modalMiembroTitulo').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Miembro';
            modalInstance.show();
        }
    } catch (error) {
        console.error('Error cargando miembro:', error);
        mostrarError('Error al cargar miembro');
    }
}

// Eliminar miembro
async function eliminarMiembro(id) {
    if (!confirm('¿Está seguro de eliminar este miembro?')) return;

    try {
        const result = await fetchConManejo(`${API_URL}/miembros/${id}`, { method: 'DELETE' });

        if (result && result.success) {
            cargarMiembros();
            mostrarExito('Miembro eliminado');
        } else if (result) {
            mostrarError(result.message);
        }
    } catch (error) {
        console.error('Error eliminando miembro:', error);
        mostrarError('Error al eliminar miembro');
    }
}

// Reset formulario
function resetForm() {
    document.getElementById('formMiembro').reset();
    document.getElementById('id_miembro').value = '';
    document.getElementById('modalMiembroTitulo').innerHTML = '<i class="bi bi-person-plus me-2"></i>Nuevo Miembro';
}

// Utilidades
function getBadgeClass(estado) {
    switch(estado) {
        case 'Activo': return 'badge-activo';
        case 'Inactivo': return 'badge-inactivo';
        case 'Suspendido': return 'badge-vencido';
        default: return 'badge-inactivo';
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function mostrarExito(mensaje) {
    alert(mensaje);
}

function mostrarError(mensaje) {
    alert('Error: ' + mensaje);
}
