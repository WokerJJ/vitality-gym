-- =====================================================
-- GIMNASIO VITALITY - TRIGGERS Y PROCEDIMIENTOS
-- =====================================================

USE vitality_gym;

DELIMITER //

-- =====================================================
-- TRIGGER: Actualizar estado de membresía automáticamente
-- =====================================================
CREATE TRIGGER trg_actualizar_estado_membresia
BEFORE INSERT ON membresias
FOR EACH ROW
BEGIN
    IF NEW.fecha_fin < CURDATE() THEN
        SET NEW.estado = 'Vencida';
    END IF;
END //

-- =====================================================
-- TRIGGER: Auditoría para miembros
-- =====================================================
CREATE TRIGGER trg_auditoria_miembros_insert
AFTER INSERT ON miembros
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, id_registro, accion, datos_nuevos, usuario, ip_address)
    VALUES (
        'miembros',
        NEW.id_miembro,
        'INSERT',
        JSON_OBJECT(
            'identificacion', NEW.identificacion,
            'nombres', NEW.nombres,
            'apellidos', NEW.apellidos,
            'email', NEW.email
        ),
        CURRENT_USER(),
        CONNECTION_ID()
    );
END //

CREATE TRIGGER trg_auditoria_miembros_update
AFTER UPDATE ON miembros
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, id_registro, accion, datos_anteriores, datos_nuevos, usuario, ip_address)
    VALUES (
        'miembros',
        NEW.id_miembro,
        'UPDATE',
        JSON_OBJECT(
            'identificacion', OLD.identificacion,
            'nombres', OLD.nombres,
            'apellidos', OLD.apellidos,
            'estado', OLD.estado
        ),
        JSON_OBJECT(
            'identificacion', NEW.identificacion,
            'nombres', NEW.nombres,
            'apellidos', NEW.apellidos,
            'estado', NEW.estado
        ),
        CURRENT_USER(),
        CONNECTION_ID()
    );
END //

-- =====================================================
-- TRIGGER: Registrar acceso con validación automática
-- =====================================================
CREATE TRIGGER trg_validar_acceso
BEFORE INSERT ON accesos
FOR EACH ROW
BEGIN
    DECLARE v_membresia_activa INT;
    DECLARE v_estado_miembro VARCHAR(20);

    SELECT estado INTO v_estado_miembro
    FROM miembros WHERE id_miembro = NEW.id_miembro;

    IF v_estado_miembro != 'Activo' THEN
        SET NEW.validado = FALSE;
        SET NEW.notas = 'Miembro inactivo';
    ELSE
        SELECT id_membresia INTO v_membresia_activa
        FROM membresias
        WHERE id_miembro = NEW.id_miembro
          AND estado = 'Activa'
          AND fecha_inicio <= CURDATE()
          AND (fecha_fin >= CURDATE() OR DATE_ADD(fecha_fin, INTERVAL dias_gracia DAY) >= CURDATE())
        ORDER BY fecha_fin DESC
        LIMIT 1;

        IF v_membresia_activa IS NOT NULL THEN
            SET NEW.id_membresia = v_membresia_activa;
            SET NEW.validado = TRUE;
        ELSE
            SET NEW.validado = FALSE;
            SET NEW.notas = 'No tiene membresía activa';
        END IF;
    END IF;
END //

-- =====================================================
-- TRIGGER: Actualizar último acceso del usuario
-- =====================================================
CREATE TRIGGER trg_actualizar_ultimo_acceso
AFTER INSERT ON accesos
FOR EACH ROW
BEGIN
    UPDATE miembros
    SET fecha_actualizacion = NOW()
    WHERE id_miembro = NEW.id_miembro;
END //

-- =====================================================
-- TRIGGER: Validar que no haya membresías duplicadas activas
-- =====================================================
CREATE TRIGGER trg_validar_membresia_unica
BEFORE INSERT ON membresias
FOR EACH ROW
BEGIN
    DECLARE v_membresias_activas INT;

    SELECT COUNT(*) INTO v_membresias_activas
    FROM membresias
    WHERE id_miembro = NEW.id_miembro
      AND estado = 'Activa'
      AND id_membresia != NEW.id_membresia;

    IF v_membresias_activas > 0 AND NEW.estado = 'Activa' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El miembro ya tiene una membresía activa';
    END IF;
END //

-- =====================================================
-- PROCEDIMIENTO: Renovación de membresía usando CURSOR
-- =====================================================
CREATE PROCEDURE sp_renovar_membresias_vencidas()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id_membresia INT;
    DECLARE v_id_miembro INT;
    DECLARE v_id_tipo INT;

    -- ✅ CURSOR DECLARADO PRIMERO (antes de cualquier sentencia ejecutable)
    DECLARE cur_membresias CURSOR FOR
        SELECT id_membresia, id_miembro, id_tipo
        FROM membresias
        WHERE estado = 'Activa'
          AND fecha_fin = CURDATE();

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Ahora sí las sentencias ejecutables
    OPEN cur_membresias;

    read_loop: LOOP
        FETCH cur_membresias INTO v_id_membresia, v_id_miembro, v_id_tipo;
        IF done THEN
            LEAVE read_loop;
        END IF;

        UPDATE membresias
        SET estado = 'Vencida',
            notas = CONCAT(IFNULL(notas, ''), ' | Vencida automáticamente el ', CURDATE())
        WHERE id_membresia = v_id_membresia;

    END LOOP;

    CLOSE cur_membresias;
END //

-- =====================================================
-- PROCEDIMIENTO: Generar reporte de ingresos con CURSOR
-- =====================================================
CREATE PROCEDURE sp_reporte_ingresos(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metodo VARCHAR(20);
    DECLARE v_total DECIMAL(12,2);
    DECLARE v_cantidad INT;

    -- ✅ CURSOR Y HANDLER DECLARADOS AL INICIO
    DECLARE cur_ingresos CURSOR FOR
        SELECT metodo_pago, COUNT(*) as cantidad, SUM(monto) as total
        FROM pagos
        WHERE DATE(fecha_pago) BETWEEN p_fecha_inicio AND p_fecha_fin
        GROUP BY metodo_pago;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Ahora las sentencias ejecutables
    DROP TEMPORARY TABLE IF EXISTS temp_reporte_ingresos;

    CREATE TEMPORARY TABLE temp_reporte_ingresos (
        metodo_pago VARCHAR(20),
        cantidad_transacciones INT,
        total_ingresos DECIMAL(12,2)
    );

    OPEN cur_ingresos;

    ingresos_loop: LOOP
        FETCH cur_ingresos INTO v_metodo, v_cantidad, v_total;
        IF done THEN
            LEAVE ingresos_loop;
        END IF;

        INSERT INTO temp_reporte_ingresos VALUES (v_metodo, v_cantidad, v_total);
    END LOOP;

    CLOSE cur_ingresos;

    SELECT * FROM temp_reporte_ingresos;

    SELECT SUM(total_ingresos) as total_general FROM temp_reporte_ingresos;

    DROP TEMPORARY TABLE IF EXISTS temp_reporte_ingresos;
END //

-- =====================================================
-- PROCEDIMIENTO: Notificar membresías por vencer
-- =====================================================
CREATE PROCEDURE sp_membresias_por_vencer(
    IN p_dias_alerta INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id_miembro INT;
    DECLARE v_nombres VARCHAR(100);
    DECLARE v_apellidos VARCHAR(100);
    DECLARE v_email VARCHAR(100);
    DECLARE v_tipo_membresia VARCHAR(50);
    DECLARE v_fecha_fin DATE;
    DECLARE v_dias_restantes INT;

    -- ✅ CURSOR Y HANDLER DECLARADOS AL INICIO
    DECLARE cur_por_vencer CURSOR FOR
        SELECT
            m.id_miembro,
            m.nombres,
            m.apellidos,
            m.email,
            tm.nombre as tipo_membresia,
            mem.fecha_fin,
            DATEDIFF(mem.fecha_fin, CURDATE()) as dias_restantes
        FROM miembros m
        INNER JOIN membresias mem ON m.id_miembro = mem.id_miembro
        INNER JOIN tipos_membresia tm ON mem.id_tipo = tm.id_tipo
        WHERE mem.estado = 'Activa'
          AND DATEDIFF(mem.fecha_fin, CURDATE()) BETWEEN 0 AND p_dias_alerta
        ORDER BY dias_restantes ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Ahora las sentencias ejecutables
    DROP TEMPORARY TABLE IF EXISTS temp_por_vencer;

    CREATE TEMPORARY TABLE temp_por_vencer (
        id_miembro INT,
        nombre_completo VARCHAR(200),
        email VARCHAR(100),
        tipo_membresia VARCHAR(50),
        fecha_vencimiento DATE,
        dias_restantes INT
    );

    OPEN cur_por_vencer;

    vencer_loop: LOOP
        FETCH cur_por_vencer INTO v_id_miembro, v_nombres, v_apellidos,
                                   v_email, v_tipo_membresia, v_fecha_fin, v_dias_restantes;
        IF done THEN
            LEAVE vencer_loop;
        END IF;

        INSERT INTO temp_por_vencer VALUES
            (v_id_miembro, CONCAT(v_nombres, ' ', v_apellidos),
             v_email, v_tipo_membresia, v_fecha_fin, v_dias_restantes);
    END LOOP;

    CLOSE cur_por_vencer;

    SELECT * FROM temp_por_vencer;

    DROP TEMPORARY TABLE IF EXISTS temp_por_vencer;
END //

-- =====================================================
-- FUNCION: Validar si miembro tiene acceso
-- =====================================================
CREATE FUNCTION fn_validar_acceso(
    p_id_miembro INT
) RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_tiene_acceso BOOLEAN DEFAULT FALSE;
    DECLARE v_estado_miembro VARCHAR(20);

    SELECT estado INTO v_estado_miembro
    FROM miembros
    WHERE id_miembro = p_id_miembro;

    IF v_estado_miembro != 'Activo' THEN
        RETURN FALSE;
    END IF;

    SELECT TRUE INTO v_tiene_acceso
    FROM membresias
    WHERE id_miembro = p_id_miembro
      AND estado = 'Activa'
      AND fecha_inicio <= CURDATE()
      AND (fecha_fin >= CURDATE() OR DATE_ADD(fecha_fin, INTERVAL dias_gracia DAY) >= CURDATE())
    LIMIT 1;

    RETURN IFNULL(v_tiene_acceso, FALSE);
END //

-- =====================================================
-- EVENTO: Ejecutar diariamente para actualizar membresías vencidas
-- =====================================================
CREATE EVENT IF NOT EXISTS evt_actualizar_membresias_vencidas
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    UPDATE membresias
    SET estado = 'Vencida',
        notas = CONCAT(IFNULL(notas, ''), ' | Vencida automáticamente el ', CURDATE())
    WHERE estado = 'Activa'
      AND fecha_fin < CURDATE()
      AND DATE_ADD(fecha_fin, INTERVAL dias_gracia DAY) < CURDATE();
END //

DELIMITER ;