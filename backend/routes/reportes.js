/**
 * Rutas de Reportes - Consultas analíticas con JOIN y GROUP BY
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ============================================
// GET /api/reportes/ingresos - Reporte de ingresos
// ============================================
router.get('/ingresos', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, grupo } = req.query;

        let query = `
            SELECT
                DATE(p.fecha_pago) as fecha,
                p.metodo_pago,
                COUNT(*) as cantidad_transacciones,
                SUM(p.monto) as total,
                GROUP_CONCAT(DISTINCT tm.nombre SEPARATOR ', ') as tipos_membresia
            FROM pagos p
            JOIN membresias m ON p.id_membresia = m.id_membresia
            JOIN tipos_membresia tm ON m.id_tipo = tm.id_tipo
            WHERE 1=1
        `;
        const params = [];

        if (fecha_inicio && fecha_fin) {
            query += ' AND DATE(p.fecha_pago) BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        } else if (fecha_inicio) {
            query += ' AND DATE(p.fecha_pago) >= ?';
            params.push(fecha_inicio);
        } else if (fecha_fin) {
            query += ' AND DATE(p.fecha_pago) <= ?';
            params.push(fecha_fin);
        }

        if (grupo === 'metodo') {
            query = `
                SELECT
                    p.metodo_pago,
                    COUNT(*) as cantidad_transacciones,
                    SUM(p.monto) as total
                FROM pagos p
                JOIN membresias m ON p.id_membresia = m.id_membresia
                WHERE 1=1
            `;
            if (fecha_inicio && fecha_fin) {
                query += ' AND DATE(p.fecha_pago) BETWEEN ? AND ?';
            }
            query += ' GROUP BY p.metodo_pago ORDER BY total DESC';
        } else if (grupo === 'tipo') {
            query = `
                SELECT
                    tm.nombre as tipo_membresia,
                    COUNT(*) as cantidad_vendidas,
                    SUM(p.monto) as total_recaudado,
                    AVG(p.monto) as promedio_pago
                FROM pagos p
                JOIN membresias m ON p.id_membresia = m.id_membresia
                JOIN tipos_membresia tm ON m.id_tipo = tm.id_tipo
                WHERE 1=1
            `;
            if (fecha_inicio && fecha_fin) {
                query += ' AND DATE(p.fecha_pago) BETWEEN ? AND ?';
            }
            query += ' GROUP BY tm.id_tipo, tm.nombre ORDER BY total_recaudado DESC';
        } else {
            query += ' GROUP BY DATE(p.fecha_pago), p.metodo_pago ORDER BY fecha DESC';
        }

        const [rows] = await pool.query(query, params);

        // Calcular total general
        let totalQuery = `
            SELECT SUM(p.monto) as total_general, COUNT(*) as total_transacciones
            FROM pagos p
            WHERE 1=1
        `;
        if (fecha_inicio && fecha_fin) {
            totalQuery += ' AND DATE(p.fecha_pago) BETWEEN ? AND ?';
        }

        const [totalResult] = await pool.query(totalQuery, params);

        res.json({
            success: true,
            data: rows,
            resumen: {
                total_general: totalResult[0].total_general || 0,
                total_transacciones: totalResult[0].total_transacciones || 0
            },
            filtros: { fecha_inicio, fecha_fin, grupo }
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de ingresos'
        });
    }
});

// ============================================
// GET /api/reportes/membresias - Estadísticas de membresías
// ============================================
router.get('/membresias', async (req, res) => {
    try {
        const { estado, por_vencer_dias = 7 } = req.query;

        // Usar la vista de estadísticas
        const [estadisticas] = await pool.query('SELECT * FROM vw_estadisticas_membresias');

        // Membresías por vencer
        const [porVencer] = await pool.query(
            `SELECT
                m.id_membresia,
                CONCAT(mi.nombres, ' ', mi.apellidos) as nombre_completo,
                mi.email,
                mi.telefono,
                tm.nombre as tipo_membresia,
                m.fecha_fin,
                DATEDIFF(m.fecha_fin, CURDATE()) as dias_restantes,
                DATE_ADD(m.fecha_fin, INTERVAL m.dias_gracia DAY) as fecha_gracia
            FROM membresias m
            JOIN miembros mi ON m.id_miembro = mi.id_miembro
            JOIN tipos_membresia tm ON m.id_tipo = tm.id_tipo
            WHERE m.estado = 'Activa'
              AND DATEDIFF(m.fecha_fin, CURDATE()) BETWEEN 0 AND ?
            ORDER BY dias_restantes ASC`,
            [parseInt(por_vencer_dias)]
        );

        // Membresías vencidas recientemente
        const [vencidas] = await pool.query(
            `SELECT
                m.id_membresia,
                CONCAT(mi.nombres, ' ', mi.apellidos) as nombre_completo,
                mi.email,
                mi.telefono,
                tm.nombre as tipo_membresia,
                m.fecha_fin,
                DATEDIFF(CURDATE(), m.fecha_fin) as dias_vencida
            FROM membresias m
            JOIN miembros mi ON m.id_miembro = mi.id_miembro
            JOIN tipos_membresia tm ON m.id_tipo = tm.id_tipo
            WHERE m.estado = 'Vencida'
              AND DATEDIFF(CURDATE(), m.fecha_fin) <= 30
            ORDER BY dias_vencida ASC`
        );

        // Miembros sin membresía activa
        const [sinMembresia] = await pool.query('SELECT * FROM vw_miembros_sin_membresia LIMIT 20');

        res.json({
            success: true,
            data: {
                estadisticas,
                por_vencer: porVencer,
                vencidas_recientes: vencidas,
                sin_membresia: sinMembresia
            }
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de membresías'
        });
    }
});

// ============================================
// GET /api/reportes/frecuencia - Frecuencia de visitas
// ============================================
router.get('/frecuencia', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, top = 20 } = req.query;

        let query = `
            SELECT
                m.id_miembro,
                CONCAT(m.nombres, ' ', m.apellidos) as nombre_completo,
                m.identificacion,
                tm.nombre as tipo_membresia_actual,
                COUNT(a.id_acceso) as total_visitas,
                COUNT(DISTINCT DATE(a.fecha_hora_entrada)) as dias_distintos,
                MIN(a.fecha_hora_entrada) as primera_visita_periodo,
                MAX(a.fecha_hora_entrada) as ultima_visita,
                AVG(TIMESTAMPDIFF(MINUTE, a.fecha_hora_entrada, COALESCE(a.fecha_hora_salida, NOW()))) as promedio_minutos
            FROM miembros m
            LEFT JOIN accesos a ON m.id_miembro = a.id_miembro AND a.validado = TRUE
            LEFT JOIN membresias mem ON m.id_miembro = mem.id_miembro AND mem.estado = 'Activa'
            LEFT JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
            WHERE m.estado = 'Activo'
        `;
        const params = [];

        if (fecha_inicio) {
            query += ' AND DATE(a.fecha_hora_entrada) >= ?';
            params.push(fecha_inicio);
        }
        if (fecha_fin) {
            query += ' AND DATE(a.fecha_hora_entrada) <= ?';
            params.push(fecha_fin);
        }

        query += ` GROUP BY m.id_miembro, m.nombres, m.apellidos, m.identificacion, tm.nombre
                   ORDER BY total_visitas DESC
                   LIMIT ?`;
        params.push(parseInt(top));

        const [rows] = await pool.query(query, params);

        // Estadísticas generales
        const [stats] = await pool.query(
            `SELECT
                COUNT(DISTINCT id_miembro) as total_miembros_activos,
                COUNT(*) as total_accesos,
                COUNT(DISTINCT DATE(fecha_hora_entrada)) as dias_con_accesos,
                AVG(TIMESTAMPDIFF(MINUTE, fecha_hora_entrada, COALESCE(fecha_hora_salida, NOW()))) as promedio_duracion_minutos
            FROM accesos
            WHERE validado = TRUE
            ${fecha_inicio ? 'AND DATE(fecha_hora_entrada) >= ?' : ''}
            ${fecha_fin ? 'AND DATE(fecha_hora_entrada) <= ?' : ''}`,
            params.filter((_, i) => i >= params.length - (fecha_inicio ? 1 : 0) - (fecha_fin ? 1 : 0))
        );

        res.json({
            success: true,
            data: rows,
            estadisticas: stats[0]
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de frecuencia'
        });
    }
});

// ============================================
// GET /api/reportes/asistencia - Reporte de asistencia por fecha
// ============================================
router.get('/asistencia', async (req, res) => {
    try {
        const { mes, anio } = req.query;

        const mesActual = mes || new Date().getMonth() + 1;
        const anioActual = anio || new Date().getFullYear();

        // Asistencia diaria del mes
        const [asistenciaDiaria] = await pool.query(
            `SELECT
                DATE(fecha_hora_entrada) as fecha,
                COUNT(*) as total_accesos,
                COUNT(DISTINCT id_miembro) as miembros_unicos,
                SUM(CASE WHEN validado = TRUE THEN 1 ELSE 0 END) as accesos_validos
            FROM accesos
            WHERE MONTH(fecha_hora_entrada) = ? AND YEAR(fecha_hora_entrada) = ?
            GROUP BY DATE(fecha_hora_entrada)
            ORDER BY fecha`,
            [mesActual, anioActual]
        );

        // Horarios pico
        const [horariosPico] = await pool.query(
            `SELECT
                HOUR(fecha_hora_entrada) as hora,
                COUNT(*) as cantidad
            FROM accesos
            WHERE MONTH(fecha_hora_entrada) = ? AND YEAR(fecha_hora_entrada) = ?
            GROUP BY HOUR(fecha_hora_entrada)
            ORDER BY cantidad DESC
            LIMIT 5`,
            [mesActual, anioActual]
        );

        // Días de la semana más concurridos
        const [diasSemana] = await pool.query(
            `SELECT
                DAYOFWEEK(fecha_hora_entrada) as dia_semana,
                COUNT(*) as cantidad
            FROM accesos
            WHERE MONTH(fecha_hora_entrada) = ? AND YEAR(fecha_hora_entrada) = ?
            GROUP BY DAYOFWEEK(fecha_hora_entrada)
            ORDER BY cantidad DESC`,
            [mesActual, anioActual]
        );

        res.json({
            success: true,
            mes: mesActual,
            anio: anioActual,
            data: {
                asistencia_diaria: asistenciaDiaria,
                horarios_pico: horariosPico,
                dias_mas_concurridos: diasSemana
            }
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de asistencia'
        });
    }
});

module.exports = router;
