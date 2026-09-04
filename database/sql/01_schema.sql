-- =====================================================
-- GIMNASIO VITALITY - ESQUEMA DE BASE DE DATOS
-- Normalización: 3FN (Tercera Forma Normal)
-- Autores: Daniela Blandón, Jhon Hucker Chalarca
-- =====================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS vitality_gym
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE vitality_gym;

-- =====================================================
-- TABLA: tipos_membresia
-- Almacena los diferentes planes de membresía
-- 3FN: Sin dependencias transitivas
-- =====================================================
CREATE TABLE IF NOT EXISTS tipos_membresia (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    duracion_dias INT NOT NULL COMMENT 'Duración en días del plan',
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    descripcion TEXT,
    max_visitas_dia INT DEFAULT NULL COMMENT 'NULL = ilimitado',
    incluye_entrenador BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_activo (activo),
    INDEX idx_precio (precio)
) ENGINE=InnoDB COMMENT='Catálogo de planes de membresía';

-- =====================================================
-- TABLA: miembros
-- Información de los clientes del gimnasio
-- 3FN: Datos dependen únicamente de la PK
-- =====================================================
CREATE TABLE IF NOT EXISTS miembros (
    id_miembro INT AUTO_INCREMENT PRIMARY KEY,
    identificacion VARCHAR(20) NOT NULL UNIQUE COMMENT 'Número de documento',
    tipo_identificacion ENUM('CC', 'CE', 'TI', 'PP') DEFAULT 'CC',
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    genero ENUM('M', 'F', 'Otro') DEFAULT 'Otro',
    direccion VARCHAR(200),
    contacto_emergencia_nombre VARCHAR(100),
    contacto_emergencia_telefono VARCHAR(20),
    foto_url VARCHAR(500),
    estado ENUM('Activo', 'Inactivo', 'Suspendido') DEFAULT 'Activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_identificacion (identificacion),
    INDEX idx_estado (estado),
    INDEX idx_nombre_completo (nombres, apellidos),
    INDEX idx_email (email)
) ENGINE=InnoDB COMMENT='Clientes del gimnasio';

-- =====================================================
-- TABLA: membresias
-- Registro de membresías activas/vencidas
-- 3FN: FK a tipos_membresia y miembros
-- =====================================================
CREATE TABLE IF NOT EXISTS membresias (
    id_membresia INT AUTO_INCREMENT PRIMARY KEY,
    id_miembro INT NOT NULL,
    id_tipo INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    precio_pagado DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Otro') DEFAULT 'Efectivo',
    referencia_pago VARCHAR(100),
    estado ENUM('Activa', 'Vencida', 'Cancelada', 'Pendiente') DEFAULT 'Activa',
    dias_gracia INT DEFAULT 0 COMMENT 'Días de cortesía después de vencimiento',
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_miembro) REFERENCES miembros(id_miembro)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_tipo) REFERENCES tipos_membresia(id_tipo)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_miembro (id_miembro),
    INDEX idx_estado (estado),
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    INDEX idx_fecha_fin (fecha_fin),

    CONSTRAINT chk_fechas CHECK (fecha_fin >= fecha_inicio) 
) ENGINE=InnoDB COMMENT='Membresías contratadas por los miembros';

-- =====================================================
-- TABLA: accesos
-- Registro de entradas al gimnasio
-- =====================================================
CREATE TABLE IF NOT EXISTS accesos (
    id_acceso INT AUTO_INCREMENT PRIMARY KEY,
    id_miembro INT NOT NULL,
    id_membresia INT,
    fecha_hora_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_salida TIMESTAMP NULL,
    tipo_acceso ENUM('Membresia', 'Visita', 'Empleado', 'Otro') DEFAULT 'Membresia',
    validado BOOLEAN DEFAULT TRUE COMMENT 'Si pasó validación de membresía activa',
    notas VARCHAR(200),

    FOREIGN KEY (id_miembro) REFERENCES miembros(id_miembro)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_membresia) REFERENCES membresias(id_membresia)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_miembro_fecha (id_miembro, fecha_hora_entrada),
    INDEX idx_fecha (fecha_hora_entrada),
    INDEX idx_validado (validado)
) ENGINE=InnoDB COMMENT='Registro de accesos al gimnasio';

-- =====================================================
-- TABLA: usuarios_sistema
-- Usuarios administrativos del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Contraseña hasheada con bcrypt',
    rol ENUM('Administrador', 'Recepcionista', 'Entrenador', 'Gerente') NOT NULL DEFAULT 'Recepcionista',
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_username (username),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo)
) ENGINE=InnoDB COMMENT='Usuarios del sistema de administración';

-- =====================================================
-- TABLA: pagos
-- Historial de pagos detallado
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_membresia INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Otro') NOT NULL,
    referencia VARCHAR(100),
    registrado_por INT NOT NULL,
    notas TEXT,

    FOREIGN KEY (id_membresia) REFERENCES membresias(id_membresia)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios_sistema(id_usuario)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_membresia (id_membresia),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_metodo (metodo_pago)
) ENGINE=InnoDB COMMENT='Registro de pagos individuales';

-- =====================================================
-- TABLA: auditoria
-- Log de cambios importantes en el sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    id_registro INT NOT NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    usuario VARCHAR(50) NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),

    INDEX idx_tabla (tabla_afectada),
    INDEX idx_fecha (fecha_hora),
    INDEX idx_usuario (usuario)
) ENGINE=InnoDB COMMENT='Auditoría de cambios en el sistema';
