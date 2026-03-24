from app import app, db, Usuario, Embarcacion, Amarre
from sqlalchemy import text
from datetime import datetime, timedelta

def migrate():
    with app.app_context():
        # 1. Alter tables
        print("Migrating database schema...")
        commands = [
            "ALTER TABLE embarcaciones ADD COLUMN propietario_id INT NULL;",
            "ALTER TABLE embarcaciones ADD CONSTRAINT fk_embarcacion_prop FOREIGN KEY (propietario_id) REFERENCES usuarios(id);",
            "ALTER TABLE amarres ADD COLUMN propietario_id INT NULL;",
            "ALTER TABLE amarres ADD CONSTRAINT fk_amarre_prop FOREIGN KEY (propietario_id) REFERENCES usuarios(id);",
            "ALTER TABLE amarres ADD COLUMN fecha_fin_alquiler DATETIME NULL;"
        ]
        
        for cmd in commands:
            try:
                db.session.execute(text(cmd))
                print(f"Success: {cmd}")
            except Exception as e:
                print(f"Skipping (might already exist): {cmd}")
                db.session.rollback()
                
        db.session.commit()

        # 2. Create captains
        print("Creating captains...")
        capitan1 = Usuario.query.filter_by(email='jack@sparrow.com').first()
        if not capitan1:
            capitan1 = Usuario(nombre='Jack Sparrow', email='jack@sparrow.com', telefono='+1-555-0200', rol='capitan')
            capitan1.set_password('pirate123')
            db.session.add(capitan1)
            
        capitan2 = Usuario.query.filter_by(email='lucas@marino.com').first()
        if not capitan2:
            capitan2 = Usuario(nombre='Lucas Marino', email='lucas@marino.com', telefono='+1-555-0201', rol='capitan')
            capitan2.set_password('capitan123')
            db.session.add(capitan2)
            
        admin = Usuario.query.filter_by(email='admin@nautica.com').first()
        
        db.session.commit()
        
        print("Assigning vessels to captains...")
        embarcaciones = Embarcacion.query.all()
        
        # Repartir los barcos
        for i, emp in enumerate(embarcaciones):
            if i % 3 == 0:
                emp.propietario_id = capitan1.id
            elif i % 3 == 1:
                emp.propietario_id = capitan2.id
            else:
                emp.propietario_id = admin.id if admin else None
                
        db.session.commit()
        
        print("Assigning some berths to captains...")
        amarres = Amarre.query.limit(4).all()
        if len(amarres) >= 2:
            amarres[0].propietario_id = capitan1.id
            amarres[0].estado = 'ocupado'
            amarres[0].fecha_fin_alquiler = datetime.utcnow() + timedelta(days=60)
            
            amarres[1].propietario_id = capitan2.id
            amarres[1].estado = 'ocupado'
            amarres[1].fecha_fin_alquiler = datetime.utcnow() + timedelta(days=90)
            
            db.session.commit()
            print("Berths updated.")
            
        print("Migration complete!")

if __name__ == '__main__':
    migrate()
