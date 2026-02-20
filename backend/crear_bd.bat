@echo off
echo ========================================
echo   CREANDO BASE DE DATOS
echo ========================================
echo.
echo Por favor, ejecuta este comando en phpMyAdmin o en MySQL:
echo.
echo CREATE DATABASE IF NOT EXISTS alquiler_barcos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo.
echo.
echo Opciones para crear la base de datos:
echo.
echo 1. XAMPP phpMyAdmin:
echo    - Abre http://localhost/phpmyadmin
echo    - Click en "Nueva"
echo    - Nombre: alquiler_barcos
echo    - Cotejamiento: utf8mb4_unicode_ci
echo    - Click en "Crear"
echo.
echo 2. MySQL Workbench:
echo    - Abre MySQL Workbench
echo    - Ejecuta: CREATE DATABASE alquiler_barcos;
echo.
echo 3. Desde XAMPP Shell:
echo    - Abre XAMPP Control Panel
echo    - Click en "Shell"
echo    - Ejecuta: mysql -u root -p
echo    - Luego: CREATE DATABASE alquiler_barcos;
echo.
pause
