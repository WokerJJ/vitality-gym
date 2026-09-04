/**
 * Servidor Principal - Gimnasio Vitality
 * Autores: Daniela Blandón, Jhon Hucker Chalarca
 * Tecnologías: Node.js, Express, MySQL
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar conexión a base de datos
const { testConnection } = require('./config/database');

// Importar rutas
const miembrosRoutes = require('./routes/miembros');
const membresiasRoutes = require('./routes/membresias');
const accesosRoutes = require('./routes/accesos');
const reportesRoutes = require('./routes/reportes');
const dashboardRoutes = require('./routes/dashboard');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================

// Helmet para headers de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting - evitar ataques de fuerza bruta
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // límite de 1000 requests por IP (aumentado)
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP. Intente más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/bootstrap/') || req.path.startsWith('/css/') || req.path.startsWith('/js/')
});
app.use(limiter);

// Configuración de CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging de requests (solo en desarrollo y formato reducido)
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('tiny'));
}

// Parseo de JSON y formularios
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// SERVIR ARCHIVOS ESTÁTICOS
// ============================================

// Bootstrap local (offline)
app.use('/bootstrap/css', express.static(path.join(__dirname, '../bootstrap/css')));
app.use('/bootstrap/js', express.static(path.join(__dirname, '../bootstrap/js')));
app.use('/bootstrap/fonts', express.static(path.join(__dirname, '../bootstrap/fonts')));

// Frontend estático
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

// ============================================
// RUTAS DE API
// ============================================

// Health check
app.get('/api/health', async (req, res) => {
    const dbStatus = await testConnection();
    res.json({
        success: true,
        status: 'OK',
        database: dbStatus ? 'Conectado' : 'Desconectado',
        timestamp: new Date().toISOString()
    });
});

// Rutas de la API
app.use('/api/miembros', miembrosRoutes);
app.use('/api/membresias', membresiasRoutes);
app.use('/api/accesos', accesosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ============================================
// RUTAS DE PÁGINAS (SPA)
// ============================================

// Página principal - Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rutas de páginas
app.get('/miembros', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/miembros.html'));
});

app.get('/membresias', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/membresias.html'));
});

app.get('/accesos', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/accesos.html'));
});

app.get('/reportes', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/reportes.html'));
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Error 404 - Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Error 500 - Error interno del servidor
app.use((err, req, res, next) => {
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const startServer = async () => {
    const dbConnected = await testConnection();

    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
        console.log('Rutas API:');
        console.log('  GET  /api/health');
        console.log('  GET  /api/miembros');
        console.log('  GET  /api/membresias');
        console.log('  GET  /api/accesos');
        console.log('  GET  /api/reportes');
        console.log('  GET  /api/dashboard');
        console.log('Rutas paginas:');
        console.log('  GET  /');
        console.log('  GET  /miembros');
        console.log('  GET  /membresias');
        console.log('  GET  /accesos');
        console.log('  GET  /reportes');
        console.log('Base de datos:', dbConnected ? 'Conectada' : 'No conectada');
    });
};

startServer();
