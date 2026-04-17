import pymysql

def update_database():
    try:
        connection = pymysql.connect(host='localhost',
                                     user='root',
                                     password='',
                                     database='alquiler_barcos',
                                     cursorclass=pymysql.cursors.DictCursor)

        with connection.cursor() as cursor:
            # Check if column exists
            cursor.execute("SHOW COLUMNS FROM usuarios LIKE 'telegram_id'")
            result = cursor.fetchone()
            if not result:
                print("Adding telegram_id column to usuarios table...")
                cursor.execute("ALTER TABLE usuarios ADD COLUMN telegram_id VARCHAR(50) UNIQUE NULL")
                connection.commit()
                print("Column telegram_id added successfully!")
            else:
                print("Column telegram_id already exists in usuarios table.")
    except Exception as e:
        print(f"Error updating database: {e}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    update_database()
