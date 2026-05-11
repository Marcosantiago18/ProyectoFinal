# Proyecto Integrado — 2º DAM

# SEAHIVE
## Sistema de Gestión y Alquiler de Embarcaciones

---

**I.E.S. Hermenegildo Lanz (Granada)**

**Alumno:** Marco Santiago

**Profesores:** Juan Luis, Francisco, José María, Juan Diego y Enrique

**Asignatura:** Proyecto Integrado

**Curso:** 2025/2026

---

## ÍNDICE

1. [ANÁLISIS DEL PROBLEMA](#1-análisis-del-problema)
   - 1.1 Introducción
   - 1.2 Objetivos
   - 1.3 Funciones y rendimientos necesarios
   - 1.4 Planteamiento y evaluación de diversas soluciones
   - 1.5 Justificación de la solución elegida
   - 1.6 Modelado de la solución
   - 1.7 Planificación temporal
2. [DISEÑO E IMPLEMENTACIÓN DEL PROYECTO](#2-diseño-e-implementación-del-proyecto)
   - 2.1 Arquitectura general
   - 2.2 Diseño del backend
   - 2.3 Diseño de la base de datos
   - 2.4 Diseño del frontend
   - 2.5 Bot de Telegram con IA
   - 2.6 Despliegue con Docker
   - 2.7 Control de versiones y entorno de desarrollo
3. [FASE DE PRUEBAS](#3-fase-de-pruebas)
4. [DOCUMENTACIÓN DE LA APLICACIÓN](#4-documentación-de-la-aplicación)
5. [CONCLUSIONES FINALES](#5-conclusiones-finales)
6. [BIBLIOGRAFÍA](#6-bibliografía)
   - 6.1 Documentación oficial de tecnologías utilizadas
   - 6.2 Tutoriales y artículos consultados
   - 6.3 Herramientas de desarrollo utilizadas
   - 6.4 Recursos académicos y de diseño

---

## 1. ANÁLISIS DEL PROBLEMA

### 1.1 Introducción

El sector náutico de recreo ha experimentado un crecimiento significativo en los últimos años, especialmente en zonas costeras como la Costa del Sol, las Islas Baleares y la Costa Brava. Sin embargo, la gestión de flotas de embarcaciones de alquiler sigue dependiendo en muchos casos de procesos manuales, hojas de cálculo y comunicaciones telefónicas, lo que genera ineficiencias, errores de disponibilidad y una experiencia de usuario poco satisfactoria.

**SEAHIVE** nace como respuesta a esta necesidad: una plataforma web integral que permite a empresas náuticas gestionar su flota de embarcaciones, automatizar las reservas, procesar pagos de forma segura y ofrecer a los clientes una experiencia de búsqueda y contratación moderna y atractiva, comparable a plataformas de referencia como Airbnb o Booking.

El proyecto integra tecnologías web modernas tanto en el frontend como en el backend, incorpora un sistema de pagos real con Stripe, un bot de Telegram con inteligencia artificial para asistir a los capitanes, y un despliegue completo mediante contenedores Docker.

### 1.2 Objetivos

Los objetivos principales del proyecto son:

- Desarrollar una aplicación web completa que permita la gestión integral de una empresa de alquiler de embarcaciones.
- Implementar un sistema de reservas con validación de disponibilidad en tiempo real.
- Integrar un sistema de pagos seguro mediante Stripe.
- Crear un panel de administración completo para capitanes y administradores.
- Ofrecer una interfaz de usuario premium, responsive y bilingüe (español/inglés).
- Implementar un sistema de mensajería en tiempo real entre usuarios y propietarios.
- Desarrollar un bot de Telegram con IA (Google Gemini) para asistir a los capitanes.
- Contenerizar toda la aplicación con Docker para facilitar el despliegue.
- Generar facturas PDF automáticas para las reservas confirmadas.

### 1.3 Funciones y rendimientos necesarios

#### Funciones del sistema

**Gestión de usuarios:**
- Registro y autenticación con contraseñas cifradas (Werkzeug).
- Tres roles diferenciados: cliente, capitán y administrador.
- Cada rol tiene acceso a funcionalidades específicas de la plataforma.

**Gestión de embarcaciones:**
- CRUD completo de embarcaciones (crear, leer, actualizar, eliminar).
- Clasificación por tipo (yate, velero, moto de agua) y categoría (super yate, catamarán, jet ski, etc.).
- Subida de imágenes con almacenamiento persistente.
- Asignación de propietario/capitán a cada embarcación.

**Sistema de reservas:**
- Selección de fechas con validación de disponibilidad.
- Cálculo automático del precio según días y experiencias añadidas.
- Estados de reserva: pendiente, confirmada, en curso, completada, cancelada.
- Asociación de experiencias náuticas a cada reserva.

**Pagos con Stripe:**
- Creación de intención de pago (PaymentIntent) desde el backend.
- Formulario de pago seguro integrado en el frontend con Stripe Elements.
- Confirmación automática del estado de la reserva tras el pago exitoso.

**Facturación PDF:**
- Generación automática de facturas en formato PDF con ReportLab.
- Descarga directa desde el panel del usuario.

**Mensajería en tiempo real:**
- Chat entre usuarios y propietarios de embarcaciones.
- Notificaciones instantáneas mediante WebSockets (Socket.IO).
- Indicador visual de mensajes sin leer en la barra de navegación.

**Sistema de notificaciones:**
- Campanita en el panel de administración con conteo en tiempo real.
- Alertas de nuevas reservas, mensajes sin leer y mantenimientos programados.
- Actualización instantánea vía WebSockets.

**Experiencias náuticas:**
- Catálogo de experiencias adicionales (avistamiento de delfines, buceo, wakeboard, etc.).
- Filtrado por compatibilidad según tipo de embarcación.
- Reserva independiente o vinculada a una embarcación.

**Gestión de mantenimientos:**
- Programación de mantenimientos preventivos y correctivos.
- Seguimiento del estado y costes.

**Gestión de amarres (marina):**
- Control de los puestos de amarre disponibles.
- Asignación de embarcaciones a amarres con control de alquiler mensual.

**Bot de Telegram con IA:**
- Asistente virtual para capitanes basado en Google Gemini.
- Consulta del estado de la flota, clima y reservas desde Telegram.

#### Rendimientos deseados

- Interfaz fluida y responsive, adaptada a móviles y escritorio.
- Tiempos de carga rápidos gracias a Vite como bundler.
- Comunicación en tiempo real sin necesidad de recargar la página.
- Diseño premium con modo oscuro, glassmorphism y animaciones CSS.
- Compatibilidad con los navegadores modernos (Chrome, Firefox, Safari, Edge).
- Despliegue reproducible en cualquier máquina con Docker instalado.

### 1.4 Planteamiento y evaluación de diversas soluciones

#### Frontend

| Criterio | React + TypeScript | Angular | Vue.js |
|---|---|---|---|
| Curva de aprendizaje | Media | Alta | Baja |
| Ecosistema | Muy amplio | Completo pero rígido | Amplio |
| Rendimiento | Excelente (Virtual DOM) | Bueno | Muy bueno |
| Tipado | TypeScript nativo | TypeScript obligatorio | Opcional |
| Comunidad | La más grande | Grande, más empresarial | En crecimiento |
| Flexibilidad | Muy alta | Baja (opinado) | Alta |

#### Backend

| Criterio | Flask (Python) | Node.js (Express) | Django |
|---|---|---|---|
| Simplicidad | Muy alta | Alta | Media |
| Flexibilidad | Máxima (microframework) | Alta | Baja (monolítico) |
| ORM | SQLAlchemy | Sequelize/Prisma | Django ORM integrado |
| Curva de aprendizaje | Baja | Baja | Media-alta |
| Rendimiento API REST | Bueno | Muy bueno (event loop) | Bueno |
| Familiaridad del alumno | Alta | Media | Baja |

#### Base de datos

| Criterio | MariaDB/MySQL | PostgreSQL | MongoDB |
|---|---|---|---|
| Tipo | Relacional | Relacional | Documental (NoSQL) |
| Licencia | Open-source | Open-source | Open-source |
| Relaciones complejas | Muy bueno | Excelente | No adecuado |
| Soporte Docker | Excelente | Excelente | Bueno |
| Rendimiento | Muy bueno | Excelente | Bueno para lectura |
| Familiaridad del alumno | Alta (XAMPP) | Baja | Baja |

### 1.5 Justificación de la solución elegida

Se eligió **React 19 con TypeScript** como framework de frontend por su enorme ecosistema, su rendimiento superior gracias al Virtual DOM, la seguridad que aporta el tipado estático de TypeScript y la cantidad de recursos de aprendizaje disponibles. Combinado con **Tailwind CSS 4**, permite construir interfaces modernas y responsive de forma rápida y mantenible.

Para el backend se eligió **Flask** por su naturaleza de microframework, lo que permite añadir exactamente los componentes necesarios sin sobrecarga. Al estar escrito en Python, resulta familiar para el alumno y permite un desarrollo ágil. **SQLAlchemy** como ORM facilita la interacción con la base de datos de forma segura y eficiente.

**MariaDB** fue seleccionada como base de datos por su compatibilidad total con MySQL, su licencia open-source, su excelente rendimiento y la familiaridad previa del alumno con el entorno XAMPP durante el ciclo formativo.

Para el despliegue se optó por **Docker Compose**, que permite definir toda la infraestructura (base de datos, backend, frontend y bot) en un único fichero YAML, garantizando un entorno reproducible y portable.

### 1.6 Modelado de la solución

#### 1.6.1 Recursos humanos

El desarrollo del proyecto ha sido realizado de forma individual por el alumno Marco Santiago, siendo responsable de todas las fases: análisis, diseño, implementación, pruebas, documentación y despliegue.

#### 1.6.2 Recursos hardware

- Ordenador personal con Windows, 16 GB de RAM, procesador moderno.
- Conexión a internet para descarga de dependencias e integración con APIs externas (Stripe, Google Gemini, Telegram).
- Docker Desktop instalado para la contenerización.

#### 1.6.3 Recursos software

| Herramienta | Uso |
|---|---|
| Visual Studio Code | Editor de código principal |
| Docker Desktop | Contenerización y despliegue |
| Git + GitHub | Control de versiones |
| Postman | Pruebas manuales de la API |
| Chrome DevTools | Depuración del frontend |
| Node.js 20 | Entorno de ejecución del frontend |
| Python 3.10 | Entorno de ejecución del backend |
| MariaDB 10.11 | Motor de base de datos |

### 1.7 Planificación temporal

| Semana | Actividades |
|---|---|
| Semana 1-2 | Análisis de requisitos, diseño de la base de datos y configuración del entorno de desarrollo. |
| Semana 3-4 | Desarrollo del backend: modelos, API REST de usuarios, embarcaciones y reservas. |
| Semana 5-6 | Desarrollo del frontend: páginas principales (Home, búsqueda, detalle, login/registro). |
| Semana 7 | Panel de administración (Dashboard): gestión de flota, reservas, mantenimientos y analytics. |
| Semana 8 | Integración de Stripe para pagos y generación de facturas PDF. |
| Semana 9 | Desarrollo del bot de Telegram con IA (Google Gemini). Sistema de mensajería. |
| Semana 10 | Experiencias náuticas, sistema de notificaciones en tiempo real con WebSockets. |
| Semana 11 | Contenerización con Docker, pruebas de integración y optimización. |
| Semana 12 | Internacionalización (i18n), fase de pruebas final, documentación y preparación de la presentación. |

---

## 2. DISEÑO E IMPLEMENTACIÓN DEL PROYECTO

### 2.1 Arquitectura general

SEAHIVE se basa en una arquitectura **cliente-servidor** con los siguientes componentes:

```
┌─────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                    │
│                                                     │
│  ┌───────────┐  ┌───────────┐  ┌────────────────┐  │
│  │ Frontend  │  │  Backend  │  │  Bot Telegram  │  │
│  │ React+TS  │→ │  Flask    │← │  Python+Gemini │  │
│  │ Nginx:80  │  │  :5000    │  │                │  │
│  └───────────┘  └─────┬─────┘  └────────────────┘  │
│                       │                             │
│                 ┌─────┴─────┐                       │
│                 │ MariaDB   │                       │
│                 │  :3306    │                       │
│                 └───────────┘                       │
│                                                     │
│        APIs externas: Stripe, Telegram, Gemini      │
└─────────────────────────────────────────────────────┘
```

- **Frontend (React 19 + TypeScript):** Aplicación SPA servida por Nginx en producción.
- **Backend (Flask + SQLAlchemy):** API REST que gestiona toda la lógica de negocio.
- **Base de datos (MariaDB 10.11):** Almacenamiento persistente de todos los datos.
- **Bot de Telegram:** Servicio independiente que consulta la misma base de datos.
- **WebSockets (Socket.IO):** Canal de comunicación bidireccional en tiempo real.

### 2.2 Diseño del backend

El backend se estructura siguiendo un patrón monolítico organizado en capas lógicas dentro de un único fichero principal (`app.py`, ~1.600 líneas):

**Modelos (SQLAlchemy ORM):**
- `Usuario`: Gestión de usuarios con roles y contraseñas cifradas.
- `Embarcacion`: Catálogo de embarcaciones con especificaciones técnicas.
- `Reserva`: Sistema de reservas con estados y experiencias asociadas.
- `Experiencia`: Actividades náuticas vinculables a reservas.
- `Mantenimiento`: Programación y seguimiento de mantenimientos.
- `Amarre`: Control de puestos de amarre en la marina.
- `Mensaje`: Sistema de mensajería entre usuarios.
- `Review`: Valoraciones de embarcaciones.
- `Favorito`: Lista de favoritos del usuario.

**Seguridad y autenticación:**
- Contraseñas cifradas con `werkzeug.security` (hash + salt).
- Decorador `@token_required` para proteger rutas que requieren autenticación.
- Sistema de tokens almacenados en `localStorage` del navegador.
- Control de acceso por roles (cliente, capitán, admin).

**Endpoints principales de la API REST:**

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro de nuevos usuarios |
| POST | `/api/auth/login` | Inicio de sesión |
| GET | `/api/embarcaciones` | Listado de embarcaciones (con filtros) |
| POST | `/api/embarcaciones` | Crear nueva embarcación |
| PUT | `/api/embarcaciones/:id` | Actualizar embarcación |
| DELETE | `/api/embarcaciones/:id` | Eliminar embarcación |
| POST | `/api/reservas` | Crear nueva reserva |
| GET | `/api/reservas` | Listado de reservas |
| PUT | `/api/reservas/:id` | Actualizar estado de reserva |
| POST | `/api/stripe/create-payment-intent` | Crear intención de pago |
| GET | `/api/reservas/:id/factura` | Descargar factura PDF |
| POST | `/api/mensajes` | Enviar mensaje |
| GET | `/api/mensajes/contactos` | Obtener lista de contactos |
| GET | `/api/notificaciones` | Obtener conteo de notificaciones |
| GET/POST | `/api/mantenimientos` | CRUD de mantenimientos |
| GET/POST | `/api/amarres` | CRUD de amarres |
| GET/POST | `/api/experiencias` | CRUD de experiencias |

### 2.3 Diseño de la base de datos

El modelo de datos relacional está compuesto por las siguientes entidades principales y sus relaciones:

**Relaciones clave:**
- `Usuario` 1:N `Reserva` — Un usuario puede tener muchas reservas.
- `Usuario` 1:N `Embarcacion` — Un capitán puede poseer varias embarcaciones.
- `Embarcacion` 1:N `Reserva` — Una embarcación puede tener muchas reservas.
- `Embarcacion` 1:N `Mantenimiento` — Control de mantenimientos por embarcación.
- `Reserva` N:M `Experiencia` — Una reserva puede incluir múltiples experiencias y viceversa (tabla intermedia `reserva_experiencias`).
- `Usuario` ↔ `Usuario` (mediante `Mensaje`) — Mensajería entre usuarios.
- `Amarre` → `Embarcacion` — Un amarre puede tener asignada una embarcación.
- `Usuario` 1:N `Review` — Un usuario puede dejar múltiples valoraciones.
- `Usuario` 1:N `Favorito` — Lista de favoritos por usuario.

Se utiliza **MariaDB 10.11** como motor de base de datos por su fiabilidad, compatibilidad con MySQL y excelente soporte en Docker.

### 2.4 Diseño del frontend

La aplicación frontend se ha desarrollado con **React 19**, **TypeScript** y **Tailwind CSS 4**, utilizando **Vite** como herramienta de compilación para obtener tiempos de recarga instantáneos durante el desarrollo.

**Estructura de carpetas:**

```
frontend/src/
├── components/
│   ├── shared/        → Navbar, Footer, CustomSelect
│   ├── home/          → Componentes de la página principal
│   └── chat/          → Interfaz de chat (ChatInterface)
├── contex/            → AuthContext, LanguageContext
├── hooks/             → Custom hooks
├── i18n/              → Traducciones (español/inglés)
├── pages/
│   ├── Home.tsx       → Página principal con hero y buscador
│   ├── SearchResults.tsx → Búsqueda con filtros avanzados
│   ├── VesselDetail.tsx  → Detalle de embarcación y reserva
│   ├── Dashboard.tsx     → Panel de administración (~1.700 líneas)
│   ├── MyBookings.tsx    → Historial de reservas del usuario
│   ├── Experiences.tsx   → Catálogo de experiencias
│   ├── Login.tsx / Register.tsx → Autenticación
│   └── Messages.tsx      → Vista de mensajes
├── types/             → Interfaces TypeScript
├── utils/
│   ├── api.ts         → Cliente HTTP centralizado
│   ├── socket.ts      → Configuración Socket.IO
│   └── formatting.ts  → Funciones de formato
└── App.tsx            → Enrutamiento principal
```

**Características de diseño:**
- **Modo oscuro premium** con paleta de colores corporativa (dorado `#d4af37`, azul `#4a90e2`, fondo `#0a1628`).
- **Glassmorphism** en la barra de navegación y tarjetas.
- **Animaciones CSS** y transiciones suaves en hover y scroll.
- **Diseño responsive** adaptado a móvil, tablet y escritorio.
- **Iconos Material Icons** y SVG personalizados para redes sociales.

**Pantallas principales:**
- **Home:** Hero section con buscador, flota destacada y sección "About".
- **Búsqueda:** Grid de resultados con filtros laterales (ubicación, tipo, precio, capacidad).
- **Detalle de embarcación:** Galería, especificaciones técnicas, formulario de reserva con calendario, selector de experiencias y botón de contacto con el propietario.
- **Dashboard:** Panel completo con pestañas para flota, reservas, mantenimientos, analytics, mensajes y marina. Incluye gráficos interactivos con Recharts.
- **Mis Reservas:** Historial de reservas del cliente con descarga de factura y formulario de pago Stripe.

**Internacionalización (i18n):**
Se ha implementado un sistema de traducción propio con un `LanguageContext` que permite cambiar entre español e inglés en toda la aplicación de forma instantánea, sin recargar la página.

### 2.5 Bot de Telegram con IA

Se ha desarrollado un bot de Telegram (`bot.py`) que utiliza la API de **Google Gemini** para proporcionar un asistente inteligente a los capitanes. El bot:

- Consulta la base de datos para obtener información sobre la flota y reservas.
- Utiliza inteligencia artificial generativa para responder consultas en lenguaje natural.
- Se ejecuta como un contenedor Docker independiente que comparte la misma base de datos.

### 2.6 Despliegue con Docker

La infraestructura se define en un fichero `docker-compose.yml` que orquesta 4 servicios:

1. **db** (MariaDB 10.11): Base de datos con volumen persistente.
2. **backend** (Python 3.10-slim): API Flask con Flask-SocketIO.
3. **frontend** (Node 20 → Nginx Alpine): Compilación multietapa.
4. **bot** (Python 3.10-slim): Bot de Telegram independiente.

El frontend utiliza una compilación multietapa: primero se construye la aplicación con Node.js (`npm run build`) y luego se sirve el resultado estático con Nginx, lo que resulta en una imagen final muy ligera.

### 2.7 Control de versiones y entorno de desarrollo

- **GitHub** como repositorio remoto para control de versiones con Git.
- **Visual Studio Code** como editor principal con extensiones para React, Python y Docker.
- **Docker Desktop** para gestionar los contenedores localmente.
- **Chrome DevTools** para depuración del frontend y red.

---

## 3. FASE DE PRUEBAS

La fase de pruebas se llevó a cabo de forma continua durante el desarrollo para garantizar el correcto funcionamiento de la aplicación en todos sus aspectos.

**Pruebas del backend (API):**
- Verificación de cada endpoint con diferentes roles de usuario.
- Pruebas de validación de datos (campos obligatorios, formatos incorrectos).
- Pruebas de autenticación y autorización (acceso denegado sin token, roles incorrectos).
- Verificación de la integridad referencial de la base de datos.

**Pruebas del frontend:**
- Navegación entre todas las páginas sin errores.
- Formularios de registro, login, reserva y contacto con validaciones.
- Responsive design verificado en diferentes resoluciones (móvil, tablet, escritorio).
- Pruebas de los filtros de búsqueda (no permitir valores negativos, etc.).

**Pruebas de integración:**
- Flujo completo de reserva: búsqueda → detalle → reserva → pago Stripe (tarjeta de prueba `4242 4242 4242 4242`) → confirmación → descarga de factura.
- Envío de mensajes y verificación de recepción en tiempo real vía WebSockets.
- Notificaciones instantáneas al recibir reservas y mensajes.
- Bot de Telegram respondiendo consultas con datos reales de la base de datos.

**Pruebas de despliegue:**
- Construcción y levantamiento de los 4 contenedores Docker sin errores.
- Persistencia de datos tras reiniciar los contenedores (volumen MariaDB).
- Persistencia de imágenes subidas (volumen de uploads).

**Credenciales de prueba:**

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@SEAHIVE.com | admin123 |
| Cliente | john@example.com | cliente123 |

**Tarjeta de prueba Stripe:** `4242 4242 4242 4242` (cualquier fecha futura, cualquier CVC de 3 dígitos).

---

## 4. DOCUMENTACIÓN DE LA APLICACIÓN

Para la información detallada sobre la instalación, configuración y uso de la aplicación, consultar los siguientes ficheros incluidos en la raíz del proyecto:

- **`README.md`**: Guía técnica completa con instrucciones de instalación, estructura del proyecto, tecnologías utilizadas y modelos de datos.
- **`QUICK_START.md`**: Guía rápida de inicio para levantar la aplicación con Docker.
- **`ACCESS_GUIDE.md`**: Credenciales de acceso, datos de prueba y experiencias disponibles.
- **`docker-compose.yml`**: Definición de toda la infraestructura de servicios.

---

## 5. CONCLUSIONES FINALES

Los objetivos planteados al inicio del proyecto se han cumplido de forma satisfactoria. Se ha logrado desarrollar una plataforma web completa y funcional que abarca todas las fases del proceso de alquiler de embarcaciones: desde la búsqueda y reserva por parte del cliente, pasando por el procesamiento seguro de pagos con Stripe, hasta la gestión integral de la flota por parte de capitanes y administradores.

El proyecto destaca especialmente por:

- La **integración de tecnologías modernas** (React 19, TypeScript, Tailwind CSS 4, Flask, Socket.IO, Stripe, Docker), demostrando la capacidad de construir una aplicación de nivel profesional.
- El **sistema de notificaciones en tiempo real** mediante WebSockets, que proporciona una experiencia de usuario fluida sin necesidad de recargar la página.
- La **contenerización completa** con Docker Compose, que permite desplegar toda la infraestructura con un solo comando.
- El **bot de Telegram con IA**, que añade un canal de comunicación innovador para los capitanes.
- El **diseño visual premium**, con un acabado profesional que incluye modo oscuro, animaciones y una experiencia de usuario cuidada al detalle.

**Mejoras futuras:**

De cara al futuro, existen varias funcionalidades que podrían incorporarse para enriquecer la plataforma:

- **Sistema de geolocalización** con mapas interactivos para localizar embarcaciones.
- **Notificaciones push** mediante Service Workers para alertar a los usuarios incluso con la aplicación cerrada.
- **Sistema de reseñas verificadas** vinculadas únicamente a reservas completadas.
- **Calendario interactivo** con vista de disponibilidad en tiempo real.
- **Pasarela de pago adicional** (PayPal, Bizum) para ofrecer más opciones.
- **Aplicación móvil nativa** con React Native reutilizando la lógica del frontend.
- **Panel de analytics avanzado** con métricas de negocio y predicciones basadas en IA.

En conclusión, SEAHIVE constituye un proyecto completo que demuestra la integración de múltiples tecnologías y patrones de desarrollo modernos, resultando en una aplicación lista para su uso en un entorno real de gestión náutica.

---

## 6. BIBLIOGRAFÍA

A continuación, se recoge la relación de recursos utilizados durante el desarrollo del proyecto, tanto en su parte técnica como documental. Se incluyen enlaces, manuales, artículos y referencias consultadas para resolver dudas, adquirir conocimientos o tomar decisiones de diseño y desarrollo.

### 6.1 Documentación oficial de tecnologías utilizadas

**Frontend:**
- React – Documentación oficial: https://react.dev/
- TypeScript – Documentación oficial (Microsoft): https://www.typescriptlang.org/docs/
- Tailwind CSS 4 – Documentación oficial: https://tailwindcss.com/docs
- Vite – Documentación oficial: https://vite.dev/guide/
- React Router – Documentación oficial: https://reactrouter.com/
- Recharts – Documentación oficial: https://recharts.org/en-US/api
- Socket.IO Client – Documentación oficial: https://socket.io/docs/v4/client-api/
- Stripe Elements (React) – Documentación oficial: https://docs.stripe.com/stripe-js/react
- Lucide React – Documentación oficial: https://lucide.dev/guide/packages/lucide-react
- Sonner – Documentación oficial: https://sonner.emilkowal.dev/

**Backend:**
- Flask – Documentación oficial: https://flask.palletsprojects.com/
- SQLAlchemy – Documentación oficial: https://docs.sqlalchemy.org/
- Flask-SQLAlchemy – Documentación oficial: https://flask-sqlalchemy.readthedocs.io/
- Flask-SocketIO – Documentación oficial: https://flask-socketio.readthedocs.io/
- Flask-CORS – Documentación oficial: https://flask-cors.readthedocs.io/
- Werkzeug – Documentación de seguridad: https://werkzeug.palletsprojects.com/en/stable/utils/#module-werkzeug.security
- PyMySQL – Documentación oficial: https://pymysql.readthedocs.io/
- Stripe API (Python) – Documentación oficial: https://docs.stripe.com/api
- ReportLab – Documentación oficial: https://docs.reportlab.com/
- python-dotenv – Documentación oficial: https://pypi.org/project/python-dotenv/
- Eventlet – Documentación oficial: https://eventlet.readthedocs.io/

**Inteligencia Artificial y Bot:**
- Google Gemini API – Documentación oficial: https://ai.google.dev/gemini-api/docs
- Google Gemini – Guía de Function Calling: https://ai.google.dev/gemini-api/docs/function-calling
- pyTelegramBotAPI – Documentación oficial: https://pytba.readthedocs.io/
- Telegram Bot API – Documentación oficial: https://core.telegram.org/bots/api

**Base de datos e infraestructura:**
- MariaDB – Documentación oficial: https://mariadb.com/kb/en/documentation/
- Docker – Documentación oficial: https://docs.docker.com/
- Docker Compose – Documentación oficial: https://docs.docker.com/compose/
- Nginx – Documentación oficial: https://nginx.org/en/docs/

### 6.2 Tutoriales y artículos consultados

- "Building a REST API with Flask and SQLAlchemy" – Real Python: https://realpython.com/flask-connexion-rest-api/
- "Accept a payment with Stripe" – Stripe Docs: https://docs.stripe.com/payments/accept-a-payment
- "WebSocket tutorial with Socket.IO and React" – Socket.IO Docs: https://socket.io/get-started/chat
- "React + TypeScript Cheatsheet" – React TypeScript Cheatsheets: https://react-typescript-cheatsheet.netlify.app/
- "Multi-stage Docker builds" – Docker Docs: https://docs.docker.com/build/building/multi-stage/
- "Deploying Flask with Docker Compose" – DigitalOcean Community Tutorials: https://www.digitalocean.com/community/tutorials
- "Function Calling with Gemini" – Google AI for Developers: https://ai.google.dev/gemini-api/docs/function-calling/tutorial
- "Generating PDFs in Python with ReportLab" – ReportLab User Guide: https://docs.reportlab.com/reportlab/userguide/
- "React 19 – What's New" – React Blog: https://react.dev/blog
- "Tailwind CSS v4.0" – Tailwind CSS Blog: https://tailwindcss.com/blog/tailwindcss-v4
- Foros técnicos: Stack Overflow, Reddit r/flask, r/reactjs y r/docker

### 6.3 Herramientas de desarrollo utilizadas

- Visual Studio Code – Editor de código principal: https://code.visualstudio.com/
- Docker Desktop – Contenerización y despliegue local: https://www.docker.com/products/docker-desktop/
- Git – Control de versiones: https://git-scm.com/
- GitHub – Repositorio remoto del proyecto: https://github.com/
- Postman – Pruebas manuales de la API REST: https://www.postman.com/
- Chrome DevTools – Depuración del frontend y red: https://developer.chrome.com/docs/devtools/
- Node.js 20 – Entorno de ejecución del frontend: https://nodejs.org/
- Python 3.10 – Entorno de ejecución del backend: https://www.python.org/
- npm – Gestor de paquetes de Node.js: https://www.npmjs.com/
- pip – Gestor de paquetes de Python: https://pip.pypa.io/
- ESLint – Linting de código TypeScript/JavaScript: https://eslint.org/

### 6.4 Recursos académicos y de diseño

- MDN Web Docs – Referencia de tecnologías web (HTML, CSS, JavaScript): https://developer.mozilla.org/
- W3Schools – Tutoriales de desarrollo web: https://www.w3schools.com/
- Google Fonts (Inter, Outfit) – Tipografías utilizadas en el diseño: https://fonts.google.com/
- Material Design Icons – Iconografía del proyecto: https://fonts.google.com/icons
- Unsplash – Imágenes de embarcaciones en alta resolución: https://unsplash.com/
- CSS-Tricks – Guía de Glassmorphism y efectos CSS modernos: https://css-tricks.com/
- Can I Use – Compatibilidad de funcionalidades CSS y JS entre navegadores: https://caniuse.com/
- Stripe Testing – Tarjetas de prueba para entorno de desarrollo: https://docs.stripe.com/testing
