# 🚢 Guía de Acceso y Pruebas - Proyecto Alquiler de Barcos

Este documento contiene las credenciales y datos necesarios para probar todas las funcionalidades del sistema (Dashboard, Reservas, Pagos, etc.).

---

## 🔐 Cuentas de Prueba

### 👑 Administrador (Acceso total al Dashboard)
- **Email:** `admin@nautica.com`
- **Contraseña:** `admin123`
- *Acceso:* [http://localhost:5173/login](http://localhost:5173/login)
- *Funciones:* Ver todas las reservas, gestionar flota, revisar analíticas.

### 👨‍✈️ Capitanes / Propietarios
Todos los capitanes tienen la misma contraseña predeterminada para facilitar las pruebas.
- **Contraseña:** `capitan123`
- **Emails sugeridos:**
    - `amelia@nautica.com` (Amelia Earhart)
    - `haddock@nautica.com` (Captain Haddock)
    - `will@nautica.com` (Will Turner)
- *Acceso:* [http://localhost:5173/login](http://localhost:5173/login)
- *Funciones:* Gestionar sus propios barcos y ver sus reservas específicas.

### 👤 Cliente Estándar
- **Email:** `john@example.com`
- **Contraseña:** `password` (o puedes registrar uno nuevo)
- *Funciones:* Buscar barcos, añadir experiencias y realizar pagos.

---

## 💳 Datos de Pago (Stripe Test)

Para probar el flujo de reserva con pasarela de pago, utiliza los siguientes datos de tarjeta de prueba de Stripe:

| Campo | Valor |
| :--- | :--- |
| **Número de Tarjeta** | `4242 4242 4242 4242` |
| **Fecha de Expiración** | Cualquier fecha futura (ej: `12/30`) |
| **CVC** | Cualquier número de 3 dígitos (ej: `123`) |
| **Código Postal** | Cualquier número (ej: `28001`) |

> [!TIP]
> Puedes usar cualquier nombre de titular para las pruebas.

---

## 🤖 Bot de Telegram (Captain AI)

El bot está configurado para asistir a los capitanes.
1. Busca el bot en Telegram (el nombre configurado en tu `.env`).
2. Interactúa con él para consultar el estado de tu flota o clima.

---

## 🌊 Experiencias Disponibles

Al realizar una reserva desde el detalle de un barco, puedes añadir:
- **🐬 Avistamiento de Delfines** (95€)
- **🌅 Paseo al Atardecer** (120€)
- **🤿 Buceo y Snorkel** (85€)
- **🏄 Wakeboard** (75€)

> [!IMPORTANT]
> Recuerda que las experiencias se filtran por compatibilidad. Por ejemplo, no verás "Yoga" si estás reservando una moto de agua.
