
import sqlalchemy
from sqlalchemy import text
import sys

DATABASE_URI = 'mysql+pymysql://root:8326@localhost'
DB_NAME = 'alquiler_barcos'

def initialize_database():
    print(f"Connecting to MySQL at {DATABASE_URI}...")
    try:
        engine = sqlalchemy.create_engine(DATABASE_URI)
        with engine.connect() as conn:
            print(f"Creating database {DB_NAME} if not exists...")
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            print("Database created or already exists.")
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

if __name__ == "__main__":
    success = initialize_database()
    if not success:
        sys.exit(1)
