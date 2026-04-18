import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

def migrate_users_table():
    print("Connecting to database...")
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=10,
        sslmode="require"
    )
    cursor = conn.cursor()
    
    try:
        # Check if auth_id already exists to prevent duplicate failures
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='USERS' AND column_name='auth_id';
        """)
        if cursor.fetchone() is None:
            print("Adding auth_id column...")
            cursor.execute('ALTER TABLE "USERS" ADD COLUMN auth_id UUID UNIQUE;')
        else:
            print("auth_id column already exists.")

        print("Making password column nullable...")
        cursor.execute('ALTER TABLE "USERS" ALTER COLUMN password DROP NOT NULL;')
        
        conn.commit()
        print("Database schema successfully migrated for Supabase Auth!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {str(e)}")
        
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate_users_table()
