@echo off
echo ========================================
echo   NAUTICA - INSTALACION COMPLETA
echo ========================================
echo.

echo PASO 1: VERIFICAR MYSQL
echo ========================================
echo.
echo Necesitas tener MySQL/MariaDB corriendo.
echo.
echo Opciones:
echo   1. XAMPP: Abre XAMPP Control Panel y inicia MySQL
echo   2. MySQL Workbench: Asegurate de que el servicio este activo
echo.
pause

echo.
echo PASO 2: CREAR BASE DE DATOS
echo ========================================
echo.
echo Abre phpMyAdmin (http://localhost/phpmyadmin) y ejecuta:
echo.
echo CREATE DATABASE IF NOT EXISTS alquiler_barcos;
echo.
echo O desde MySQL Workbench ejecuta el mismo comando.
echo.
pause

echo.
echo PASO 3: INICIAR BACKEND
echo ========================================
cd backend
echo Activando entorno virtual...
call venv\Scripts\activate.bat
echo.
echo Iniciando servidor Flask...
echo El servidor creara las tablas automaticamente.
echo.
start cmd /k "venv\Scripts\activate && python app.py"
timeout /t 5

echo.
echo PASO 4: POBLAR BASE DE DATOS
echo ========================================
echo.
echo Presiona una tecla cuando el backend este corriendo...
pause
echo.
echo Poblando base de datos con datos de ejemplo...
start cmd /k "venv\Scripts\activate && python populate_db.py && pause"
cd ..

echo.
echo PASO 5: INICIAR FRONTEND
echo ========================================
cd frontend
echo Iniciando React...
start cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo   INSTALACION COMPLETADA!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Credenciales:
echo   Admin: admin@nautica.com / admin123
echo.
echo Si hay errores de conexion a MySQL:
echo   1. Verifica que MySQL este corriendo
echo   2. Edita backend/app.py linea 13
echo   3. Ajusta usuario/password segun tu configuracion
echo.
pause
