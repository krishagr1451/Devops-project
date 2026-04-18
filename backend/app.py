import os
import uuid
from flask import Flask, request, session, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime
from supabase import create_client, Client

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
app.permanent_session_lifetime = timedelta(minutes=60)

CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# ==============================
# SUPABASE CLIENT (for Storage)
# ==============================
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

STORAGE_BUCKET = "property-images"

@app.route('/api/test_supabase')
def test_supabase():
    """Simple test route to verify Supabase Client connection."""
    try:
        # Tries to select from USERS table (already created in Step 2 of plan)
        response = supabase.table('USERS').select("count", count='exact').limit(0).execute()
        return jsonify({"status": "success", "message": "Supabase Connection OK", "count": response.count})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ==============================
# DATABASE CONNECTION UTILITY (Supabase PostgreSQL)
# ==============================
class Database:
    @staticmethod
    def create_connection():
        return psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 5432)),
            dbname=os.getenv("DB_NAME", "postgres"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD"),
            connect_timeout=10,
            sslmode="require",
            cursor_factory=psycopg2.extras.RealDictCursor,
        )


# ==============================
# CORE CLASSES FROM CLASS DIAGRAM
# ==============================
class User:
    def __init__(self, user_id=None, name=None, email=None, role=None):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.role = role

    @staticmethod
    def register(name, email, password, role, phone_number):
        conn = Database.create_connection()
        cursor = conn.cursor()
        hashed_password = generate_password_hash(password)
        try:
            cursor.execute(
                'INSERT INTO "USERS" (name, email, password, role, phone_number) VALUES (%s, %s, %s, %s, %s)',
                (name, email, hashed_password, role, phone_number)
            )
            conn.commit()
            return jsonify({"status": "success", "message": "Account created successfully! Please log in."})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()

    @staticmethod
    def login(email, password, role):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM "USERS" WHERE email=%s AND role=%s', (email, role))
        user_data = cursor.fetchone()
        conn.close()

        if user_data and check_password_hash(user_data['password'], password):
            session.permanent = True
            session['logged_in'] = True
            session['user_id'] = user_data['user_id']
            session['name'] = user_data['name']
            session['role'] = user_data['role']
            return jsonify({
                "status": "success",
                "message": "Logged in successfully.",
                "role": user_data['role'],
                "name": user_data['name'],
                "user_id": user_data['user_id']
            })
        else:
            return jsonify({"status": "error", "message": "Login failed. Check your credentials and try again."}), 401

    @staticmethod
    def logout():
        session.clear()
        return jsonify({"status": "success", "message": "You have been logged out."})


class Admin(User):
    def __init__(self, user_id, name, email, role):
        super().__init__(user_id, name, email, role)

    def addProperty(self, address, city, state, country, description, image_url, image_description):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO "PROPERTIES"
                (owner_id, address, city, state, country, description, image_url, image_description)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING property_id
            """, (self.user_id, address, city, state, country, description, image_url, image_description))
            row = cursor.fetchone()
            conn.commit()
            property_id = row['property_id']
            return jsonify({"status": "success", "message": "Property added successfully!", "property_id": property_id})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()

    def editProperty(self, property_id, address, city, state, country, description, image_url, image_description):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE "PROPERTIES" SET address = %s, city = %s, state = %s, country = %s,
                description = %s, image_url = %s, image_description = %s
                WHERE property_id = %s AND owner_id = %s
            """, (address, city, state, country, description, image_url, image_description, property_id, self.user_id))
            conn.commit()
            return jsonify({"status": "success", "message": "Property updated successfully!"})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()

    def deleteProperty(self, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('DELETE FROM "ROOMS" WHERE property_id = %s', (property_id,))
            cursor.execute('DELETE FROM "AMENITIES" WHERE property_id = %s', (property_id,))
            cursor.execute('DELETE FROM "PROPERTIES" WHERE property_id = %s AND owner_id = %s', (property_id, self.user_id))
            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"status": "error", "message": "Property not found or no permission."}), 403
            else:
                conn.commit()
                return jsonify({"status": "success", "message": "Property deleted successfully!"})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()

    def viewDashboard(self):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM "PROPERTIES" WHERE owner_id = %s', (self.user_id,))
        properties = cursor.fetchall()
        conn.close()
        return jsonify({"properties": [dict(p) for p in properties], "name": self.name, "role": self.role})

    @staticmethod
    def addAmenity(property_id, name, description):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('INSERT INTO "AMENITIES" (property_id, name, description) VALUES (%s, %s, %s)',
                           (property_id, name, description))
            conn.commit()
            return jsonify({"status": "success", "message": "Amenity added successfully!"})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()

    @staticmethod
    def viewAmenities(property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM "AMENITIES" WHERE property_id = %s', (property_id,))
        amenities = cursor.fetchall()
        conn.close()
        return [dict(a) for a in amenities]

    @staticmethod
    def deleteAmenity(amenity_id, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('DELETE FROM "AMENITIES" WHERE amenity_id = %s', (amenity_id,))
            conn.commit()
            return jsonify({"status": "success", "message": "Amenity deleted successfully!"})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()

    @staticmethod
    def editAmenity(amenity_id, name, description, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('UPDATE "AMENITIES" SET name = %s, description = %s WHERE amenity_id = %s',
                           (name, description, amenity_id))
            conn.commit()
            return jsonify({"status": "success", "message": "Amenity updated successfully!"})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()
        return property_id

    @staticmethod
    def addRoom(property_id, room_type, capacity, price_per_night, availability_status):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO "ROOMS" (property_id, room_type, capacity, price_per_night, availability_status)
                VALUES (%s, %s, %s, %s, %s)
            """, (property_id, room_type, int(capacity), float(price_per_night), bool(availability_status)))
            conn.commit()
            return jsonify({"status": "success", "message": "Room added successfully!"})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()

    @staticmethod
    def viewRooms(property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM "ROOMS" WHERE property_id = %s', (property_id,))
        rooms = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rooms]

    @staticmethod
    def deleteRoom(room_id, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('DELETE FROM "ROOMS" WHERE room_id = %s', (room_id,))
            conn.commit()
            return jsonify({"status": "success", "message": "Room deleted successfully!"})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()

    @staticmethod
    def editRoom(room_id, room_type, capacity, price_per_night, availability_status, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE "ROOMS" SET room_type = %s, capacity = %s,
                price_per_night = %s, availability_status = %s
                WHERE room_id = %s
            """, (room_type, int(capacity), float(price_per_night), bool(availability_status), room_id))
            conn.commit()
            return jsonify({"status": "success", "message": "Room updated successfully!"})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()
        return property_id

    @staticmethod
    def getRoomStatus(property_id, owner_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM "PROPERTIES" WHERE property_id = %s AND owner_id = %s', (property_id, owner_id))
        property_details = cursor.fetchone()
        if not property_details:
            conn.close()
            return None, None
        cursor.execute("""
            SELECT r.room_id, r.room_type, r.capacity, r.price_per_night,
                   EXISTS (
                       SELECT 1 FROM "BOOKINGS" b 
                       WHERE b.room_id = r.room_id 
                         AND b.check_out_date > CURRENT_DATE 
                         AND b.check_in_date <= CURRENT_DATE
                   ) AS is_booked
            FROM "ROOMS" r
            WHERE r.property_id = %s
        """, (property_id,))
        rooms = cursor.fetchall()
        conn.close()
        return dict(property_details), [dict(r) for r in rooms]


class Guest(User):
    def __init__(self, user_id, name, email, role):
        super().__init__(user_id, name, email, role)

    def searchRooms(self):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM "PROPERTIES"')
        properties = cursor.fetchall()
        conn.close()
        return jsonify({"properties": [dict(p) for p in properties], "name": self.name, "role": self.role})

    def bookRoom(self, room_id, property_id, check_in_date, check_out_date, payment_method):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM "ROOMS" WHERE room_id = %s', (room_id,))
        room = cursor.fetchone()

        if not room or not bool(room['availability_status']):
            conn.close()
            return jsonify({"status": "error", "message": "This room is currently turned off by the admin."}), 400

        check_in = datetime.strptime(check_in_date, '%Y-%m-%d')
        check_out = datetime.strptime(check_out_date, '%Y-%m-%d')
        num_days = (check_out - check_in).days
        if num_days <= 0:
            conn.close()
            return jsonify({"status": "error", "message": "Invalid date range."}), 400

        # DYNAMIC CHECK: Ensure there are no overlapping bookings for the selected dates
        cursor.execute("""
            SELECT booking_id FROM "BOOKINGS" 
            WHERE room_id = %s 
              AND check_in_date < %s 
              AND check_out_date > %s
        """, (room_id, check_out.date(), check_in.date()))
        if cursor.fetchone():
            conn.close()
            return jsonify({"status": "error", "message": "Room is already booked for these dates."}), 400
        total_price = num_days * float(room['price_per_night'])

        try:
            cursor.execute("""
                INSERT INTO "BOOKINGS" (user_id, room_id, check_in_date, check_out_date, total_price, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING booking_id
            """, (self.user_id, room_id, check_in_date, check_out_date, total_price))
            booking_id = cursor.fetchone()['booking_id']

            cursor.execute("""
                INSERT INTO "PAYMENTS" (booking_id, payment_method, amount, payment_status, payment_date)
                VALUES (%s, %s, %s, 'completed', NOW())
            """, (booking_id, payment_method, total_price))

            conn.commit()
            return jsonify({"status": "success", "message": "Booking and payment successful!", "booking_id": booking_id})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()

    def cancelBooking(self, booking_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('SELECT * FROM "BOOKINGS" WHERE booking_id = %s AND user_id = %s', (booking_id, self.user_id))
            booking = cursor.fetchone()
            if not booking:
                conn.close()
                return jsonify({"status": "error", "message": "Booking not found or no permission."}), 404

            cursor.execute('DELETE FROM "PAYMENTS" WHERE booking_id = %s', (booking_id,))
            cursor.execute('DELETE FROM "BOOKINGS" WHERE booking_id = %s', (booking_id,))
            conn.commit()
            return jsonify({"status": "success", "message": "Booking cancelled successfully."})
        except Exception as err:
            conn.rollback()
            return jsonify({"status": "error", "message": str(err)}), 400
        finally:
            conn.close()

    def viewBookings(self):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT b.booking_id, b.check_in_date, b.check_out_date, b.total_price, r.room_type, p.address
            FROM "BOOKINGS" b
            JOIN "ROOMS" r ON b.room_id = r.room_id
            JOIN "PROPERTIES" p ON r.property_id = p.property_id
            WHERE b.user_id = %s
        """, (self.user_id,))
        bookings = cursor.fetchall()
        conn.close()
        result = []
        for b in bookings:
            bd = dict(b)
            if bd.get('check_in_date'):
                bd['check_in_date'] = str(bd['check_in_date'])
            if bd.get('check_out_date'):
                bd['check_out_date'] = str(bd['check_out_date'])
            result.append(bd)
        return jsonify({"bookings": result})

    @staticmethod
    def viewPropertyDetails(property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM "PROPERTIES" WHERE property_id = %s', (property_id,))
        property_details = cursor.fetchone()
        cursor.execute('SELECT * FROM "AMENITIES" WHERE property_id = %s', (property_id,))
        amenities = cursor.fetchall()
        cursor.execute('SELECT * FROM "ROOMS" WHERE property_id = %s', (property_id,))
        rooms = cursor.fetchall()

        room_reviews = {}
        for room in rooms:
            cursor.execute("""
                SELECT r.rating, r.comment, u.name AS user_name, r.created_at
                FROM "REVIEWS" r
                JOIN "USERS" u ON r.user_id = u.user_id
                WHERE r.room_id = %s
                ORDER BY r.created_at DESC
            """, (room['room_id'],))
            reviews = cursor.fetchall()
            revs = []
            for rev in reviews:
                rd = dict(rev)
                if rd.get('created_at'):
                    rd['created_at'] = str(rd['created_at'])
                revs.append(rd)
            room_reviews[str(room['room_id'])] = revs

        conn.close()
        return (
            dict(property_details) if property_details else None,
            [dict(a) for a in amenities],
            [dict(r) for r in rooms],
            room_reviews
        )

    @staticmethod
    def addReview(room_id, user_id, rating, comment, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        now = datetime.now()
        try:
            cursor.execute("""
                INSERT INTO "REVIEWS" (room_id, user_id, rating, comment, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (room_id, user_id, int(rating), comment, now, now))
            conn.commit()
            return jsonify({"status": "success", "message": "Your review has been added."})
        except Exception:
            conn.rollback()
            return jsonify({"status": "error", "message": "An error occurred. Please try again."}), 400
        finally:
            conn.close()


class Scheduler:
    @staticmethod
    def updateRoomAvailability():
        conn = Database.create_connection()
        cursor = conn.cursor()
        current_time = datetime.now()
        try:
            cursor.execute('SELECT room_id FROM "BOOKINGS" WHERE check_out_date <= %s', (current_time.date(),))
            expired_bookings = cursor.fetchall()
            for booking in expired_bookings:
                cursor.execute('UPDATE "ROOMS" SET availability_status = TRUE WHERE room_id = %s', (booking['room_id'],))
            if expired_bookings:
                conn.commit()
                print(f"Updated availability for {len(expired_bookings)} room(s).")
        except Exception as err:
            conn.rollback()
            print(f"Error updating room availability: {err}")
        finally:
            conn.close()


# ==============================
# API ROUTES
# ==============================

@app.route('/api/me')
def me():
    if 'logged_in' not in session:
        return jsonify({"logged_in": False}), 401
    return jsonify({
        "logged_in": True,
        "user_id": session['user_id'],
        "name": session['name'],
        "role": session['role']
    })

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    return User.register(
        data['name'], data['email'], data['password'],
        data['role'], data['phone_number']
    )

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    return User.login(data['email'], data['password'], data['role'])

@app.route('/api/logout', methods=['POST'])
def logout():
    return User.logout()

@app.route('/api/dashboard')
def dashboard():
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    admin = Admin(session['user_id'], session['name'], None, 'admin')
    return admin.viewDashboard()

@app.route('/api/user_dashboard')
def user_dashboard():
    if 'logged_in' not in session or session['role'] != 'user':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    guest = Guest(session['user_id'], session['name'], None, 'user')
    return guest.searchRooms()

@app.route('/api/book_room/<int:room_id>/<int:property_id>', methods=['GET', 'POST'])
def book_room(room_id, property_id):
    if 'logged_in' not in session or session['role'] != 'user':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    if request.method == 'POST':
        data = request.get_json()
        guest = Guest(session['user_id'], session['name'], None, 'user')
        return guest.bookRoom(
            room_id, property_id,
            data['check_in_date'], data['check_out_date'], data['payment_method']
        )

    conn = Database.create_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM "ROOMS" WHERE room_id = %s', (room_id,))
    room = cursor.fetchone()
    conn.close()
    return jsonify({"room": dict(room) if room else None, "property_id": property_id})

@app.route('/api/room_status/<int:property_id>')
def room_status(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    property_details, rooms = Admin.getRoomStatus(property_id, session['user_id'])
    if not property_details:
        return jsonify({"status": "error", "message": "Property not found."}), 404
    return jsonify({"property": property_details, "rooms": rooms})

@app.route('/api/view_more/<int:property_id>')
def view_more(property_id):
    if 'logged_in' not in session or session['role'] != 'user':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    property_details, amenities, rooms, room_reviews = Guest.viewPropertyDetails(property_id)
    return jsonify({
        "property": property_details,
        "amenities": amenities,
        "rooms": rooms,
        "room_reviews": room_reviews
    })

@app.route('/api/add_review/<int:room_id>', methods=['POST'])
def add_review(room_id):
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    data = request.get_json()
    return Guest.addReview(
        room_id, session['user_id'],
        int(data['rating']), data['comment'], data.get('property_id')
    )

@app.route('/api/my_bookings')
def my_bookings():
    if 'logged_in' not in session or session['role'] != 'user':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    guest = Guest(session['user_id'], session['name'], None, 'user')
    return guest.viewBookings()

@app.route('/api/cancel_booking/<int:booking_id>', methods=['POST'])
def cancel_booking(booking_id):
    if 'logged_in' not in session or session['role'] != 'user':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    guest = Guest(session['user_id'], session['name'], None, 'user')
    return guest.cancelBooking(booking_id)

@app.route('/api/delete_property/<int:property_id>', methods=['DELETE'])
def delete_property(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    admin = Admin(session['user_id'], session['name'], None, 'admin')
    return admin.deleteProperty(property_id)

@app.route('/api/upload_property_image', methods=['POST'])
def upload_property_image():
    """Upload a property image to Supabase Storage and return the public URL."""
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image file provided"}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({"status": "error", "message": "Empty filename"}), 400

    # Determine extension and build a unique storage path
    ext = os.path.splitext(image_file.filename)[1].lower() or '.jpg'
    file_name = f"{uuid.uuid4()}{ext}"
    file_bytes = image_file.read()
    content_type = image_file.content_type or 'image/jpeg'

    try:
        # Upload to Supabase Storage
        supabase.storage.from_(STORAGE_BUCKET).upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": content_type}
        )
        # Build public URL
        public_url = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public/{STORAGE_BUCKET}/{file_name}"
        return jsonify({"status": "success", "image_url": public_url})
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500

@app.route('/api/add_property', methods=['POST'])
def add_property():
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    data = request.get_json()
    admin = Admin(session['user_id'], session['name'], None, 'admin')
    return admin.addProperty(
        data['address'], data['city'], data['state'], data['country'],
        data['description'], data.get('image_url', ''), data.get('image_description', '')
    )

@app.route('/api/edit_property/<int:property_id>', methods=['GET', 'PUT'])
def edit_property(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    if request.method == 'PUT':
        data = request.get_json()
        admin = Admin(session['user_id'], session['name'], None, 'admin')
        return admin.editProperty(
            property_id,
            data['address'], data['city'], data['state'], data['country'],
            data['description'], data.get('image_url', ''), data.get('image_description', '')
        )
    conn = Database.create_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM "PROPERTIES" WHERE property_id = %s AND owner_id = %s',
                   (property_id, session['user_id']))
    property_row = cursor.fetchone()
    conn.close()
    return jsonify({"property": dict(property_row) if property_row else None})

@app.route('/api/view_amenities/<int:property_id>')
def view_amenities(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    amenities = Admin.viewAmenities(property_id)
    return jsonify({"amenities": amenities, "property_id": property_id})

@app.route('/api/add_amenities/<int:property_id>', methods=['POST'])
def add_amenities(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    data = request.get_json()
    return Admin.addAmenity(property_id, data['amenity_name'], data['amenity_description'])

@app.route('/api/delete_amenity/<int:amenity_id>', methods=['DELETE'])
def delete_amenity(amenity_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    return Admin.deleteAmenity(amenity_id, None)

@app.route('/api/edit_amenity/<int:amenity_id>', methods=['GET', 'PUT'])
def edit_amenity(amenity_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    if request.method == 'PUT':
        data = request.get_json()
        return Admin.editAmenity(amenity_id, data['amenity_name'], data['amenity_description'], data.get('property_id'))
    conn = Database.create_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM "AMENITIES" WHERE amenity_id = %s', (amenity_id,))
    amenity = cursor.fetchone()
    conn.close()
    return jsonify({"amenity": dict(amenity) if amenity else None})

@app.route('/api/view_rooms/<int:property_id>')
def view_rooms(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    rooms = Admin.viewRooms(property_id)
    return jsonify({"rooms": rooms, "property_id": property_id})

@app.route('/api/delete_room/<int:room_id>', methods=['DELETE'])
def delete_room(room_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    return Admin.deleteRoom(room_id, None)

@app.route('/api/add_room/<int:property_id>', methods=['POST'])
def add_room(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    data = request.get_json()
    return Admin.addRoom(
        property_id, data['room_type'], data['capacity'],
        data['price_per_night'], data.get('availability_status', True)
    )

@app.route('/api/edit_room/<int:room_id>', methods=['GET', 'PUT'])
def edit_room(room_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    conn = Database.create_connection()
    cursor = conn.cursor()
    if request.method == 'PUT':
        data = request.get_json()
        conn.close()
        return Admin.editRoom(
            room_id, data['room_type'], data['capacity'],
            data['price_per_night'], data.get('availability_status', True),
            data.get('property_id')
        )
    cursor.execute("""
        SELECT r.*, p.property_id
        FROM "ROOMS" r
        JOIN "PROPERTIES" p ON r.property_id = p.property_id
        WHERE r.room_id = %s
    """, (room_id,))
    room = cursor.fetchone()
    conn.close()
    if not room:
        return jsonify({"status": "error", "message": "Room not found."}), 404
    return jsonify({"room": dict(room)})

if __name__ == '__main__':
    app.run(debug=True)
