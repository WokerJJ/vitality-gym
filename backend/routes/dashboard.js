/**
 * Rutas del Dashboard - Resumen y estadísticas
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ============================================
// GET /api/dashboard/resumen - Resumen del dashboard
// ============================================
router.get('/resumen', async (req, res) => {
    try {
        // Usar la vista de dashboard
        const [dashboard] = await pool.query('SELECT * FROM vw_dashboard_resumen');

        // Miembros recientes (últimos 5)
        const [miembrosRecientes] = await pool.query(
            `SELECT id_miembro, nombres, apellidos, identificacion, fecha_registro
             FROM miembros
             ORDER BY fecha_registro DESC
             LIMIT 5`
        );

        // Accesos recientes (últimos 10)
        const [accesosRecientes] = await pool.query(
            `SELECT a.*, CONCAT(m.nombres, ' ', m.apellidos) as nombre_completo,
                    tm.nombre as tipo_membresia
             FROM accesos a
             JOIN miembros m ON a.id_miembro = m.id_miembro
             LEFT JOIN membresias mem ON a.id_membresia = mem.id_membresia
             LEFT JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
             ORDER BY a.fecha_hora_entrada DESC
             LIMIT 10`
        );

        // Membresías por vencer (próximos 7 días)
        const [porVencer] = await pool.query(
            `SELECT m.id_membresia, mi.nombres, mi.apellidos, mi.telefono,
                    tm.nombre as tipo_membresia, m.fecha_fin,
                    DATEDIFF(m.fecha_fin, CURDATE()) as dias_restantes
             FROM membresias m
             JOIN miembros mi ON m.id_miembro = mi.id_miembro
             JOIN tipos_membresia tm ON m.id_tipo = tm.id_tipo
             WHERE m.estado = 'Activa'
               AND DATEDIFF(m.fecha_fin, CURDATE()) BETWEEN 0 AND 7
             ORDER BY dias_restantes ASC
             LIMIT 5`
        );

        // Gráfico: Membresías por tipo (activas)
        const [membresiasPorTipo] = await pool.query(
            `SELECT tm.nombre as tipo, COUNT(*) as cantidad
             FROM membresias m
             JOIN tipos_membresia tm ON m.id_tipo = tm.id_tipo
             WHERE m.estado = 'Activa'
             GROUP BY tm.id_tipo, tm.nombre`
        );

        // Gráfico: Ingresos últimos 7 días
        const [ingresosSemana] = await pool.query(
            `SELECT
                DATE(fecha_pago) as fecha,
                SUM(monto) as total
            FROM pagos
            WHERE fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(fecha_pago)
            ORDER BY fecha`
        );

        res.json({
            success: true,
            data: {
                resumen: dashboard[0],
                miembros_recientes: miembrosRecientes,
                accesos_recientes: accesosRecientes,
                membresias_por_vencer: porVencer,
                graficos: {
                    membresias_por_tipo: membresiasPorTipo,
                    ingresos_ultima_semana: ingresosSemana
                }
            }
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen del dashboard'
        });
    }
});

module.exports = router;
