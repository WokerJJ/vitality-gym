/**
 * Configuración de conexión a MySQL
 * Uso de variables de entorno para seguridad
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'vitality_app',
    password: process.env.DB_PASSWORD || 'Vitality2024!',
    database: process.env.DB_NAME || 'vitality_gym',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Verificar conexión al iniciar
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        console.log('✅ Conexión a MySQL establecida correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al conectar a MySQL:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    testConnection
};
