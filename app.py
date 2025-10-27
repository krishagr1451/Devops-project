import os
from flask import Flask, render_template, request, redirect, url_for, session, flash
from dotenv import load_dotenv
import pymysql
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime
from apscheduler.schedulers.background import BackgroundScheduler

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
app.permanent_session_lifetime = timedelta(minutes=10)


# ==============================
# DATABASE CONNECTION UTILITY (Aiven MySQL over TLS)
# ==============================
class Database:
    @staticmethod
    def create_connection():
        ca_path = os.path.join(os.getcwd(), os.getenv("DB_SSL_CA"))
        timeout = 10
        """Establishes a TLS-verified connection to the Aiven MySQL database (PyMySQL)."""
        return pymysql.connect(
            charset="utf8mb4",
            connect_timeout=timeout,
            cursorclass=pymysql.cursors.DictCursor,
            db=os.getenv("DB_NAME"),
            host=os.getenv("DB_HOST"),
            password=str(os.getenv("DB_PASSWORD")),
            read_timeout=timeout,
            port=int(os.getenv("DB_PORT")),
            user=os.getenv("DB_USER"),
            write_timeout=timeout,
            ssl={"ca": ca_path}
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
                "INSERT INTO USERS (name, email, password, role, phone_number) VALUES (%s, %s, %s, %s, %s)",
                (name, email, hashed_password, role, phone_number)
            )
            conn.commit()
            flash("Account created successfully! Please log in.")
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
        finally:
            conn.close()
        return redirect(url_for('home'))

    @staticmethod
    def login(email, password, role):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM USERS WHERE email=%s AND role=%s", (email, role))
        user_data = cursor.fetchone()
        conn.close()

        if user_data and check_password_hash(user_data['password'], password):
            session['logged_in'] = True
            session['user_id'] = user_data['user_id']
            session['name'] = user_data['name']
            session['role'] = user_data['role']
            flash("Logged in successfully.")
            return Admin(user_data['user_id'], user_data['name'], user_data['email'], 'admin') \
                if session['role'] == 'admin' else Guest(user_data['user_id'], user_data['name'], user_data['email'], 'user')
        else:
            flash("Login failed. Check your credentials and try again.")
            return None

    @staticmethod
    def logout():
        session.clear()
        flash("You have been logged out.")
        return redirect(url_for('home'))

class Admin(User):
    def __init__(self, user_id, name, email, role):
        super().__init__(user_id, name, email, role)

    def addProperty(self, address, city, state, country, description, image_url, image_description):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO PROPERTIES 
                (owner_id, address, city, state, country, description, image_url, image_description)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (self.user_id, address, city, state, country, description, image_url, image_description))
            conn.commit()
            property_id = cursor.lastrowid
            flash("Property added successfully! Now add amenities.")
            return property_id
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
            return None
        finally:
            conn.close()

    def editProperty(self, property_id, address, city, state, country, description, image_url, image_description):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE PROPERTIES SET address = %s, city = %s, state = %s, country = %s, 
                description = %s, image_url = %s, image_description = %s
                WHERE property_id = %s AND owner_id = %s
            """, (address, city, state, country, description, image_url, image_description, property_id, self.user_id))
            conn.commit()
            flash("Property updated successfully!")
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
        finally:
            conn.close()

    def deleteProperty(self, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            conn.begin()
            cursor.execute("DELETE FROM ROOMS WHERE property_id = %s", (property_id,))
            cursor.execute("DELETE FROM AMENITIES WHERE property_id = %s", (property_id,))
            cursor.execute("DELETE FROM PROPERTIES WHERE property_id = %s AND owner_id = %s", (property_id, self.user_id))
            if cursor.rowcount == 0:
                conn.rollback()
                flash("Property not found or you don't have permission to delete it.")
            else:
                conn.commit()
                flash("Property and its associated rooms and amenities were deleted successfully!")
        except Exception as err:
            conn.rollback()
            flash(f"Error deleting property: {err}")
        finally:
            conn.close()

    def manageAmenities(self):
        pass

    def manageRooms(self):
        pass

    def viewBookings(self):
        pass

    def viewDashboard(self):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM PROPERTIES WHERE owner_id = %s", (self.user_id,))
        properties = cursor.fetchall()
        conn.close()
        return render_template('dashboard.html', properties=properties, name=self.name, role=self.role)

    @staticmethod
    def addAmenity(property_id, name, description):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO AMENITIES (property_id, name, description) VALUES (%s, %s, %s)",
                           (property_id, name, description))
            conn.commit()
            flash("Amenity added successfully!")
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
        finally:
            conn.close()

    @staticmethod
    def viewAmenities(property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM AMENITIES WHERE property_id = %s", (property_id,))
        amenities = cursor.fetchall()
        conn.close()
        return amenities

    @staticmethod
    def deleteAmenity(amenity_id, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM AMENITIES WHERE amenity_id = %s", (amenity_id,))
            conn.commit()
            flash("Amenity deleted successfully!")
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
        finally:
            conn.close()
        return property_id

    @staticmethod
    def editAmenity(amenity_id, name, description, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("UPDATE AMENITIES SET name = %s, description = %s WHERE amenity_id = %s",
                           (name, description, amenity_id))
            conn.commit()
            flash("Amenity updated successfully!")
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
        finally:
            conn.close()
        return property_id

    @staticmethod
    def addRoom(property_id, room_type, capacity, price_per_night, availability_status):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO ROOMS (property_id, room_type, capacity, price_per_night, availability_status)
                VALUES (%s, %s, %s, %s, %s)
            """, (property_id, room_type, int(capacity), float(price_per_night), 1 if availability_status else 0))
            conn.commit()
            flash("Room added successfully!")
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
        finally:
            conn.close()

    @staticmethod
    def viewRooms(property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ROOMS WHERE property_id = %s", (property_id,))
        rooms = cursor.fetchall()
        conn.close()
        return rooms

    @staticmethod
    def deleteRoom(room_id, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM ROOMS WHERE room_id = %s", (room_id,))
            conn.commit()
            flash("Room deleted successfully!")
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
        finally:
            conn.close()
        return property_id

    @staticmethod
    def editRoom(room_id, room_type, capacity, price_per_night, availability_status, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE ROOMS SET room_type = %s, capacity = %s, 
                price_per_night = %s, availability_status = %s
                WHERE room_id = %s
            """, (room_type, int(capacity), float(price_per_night), 1 if availability_status else 0, room_id))
            conn.commit()
            flash("Room updated successfully!")
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
        finally:
            conn.close()
        return property_id

    @staticmethod
    def getRoomStatus(property_id, owner_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM PROPERTIES WHERE property_id = %s AND owner_id = %s", (property_id, owner_id))
        property_details = cursor.fetchone()
        if not property_details:
            conn.close()
            return None, None

        cursor.execute("""
            SELECT r.room_id, r.room_type, r.capacity, r.price_per_night,
                   CASE WHEN b.booking_id IS NOT NULL THEN 1 ELSE 0 END AS is_booked
            FROM ROOMS r
            LEFT JOIN BOOKINGS b ON r.room_id = b.room_id AND b.check_out_date >= CURDATE()
            WHERE r.property_id = %s
        """, (property_id,))
        rooms = cursor.fetchall()
        conn.close()
        return property_details, rooms

class Guest(User):
    def __init__(self, user_id, name, email, role):
        super().__init__(user_id, name, email, role)

    def searchRooms(self):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM PROPERTIES")
        properties = cursor.fetchall()
        conn.close()
        return render_template('user_dashboard.html', properties=properties, name=self.name, role=self.role)

    def bookRoom(self, room_id, property_id, check_in_date, check_out_date, payment_method):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ROOMS WHERE room_id = %s", (room_id,))
        room = cursor.fetchone()

        if not room or not bool(room['availability_status']):
            flash("This room is currently unavailable.")
            conn.close()
            return redirect(url_for('view_more', property_id=property_id))

        check_in = datetime.strptime(check_in_date, '%Y-%m-%d')
        check_out = datetime.strptime(check_out_date, '%Y-%m-%d')
        num_days = (check_out - check_in).days
        if num_days <= 0:
            flash("Invalid date range.")
            conn.close()
            return redirect(url_for('view_more', property_id=property_id))
        total_price = num_days * float(room['price_per_night'])

        try:
            conn.begin()
            cursor.execute("""
                INSERT INTO BOOKINGS (user_id, room_id, check_in_date, check_out_date, total_price, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """, (self.user_id, room_id, check_in_date, check_out_date, total_price))
            booking_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO PAYMENTS (booking_id, payment_method, amount, payment_status, payment_date)
                VALUES (%s, %s, %s, 'completed', NOW())
            """, (booking_id, payment_method, total_price))

            cursor.execute("UPDATE ROOMS SET availability_status = 0 WHERE room_id = %s", (room_id,))
            conn.commit()
            flash("Booking and payment successful!")
            return redirect(url_for('user_dashboard'))
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
            return redirect(url_for('view_more', property_id=property_id))
        finally:
            conn.close()

    def cancelBooking(self, booking_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT * FROM BOOKINGS WHERE booking_id = %s AND user_id = %s", (booking_id, self.user_id))
            booking = cursor.fetchone()
            if not booking:
                flash("Booking not found or you do not have permission to cancel it.")
                return

            cursor.execute("DELETE FROM PAYMENTS WHERE booking_id = %s", (booking_id,))
            cursor.execute("UPDATE ROOMS SET availability_status = 1 WHERE room_id = %s", (booking['room_id'],))
            cursor.execute("DELETE FROM BOOKINGS WHERE booking_id = %s", (booking_id,))
            conn.commit()
            flash("Booking has been successfully canceled.")
        except Exception as err:
            conn.rollback()
            flash(f"Error: {err}")
        finally:
            conn.close()

    def viewBookings(self):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT b.booking_id, b.check_in_date, b.check_out_date, b.total_price, r.room_type, p.address 
            FROM BOOKINGS b
            JOIN ROOMS r ON b.room_id = r.room_id
            JOIN PROPERTIES p ON r.property_id = p.property_id
            WHERE b.user_id = %s
        """, (self.user_id,))
        bookings = cursor.fetchall()
        conn.close()
        return render_template('my_bookings.html', bookings=bookings)

    @staticmethod
    def viewPropertyDetails(property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM PROPERTIES WHERE property_id = %s", (property_id,))
        property_details = cursor.fetchone()
        cursor.execute("SELECT * FROM AMENITIES WHERE property_id = %s", (property_id,))
        amenities = cursor.fetchall()
        cursor.execute("SELECT * FROM ROOMS WHERE property_id = %s", (property_id,))
        rooms = cursor.fetchall()

        room_reviews = {}
        for room in rooms:
            cursor.execute("""
                SELECT r.rating, r.comment, u.name AS user_name, r.created_at
                FROM REVIEWS r
                JOIN USERS u ON r.user_id = u.user_id
                WHERE r.room_id = %s
                ORDER BY r.created_at DESC
            """, (room['room_id'],))
            room_reviews[room['room_id']] = cursor.fetchall()

        conn.close()
        return property_details, amenities, rooms, room_reviews

    @staticmethod
    def addReview(room_id, user_id, rating, comment, property_id):
        conn = Database.create_connection()
        cursor = conn.cursor()
        now = datetime.now()
        try:
            cursor.execute("""
                INSERT INTO REVIEWS (room_id, user_id, rating, comment, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (room_id, user_id, int(rating), comment, now, now))
            conn.commit()
            flash("Your review has been added.")
        except Exception:
            conn.rollback()
            flash("An error occurred. Please try again.")
        finally:
            conn.close()
        return property_id

class Scheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        try:
            self.scheduler.start()
        except Exception as e:
            print(f"Failed to start the scheduler: {e}")
        self.scheduler.add_job(func=self.updateRoomAvailability, trigger="interval", hours=1)

    @staticmethod
    def updateRoomAvailability():
        conn = Database.create_connection()
        cursor = conn.cursor()
        current_time = datetime.now()
        try:
            cursor.execute("SELECT room_id FROM BOOKINGS WHERE check_out_date <= %s", (current_time.date(),))
            expired_bookings = cursor.fetchall()
            for booking in expired_bookings:
                cursor.execute("UPDATE ROOMS SET availability_status = 1 WHERE room_id = %s", (booking['room_id'],))
            if expired_bookings:
                conn.commit()
                print(f"Updated availability for {len(expired_bookings)} room(s).")
        except Exception as err:
            conn.rollback()
            print(f"Error updating room availability: {err}")
        finally:
            conn.close()

    def shutdown(self):
        try:
            if self.scheduler.running:
                self.scheduler.shutdown()
        except Exception:
            pass

# Initialize Scheduler
scheduler_instance = Scheduler()

# ==============================
# ROUTES USING OOP
# ==============================
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    return User.register(
        request.form['name'],
        request.form['email'],
        request.form['password'],
        request.form['role'],
        request.form['phone_number']
    )

@app.route('/login', methods=['POST'])
def login():
    user = User.login(request.form['email'], request.form['password'], request.form['role'])
    if user and user.role == 'admin':
        return redirect(url_for('dashboard'))
    elif user and user.role == 'user':
        return redirect(url_for('user_dashboard'))
    return redirect(url_for('home'))

@app.route('/dashboard')
def dashboard():
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    admin = Admin(session['user_id'], session['name'], None, 'admin')
    return admin.viewDashboard()

@app.route('/user_dashboard')
def user_dashboard():
    if 'logged_in' not in session or session['role'] != 'user':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    guest = Guest(session['user_id'], session['name'], None, 'user')
    return guest.searchRooms()

@app.route('/book_room/<int:room_id>/<int:property_id>', methods=['GET', 'POST'])
def book_room(room_id, property_id):
    if 'logged_in' not in session or session['role'] != 'user':
        flash("Please log in to make a booking.")
        return redirect(url_for('home'))

    if request.method == 'POST':
        guest = Guest(session['user_id'], session['name'], None, 'user')
        return guest.bookRoom(
            room_id, property_id,
            request.form['check_in_date'],
            request.form['check_out_date'],
            request.form['payment_method']
        )

    conn = Database.create_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ROOMS WHERE room_id = %s", (room_id,))
    room = cursor.fetchone()
    conn.close()
    return render_template('booking.html', room=room, property_id=property_id)

@app.route('/room_status/<int:property_id>')
def room_status(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))

    property_details, rooms = Admin.getRoomStatus(property_id, session['user_id'])
    if not property_details:
        flash("Property not found or you do not have permission to view it.")
        return redirect(url_for('dashboard'))
    return render_template('room_status.html', property=property_details, rooms=rooms)

@app.route('/view_more/<int:property_id>')
def view_more(property_id):
    if 'logged_in' not in session or session['role'] != 'user':
        flash("Unauthorized access.")
        return redirect(url_for('home'))

    property_details, amenities, rooms, room_reviews = Guest.viewPropertyDetails(property_id)
    return render_template('view_more.html', property=property_details, amenities=amenities,
                           rooms=rooms, room_reviews=room_reviews)

@app.route('/add_review/<int:room_id>', methods=['POST'])
def add_review(room_id):
    if 'user_id' not in session:
        flash("Please log in to leave a review.")
        return redirect(url_for('home'))

    property_id = Guest.addReview(
        room_id, session['user_id'],
        int(request.form['rating']),
        request.form['comment'],
        request.form.get('property_id')
    )
    return redirect(url_for('view_more', property_id=property_id))

@app.route('/my_bookings')
def my_bookings():
    if 'logged_in' not in session or session['role'] != 'user':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    guest = Guest(session['user_id'], session['name'], None, 'user')
    return guest.viewBookings()

@app.route('/cancel_booking/<int:booking_id>', methods=['POST'])
def cancel_booking(booking_id):
    if 'logged_in' not in session or session['role'] != 'user':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    guest = Guest(session['user_id'], session['name'], None, 'user')
    guest.cancelBooking(booking_id)
    return redirect(url_for('my_bookings'))

@app.route('/delete_property/<int:property_id>', methods=['POST'])
def delete_property(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    admin = Admin(session['user_id'], session['name'], None, 'admin')
    admin.deleteProperty(property_id)
    return redirect(url_for('dashboard'))

@app.route('/add_property', methods=['GET', 'POST'])
def add_property():
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    if request.method == 'POST':
        admin = Admin(session['user_id'], session['name'], None, 'admin')
        property_id = admin.addProperty(
            request.form['address'], request.form['city'], request.form['state'], request.form['country'],
            request.form['description'], request.form['image_url'], request.form['image_description']
        )
        if property_id:
            return redirect(url_for('add_amenities', property_id=property_id))
    return render_template('add_property.html')

@app.route('/add_amenities/<int:property_id>', methods=['GET', 'POST'])
def add_amenities(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    if request.method == 'POST':
        Admin.addAmenity(property_id, request.form['amenity_name'], request.form['amenity_description'])
        return redirect(url_for('add_amenities', property_id=property_id))
    return render_template('add_amenities.html', property_id=property_id)

@app.route('/edit_property/<int:property_id>', methods=['GET', 'POST'])
def edit_property(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    admin = Admin(session['user_id'], session['name'], None, 'admin')
    if request.method == 'POST':
        admin.editProperty(property_id,
                           request.form['address'], request.form['city'], request.form['state'], request.form['country'],
                           request.form['description'], request.form['image_url'], request.form['image_description'])
        return redirect(url_for('dashboard'))

    conn = Database.create_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM PROPERTIES WHERE property_id = %s AND owner_id = %s", (property_id, session['user_id']))
    property_row = cursor.fetchone()
    conn.close()
    return render_template('edit_property.html', property=property_row)

@app.route('/view_amenities/<int:property_id>')
def view_amenities(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    amenities = Admin.viewAmenities(property_id)
    return render_template('view_amenities.html', amenities=amenities, property_id=property_id)

@app.route('/delete_amenity/<int:amenity_id>', methods=['POST'])
def delete_amenity(amenity_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    property_id = Admin.deleteAmenity(amenity_id, request.form['property_id'])
    return redirect(url_for('view_amenities', property_id=property_id))

@app.route('/edit_amenity/<int:amenity_id>', methods=['GET', 'POST'])
def edit_amenity(amenity_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    if request.method == 'POST':
        property_id = Admin.editAmenity(amenity_id, request.form['amenity_name'], request.form['amenity_description'],
                                        request.form.get('property_id'))
        return redirect(url_for('view_amenities', property_id=property_id))

    conn = Database.create_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM AMENITIES WHERE amenity_id = %s", (amenity_id,))
    amenity = cursor.fetchone()
    conn.close()
    return render_template('edit_amenity.html', amenity=amenity)

@app.route('/view_rooms/<int:property_id>')
def view_rooms(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    rooms = Admin.viewRooms(property_id)
    return render_template('view_rooms.html', rooms=rooms, property_id=property_id)

@app.route('/delete_room/<int:room_id>', methods=['POST'])
def delete_room(room_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))

    property_id = request.form.get('property_id')
    if not property_id:
        flash("Property ID missing.")
        return redirect(url_for('dashboard'))

    property_id = Admin.deleteRoom(room_id, property_id)
    return redirect(url_for('view_rooms', property_id=property_id))

@app.route('/add_room/<int:property_id>', methods=['GET', 'POST'])
def add_room(property_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))
    if request.method == 'POST':
        Admin.addRoom(property_id,
                      request.form['room_type'],
                      request.form['capacity'],
                      request.form['price_per_night'],
                      request.form.get('availability_status') == 'on')
        return redirect(url_for('view_rooms', property_id=property_id))
    return render_template('add_rooms.html', property_id=property_id)

@app.route('/edit_room/<int:room_id>', methods=['GET', 'POST'])
def edit_room(room_id):
    if 'logged_in' not in session or session['role'] != 'admin':
        flash("Unauthorized access.")
        return redirect(url_for('home'))

    conn = Database.create_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        property_id = request.form.get('property_id')
        if not property_id:
            flash("Property ID is missing.")
            conn.close()
            return redirect(url_for('dashboard'))

        availability_status = request.form.get('availability_status') == 'on'
        property_id = Admin.editRoom(
            room_id,
            request.form['room_type'],
            request.form['capacity'],
            request.form['price_per_night'],
            availability_status,
            property_id
        )
        conn.close()
        return redirect(url_for('view_rooms', property_id=property_id))

    cursor.execute("""
        SELECT r.*, p.property_id 
        FROM ROOMS r 
        JOIN PROPERTIES p ON r.property_id = p.property_id 
        WHERE r.room_id = %s
    """, (room_id,))
    room = cursor.fetchone()
    conn.close()

    if not room:
        flash("Room not found.")
        return redirect(url_for('dashboard'))

    return render_template('edit_rooms.html', room=room)

@app.route('/logout')
def logout():
    return User.logout()

@app.teardown_appcontext
def shutdown_scheduler(exception=None):
    scheduler_instance.shutdown()

if __name__ == '__main__':
    # PyMySQL installs as MySQLdb-compatible only if imported, but here we directly use pymysql.
    app.run(debug=True)

