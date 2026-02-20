@echo off
echo ========================================
echo   NAUTICA - Sistema de Alquiler de Barcos
echo ========================================
echo.

echo [1/3] Verificando MySQL...
echo Asegurate de que MySQL/MariaDB este corriendo (XAMPP o servicio)
pause

echo.
echo [2/3] Iniciando Backend (Flask)...
cd backend
start cmd /k "venv\Scripts\activate && python app.py"

echo.
echo [3/3] Iniciando Frontend (React)...
cd ..\frontend
start cmd /k "npm run dev"

echo.
echo ========================================
echo   Servidores iniciados!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Credenciales de prueba:
echo   Admin: admin@nautica.com / admin123
echo.
pause
