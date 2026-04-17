from app import app, db, Usuario

def reset_admin():
    with app.app_context():
        admin = Usuario.query.filter_by(email='admin@nautica.com').first()
        if admin:
            admin.set_password('admin123')
            db.session.commit()
            print("Admin password reset to 'admin123'")
        else:
            # Create if not exists
            admin = Usuario(nombre='Captain Reynolds', email='admin@nautica.com', rol='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Admin user created with password 'admin123'")

if __name__ == '__main__':
    reset_admin()
