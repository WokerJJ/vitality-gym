-- =====================================================
-- GIMNASIO VITALITY - VISTAS
-- Vistas para reportes y consultas frecuentes
-- =====================================================

USE vitality_gym;

-- =====================================================
-- VISTA: Miembros con membresía activa
-- =====================================================
CREATE OR REPLACE VIEW vw_membresias_activas AS
SELECT
    m.id_miembro,
    CONCAT(m.nombres, ' ', m.apellidos) AS nombre_completo,
    m.identificacion,
    m.email,
    m.telefono,
    mem.id_membresia,
    tm.nombre AS tipo_membresia,
    tm.duracion_dias,
    tm.incluye_entrenador,
    mem.fecha_inicio,
    mem.fecha_fin,
    DATEDIFF(mem.fecha_fin, CURDATE()) AS dias_restantes,
    mem.precio_pagado,
    CASE
        WHEN DATEDIFF(mem.fecha_fin, CURDATE()) <= 7 THEN 'Por vencer'
        WHEN DATEDIFF(mem.fecha_fin, CURDATE()) <= 0 THEN 'En gracia'
        ELSE 'Activa'
    END AS estado_dias,
    mem.dias_gracia,
    DATE_ADD(mem.fecha_fin, INTERVAL mem.dias_gracia DAY) AS fecha_gracia_hasta
FROM miembros m
INNER JOIN membresias mem ON m.id_miembro = mem.id_miembro
INNER JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
WHERE mem.estado = 'Activa'
  AND m.estado = 'Activo'
ORDER BY mem.fecha_fin ASC;

-- =====================================================
-- VISTA: Resumen de accesos del día
-- =====================================================
CREATE OR REPLACE VIEW vw_accesos_hoy AS
SELECT
    a.id_acceso,
    a.id_miembro,
    CONCAT(m.nombres, ' ', m.apellidos) AS nombre_completo,
    m.identificacion,
    tm.nombre AS tipo_membresia,
    a.fecha_hora_entrada,
    a.fecha_hora_salida,
    TIMESTAMPDIFF(MINUTE, a.fecha_hora_entrada, COALESCE(a.fecha_hora_salida, NOW())) AS minutos_dentro,
    a.tipo_acceso,
    a.validado,
    a.notas
FROM accesos a
INNER JOIN miembros m ON a.id_miembro = m.id_miembro
LEFT JOIN membresias mem ON a.id_membresia = mem.id_membresia
LEFT JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
WHERE DATE(a.fecha_hora_entrada) = CURDATE()
ORDER BY a.fecha_hora_entrada DESC;

-- =====================================================
-- VISTA: Estadísticas de membresías
-- =====================================================
CREATE OR REPLACE VIEW vw_estadisticas_membresias AS
SELECT
    tm.nombre AS tipo_membresia,
    tm.precio AS precio_base,
    COUNT(mem.id_membresia) AS total_vendidas,
    SUM(CASE WHEN mem.estado = 'Activa' THEN 1 ELSE 0 END) AS activas,
    SUM(CASE WHEN mem.estado = 'Vencida' THEN 1 ELSE 0 END) AS vencidas,
    SUM(CASE WHEN mem.estado = 'Cancelada' THEN 1 ELSE 0 END) AS canceladas,
    SUM(mem.precio_pagado) AS total_recaudado,
    AVG(mem.precio_pagado) AS precio_promedio_pagado,
    MIN(mem.fecha_inicio) AS primera_venta,
    MAX(mem.fecha_inicio) AS ultima_venta
FROM tipos_membresia tm
LEFT JOIN membresias mem ON tm.id_tipo = mem.id_tipo
WHERE tm.activo = TRUE
GROUP BY tm.id_tipo, tm.nombre, tm.precio
ORDER BY total_vendidas DESC;

-- =====================================================
-- VISTA: Miembros sin membresía activa (CORREGIDA - NULLS LAST eliminado)
-- =====================================================
CREATE OR REPLACE VIEW vw_miembros_sin_membresia AS
SELECT
    m.id_miembro,
    CONCAT(m.nombres, ' ', m.apellidos) AS nombre_completo,
    m.identificacion,
    m.email,
    m.telefono,
    m.fecha_registro,
    DATEDIFF(CURDATE(), m.fecha_registro) AS dias_desde_registro,
    MAX(mem.fecha_fin) AS ultima_membresia,
    COUNT(mem.id_membresia) AS total_membresias_historicas
FROM miembros m
LEFT JOIN membresias mem ON m.id_miembro = mem.id_miembro
WHERE m.estado = 'Activo'
GROUP BY m.id_miembro, m.nombres, m.apellidos, m.identificacion,
         m.email, m.telefono, m.fecha_registro
HAVING MAX(mem.estado) IS NULL OR MAX(mem.estado) != 'Activa'
-- ✅ CORREGIDO: MySQL no soporta NULLS LAST, se usa expresión alternativa
ORDER BY ultima_membresia IS NULL ASC, ultima_membresia DESC;

-- =====================================================
-- VISTA: Ingresos por período (últimos 30 días)
-- =====================================================
CREATE OR REPLACE VIEW vw_ingresos_recientes AS
SELECT
    DATE(p.fecha_pago) AS fecha,
    COUNT(*) AS cantidad_transacciones,
    SUM(p.monto) AS total_dia,
    p.metodo_pago,
    GROUP_CONCAT(DISTINCT tm.nombre SEPARATOR ', ') AS tipos_membresia
FROM pagos p
INNER JOIN membresias mem ON p.id_membresia = mem.id_membresia
INNER JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
WHERE p.fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(p.fecha_pago), p.metodo_pago
ORDER BY fecha DESC;

-- =====================================================
-- VISTA: Frecuencia de visitas por miembro
-- =====================================================
CREATE OR REPLACE VIEW vw_frecuencia_visitas AS
SELECT
    m.id_miembro,
    CONCAT(m.nombres, ' ', m.apellidos) AS nombre_completo,
    m.identificacion,
    tm.nombre AS tipo_membresia_actual,
    COUNT(a.id_acceso) AS total_visitas,
    COUNT(DISTINCT DATE(a.fecha_hora_entrada)) AS dias_distintos,
    MIN(a.fecha_hora_entrada) AS primera_visita,
    MAX(a.fecha_hora_entrada) AS ultima_visita,
    AVG(TIMESTAMPDIFF(MINUTE, a.fecha_hora_entrada, COALESCE(a.fecha_hora_salida, NOW()))) AS promedio_minutos
FROM miembros m
LEFT JOIN accesos a ON m.id_miembro = a.id_miembro AND a.validado = TRUE
LEFT JOIN membresias mem ON m.id_miembro = mem.id_miembro AND mem.estado = 'Activa'
LEFT JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
WHERE m.estado = 'Activo'
GROUP BY m.id_miembro, m.nombres, m.apellidos, m.identificacion, tm.nombre
ORDER BY total_visitas DESC;

-- =====================================================
-- VISTA: Dashboard resumen
-- =====================================================
CREATE OR REPLACE VIEW vw_dashboard_resumen AS
SELECT
    (SELECT COUNT(*) FROM miembros WHERE estado = 'Activo') AS total_miembros_activos,
    (SELECT COUNT(*) FROM membresias WHERE estado = 'Activa') AS membresias_activas,
    (SELECT COUNT(*) FROM membresias WHERE estado = 'Activa' AND fecha_fin <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS membresias_por_vencer,
    (SELECT COUNT(*) FROM membresias WHERE estado = 'Vencida') AS membresias_vencidas,
    (SELECT COUNT(*) FROM accesos WHERE DATE(fecha_hora_entrada) = CURDATE()) AS accesos_hoy,
    (SELECT SUM(monto) FROM pagos WHERE DATE(fecha_pago) = CURDATE()) AS ingresos_hoy,
    (SELECT SUM(monto) FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE())) AS ingresos_mes,
    (SELECT COUNT(*) FROM miembros WHERE DATE(fecha_registro) = CURDATE()) AS nuevos_hoy;

-- =====================================================
-- VISTA: Historial completo de miembro
-- =====================================================
CREATE OR REPLACE VIEW vw_historial_miembro AS
SELECT
    m.id_miembro,
    CONCAT(m.nombres, ' ', m.apellidos) AS nombre_completo,
    m.identificacion,
    m.email,
    m.telefono,
    mem.id_membresia,
    tm.nombre AS tipo_membresia,
    mem.fecha_inicio,
    mem.fecha_fin,
    mem.estado AS estado_membresia,
    mem.precio_pagado,
    (SELECT COUNT(*) FROM accesos WHERE id_membresia = mem.id_membresia) AS visitas_con_membresia,
    (SELECT SUM(monto) FROM pagos WHERE id_membresia = mem.id_membresia) AS total_pagado_membresia
FROM miembros m
LEFT JOIN membresias mem ON m.id_miembro = mem.id_miembro
LEFT JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
ORDER BY m.id_miembro, mem.fecha_inicio DESC;

-- =====================================================
-- NUEVA VISTA: Membresías por vencer (para el SP sp_membresias_por_vencer)
-- =====================================================
CREATE OR REPLACE VIEW vw_membresias_por_vencer AS
SELECT
    m.id_miembro,
    CONCAT(m.nombres, ' ', m.apellidos) AS nombre_completo,
    m.email,
    tm.nombre AS tipo_membresia,
    mem.fecha_fin AS fecha_vencimiento,
    DATEDIFF(mem.fecha_fin, CURDATE()) AS dias_restantes,
    mem.precio_pagado,
    mem.dias_gracia,
    DATE_ADD(mem.fecha_fin, INTERVAL mem.dias_gracia DAY) AS fecha_gracia_hasta,
    CASE 
        WHEN DATEDIFF(mem.fecha_fin, CURDATE()) <= 0 THEN 'En período de gracia'
        WHEN DATEDIFF(mem.fecha_fin, CURDATE()) <= 3 THEN 'Crítico'
        WHEN DATEDIFF(mem.fecha_fin, CURDATE()) <= 7 THEN 'Urgente'
        ELSE 'Próximo'
    END AS nivel_alerta,
    mem.id_membresia
FROM miembros m
INNER JOIN membresias mem ON m.id_miembro = mem.id_miembro
INNER JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
WHERE mem.estado = 'Activa'
  AND DATEDIFF(mem.fecha_fin, CURDATE()) <= 7
ORDER BY dias_restantes ASC;