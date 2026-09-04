/**
 * Rutas de Accesos - Control de entrada al gimnasio
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ============================================
// GET /api/accesos - Listar accesos
// ============================================
router.get('/', async (req, res) => {
    try {
        const { fecha, hoy, id_miembro, pagina = 1, limite = 20 } = req.query;

        let query = `
            SELECT a.*, CONCAT(m.nombres, ' ', m.apellidos) as nombre_completo,
                   m.identificacion, tm.nombre as tipo_membresia
            FROM accesos a
            JOIN miembros m ON a.id_miembro = m.id_miembro
            LEFT JOIN membresias mem ON a.id_membresia = mem.id_membresia
            LEFT JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
            WHERE 1=1
        `;
        const params = [];

        if (hoy === 'true') {
            query += ' AND DATE(a.fecha_hora_entrada) = CURDATE()';
        } else if (fecha) {
            query += ' AND DATE(a.fecha_hora_entrada) = ?';
            params.push(fecha);
        }

        if (id_miembro) {
            query += ' AND a.id_miembro = ?';
            params.push(id_miembro);
        }

        const offset = (parseInt(pagina) - 1) * parseInt(limite);
        query += ' ORDER BY a.fecha_hora_entrada DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limite), offset);

        const [rows] = await pool.query(query, params);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al obtener accesos'
        });
    }
});

// ============================================
// POST /api/accesos/entrada - Registrar entrada
// ============================================
router.post('/entrada', async (req, res) => {
    try {
        const { identificacion } = req.body;

        // Buscar miembro por identificación
        const [miembroRows] = await pool.query(
            'SELECT id_miembro, nombres, apellidos, identificacion, estado FROM miembros WHERE identificacion = ?',
            [identificacion]
        );

        if (miembroRows.length === 0) {
            return res.status(404).json({
                success: false,
                tieneAcceso: false,
                message: 'Miembro no encontrado'
            });
        }

        const miembro = miembroRows[0];

        // Insertar acceso - EL TRIGGER trg_validar_acceso HACE TODA LA VALIDACIÓN
        const [result] = await pool.query(
            'INSERT INTO accesos (id_miembro, tipo_acceso) VALUES (?, ?)',
            [miembro.id_miembro, 'Membresia']
        );

        // Leer el resultado completo que el trigger generó, incluyendo datos de membresía
        const [accesoRows] = await pool.query(
            `SELECT
                a.*,
                m.nombres,
                m.apellidos,
                tm.nombre as tipo_membresia,
                mem.fecha_fin,
                mem.dias_gracia,
                DATE_ADD(mem.fecha_fin, INTERVAL mem.dias_gracia DAY) as fecha_gracia_hasta
             FROM accesos a
             JOIN miembros m ON a.id_miembro = m.id_miembro
             LEFT JOIN membresias mem ON a.id_membresia = mem.id_membresia
             LEFT JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
             WHERE a.id_acceso = ?`,
            [result.insertId]
        );

        const acceso = accesoRows[0];
        const tieneAcceso = acceso.validado === 1;

        // Calcular días restantes si tiene membresía
        let diasRestantes = null;
        if (acceso.fecha_fin) {
            const hoy = new Date();
            const fin = new Date(acceso.fecha_fin);
            diasRestantes = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
        }

        res.json({
            success: true,
            tieneAcceso,
            id_acceso: result.insertId,
            miembro: {
                id_miembro: miembro.id_miembro,
                nombre_completo: `${miembro.nombres} ${miembro.apellidos}`,
                identificacion: miembro.identificacion
            },
            membresia: tieneAcceso ? {
                tipo_membresia: acceso.tipo_membresia,
                fecha_fin: acceso.fecha_fin,
                fecha_gracia_hasta: acceso.fecha_gracia_hasta,
                dias_restantes: diasRestantes
            } : null,
            mensaje: tieneAcceso
                ? '¡Acceso permitido!'
                : (acceso.notas || 'Acceso denegado')
        });

    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            tieneAcceso: false,
            message: 'Error al registrar entrada',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// POST /api/accesos/:id/salida - Registrar salida
// ============================================
router.post('/:id/salida', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'UPDATE accesos SET fecha_hora_salida = NOW() WHERE id_acceso = ? AND fecha_hora_salida IS NULL',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Acceso no encontrado o ya tiene salida registrada'
            });
        }

        res.json({
            success: true,
            message: 'Salida registrada exitosamente'
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al registrar salida'
        });
    }
});

// ============================================
// GET /api/accesos/estadisticas/hoy - Estadísticas de hoy
// ============================================
router.get('/estadisticas/hoy', async (req, res) => {
    try {
        // Total de accesos hoy
        const [accesosHoy] = await pool.query(
            'SELECT COUNT(*) as total FROM accesos WHERE DATE(fecha_hora_entrada) = CURDATE()'
        );

        // Accesos válidos vs inválidos
        const [accesosValidos] = await pool.query(
            `SELECT
                SUM(CASE WHEN validado = TRUE THEN 1 ELSE 0 END) as validos,
                SUM(CASE WHEN validado = FALSE THEN 1 ELSE 0 END) as invalidos
             FROM accesos WHERE DATE(fecha_hora_entrada) = CURDATE()`
        );

        // Accesos por hora
        const [accesosPorHora] = await pool.query(
            `SELECT HOUR(fecha_hora_entrada) as hora, COUNT(*) as cantidad
             FROM accesos
             WHERE DATE(fecha_hora_entrada) = CURDATE()
             GROUP BY HOUR(fecha_hora_entrada)
             ORDER BY hora`
        );

        // Personas dentro actualmente
        const [dentro] = await pool.query(
            `SELECT COUNT(*) as total FROM accesos
             WHERE DATE(fecha_hora_entrada) = CURDATE() AND fecha_hora_salida IS NULL`
        );

        res.json({
            success: true,
            data: {
                total_accesos: accesosHoy[0].total,
                accesos_validos: accesosValidos[0].validos || 0,
                accesos_invalidos: accesosValidos[0].invalidos || 0,
                personas_dentro: dentro[0].total,
                por_hora: accesosPorHora
            }
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

module.exports = router;
