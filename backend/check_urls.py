import requests
from app import app, db, Embarcacion

with app.app_context():
    embarcaciones = Embarcacion.query.all()
    for e in embarcaciones:
        if e.imagen_url:
            try:
                res = requests.head(e.imagen_url, timeout=5)
                if res.status_code != 200:
                    print(f"[{e.id}] {e.nombre} - BAD URL: {e.imagen_url} - Status: {res.status_code}")
                else:
                    print(f"[{e.id}] {e.nombre} - OK")
            except Exception as ex:
                print(f"[{e.id}] {e.nombre} - ERROR: {ex}")
