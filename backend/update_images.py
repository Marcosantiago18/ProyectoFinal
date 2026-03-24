from app import app, db, Embarcacion

def update_images():
    with app.app_context():
        # Mapping from boat name to local image path
        image_map = {
            'Skyrider Jetski': '/images/fleet/skyrider_jetski.png',
            'Amelia Explorer': '/images/fleet/amelia_explorer.png',
            'Marlin Cruiser': '/images/fleet/marlin_cruiser.png',
            'SeaDoo GTX': '/images/fleet/seadoo_gtx.png',
            'Dutchman Sailing': '/images/fleet/dutchman_sailing.png',
            'Yamaha WaveRunner': '/images/fleet/yamaha_waverunner.png',
            'Black Pearl Mega Yacht': '/images/fleet/black_pearl.png',
            'Barbossa Turbo Jet': '/images/fleet/barbossa_turbo_jet.png',
            'Sparrow Spark': '/images/fleet/sparrow_spark.png',
            'Lucas Racer': '/images/fleet/lucas_racer.png'
        }
        
        updated_count = 0
        for b_name, img_url in image_map.items():
            boat = Embarcacion.query.filter_by(nombre=b_name).first()
            if boat:
                boat.imagen_url = img_url
                updated_count += 1
                
        db.session.commit()
        print(f"✅ Se actualizaron las fotos de {updated_count} barcos a sus versiones generadas.")

if __name__ == '__main__':
    update_images()
