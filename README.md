# 🏋️ Gimnasio VITALITY - Sistema de Control de Membresías

Sistema Fullstack desarrollado para la gestión de membresías y control de acceso al gimnasio **Vitality**.

## 📋 Descripción del Proyecto

Este sistema permite:
- Gestión completa de miembros (CRUD)
- Administración de membresías y pagos
- Validación automática de acceso al gimnasio
- Reportes analíticos con filtros de fecha
- Seguridad mediante usuarios y permisos (GRANT)

## 👥 Autores

- **Daniela Blandón**
- **Jhon Hucker Chalarca**

## 🏗️ Arquitectura

### Base de Datos (MySQL)
- **Normalización**: 3FN (Tercera Forma Normal)
- **Tablas principales**:
  - `miembros`: Información de clientes
  - `tipos_membresia`: Catálogo de planes
  - `membresias`: Registro de membresías activas/vencidas
  - `accesos`: Control de entrada/salida
  - `pagos`: Historial de pagos
  - `usuarios_sistema`: Usuarios administrativos
  - `auditoria`: Log de cambios

### Características Avanzadas de MySQL
- ✅ **Triggers**: Automatización de estados, auditoría, validaciones
- ✅ **Vistas**: Reportes predefinidos (vw_membresias_activas, vw_accesos_hoy, etc.)
- ✅ **Cursores**: Procedimientos sp_renovar_membresias_vencidas, sp_reporte_ingresos
- ✅ **Funciones**: fn_validar_acceso()
- ✅ **Eventos**: Actualización automática diaria de membresías vencidas
- ✅ **Permisos GRANT**: 5 niveles de usuarios (admin, app, recepción, lector, reportes)

### Backend (Node.js + Express)
- API RESTful completa
- Conexión segura a MySQL con pool de conexiones
- Variables de entorno para configuración
- Rate limiting y seguridad con Helmet
- Validación de datos con express-validator

### Frontend (HTML + Bootstrap 5)
- **100% Offline**: Bootstrap descargado localmente
- Diseño responsivo y moderno
- Tema personalizado con paleta de colores "Vitality"
- Interfaz intuitiva con validaciones

## 🚀 Instalación y Ejecución

### Requisitos Previos
1. **Node.js** (v14 o superior)
2. **MySQL** (v8.0 o superior)
3. **MySQL Workbench** (para administración)

### Paso 1: Configurar Base de Datos

```bash
# Clonar o descargar el proyecto
cd vitality-gym

# Crear base de datos y tablas (como root)
npm run db:create

# Crear triggers y procedimientos
npm run db:triggers

# Crear vistas
npm run db:views

# Crear usuarios y permisos
npm run db:permissions

# Cargar datos iniciales
npm run db:seed

# O ejecutar todo de una vez:
npm run db:setup
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

El archivo `.env` ya está configurado con valores por defecto:

```
DB_HOST=localhost
DB_USER=vitality_app
DB_PASSWORD=Vitality2024!
DB_NAME=vitality_gym
PORT=3000
```

### Paso 4: Iniciar el Servidor

```bash
# Modo producción
npm start

# Modo desarrollo (con auto-reload)
npm run dev
```

El sistema estará disponible en: **http://localhost:3000**

## 📁 Estructura del Proyecto

```
vitality-gym/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración de conexión MySQL
│   ├── routes/
│   │   ├── miembros.js          # API de miembros
│   │   ├── membresias.js        # API de membresías
│   │   ├── accesos.js           # API de control de acceso
│   │   ├── reportes.js          # API de reportes
│   │   └── dashboard.js         # API de dashboard
│   └── server.js                # Servidor Express
├── database/
│   └── sql/
│       ├── 01_schema.sql        # Esquema de tablas (3FN)
│       ├── 02_triggers.sql      # Triggers y procedimientos
│       ├── 03_vistas.sql        # Vistas
│       ├── 04_usuarios_permisos.sql  # Usuarios GRANT
│       └── 05_datos_iniciales.sql    # Datos de prueba
├── frontend/
│   ├── css/
│   │   └── vitality-theme.css   # Tema personalizado
│   ├── js/
│   │   ├── miembros.js
│   │   ├── membresias.js
│   │   ├── accesos.js
│   │   └── reportes.js
│   ├── pages/
│   │   ├── miembros.html
│   │   ├── membresias.html
│   │   ├── accesos.html
│   │   └── reportes.html
│   └── index.html               # Dashboard
├── bootstrap/                   # Bootstrap 5 offline
│   ├── css/
│   └── js/
├── package.json
├── .env
└── README.md
```

## 🔐 Usuarios de Base de Datos

| Usuario | Contraseña | Permisos |
|---------|-----------|----------|
| vitality_admin | AdminVitality2024!@# | Todos (con GRANT) |
| vitality_app | Vitality2024! | CRUD completo (aplicación) |
| vitality_recepcion | RecepVitality2024! | Recepción (SELECT, INSERT) |
| vitality_lector | LectorVitality2024! | Solo lectura de accesos |
| vitality_reportes | ReportesVitality2024! | Solo SELECT para reportes |

## 📊 Reportes Disponibles

1. **Ingresos por Período**: Filtrado por fechas con JOIN y GROUP BY
2. **Membresías por Vencer**: Alertas de vencimiento (0-7 días)
3. **Frecuencia de Visitas**: Análisis de uso por miembro
4. **Estadísticas de Membresías**: Tipos más vendidos
5. **Asistencia Diaria**: Horarios pico y días concurridos

## 🌐 Rutas de la Aplicación

- `/` - Dashboard principal
- `/miembros` - Gestión de miembros
- `/membresias` - Gestión de membresías
- `/accesos` - Control de acceso y validación
- `/reportes` - Reportes y estadísticas

## 🔧 Comandos NPM Disponibles

```bash
npm start              # Iniciar servidor
npm run dev            # Modo desarrollo con nodemon
npm run db:create      # Crear esquema de base de datos
npm run db:triggers    # Crear triggers y procedimientos
npm run db:views       # Crear vistas
npm run db:permissions # Crear usuarios y permisos
npm run db:seed        # Cargar datos de prueba
npm run db:setup       # Ejecutar todo el setup
npm run db:reset       # Resetear y recrear todo
```

## 📱 Características de la Interfaz

- ✅ **Diseño Responsive**: Adaptable a móviles, tablets y desktop
- ✅ **Tema Vitality**: Paleta de colores energética (verde + naranja)
- ✅ **Validaciones**: Frontend y backend
- ✅ **Feedback Visual**: Alertas, badges y animaciones
- ✅ **Sin Internet**: Bootstrap local, funciona 100% offline

## 🔒 Seguridad

- Rate limiting (100 requests / 15 min)
- Helmet para headers de seguridad
- Validación de datos con express-validator
- Sanitización de inputs
- Control de acceso por roles (GRANT)

## 📝 Notas para Desarrollo

- La base de datos debe estar ejecutándose antes de iniciar el servidor
- MySQL Workbench se puede usar para administrar visualmente
- Los datos de prueba incluyen 12 miembros y 8 tipos de membresía
- El trigger `trg_validar_acceso` se ejecuta automáticamente en cada entrada

## 📞 Soporte

Para soporte técnico o consultas, contactar a los desarrolladores:
- Daniela Blandón
- Jhon Hucker Chalarca

---

**Gimnasio Vitality** © 2024 - Sistema de Control de Membresías
