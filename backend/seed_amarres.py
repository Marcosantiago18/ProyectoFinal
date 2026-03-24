"""
Script para poblar la tabla de amarres con datos iniciales.
Ejecutar DESPUÉS de tener MySQL/XAMPP corriendo y app.py corrido al menos una vez.
  > python seed_amarres.py
"""
from app import app, db, Amarre

with app.app_context():
    if Amarre.query.count() > 0:
        print(f"Ya existen {Amarre.query.count()} amarres. Sin cambios.")
    else:
        filas = ['A', 'B', 'C']
        precios = {'A': 450.0, 'B': 380.0, 'C': 310.0}
        longitudes = {'A': 15.0, 'B': 12.0, 'C': 9.0}
        for fila in filas:
            for num in range(1, 9):
                codigo = f"{fila}-{num:02d}"
                amarre = Amarre(
                    codigo=codigo,
                    muelle='Principal',
                    fila=fila,
                    numero=num,
                    longitud_max=longitudes[fila],
                    manga_max=4.0,
                    calado_max=2.5,
                    precio_mes=precios[fila],
                    estado='disponible',
                )
                db.session.add(amarre)
        db.session.commit()
        print(f"✅ 24 amarres creados: filas A, B, C con 8 posiciones cada una.")
