# Sistema de Gestión Gimnasio Vitality
## Documentación Técnica y Guía de Estudio

---

## 📋 1. PORTADA Y METADATOS

| Campo | Valor |
|-------|-------|
| **Proyecto** | Sistema de Gestión de Membresías y Control de Acceso - Gimnasio Vitality |
| **Autores** | Daniela Blandón, Jhon Hucker Chalarca |
| **Tecnologías** | Node.js 16+, Express.js 4.x, MySQL 8.0, Bootstrap 5.3 |
| **Fecha** | Abril 2024 |
| **Versión** | 1.0.0 |
| **Repositorio** | `vitality-gym/` (trabajo local) |

---

## 🎯 2. RESUMEN EJECUTIVO

### Objetivo del Sistema
Desarrollar una solución Fullstack para la gestión integral de un gimnasio, centrada en el **control de membresías y acceso**, donde la **integridad de la información en MySQL sea el núcleo** del sistema.

### Alcance Funcional
- ✅ Gestión completa de miembros (CRUD)
- ✅ Administración de membresías y tipos de planes
- ✅ Control de acceso con validación automática
- ✅ Registro de pagos y reportes financieros
- ✅ Auditoría de cambios en el sistema

### Valor Diferencial (Aplicación de Conceptos Avanzados)

| Concepto | Implementación | Archivo |
|----------|---------------|---------|
| **Triggers** | 6 triggers para automatización de reglas de negocio | `02_triggers.sql` |
| **Cursores** | 3 procedimientos con cursores para procesamiento batch | `02_triggers.sql` |
| **Vistas** | 8 vistas para reportes y consultas frecuentes | `03_vistas.sql` |
| **Seguridad GRANT** | 5 niveles de usuarios con permisos diferenciados | `04_usuarios_permisos.sql` |
| **Eventos** | 1 evento programado para mantenimiento automático | `02_triggers.sql` |
| **Funciones** | Función SQL para validación booleana de acceso | `02_triggers.sql` |

---

## 🏗️ 3. ARQUITECTURA DEL SISTEMA

### Diagrama de Arquitectura (Flujo de Datos)

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Navegador  │  │  Bootstrap  │  │  JavaScript Vanilla │  │
│  │   (HTML)    │  │    (CSS)    │  │     (Frontend)      │  │
│  └──────┬──────┘  └─────────────┘  └─────────────────────┘  │
│         │                                                   │
│         ▼ HTTP Request                                      │
├─────────────────────────────────────────────────────────────┤
│                      SERVIDOR NODE.JS                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js 4.x                                      │   │
│  │  ├─ Routes: /api/miembros, /api/membresias           │   │
│  │  ├─ Routes: /api/accesos, /api/reportes              │   │
│  │  └─ Static: /frontend, /bootstrap                    │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                 │
│                           ▼ MySQL Protocol                  │
├─────────────────────────────────────────────────────────────┤
│                    BASE DE DATOS MYSQL 8.0                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │    Tablas    │  │   Triggers   │  │   Procedimientos │   │
│  │   (Schema)   │  │   (Logic)    │  │    (Cursores)    │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Estructura de Carpetas

```
vitality-gym/
├── backend/
│   ├── config/
│   │   └── database.js          # Pool de conexiones MySQL
│   ├── routes/
│   │   ├── miembros.js          # CRUD miembros
│   │   ├── membresias.js        # Gestión membresías
│   │   ├── accesos.js           # Control de entrada
│   │   ├── reportes.js          # Reportes analíticos
│   │   └── dashboard.js         # KPIs y estadísticas
│   └── server.js                # Servidor Express
├── database/
│   └── sql/
│       ├── 01_schema.sql        # Esquema de tablas (3FN)
│       ├── 02_triggers.sql      # Triggers y procedimientos
│       ├── 03_vistas.sql        # Views
│       ├── 04_usuarios_permisos.sql  # Seguridad GRANT
│       └── 05_datos_iniciales.sql    # Datos de prueba
├── frontend/
│   ├── css/
│   │   └── vitality-theme.css   # Tema personalizado
│   ├── js/                      # Controladores JS
│   ├── pages/                   # HTML de cada módulo
│   └── index.html               # Dashboard
└── bootstrap/                   # Bootstrap 5 offline
```

---

## 🗄️ 4. BASE DE DATOS (Sección Técnica)

### 4.1 Esquema Relacional (3FN - Tercera Forma Normal)

#### Tablas Principales

| Tabla | Propósito | Clave Primaria | Claves Foráneas |
|-------|-----------|----------------|-----------------|
| `miembros` | Información de clientes | `id_miembro` | - |
| `tipos_membresia` | Catálogo de planes | `id_tipo` | - |
| `membresias` | Registro de membresías contratadas | `id_membresia` | `id_miembro`, `id_tipo` |
| `accesos` | Control de entrada/salida | `id_acceso` | `id_miembro`, `id_membresia` |
| `pagos` | Historial de pagos | `id_pago` | `id_membresia`, `registrado_por` |
| `usuarios_sistema` | Usuarios administrativos | `id_usuario` | - |
| `auditoria` | Log de cambios | `id_auditoria` | - |

#### Diagrama ER (Descripción)

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│   miembros      │     │    membresias     │     │tipos_membresia  │
├─────────────────┤     ├───────────────────┤     ├─────────────────┤
│ PK id_miembro   │◄────┤ PK id_membresia   │────►│ PK id_tipo      │
│    nombres      │  1:N│ FK id_miembro     │  N:1│    nombre       │
│    apellidos    │     │ FK id_tipo        │     │    duracion_dias│
│   identificacion│     │    fecha_inicio   │     │    precio       │
│    estado       │     │    fecha_fin      │     └─────────────────┘
└─────────────────┘     │    estado         │
         │              │    precio_pagado  │
         │              └───────────────────┘
         │                      │
         │                      │ 1:N
         │                      ▼
         │              ┌──────────────────────┐
         │              │     accesos          │
         │              ├──────────────────────┤
         │              │ PK id_acceso         │
         │              │ FK id_miembro        │
         │              │ FK id_membresia      │
         │              │    fecha_hora_entrada│
         │              │    validado          │
         │              └──────────────────────┘
         │
         └────────────►┌───────────────────┐
                       │     pagos         │
                       ├───────────────────┤
                       │ PK id_pago        │
                       │ FK id_membresia   │
                       │    monto          │
                       │    fecha_pago     │
                       └───────────────────┘
```

#### Restricciones CHECK Implementadas

```sql
-- Precio no negativo
ALTER TABLE tipos_membresia ADD CONSTRAINT chk_precio CHECK (precio >= 0);

-- Fechas coherentes
ALTER TABLE membresias ADD CONSTRAINT chk_fechas CHECK (fecha_fin > fecha_inicio);

-- Estado válido
ALTER TABLE miembros ADD CONSTRAINT chk_estado CHECK (estado IN ('Activo', 'Inactivo', 'Suspendido'));
```

---

### 4.2 Triggers (Lógica de Negocio Automatizada)

#### `trg_actualizar_estado_membresia`
**Propósito:** Marcar automáticamente membresías como vencidas
**Evento:** BEFORE INSERT
**Lógica:**
```sql
IF NEW.fecha_fin < CURDATE() THEN
    SET NEW.estado = 'Vencida';
END IF;
```

#### `trg_auditoria_miembros_insert`
**Propósito:** Registrar creación de miembros
**Evento:** AFTER INSERT
**Lógica:** Inserta registro en tabla auditoria con datos nuevos en JSON

#### `trg_auditoria_miembros_update`
**Propósito:** Registrar modificaciones de miembros
**Evento:** AFTER UPDATE
**Lógica:** Guarda datos anteriores y nuevos en formato JSON

#### `trg_validar_acceso` ⭐ CRÍTICO
**Propósito:** Validar membresía activa antes de permitir acceso
**Evento:** BEFORE INSERT ON accesos
**Lógica:**
```sql
1. Verificar estado del miembro = 'Activo'
2. Buscar membresía activa válida
3. Si existe: asignar id_membresia, validado = TRUE
4. Si no existe: validado = FALSE, notas = 'Sin membresía activa'
```

#### `trg_actualizar_ultimo_acceso`
**Propósito:** Timestamp automático
**Evento:** AFTER INSERT ON accesos
**Lógica:** Actualiza fecha_actualizacion en tabla miembros

#### `trg_validar_membresia_unica`
**Propósito:** Prevenir membresías activas duplicadas
**Evento:** BEFORE INSERT
**Lógica:** Lanza error si miembro ya tiene membresía activa

---

### 4.3 Procedimientos Almacenados y Funciones

#### `sp_renovar_membresias_vencidas()`
**Propósito:** Proceso batch para marcar membresías vencidas
**Técnica:** Usa CURSOR para iterar registros
```sql
DECLARE cur_membresias CURSOR FOR
    SELECT id_membresia FROM membresias
    WHERE estado = 'Activa' AND fecha_fin = CURDATE();
```

#### `sp_reporte_ingresos(IN fecha_inicio DATE, IN fecha_fin DATE)`
**Propósito:** Generar reporte financiero agrupado por método de pago
**Técnica:** Usa CURSOR y tabla temporal
**Retorna:** Tabla con método, cantidad de transacciones y total

#### `sp_membresias_por_vencer(IN dias_alerta INT)`
**Propósito:** Alertas de vencimiento próximo
**Técnica:** CURSOR para generar lista de miembros por contactar

#### `fn_validar_acceso(id_miembro INT)` ⭐ FUNCIÓN BOOLEANA
**Propósito:** Validación rápida de acceso
**Retorna:** BOOLEAN (TRUE/FALSE)
**Uso:** 
```sql
SELECT fn_validar_acceso(123) as tiene_acceso;
```

---

### 4.4 Eventos Programados

#### `evt_actualizar_membresias_vencidas`
**Frecuencia:** Cada día (SCHEDULE EVERY 1 DAY)
**Acción:** Ejecuta UPDATE para marcar membresías vencidas
**Propósito:** Mantenimiento automático sin intervención manual

---

### 4.5 Vistas (Views)

| Vista | Propósito | Consultas Clave |
|-------|-----------|-----------------|
| `vw_membresias_activas` | Miembros con membresía válida | JOIN miembros + membresias + tipos |
| `vw_accesos_hoy` | Registro de accesos del día | JOIN accesos + miembros |
| `vw_estadisticas_membresias` | Métricas por tipo de plan | GROUP BY, COUNT, SUM |
| `vw_miembros_sin_membresia` | Clientes potenciales para renovar | LEFT JOIN + HAVING |
| `vw_ingresos_recientes` | Ingresos últimos 30 días | GROUP BY DATE(fecha_pago) |
| `vw_frecuencia_visitas` | Análisis de uso por miembro | AVG, COUNT, JOINs múltiples |
| `vw_dashboard_resumen` | KPIs para panel principal | Subconsultas agregadas |
| `vw_historial_miembro` | Traza completa de un miembro | JOINs históricos |

**Ejemplo de uso:**
```sql
-- Ver membresías que vencen esta semana
SELECT * FROM vw_membresias_activas 
WHERE dias_restantes <= 7;
```

---

### 4.6 Seguridad con GRANT

#### Usuarios y Permisos

| Usuario | Contraseña | Rol | Permisos | Justificación |
|---------|-----------|-----|----------|---------------|
| `vitality_admin` | AdminVitality2024!@# | Administrador | ALL PRIVILEGES | Mantenimiento completo |
| `vitality_app` | Vitality2024! | Aplicación | SELECT, INSERT, UPDATE en tablas principales | Operación normal del sistema |
| `vitality_recepcion` | RecepVitality2024! | Recepcionista | SELECT miembros, INSERT accesos, SELECT membresias | Tareas diarias de recepción |
| `vitality_lector` | LectorVitality2024! | Control Acceso | SELECT miembros, INSERT accesos | Solo puerta de entrada |
| `vitality_reportes` | ReportesVitality2024! | Analista | SELECT en todas las tablas | Generación de reportes |

#### Principio de Mínimo Privilegio
- Cada usuario solo puede hacer lo necesario para su función
- No hay acceso directo a tablas de auditoría (solo admin)
- Usuario `vitality_lector` no puede modificar datos
---

## ⚡ 5. BACKEND - API REST

### 5.1 Endpoints Principales

#### Miembros
```
GET    /api/miembros          # Listar con paginación y búsqueda
GET    /api/miembros/:id       # Detalle completo con historial
POST   /api/miembros           # Crear nuevo miembro
PUT    /api/miembros/:id       # Actualizar datos
DELETE /api/miembros/:id       # Eliminación lógica (soft delete)
GET    /api/miembros/validar/:identificacion  # Validar acceso
```

#### Membresías
```
GET    /api/membresias                 # Listar todas
GET    /api/membresias/tipos/all        # Catálogo de tipos
POST   /api/membresias                  # Crear membresía
PUT    /api/membresias/:id             # Actualizar estado
POST   /api/membresias/:id/renovar     # Renovar membresía
```

#### Accesos (Control de Entrada)
```
GET    /api/accesos?hoy=true   # Accesos del día
POST   /api/accesos/entrada    # Registrar entrada (⭐ CRÍTICO)
POST   /api/accesos/:id/salida # Registrar salida
GET    /api/accesos/estadisticas/hoy  # KPIs de hoy
```

#### Dashboard y Reportes
```
GET    /api/dashboard/resumen         # Resumen KPIs
GET    /api/reportes/ingresos         # Reporte financiero
GET    /api/reportes/membresias        # Estadísticas de membresías
GET    /api/reportes/frecuencia         # Frecuencia de visitas
```

---

### 5.2 Lógica de Negocio Crítica

#### Flujo de Validación de Acceso (POST /api/accesos/entrada)

**Paso 1:** Frontend envía identificación
```javascript
fetch('/api/accesos/entrada', {
    method: 'POST',
    body: JSON.stringify({ identificacion: '1001234567' })
});
```

**Paso 2:** Backend busca miembro
```javascript
const [miembro] = await pool.query(
    'SELECT id_miembro FROM miembros WHERE identificacion = ?',
    [identificacion]
);
```

**Paso 3:** Backend ejecuta INSERT simple
```javascript
const [result] = await pool.query(
    'INSERT INTO accesos (id_miembro, tipo_acceso) VALUES (?, ?)',
    [miembro.id_miembro, 'Membresia']
);
```

**Paso 4:** Trigger `trg_validar_acceso` se activa automáticamente
- Verifica si miembro está activo
- Busca membresía activa válida
- Asigna `id_membresia` si existe
- Establece `validado = TRUE/FALSE`
- Establece `notas` si es rechazado

**Paso 5:** Backend consulta el resultado generado
```javascript
const [acceso] = await pool.query(
    'SELECT * FROM accesos WHERE id_acceso = ?',
    [result.insertId]
);
```

**Paso 6:** Respuesta al frontend
```javascript
{
    success: true,
    tieneAcceso: true,
    miembro: { nombre_completo: '...' },
    membresia: { tipo_membresia: 'Premium', dias_restantes: 15 }
}
```

---

### 5.3 Manejo de Errores y Respuestas JSON Estándar

**Respuesta Exitosa:**
```json
{
    "success": true,
    "data": { ... },
    "message": "Miembro creado exitosamente"
}
```

**Respuesta de Error:**
```json
{
    "success": false,
    "message": "Error descriptivo",
    "error": "Detalle técnico (solo en desarrollo)"
}
```

**Códigos HTTP:**
- 200: OK
- 201: Created
- 400: Bad Request (datos inválidos)
- 404: Not Found
- 429: Too Many Requests (rate limit)
- 500: Internal Server Error

---

## 💻 6. FRONTEND

### 6.1 Componentes Principales

| Componente | Tecnología | Función |
|------------|------------|---------|
| Modal de Membresía | Bootstrap Modal + JavaScript | Crear/editar membresías |
| Formulario Acceso | HTML Form + Fetch API | Validar entrada de miembros |
| Dashboard Cards | Bootstrap Grid + CSS Custom | Mostrar KPIs |
| Tablas de Datos | Bootstrap Tables + JS | Listados con filtros |

### 6.2 Ejemplo de Consumo de API

```javascript
// Registrar acceso
async function validarAcceso(identificacion) {
    try {
        const response = await fetch('/api/accesos/entrada', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificacion })
        });
        
        const result = await response.json();
        
        if (result.success && result.tieneAcceso) {
            mostrarMensaje('Acceso permitido', 'success');
            mostrarDatosMembresia(result.membresia);
        } else {
            mostrarMensaje(result.mensaje || 'Acceso denegado', 'error');
        }
    } catch (error) {
        mostrarMensaje('Error de conexión', 'error');
    }
}
```

---

## 🔄 7. FLUJOS DE TRABAJO

### Flujo 1: Nuevo Miembro

```
1. Frontend: Formulario nuevo miembro
   ↓ POST /api/miembros
2. Backend: INSERT INTO miembros
   ↓ trigger trg_auditoria_miembros_insert
3. BD: Registro en tabla auditoria
   ↓ Response 201 Created
4. Frontend: Redirigir a crear membresía
```

### Flujo 2: Control de Acceso (⭐ DEMO CRÍTICA)

```
1. Recepcionista ingresa identificación
   ↓ POST /api/accesos/entrada
2. Backend: INSERT INTO accesos (mínimo datos)
   ↓ trigger trg_validar_acceso (AUTOMÁTICO)
3. BD Trigger: 
   - Verifica miembro activo
   - Busca membresía válida
   - Asigna id_membresia
   - Establece validado=true/false
   ↓ Response con resultado
4. Frontend: Muestra pantalla verde/rojo
   - Acceso permitido: datos de membresía
   - Acceso denegado: razón del rechazo
```

### Flujo 3: Reporte Financiero

```
1. Administrador selecciona fechas
   ↓ GET /api/reportes/ingresos?fecha_inicio=X&fecha_fin=Y
2. Backend: CALL sp_reporte_ingresos(X, Y)
3. BD: Cursor procesa pagos
   - Agrupa por método de pago
   - Calcula totales
   - Inserta en tabla temporal
   ↓ Resultado paginado
4. Frontend: Tabla y gráfico de ingresos
```

---

## 🔒 8. SEGURIDAD Y BUENAS PRÁCTICAS

### Normalización 3FN
✅ Todas las tablas están en Tercera Forma Normal:
- No hay grupos repetitivos
- No hay dependencias transitivas
- Cada tabla tiene propósito único

### Prevención SQL Injection
✅ Uso obligatorio de prepared statements:
```javascript
// CORRECTO (con parámetros)
pool.query('SELECT * FROM miembros WHERE id = ?', [id]);

// INCORRECTO (concatenación)
pool.query(`SELECT * FROM miembros WHERE id = ${id}`);
```

### Separación de Responsabilidades
✅ Arquitectura MVC simplificada:
- **Modelo:** Base de datos con lógica en triggers
- **Vista:** HTML/Bootstrap estático
- **Controlador:** Rutas Express que orquestan

---

## 📝 9. COMANDOS SQL DE REFERENCIA

### Verificar Membresías Activas
```sql
SELECT * FROM vw_membresias_activas 
WHERE dias_restantes <= 7;
```

### Ejecutar Reporte de Ingresos
```sql
CALL sp_reporte_ingresos('2024-01-01', '2024-01-31');
```

### Consultar Dashboard
```sql
SELECT * FROM vw_dashboard_resumen;
```

### Ver Logs de Auditoría
```sql
SELECT * FROM auditoria 
WHERE tabla_afectada = 'miembros' 
ORDER BY fecha_hora DESC 
LIMIT 10;
```

---

## 📚 10. GLOSARIO TÉCNICO

| Término | Definición | Uso en el Proyecto |
|---------|------------|-------------------|
| **Trigger** | Procedimiento que se ejecuta automáticamente ante evento en tabla | Validar acceso, auditoría |
| **Cursor** | Puntero para recorrer resultados fila por fila | Procesar membresías vencidas |
| **Stored Procedure** | Programa almacenado en BD | Reporte de ingresos |
| **View (Vista)** | Tabla virtual basada en consulta | Reportes predefinidos |
| **GRANT** | Comando para asignar permisos | Seguridad por roles |
| **3FN** | Tercera Forma Normal | Diseño de tablas |
| **Prepared Statement** | Consulta SQL con parámetros | Prevenir SQL Injection |
| **Soft Delete** | Marcar como eliminado sin borrar físicamente | Campo `estado` en miembros |
| **Rate Limiting** | Limitar requests por tiempo | Protección contra abuso |
| **Event (MySQL)** | Tarea programada | Actualización diaria automática |

---

## ✅ CHECKLIST PARA PRESENTACIÓN

- [ ] Mostrar esquema de BD en Workbench
- [ ] Ejecutar INSERT de acceso y demostrar trigger
- [ ] Mostrar tabla de auditoría poblada
- [ ] Ejecutar procedimiento de reporte
- [ ] Verificar usuarios con `SHOW GRANTS`
- [ ] Demostrar validación de acceso (caso exitoso y fallido)
- [ ] Mostrar vistas en funcionamiento

---

**Sistema de Gestión Gimnasio Vitality v1.0**
