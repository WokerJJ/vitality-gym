-- =====================================================
-- GIMNASIO VITALITY - DATOS INICIALES
-- Datos de prueba para el sistema
-- =====================================================

USE vitality_gym;

-- =====================================================
-- TIPOS DE MEMBRESÍA
-- =====================================================
INSERT INTO tipos_membresia (nombre, duracion_dias, precio, descripcion, max_visitas_dia, incluye_entrenador) VALUES
('Básica Mensual', 30, 80000.00, 'Acceso a zona de pesas y cardio. Horario limitado.', NULL, FALSE),
('Básica Trimestral', 90, 210000.00, 'Ahorra $30,000. Acceso básico por 3 meses.', NULL, FALSE),
('Premium Mensual', 30, 150000.00, 'Acceso ilimitado 24/7, todas las áreas incluyendo spa.', NULL, TRUE),
('Premium Trimestral', 90, 400000.00, 'Ahorra $50,000. Acceso premium por 3 meses.', NULL, TRUE),
('Estudiante', 30, 60000.00, 'Precio especial para estudiantes. Acceso básico.', NULL, FALSE),
('Pase Diario', 1, 20000.00, 'Acceso por un día a todas las áreas.', 1, FALSE),
('Familiar', 30, 250000.00, 'Hasta 4 miembros de la familia. Acceso premium.', NULL, TRUE),
('Empresarial', 30, 180000.00, 'Plan corporativo. Incluye reportes de uso.', NULL, TRUE);

-- =====================================================
-- MIEMBROS DE PRUEBA
-- =====================================================
INSERT INTO miembros (identificacion, tipo_identificacion, nombres, apellidos, email, telefono, fecha_nacimiento, genero, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono) VALUES
('1001234567', 'CC', 'Daniela', 'Blandón', 'daniela.b@email.com', '3001234567', '1998-05-15', 'F', 'Calle 123 #45-67, Medellín', 'María Blandón', '3009876543'),
('1007654321', 'CC', 'Jhon Hucker', 'Chalarca', 'jhon.chalarca@email.com', '3107654321', '1995-08-22', 'M', 'Carrera 67 #89-10, Medellín', 'Carlos Chalarca', '3109876543'),
('1002345678', 'CC', 'Carlos', 'Martínez', 'carlos.mtz@email.com', '3202345678', '1990-03-10', 'M', 'Avenida El Poblado #12-34', 'Ana Martínez', '3209876543'),
('1003456789', 'CC', 'María', 'Gómez', 'maria.gomez@email.com', '3003456789', '1992-11-28', 'F', 'Calle 50 #33-44, Envigado', 'Pedro Gómez', '3019876543'),
('1004567890', 'CC', 'Luis', 'Rodríguez', 'luis.rodriguez@email.com', '3104567890', '1988-07-05', 'M', 'Carrera 45 #67-89', 'Diana Rodríguez', '3119876543'),
('1005678901', 'CC', 'Ana', 'López', 'ana.lopez@email.com', '3205678901', '1996-12-18', 'F', 'Avenida Las Vegas #56-78', 'Juan López', '3129876543'),
('1006789012', 'CC', 'Pedro', 'Sánchez', 'pedro.sanchez@email.com', '3006789012', '1993-04-25', 'M', 'Calle 80 #90-12, Bello', 'Laura Sánchez', '3139876543'),
('1007890123', 'CC', 'Laura', 'Torres', 'laura.torres@email.com', '3107890123', '1997-09-14', 'F', 'Carrera 70 #11-22', 'Roberto Torres', '3149876543'),
('1008901234', 'CC', 'Andrés', 'García', 'andres.garcia@email.com', '3208901234', '1985-01-30', 'M', 'Calle 33 #44-55, Itagüí', 'Carmen García', '3159876543'),
('1009012345', 'CC', 'Sofía', 'Ramírez', 'sofia.ramirez@email.com', '3009012345', '1999-06-08', 'F', 'Avenida San Diego #66-77', 'Diego Ramírez', '3169876543'),
('1010123456', 'CC', 'Diego', 'Herrera', 'diego.herrera@email.com', '3100123456', '1991-10-20', 'M', 'Carrera 25 #88-99', 'Valentina Herrera', '3179876543'),
('1011234567', 'CC', 'Valentina', 'Castro', 'valentina.castro@email.com', '3201234567', '1994-02-12', 'F', 'Calle 10 #20-30', 'Mateo Castro', '3189876543');

-- =====================================================
-- USUARIOS DEL SISTEMA
-- Contraseñas hasheadas con bcrypt (costo 10)
-- =====================================================
-- Nota: Las contraseñas son:
-- admin: AdminVitality2024!
-- recepcion: Recepcion123!
-- entrenador: Entrenador123!
INSERT INTO usuarios_sistema (username, password_hash, rol, nombres, apellidos, email, telefono) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'Administrador', 'Sistema', 'admin@vitalitygym.com', '3000000000'),
('recepcion1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Recepcionista', 'María', 'González', 'recepcion@vitalitygym.com', '3001111111'),
('entrenador1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Entrenador', 'Carlos', 'Vega', 'entrenador@vitalitygym.com', '3002222222'),
('gerente1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Gerente', 'Lucía', 'Mendoza', 'gerente@vitalitygym.com', '3003333333');

-- =====================================================
-- MEMBRESÍAS ACTIVAS
-- =====================================================
INSERT INTO membresias (id_miembro, id_tipo, fecha_inicio, fecha_fin, precio_pagado, metodo_pago, referencia_pago, estado, dias_gracia) VALUES
-- Membresías activas
(1, 3, '2025-03-01', '2025-04-30', 150000.00, 'Tarjeta', 'PAY-2025-001', 'Activa', 3),
(2, 4, '2025-01-15', '2025-04-15', 400000.00, 'Transferencia', 'TR-001-ABC', 'Activa', 5),
(3, 1, '2025-03-10', '2025-04-09', 80000.00, 'Efectivo', NULL, 'Activa', 0),
(4, 2, '2025-02-01', '2025-05-01', 210000.00, 'Tarjeta', 'PAY-2025-002', 'Activa', 3),
(5, 3, '2025-03-20', '2025-04-19', 150000.00, 'Transferencia', 'TR-002-DEF', 'Activa', 3),
(6, 6, '2025-04-11', '2025-04-11', 20000.00, 'Efectivo', NULL, 'Activa', 0),
(7, 5, '2025-04-01', '2025-05-01', 60000.00, 'Tarjeta', 'PAY-2025-003', 'Activa', 2),
(8, 1, '2025-03-25', '2025-04-24', 80000.00, 'Efectivo', NULL, 'Activa', 0);

-- =====================================================
-- MEMBRESÍAS VENCIDAS (histórico)
-- =====================================================
INSERT INTO membresias (id_miembro, id_tipo, fecha_inicio, fecha_fin, precio_pagado, metodo_pago, estado, notas) VALUES
(1, 1, '2024-12-01', '2024-12-31', 80000.00, 'Tarjeta', 'Vencida', 'Renovada a Premium'),
(3, 1, '2025-01-10', '2025-02-09', 80000.00, 'Efectivo', 'Vencida', 'Renovada el 10 de marzo'),
(9, 7, '2025-01-01', '2025-01-31', 250000.00, 'Transferencia', 'Vencida', 'No renovada'),
(10, 3, '2025-02-01', '2025-03-02', 150000.00, 'Tarjeta', 'Vencida', 'Pendiente de renovación'),
(11, 2, '2024-11-01', '2025-01-30', 210000.00, 'Efectivo', 'Vencida', 'No ha renovado'),
(12, 1, '2025-01-15', '2025-02-14', 80000.00, 'Tarjeta', 'Vencida', 'Contactar para renovación');

-- =====================================================
-- ACCESOS RECIENTES (últimos 7 días)
-- =====================================================
INSERT INTO accesos (id_miembro, id_membresia, fecha_hora_entrada, fecha_hora_salida, tipo_acceso, validado) VALUES
-- Accesos de hoy
(1, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW(), 'Membresia', TRUE),
(2, 2, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Membresia', TRUE),
(3, 3, DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL, 'Membresia', TRUE),

-- Accesos de ayer
(4, 4, DATE_SUB(NOW(), INTERVAL 25 HOUR), DATE_SUB(NOW(), INTERVAL 23 HOUR), 'Membresia', TRUE),
(5, 5, DATE_SUB(NOW(), INTERVAL 26 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR), 'Membresia', TRUE),
(1, 1, DATE_SUB(NOW(), INTERVAL 28 HOUR), DATE_SUB(NOW(), INTERVAL 26 HOUR), 'Membresia', TRUE),

-- Accesos de hace 2 días
(6, NULL, DATE_SUB(NOW(), INTERVAL 50 HOUR), DATE_SUB(NOW(), INTERVAL 48 HOUR), 'Visita', FALSE),
(7, 7, DATE_SUB(NOW(), INTERVAL 52 HOUR), DATE_SUB(NOW(), INTERVAL 50 HOUR), 'Membresia', TRUE),
(2, 2, DATE_SUB(NOW(), INTERVAL 54 HOUR), DATE_SUB(NOW(), INTERVAL 52 HOUR), 'Membresia', TRUE),

-- Accesos de hace 3 días
(8, 8, DATE_SUB(NOW(), INTERVAL 75 HOUR), DATE_SUB(NOW(), INTERVAL 73 HOUR), 'Membresia', TRUE),
(3, 3, DATE_SUB(NOW(), INTERVAL 76 HOUR), DATE_SUB(NOW(), INTERVAL 74 HOUR), 'Membresia', TRUE),
(4, 4, DATE_SUB(NOW(), INTERVAL 78 HOUR), DATE_SUB(NOW(), INTERVAL 76 HOUR), 'Membresia', TRUE);

-- =====================================================
-- PAGOS
-- =====================================================
INSERT INTO pagos (id_membresia, monto, fecha_pago, metodo_pago, referencia, registrado_por, notas) VALUES
(1, 150000.00, '2025-03-01 10:30:00', 'Tarjeta', 'PAY-2025-001', 1, 'Pago de membresía premium'),
(2, 400000.00, '2025-01-15 14:15:00', 'Transferencia', 'TR-001-ABC', 2, 'Pago trimestral'),
(3, 80000.00, '2025-03-10 09:00:00', 'Efectivo', NULL, 2, 'Pago mensualidad básica'),
(4, 210000.00, '2025-02-01 16:45:00', 'Tarjeta', 'PAY-2025-002', 1, 'Pago trimestral básica'),
(5, 150000.00, '2025-03-20 11:20:00', 'Transferencia', 'TR-002-DEF', 2, 'Pago premium mensual'),
(6, 20000.00, '2025-04-11 08:00:00', 'Efectivo', NULL, 2, 'Pase diario'),
(7, 60000.00, '2025-04-01 15:30:00', 'Tarjeta', 'PAY-2025-003', 1, 'Estudiante'),
(8, 80000.00, '2025-03-25 12:00:00', 'Efectivo', NULL, 2, 'Mensualidad básica'),
(9, 80000.00, '2024-12-01 10:00:00', 'Tarjeta', 'OLD-001', 1, 'Pago histórico'),
(10, 150000.00, '2025-02-01 11:00:00', 'Tarjeta', 'OLD-002', 2, 'Pago histórico');

-- =====================================================
-- CONSULTAS DE VERIFICACIÓN
-- =====================================================
SELECT '=== RESUMEN DE DATOS INICIALES ===' AS info;

SELECT CONCAT('Tipos de membresía: ', COUNT(*)) FROM tipos_membresia;
SELECT CONCAT('Miembros registrados: ', COUNT(*)) FROM miembros;
SELECT CONCAT('Membresías activas: ', COUNT(*)) FROM membresias WHERE estado = 'Activa';
SELECT CONCAT('Membresías vencidas: ', COUNT(*)) FROM membresias WHERE estado = 'Vencida';
SELECT CONCAT('Usuarios del sistema: ', COUNT(*)) FROM usuarios_sistema;
SELECT CONCAT('Accesos registrados: ', COUNT(*)) FROM accesos;
SELECT CONCAT('Pagos registrados: ', COUNT(*)) FROM pagos;
