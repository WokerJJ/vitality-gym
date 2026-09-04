-- =====================================================
-- GIMNASIO VITALITY - USUARIOS Y PERMISOS
-- Configuración de usuarios de base de datos con GRANT
-- =====================================================

-- =====================================================
-- NOTA IMPORTANTE:
-- Ejecutar este archivo como usuario root o administrador
-- de MySQL para crear los usuarios y asignar permisos
-- =====================================================

USE mysql;

-- =====================================================
-- ELIMINAR USUARIOS SI EXISTEN (para recrear)
-- =====================================================
DROP USER IF EXISTS 'vitality_admin'@'localhost';
DROP USER IF EXISTS 'vitality_app'@'localhost';
DROP USER IF EXISTS 'vitality_recepcion'@'localhost';
DROP USER IF EXISTS 'vitality_lector'@'localhost';
DROP USER IF EXISTS 'vitality_reportes'@'localhost';

FLUSH PRIVILEGES;

-- =====================================================
-- USUARIO: vitality_admin
-- ROL: Administrador completo del sistema
-- Permisos: Todos los privilegios sobre la base de datos
-- =====================================================
CREATE USER 'vitality_admin'@'localhost'
    IDENTIFIED BY 'AdminVitality2024!@#';

GRANT ALL PRIVILEGES ON vitality_gym.*
    TO 'vitality_admin'@'localhost'
    WITH GRANT OPTION;

-- =====================================================
-- USUARIO: vitality_app
-- ROL: Aplicación web (backend Node.js)
-- Permisos: CRUD completo en todas las tablas principales
-- =====================================================
CREATE USER 'vitality_app'@'localhost'
    IDENTIFIED BY 'Vitality2024!';

-- Permisos de SELECT, INSERT, UPDATE, DELETE en todas las tablas principales
GRANT SELECT, INSERT, UPDATE, DELETE ON vitality_gym.miembros TO 'vitality_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON vitality_gym.membresias TO 'vitality_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vitality_gym.tipos_membresia TO 'vitality_app'@'localhost';
GRANT SELECT, INSERT ON vitality_gym.accesos TO 'vitality_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vitality_gym.pagos TO 'vitality_app'@'localhost';
GRANT SELECT ON vitality_gym.usuarios_sistema TO 'vitality_app'@'localhost';
GRANT SELECT ON vitality_gym.auditoria TO 'vitality_app'@'localhost';

-- Permisos para ejecutar procedimientos almacenados
GRANT EXECUTE ON PROCEDURE vitality_gym.sp_renovar_membresias_vencidas TO 'vitality_app'@'localhost';
GRANT EXECUTE ON PROCEDURE vitality_gym.sp_reporte_ingresos TO 'vitality_app'@'localhost';
GRANT EXECUTE ON PROCEDURE vitality_gym.sp_membresias_por_vencer TO 'vitality_app'@'localhost';

-- Permisos para ejecutar funciones
GRANT EXECUTE ON FUNCTION vitality_gym.fn_validar_acceso TO 'vitality_app'@'localhost';

-- Permisos para usar vistas
GRANT SELECT ON vitality_gym.vw_membresias_activas TO 'vitality_app'@'localhost';
GRANT SELECT ON vitality_gym.vw_accesos_hoy TO 'vitality_app'@'localhost';
GRANT SELECT ON vitality_gym.vw_estadisticas_membresias TO 'vitality_app'@'localhost';
GRANT SELECT ON vitality_gym.vw_miembros_sin_membresia TO 'vitality_app'@'localhost';
GRANT SELECT ON vitality_gym.vw_ingresos_recientes TO 'vitality_app'@'localhost';
GRANT SELECT ON vitality_gym.vw_frecuencia_visitas TO 'vitality_app'@'localhost';
GRANT SELECT ON vitality_gym.vw_dashboard_resumen TO 'vitality_app'@'localhost';
GRANT SELECT ON vitality_gym.vw_historial_miembro TO 'vitality_app'@'localhost';

-- =====================================================
-- USUARIO: vitality_recepcion
-- ROL: Usuario de recepción
-- Permisos: Gestionar accesos, consultar miembros, registrar pagos
-- =====================================================
CREATE USER 'vitality_recepcion'@'localhost'
    IDENTIFIED BY 'RecepVitality2024!';

-- Solo SELECT y UPDATE en miembros (no puede eliminar)
GRANT SELECT, INSERT, UPDATE ON vitality_gym.miembros TO 'vitality_recepcion'@'localhost';

-- Solo SELECT en membresías (no puede modificar)
GRANT SELECT ON vitality_gym.membresias TO 'vitality_recepcion'@'localhost';

-- Solo SELECT en tipos de membresía
GRANT SELECT ON vitality_gym.tipos_membresia TO 'vitality_recepcion'@'localhost';

-- INSERT en accesos (registrar entradas)
GRANT INSERT, SELECT ON vitality_gym.accesos TO 'vitality_recepcion'@'localhost';

-- Solo INSERT en pagos (registrar pagos nuevos)
GRANT INSERT, SELECT ON vitality_gym.pagos TO 'vitality_recepcion'@'localhost';

-- Solo SELECT en vistas de consulta
GRANT SELECT ON vitality_gym.vw_membresias_activas TO 'vitality_recepcion'@'localhost';
GRANT SELECT ON vitality_gym.vw_accesos_hoy TO 'vitality_recepcion'@'localhost';
GRANT SELECT ON vitality_gym.vw_dashboard_resumen TO 'vitality_recepcion'@'localhost';

-- Ejecutar función de validación
GRANT EXECUTE ON FUNCTION vitality_gym.fn_validar_acceso TO 'vitality_recepcion'@'localhost';

-- =====================================================
-- USUARIO: vitality_lector
-- ROL: Solo lectura de accesos
-- Permisos: Solo consultar, ideal para el módulo de control de acceso
-- =====================================================
CREATE USER 'vitality_lector'@'localhost'
    IDENTIFIED BY 'LectorVitality2024!';

-- Solo SELECT en tablas principales
GRANT SELECT ON vitality_gym.miembros TO 'vitality_lector'@'localhost';
GRANT SELECT ON vitality_gym.membresias TO 'vitality_lector'@'localhost';
GRANT SELECT ON vitality_gym.tipos_membresia TO 'vitality_lector'@'localhost';

-- Solo INSERT en accesos (registrar entradas)
GRANT INSERT, SELECT ON vitality_gym.accesos TO 'vitality_lector'@'localhost';

-- Ejecutar función de validación
GRANT EXECUTE ON FUNCTION vitality_gym.fn_validar_acceso TO 'vitality_lector'@'localhost';

-- Solo SELECT en vistas relevantes
GRANT SELECT ON vitality_gym.vw_membresias_activas TO 'vitality_lector'@'localhost';
GRANT SELECT ON vitality_gym.vw_accesos_hoy TO 'vitality_lector'@'localhost';

-- =====================================================
-- USUARIO: vitality_reportes
-- ROL: Generación de reportes
-- Permisos: Solo SELECT en todas las vistas y tablas
-- =====================================================
CREATE USER 'vitality_reportes'@'localhost'
    IDENTIFIED BY 'ReportesVitality2024!';

-- Solo SELECT en todas las tablas
GRANT SELECT ON vitality_gym.* TO 'vitality_reportes'@'localhost';

-- Ejecutar procedimientos de reportes
GRANT EXECUTE ON PROCEDURE vitality_gym.sp_reporte_ingresos TO 'vitality_reportes'@'localhost';
GRANT EXECUTE ON PROCEDURE vitality_gym.sp_membresias_por_vencer TO 'vitality_reportes'@'localhost';
GRANT EXECUTE ON FUNCTION vitality_gym.fn_validar_acceso TO 'vitality_reportes'@'localhost';

-- =====================================================
-- APLICAR CAMBIOS
-- =====================================================
FLUSH PRIVILEGES;

-- =====================================================
-- VERIFICAR USUARIOS CREADOS
-- =====================================================
SELECT
    user,
    host,
    plugin,
    authentication_string IS NOT NULL as has_password
FROM mysql.user
WHERE user LIKE 'vitality_%'
ORDER BY user;

-- =====================================================
-- MOSTRAR PERMISOS DE CADA USUARIO
-- =====================================================
-- Para ver los permisos de un usuario específico, ejecutar:
-- SHOW GRANTS FOR 'vitality_app'@'localhost';
-- SHOW GRANTS FOR 'vitality_recepcion'@'localhost';
-- SHOW GRANTS FOR 'vitality_lector'@'localhost';
-- SHOW GRANTS FOR 'vitality_reportes'@'localhost';

-- =====================================================
-- NOTAS DE SEGURIDAD:
-- =====================================================
-- 1. Las contraseñas deben cambiarse periódicamente
-- 2. Considerar usar SSL para conexiones remotas
-- 3. Los usuarios están restringidos a 'localhost'
-- 4. Para conexiones remotas, crear usuarios con '%' en host
-- =====================================================
