/**
 * Rutas de Miembros - CRUD completo
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Middleware de validación
const validarMiembro = [
    body('nombres').trim().notEmpty().withMessage('El nombre es requerido').isLength({ max: 100 }),
    body('apellidos').trim().notEmpty().withMessage('El apellido es requerido').isLength({ max: 100 }),
    body('identificacion').trim().notEmpty().withMessage('La identificación es requerida').isLength({ max: 20 }),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('telefono').optional().isLength({ max: 20 }),
    body('fecha_nacimiento').optional().isDate(),
    body('genero').optional().isIn(['M', 'F', 'Otro'])
];

// ============================================
// GET /api/miembros - Listar todos los miembros
// ============================================
router.get('/', async (req, res) => {
    try {
        const { busqueda, estado, pagina = 1, limite = 10 } = req.query;
        let query = 'SELECT * FROM miembros WHERE 1=1';
        const params = [];

        if (busqueda) {
            query += ' AND (nombres LIKE ? OR apellidos LIKE ? OR identificacion LIKE ? OR email LIKE ?)';
            const busquedaLike = `%${busqueda}%`;
            params.push(busquedaLike, busquedaLike, busquedaLike, busquedaLike);
        }

        if (estado) {
            query += ' AND estado = ?';
            params.push(estado);
        }

        // Paginación
        const offset = (parseInt(pagina) - 1) * parseInt(limite);
        query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limite), offset);

        const [rows] = await pool.query(query, params);

        // Contar total para paginación
        let countQuery = 'SELECT COUNT(*) as total FROM miembros WHERE 1=1';
        const countParams = [];

        if (busqueda) {
            countQuery += ' AND (nombres LIKE ? OR apellidos LIKE ? OR identificacion LIKE ? OR email LIKE ?)';
            const busquedaLike = `%${busqueda}%`;
            countParams.push(busquedaLike, busquedaLike, busquedaLike, busquedaLike);
        }

        if (estado) {
            countQuery += ' AND estado = ?';
            countParams.push(estado);
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
            message: 'Error al obtener miembros',
            error: error.message
        });
    }
});

// ============================================
// GET /api/miembros/:id - Obtener un miembro por ID
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener datos del miembro
        const [miembroRows] = await pool.query(
            'SELECT * FROM miembros WHERE id_miembro = ?',
            [id]
        );

        if (miembroRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Miembro no encontrado'
            });
        }

        const miembro = miembroRows[0];

        // Obtener historial de membresías
        const [membresiasRows] = await pool.query(
            `SELECT m.*, tm.nombre as tipo_membresia, tm.duracion_dias
             FROM membresias m
             JOIN tipos_membresia tm ON m.id_tipo = tm.id_tipo
             WHERE m.id_miembro = ?
             ORDER BY m.fecha_inicio DESC`,
            [id]
        );

        // Obtener últimos accesos
        const [accesosRows] = await pool.query(
            `SELECT a.*, tm.nombre as tipo_membresia
             FROM accesos a
             LEFT JOIN membresias mem ON a.id_membresia = mem.id_membresia
             LEFT JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
             WHERE a.id_miembro = ?
             ORDER BY a.fecha_hora_entrada DESC
             LIMIT 10`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...miembro,
                membresias: membresiasRows,
                accesos: accesosRows
            }
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al obtener miembro',
            error: error.message
        });
    }
});

// ============================================
// POST /api/miembros - Crear nuevo miembro
// ============================================
router.post('/', validarMiembro, async (req, res) => {
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
            identificacion,
            tipo_identificacion = 'CC',
            nombres,
            apellidos,
            email,
            telefono,
            fecha_nacimiento,
            genero = 'Otro',
            direccion,
            contacto_emergencia_nombre,
            contacto_emergencia_telefono
        } = req.body;

        // Verificar identificación única
        const [existe] = await pool.query(
            'SELECT id_miembro FROM miembros WHERE identificacion = ?',
            [identificacion]
        );

        if (existe.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un miembro con esta identificación'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO miembros
             (identificacion, tipo_identificacion, nombres, apellidos, email, telefono,
              fecha_nacimiento, genero, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [identificacion, tipo_identificacion, nombres, apellidos, email, telefono,
             fecha_nacimiento, genero, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono]
        );

        res.status(201).json({
            success: true,
            message: 'Miembro creado exitosamente',
            data: { id_miembro: result.insertId }
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al crear miembro',
            error: error.message
        });
    }
});

// ============================================
// PUT /api/miembros/:id - Actualizar miembro
// ============================================
router.put('/:id', validarMiembro, async (req, res) => {
    try {
        const { id } = req.params;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const {
            nombres,
            apellidos,
            email,
            telefono,
            fecha_nacimiento,
            genero,
            direccion,
            contacto_emergencia_nombre,
            contacto_emergencia_telefono,
            estado
        } = req.body;

        const [result] = await pool.query(
            `UPDATE miembros SET
                nombres = ?, apellidos = ?, email = ?, telefono = ?,
                fecha_nacimiento = ?, genero = ?, direccion = ?,
                contacto_emergencia_nombre = ?, contacto_emergencia_telefono = ?, estado = ?
             WHERE id_miembro = ?`,
            [nombres, apellidos, email, telefono, fecha_nacimiento, genero, direccion,
             contacto_emergencia_nombre, contacto_emergencia_telefono, estado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Miembro no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Miembro actualizado exitosamente'
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al actualizar miembro',
            error: error.message
        });
    }
});

// ============================================
// DELETE /api/miembros/:id - Eliminar miembro (soft delete)
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que no tenga membresías activas
        const [membresiasActivas] = await pool.query(
            'SELECT COUNT(*) as count FROM membresias WHERE id_miembro = ? AND estado = "Activa"',
            [id]
        );

        if (membresiasActivas[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar: el miembro tiene membresías activas'
            });
        }

        // Soft delete - marcar como inactivo
        const [result] = await pool.query(
            'UPDATE miembros SET estado = "Inactivo" WHERE id_miembro = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Miembro no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Miembro eliminado exitosamente'
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al eliminar miembro',
            error: error.message
        });
    }
});

// ============================================
// GET /api/miembros/validar/:identificacion - Validar acceso
// ============================================
router.get('/validar/:identificacion', async (req, res) => {
    try {
        const { identificacion } = req.params;

        // Buscar miembro
        const [miembroRows] = await pool.query(
            'SELECT * FROM miembros WHERE identificacion = ?',
            [identificacion]
        );

        if (miembroRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Miembro no encontrado',
                tieneAcceso: false
            });
        }

        const miembro = miembroRows[0];

        // Validar acceso usando la función de MySQL
        const [accesoResult] = await pool.query(
            'SELECT fn_validar_acceso(?) as tiene_acceso',
            [miembro.id_miembro]
        );

        const tieneAcceso = accesoResult[0].tiene_acceso === 1;

        // Obtener información de membresía activa
        let membresiaInfo = null;
        if (tieneAcceso) {
            const [membresiaRows] = await pool.query(
                `SELECT m.*, tm.nombre as tipo_membresia, tm.duracion_dias
                 FROM membresias m
                 JOIN tipos_membresia tm ON m.id_tipo = tm.id_tipo
                 WHERE m.id_miembro = ? AND m.estado = 'Activa'
                 ORDER BY m.fecha_fin DESC
                 LIMIT 1`,
                [miembro.id_miembro]
            );
            if (membresiaRows.length > 0) {
                membresiaInfo = membresiaRows[0];
            }
        }

        res.json({
            success: true,
            tieneAcceso,
            miembro: {
                id_miembro: miembro.id_miembro,
                nombre_completo: `${miembro.nombres} ${miembro.apellidos}`,
                identificacion: miembro.identificacion,
                foto_url: miembro.foto_url
            },
            membresia: membresiaInfo
        });
    } catch (error) {
        // Error silenciado
        res.status(500).json({
            success: false,
            message: 'Error al validar acceso',
            error: error.message
        });
    }
});

module.exports = router;
