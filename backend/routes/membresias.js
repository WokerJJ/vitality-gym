/**
 * Rutas de Membresías - CRUD completo
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Middleware de validación
const validarMembresia = [
    body('id_miembro').isInt().withMessage('ID de miembro inválido'),
    body('id_tipo').isInt().withMessage('Tipo de membresía inválido'),
    body('fecha_inicio').isDate().withMessage('Fecha de inicio inválida'),
    body('precio_pagado').isFloat({ min: 0 }).withMessage('Precio debe ser positivo'),
    body('metodo_pago').isIn(['Efectivo', 'Tarjeta', 'Transferencia', 'Otro']).withMessage('Método de pago inválido')
];

// ============================================
// GET /api/membresias - Listar membresías
// ============================================
router.get('/', async (req, res) => {
    try {
        const { estado, id_miembro, pagina = 1, limite = 10 } = req.query;

        let query = `
            SELECT m.*, mi.nombres, mi.apellidos, mi.identificacion,
                   tm.nombre as tipo_membresia, tm.duracion_dias, tm.precio as precio_base
            FROM membresias m
            JOIN miembros mi ON m.id_miembro = mi.id_miembro
            JOIN tipos_membresia tm ON m.id_tipo = tm.id_tipo
            WHERE 1=1
        `;
        const params = [];

        if (estado) {
            query += ' AND m.estado = ?';
            params.push(estado);
        }

        if (id_miembro) {
            query += ' AND m.id_miembro = ?';
            params.push(id_miembro);
        }

        const offset = (parseInt(pagina) - 1) * parseInt(limite);
        query += ' ORDER BY m.fecha_creacion DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limite), offset);

        const [rows] = await pool.query(query, params);

        // Contar total
        let countQuery = `
            SELECT COUNT(*) as total
            FROM membresias m
            JOIN miembros mi ON m.id_miembro = mi.id_miembro
            WHERE 1=1
        `;
        const countParams = [];

        if (estado) {
            countQuery += ' AND m.estado = ?';
            countParams.push(estado);
        }

        if (id_miembro) {
            countQuery += ' AND m.id_miembro = ?';
            countParams.push(id_miembro);
        }

        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: rows,
            paginacion: {
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                total,
                paginas: Math.ceil(total / parseInt(limite))
            }
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al obtener membresías',
            error: error.message
        });
    }
});

// ============================================
// GET /api/membresias/tipos - Obtener tipos de membresía
// ============================================
router.get('/tipos/all', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM tipos_membresia WHERE activo = TRUE ORDER BY precio ASC'
        );
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al obtener tipos de membresía'
        });
    }
});

// ============================================
// GET /api/membresias/:id - Obtener membresía por ID
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT m.*, mi.nombres, mi.apellidos, mi.identificacion,
                    tm.nombre as tipo_membresia, tm.duracion_dias, tm.precio as precio_base
             FROM membresias m
             JOIN miembros mi ON m.id_miembro = mi.id_miembro
             JOIN tipos_membresia tm ON m.id_tipo = tm.id_tipo
             WHERE m.id_membresia = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Membresía no encontrada'
            });
        }

        // Obtener pagos asociados
        const [pagos] = await pool.query(
            'SELECT * FROM pagos WHERE id_membresia = ? ORDER BY fecha_pago DESC',
            [id]
        );

        res.json({
            success: true,
            data: { ...rows[0], pagos }
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al obtener membresía'
        });
    }
});

// ============================================
// POST /api/membresias - Crear nueva membresía
// ============================================
router.post('/', validarMembresia, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const {
            id_miembro,
            id_tipo,
            fecha_inicio,
            precio_pagado,
            metodo_pago,
            referencia_pago,
            dias_gracia = 0,
            notas
        } = req.body;

        // Obtener duración del tipo de membresía
        const [tipoRows] = await pool.query(
            'SELECT duracion_dias FROM tipos_membresia WHERE id_tipo = ?',
            [id_tipo]
        );

        if (tipoRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de membresía no encontrado'
            });
        }

        const duracionDias = tipoRows[0].duracion_dias;
        const fechaInicio = new Date(fecha_inicio);
        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + duracionDias);

        // Iniciar transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insertar membresía
            const [result] = await connection.query(
                `INSERT INTO membresias
                 (id_miembro, id_tipo, fecha_inicio, fecha_fin, precio_pagado,
                  metodo_pago, referencia_pago, dias_gracia, notas)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id_miembro, id_tipo, fecha_inicio, fechaFin.toISOString().split('T')[0],
                 precio_pagado, metodo_pago, referencia_pago, dias_gracia, notas]
            );

            const idMembresia = result.insertId;

            // Registrar pago
            await connection.query(
                `INSERT INTO pagos (id_membresia, monto, metodo_pago, referencia, registrado_por, notas)
                 VALUES (?, ?, ?, ?, 1, ?)`,
                [idMembresia, precio_pagado, metodo_pago, referencia_pago, 'Pago inicial de membresía']
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Membresía creada exitosamente',
                data: { id_membresia: idMembresia }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al crear membresía',
            error: error.message
        });
    }
});

// ============================================
// PUT /api/membresias/:id - Actualizar membresía
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, dias_gracia, notas } = req.body;

        const [result] = await pool.query(
            'UPDATE membresias SET estado = ?, dias_gracia = ?, notas = ? WHERE id_membresia = ?',
            [estado, dias_gracia, notas, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Membresía no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Membresía actualizada exitosamente'
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al actualizar membresía'
        });
    }
});

// ============================================
// POST /api/membresias/:id/renovar - Renovar membresía
// ============================================
router.post('/:id/renovar', async (req, res) => {
    try {
        const { id } = req.params;
        const { id_tipo, precio_pagado, metodo_pago, referencia_pago } = req.body;

        // Obtener datos de la membresía anterior
        const [membresiaAnterior] = await pool.query(
            'SELECT * FROM membresias WHERE id_membresia = ?',
            [id]
        );

        if (membresiaAnterior.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Membresía no encontrada'
            });
        }

        const datosAnteriores = membresiaAnterior[0];

        // Obtener duración del nuevo tipo
        const [tipoRows] = await pool.query(
            'SELECT duracion_dias FROM tipos_membresia WHERE id_tipo = ?',
            [id_tipo]
        );

        const duracionDias = tipoRows[0].duracion_dias;

        // Calcular nueva fecha de inicio (desde el día siguiente al vencimiento)
        const fechaInicio = new Date(datosAnteriores.fecha_fin);
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + duracionDias);

        // Crear nueva membresía
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Marcar anterior como renovada
            await connection.query(
                'UPDATE membresias SET estado = "Vencida", notas = CONCAT(IFNULL(notas, ""), " | Renovada") WHERE id_membresia = ?',
                [id]
            );

            // Crear nueva membresía
            const [result] = await connection.query(
                `INSERT INTO membresias
                 (id_miembro, id_tipo, fecha_inicio, fecha_fin, precio_pagado,
                  metodo_pago, referencia_pago, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Activa')`,
                [datosAnteriores.id_miembro, id_tipo, fechaInicio.toISOString().split('T')[0],
                 fechaFin.toISOString().split('T')[0], precio_pagado, metodo_pago, referencia_pago]
            );

            // Registrar pago
            await connection.query(
                `INSERT INTO pagos (id_membresia, monto, metodo_pago, referencia, registrado_por, notas)
                 VALUES (?, ?, ?, ?, 1, ?)`,
                [result.insertId, precio_pagado, metodo_pago, referencia_pago, 'Renovación de membresía']
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Membresía renovada exitosamente',
                data: { id_membresia: result.insertId }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al renovar membresía'
        });
    }
});

module.exports = router;
