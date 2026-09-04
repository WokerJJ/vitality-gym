/**
 * Controlador de Membresías - Frontend
 * Gimnasio Vitality
 */

const API_URL = '/api';
let membresiasModal = null;

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
    membresiasModal = new bootstrap.Modal(document.getElementById('modalMembresia'));
    cargarMembresias();
    cargarTiposMembresia();
    cargarMiembrosSelect();

    // Filtro
    document.getElementById('filtroEstado').addEventListener('change', (e) => {
        cargarMembresias(e.target.value);
    });

    // Cambio de tipo para actualizar precio
    document.getElementById('id_tipo').addEventListener('change', actualizarPrecioSugerido);

    // Set fecha inicio por defecto
    document.getElementById('fecha_inicio').valueAsDate = new Date();

    // Botón guardar
    document.getElementById('btnGuardarMembresia').addEventListener('click', guardarMembresia);

    // Event delegation para botones de renovar
    document.getElementById('tabla-membresias').addEventListener('click', (e) => {
        const btnRenovar = e.target.closest('.btn-renovar');
        if (btnRenovar) {
            const id = btnRenovar.getAttribute('data-id');
            renovarMembresia(id);
        }
    });
});

// Cargar membresías
async function cargarMembresias(estado = '') {
    try {
        let url = `${API_URL}/membresias`;
        if (estado) url += `?estado=${estado}`;

        const result = await fetchConManejo(url);

        if (result && result.success) {
            renderizarTabla(result.data);
        }
    } catch (error) {
        console.error('Error cargando membresías:', error);
    }
}

// Renderizar tabla
function renderizarTabla(membresias) {
    const tbody = document.getElementById('tabla-membresias');

    if (membresias.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" class="text-center py-4 text-muted">No se encontraron membresías</td></tr>
        `;
        return;
    }

    tbody.innerHTML = membresias.map(m => {
        const hoy = new Date();
        const fechaFin = new Date(m.fecha_fin);
        const diasRestantes = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
        let estadoBadge = getBadgeClass(m.estado);

        if (m.estado === 'Activa' && diasRestantes <= 7 && diasRestantes > 0) {
            estadoBadge = 'badge-por-vencer';
        }

        const puedeRenovar = m.estado !== 'Activa';

        return `
        <tr>
            <td>${m.nombres} ${m.apellidos}</td>
            <td>${m.tipo_membresia}</td>
            <td>${formatearFecha(m.fecha_inicio)}</td>
            <td>
                ${formatearFecha(m.fecha_fin)}
                ${m.estado === 'Activa' && diasRestantes <= 7 ? `<br><small class="${diasRestantes <= 3 ? 'text-danger' : 'text-warning'}">${diasRestantes} días restantes</small>` : ''}
            </td>
            <td>$${formatearMoneda(m.precio_pagado)}</td>
            <td><span class="badge badge-vitality ${estadoBadge}">${m.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-vitality-outline btn-renovar" data-id="${m.id_membresia}"
                    ${puedeRenovar ? '' : 'disabled'}>
                    <i class="bi bi-arrow-clockwise"></i> Renovar
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Cargar tipos de membresía
async function cargarTiposMembresia() {
    try {
        const result = await fetchConManejo(`${API_URL}/membresias/tipos/all`);

        if (result && result.success) {
            const select = document.getElementById('id_tipo');
            select.innerHTML = '<option value="">Seleccione...</option>' +
                result.data.map(t => `
                    <option value="${t.id_tipo}" data-precio="${t.precio}">${t.nombre} - $${formatearMoneda(t.precio)} (${t.duracion_dias} días)</option>
                `).join('');
        }
    } catch (error) {
        console.error('Error cargando tipos:', error);
    }
}

// Cargar miembros para select
async function cargarMiembrosSelect() {
    try {
        const result = await fetchConManejo(`${API_URL}/miembros?estado=Activo`);

        if (result && result.success) {
            const select = document.getElementById('id_miembro_select');
            select.innerHTML = '<option value="">Seleccione un miembro</option>' +
                result.data.map(m => `
                    <option value="${m.id_miembro}">${m.identificacion} - ${m.nombres} ${m.apellidos}</option>
                `).join('');
        }
    } catch (error) {
        console.error('Error cargando miembros:', error);
    }
}

// Actualizar precio sugerido
function actualizarPrecioSugerido() {
    const select = document.getElementById('id_tipo');
    const selected = select.options[select.selectedIndex];
    if (selected && selected.dataset.precio) {
        document.getElementById('precio_pagado').value = selected.dataset.precio;
    }
}

// Guardar membresía
async function guardarMembresia() {
    const data = {
        id_miembro: document.getElementById('id_miembro_select').value,
        id_tipo: document.getElementById('id_tipo').value,
        fecha_inicio: document.getElementById('fecha_inicio').value,
        precio_pagado: parseFloat(document.getElementById('precio_pagado').value),
        metodo_pago: document.getElementById('metodo_pago').value
    };

    if (!data.id_miembro || !data.id_tipo || !data.fecha_inicio || !data.precio_pagado) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }

    try {
        const result = await fetchConManejo(`${API_URL}/membresias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (result && result.success) {
            membresiasModal.hide();
            document.getElementById('formMembresia').reset();
            document.getElementById('fecha_inicio').valueAsDate = new Date();
            cargarMembresias();
            alert('Membresía creada exitosamente');
        } else if (result) {
            alert(result.message || 'Error al crear membresía');
        }
    } catch (error) {
        console.error('Error guardando membresía:', error);
        alert('Error al guardar membresía');
    }
}

// Renovar membresía
async function renovarMembresia(id) {
    if (!confirm('¿Desea renovar esta membresía?')) return;

    // Abrir modal con datos prellenados
    try {
        const result = await fetchConManejo(`${API_URL}/membresias/${id}`);

        if (result && result.success) {
            // Prellenar formulario de renovación
            const m = result.data;
            document.getElementById('id_miembro_select').value = m.id_miembro;
            document.getElementById('id_tipo').value = m.id_tipo;
            document.getElementById('precio_pagado').value = m.precio_pagado;
            document.getElementById('fecha_inicio').value = new Date().toISOString().split('T')[0];

            membresiasModal.show();
            document.getElementById('id_miembro_select').disabled = true;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Utilidades
function getBadgeClass(estado) {
    switch(estado) {
        case 'Activa': return 'badge-activo';
        case 'Vencida': return 'badge-vencido';
        case 'Cancelada': return 'badge-inactivo';
        default: return 'badge-inactivo';
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO').format(valor || 0);
}
