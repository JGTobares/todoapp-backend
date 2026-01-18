# TodoApp Backend

Backend API desarrollado con Express.js y MongoDB para la gestión de autenticación de usuarios y tareas.

## 🚀 Características

- ✅ Autenticación JWT
- ✅ Gestión de usuarios (registro, login, actualización de perfil)
- ✅ CRUD completo de tareas
- ✅ Paginación, filtros y ordenamiento en tareas
- ✅ Rate limiting configurable
- ✅ Logging asíncrono (solo en desarrollo)
- ✅ Manejo centralizado de errores
- ✅ Validación robusta de datos
- ✅ Seguridad mejorada (Helmet, sanitización)
- ✅ Conexión MongoDB con selección automática (Local/Atlas)

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- MongoDB (local o remoto - Atlas)
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/JGTobares/todoapp-backend.git
cd todoapp-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:

Crea un archivo `.env` en la raíz del proyecto basándote en `env.template`:

```env
# Servidor
PORT=2411
NODE_ENV=development

# Base de Datos
URI_DB=mongodb://localhost:27017/todotalker
URI_DB_REMOTE=mongodb+srv://usuario:password@cluster.mongodb.net/todotalker

# JWT
JWT_SECRET=tu-clave-secreta-de-al-menos-32-caracteres
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=*
CORS_CREDENTIALS=false

# Email (Opcional)
ADMIN_EMAIL=tu-email@gmail.com
PASS_GOOGLE_APP=tu-google-app-password
EMAIL_FROM=noreply@example.com
```

## 🏃 Ejecución

### Desarrollo:
```bash
npm run dev
```

### Producción:
```bash
npm start
```

## 📡 Endpoints

### Autenticación
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/profile` - Obtener perfil del usuario
- `PUT /auth/profile` - Actualizar perfil
- `POST /auth/refresh` - Refrescar token

### Tareas
- `GET /tasks` - Obtener tareas (con paginación, filtros y ordenamiento)
- `GET /tasks/:id` - Obtener una tarea
- `POST /tasks` - Crear nueva tarea
- `PUT /tasks/:id` - Actualizar tarea
- `DELETE /tasks/:id` - Eliminar tarea
- `GET /tasks/stats` - Obtener estadísticas de tareas

### Health Check
- `GET /` - Estado del servidor y base de datos

## 🔒 Seguridad

- JWT para autenticación
- Rate limiting diferenciado por tipo de ruta
- Helmet para headers de seguridad HTTP
- Sanitización de inputs
- Validación robusta de datos
- CORS configurable

## 🗄️ Base de Datos

El sistema selecciona automáticamente la base de datos según el entorno:

- **Desarrollo**: Usa MongoDB Local por defecto
- **Producción**: Usa MongoDB Atlas por defecto
- **Forzar Atlas**: Configura `USE_ATLAS=true` en `.env`

## 📝 Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `PORT` | Puerto del servidor | ✅ |
| `NODE_ENV` | Entorno (development/production) | ✅ |
| `URI_DB` | URI de MongoDB Local | ✅ |
| `URI_DB_REMOTE` | URI de MongoDB Atlas | ⚠️ (Producción) |
| `JWT_SECRET` | Clave secreta para JWT (mín. 32 chars) | ✅ |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | ❌ |
| `CORS_ORIGIN` | Orígenes permitidos | ❌ |
| `USE_ATLAS` | Forzar uso de Atlas en desarrollo | ❌ |

## 🛠️ Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo (con Nodemon)
- `npm run migrate` - Migrar datos entre instancias de MongoDB

## 📦 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuración (DB, app)
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Middlewares (auth, errors, logging)
│   ├── models/          # Modelos de MongoDB
│   ├── routes/          # Definición de rutas
│   ├── utils/           # Utilidades (logger, errors, asyncHandler)
│   ├── validators/      # Validadores de datos
│   └── templates/       # Plantillas de email
├── log/                 # Logs del servidor
├── scripts/             # Scripts de utilidad
├── .env                 # Variables de entorno (no incluido en git)
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Tecnologías Utilizadas

- **Express.js** - Framework web
- **MongoDB** - Base de datos
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas
- **express-validator** - Validación de datos
- **helmet** - Seguridad HTTP
- **compression** - Compresión de respuestas
- **morgan** - Logging de requests
- **nodemailer** - Envío de emails
- **express-rate-limit** - Rate limiting

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👤 Autor

**JGTobares**
- GitHub: [@JGTobares](https://github.com/JGTobares)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Versión**: 2.0.0  
**Estado**: ✅ Producción Ready
