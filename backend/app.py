import os
import uuid
from flask import Flask, request, session, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
# import psycopg2 (Removed - switching to Supabase Client for HTTP compatibility)
# import psycopg2.extras
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
# DATABASE UTILITY (Removed legacy psycopg2 connection)
# ==============================
# All DB operations now use the 'supabase' client defined above.


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
        try:
            # 1. Sign up user inside Supabase Auth
            auth_response = supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            
            # Auth response provides a user object if successful
            user_auth_id = auth_response.user.id
        except Exception as e:
            error_msg = str(e).lower()
            if "already" in error_msg and "registered" in error_msg:
                print("DEBUG: User already in Auth, trying to recover UUID via sign_in...")
                try:
                    # Attempt a sign_in just to get the auth_id (user might be in Auth but missing from DB)
                    login_res = supabase.auth.sign_in_with_password({"email": email, "password": password})
                    user_auth_id = login_res.user.id
                except Exception as login_err:
                    print(f"DEBUG: Recovery sign_in failed: {str(login_err)}")
                    return jsonify({"status": "error", "message": f"User exists in Auth but cannot be recovered. Error: {str(login_err)}"}), 400
            else:
                print(f"DEBUG: Supabase auth sign_up error: {error_msg}")
                return jsonify({"status": "error", "message": f"Supabase auth failed: {error_msg}"}), 400

        # 2. Insert into local USERS table and map to Auth UUID
        try:
            user_data = {
                "name": name,
                "email": email,
                "role": role,
                "phone_number": phone_number,
                "auth_id": user_auth_id
            }
            response = supabase.table('USERS').insert(user_data).execute()
            return jsonify({"status": "success", "message": "Account created successfully! Please log in."})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    @staticmethod
    def login(email, password, role):
        try:
            # 1. Authenticate with Supabase
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            user_auth_id = auth_response.user.id
        except Exception as e:
            print(f"DEBUG: Supabase auth login error: {str(e)}")
            return jsonify({"status": "error", "message": "Login failed. Check your credentials and try again."}), 401

        # 2. Fetch from our linked local table
        try:
            response = supabase.table('USERS').select("*").eq("auth_id", user_auth_id).eq("role", role).execute()
            user_data = response.data[0] if response.data else None
        except Exception as e:
            return jsonify({"status": "error", "message": f"Database fetch failed: {str(e)}"}), 500

        if user_data:
            session.permanent = True
            session['logged_in'] = True
            session['user_id'] = user_data['user_id']
            session['name'] = user_data['name']
            session['role'] = user_data['role']
            # Optionally store Supabase tokens in session if you ever need to access RLS later
            session['access_token'] = auth_response.session.access_token
            return jsonify({
                "status": "success",
                "message": "Logged in successfully.",
                "role": user_data['role'],
                "name": user_data['name'],
                "user_id": user_data['user_id']
            })
        else:
            return jsonify({"status": "error", "message": "Account does not exist with that role."}), 401

    @staticmethod
    def logout():
        session.clear()
        try:
            supabase.auth.sign_out()
        except:
            pass
        return jsonify({"status": "success", "message": "You have been logged out."})


class Admin(User):
    def __init__(self, user_id, name, email, role):
        super().__init__(user_id, name, email, role)

    def addProperty(self, address, city, state, country, description, image_url, image_description):
        try:
            property_data = {
                "owner_id": self.user_id,
                "address": address,
                "city": city,
                "state": state,
                "country": country,
                "description": description,
                "image_url": image_url,
                "image_description": image_description
            }
            response = supabase.table('PROPERTIES').insert(property_data).execute()
            if not response.data:
                return jsonify({"status": "error", "message": "Failed to add property"}), 400
            property_id = response.data[0]['property_id']
            return jsonify({"status": "success", "message": "Property added successfully!", "property_id": property_id})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    def editProperty(self, property_id, address, city, state, country, description, image_url, image_description):
        try:
            update_data = {
                "address": address,
                "city": city,
                "state": state,
                "country": country,
                "description": description,
                "image_url": image_url,
                "image_description": image_description
            }
            response = supabase.table('PROPERTIES')\
                .update(update_data)\
                .eq("property_id", property_id)\
                .eq("owner_id", self.user_id)\
                .execute()
            return jsonify({"status": "success", "message": "Property updated successfully!"})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    def deleteProperty(self, property_id):
        try:
            # Note: We perform deletes sequentially as Supabase client doesn't 
            # support multi-table transactions in one call easily.
            # In production, RLS or DB Triggers would handle cascading deletes.
            supabase.table('ROOMS').delete().eq("property_id", property_id).execute()
            supabase.table('AMENITIES').delete().eq("property_id", property_id).execute()
            response = supabase.table('PROPERTIES')\
                .delete()\
                .eq("property_id", property_id)\
                .eq("owner_id", self.user_id)\
                .execute()
            
            if not response.data:
                return jsonify({"status": "error", "message": "Property not found or no permission."}), 403
            return jsonify({"status": "success", "message": "Property deleted successfully!"})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    def viewDashboard(self):
        try:
            response = supabase.table('PROPERTIES').select("*").eq("owner_id", self.user_id).execute()
            properties = response.data
            return jsonify({"properties": properties, "name": self.name, "role": self.role})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    @staticmethod
    def addAmenity(property_id, name, description):
        try:
            amenity_data = {"property_id": property_id, "name": name, "description": description}
            supabase.table('AMENITIES').insert(amenity_data).execute()
            return jsonify({"status": "success", "message": "Amenity added successfully!"})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    @staticmethod
    def viewAmenities(property_id):
        try:
            response = supabase.table('AMENITIES').select("*").eq("property_id", property_id).execute()
            return response.data
        except Exception:
            return []

    @staticmethod
    def deleteAmenity(amenity_id, property_id):
        try:
            supabase.table('AMENITIES').delete().eq("amenity_id", amenity_id).execute()
            return jsonify({"status": "success", "message": "Amenity deleted successfully!"})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    @staticmethod
    def editAmenity(amenity_id, name, description, property_id):
        try:
            update_data = {"name": name, "description": description}
            supabase.table('AMENITIES').update(update_data).eq("amenity_id", amenity_id).execute()
            return jsonify({"status": "success", "message": "Amenity updated successfully!"})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400
        return property_id

    @staticmethod
    def addRoom(property_id, room_type, capacity, price_per_night, availability_status):
        try:
            room_data = {
                "property_id": property_id,
                "room_type": room_type,
                "capacity": int(capacity),
                "price_per_night": float(price_per_night),
                "availability_status": bool(availability_status)
            }
            supabase.table('ROOMS').insert(room_data).execute()
            return jsonify({"status": "success", "message": "Room added successfully!"})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    @staticmethod
    def viewRooms(property_id):
        try:
            response = supabase.table('ROOMS').select("*").eq("property_id", property_id).execute()
            return response.data
        except Exception:
            return []

    @staticmethod
    def deleteRoom(room_id, property_id):
        try:
            supabase.table('ROOMS').delete().eq("room_id", room_id).execute()
            return jsonify({"status": "success", "message": "Room deleted successfully!"})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    @staticmethod
    def editRoom(room_id, room_type, capacity, price_per_night, availability_status, property_id):
        try:
            update_data = {
                "room_type": room_type,
                "capacity": int(capacity),
                "price_per_night": float(price_per_night),
                "availability_status": bool(availability_status)
            }
            supabase.table('ROOMS').update(update_data).eq("room_id", room_id).execute()
            return jsonify({"status": "success", "message": "Room updated successfully!"})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400
        return property_id

    @staticmethod
    def getRoomStatus(property_id, owner_id):
        try:
            # 1. Fetch property details
            p_res = supabase.table('PROPERTIES').select("*").eq("property_id", property_id).eq("owner_id", owner_id).execute()
            if not p_res.data:
                return None, None
            property_details = p_res.data[0]

            # 2. Fetch rooms
            r_res = supabase.table('ROOMS').select("*").eq("property_id", property_id).execute()
            rooms = r_res.data

            # 3. Fetch active bookings (for room status)
            today = datetime.now().date().isoformat()
            # Find bookings where current date is between check_in and check_out
            b_res = supabase.table('BOOKINGS')\
                .select("room_id")\
                .lte("check_in_date", today)\
                .gt("check_out_date", today)\
                .execute()
            booked_room_ids = {b['room_id'] for b in b_res.data}

            for room in rooms:
                room['is_booked'] = room['room_id'] in booked_room_ids

            return property_details, rooms
        except Exception:
            return None, None
            


class Guest(User):
    def __init__(self, user_id, name, email, role):
        super().__init__(user_id, name, email, role)

    def searchRooms(self):
        try:
            response = supabase.table('PROPERTIES').select("*").execute()
            return jsonify({"properties": response.data, "name": self.name, "role": self.role})
        except Exception:
            return jsonify({"properties": [], "name": self.name, "role": self.role})

    def bookRoom(self, room_id, property_id, check_in_date, check_out_date, payment_method):
        try:
            # 1. Fetch room details
            res = supabase.table('ROOMS').select("*").eq("room_id", room_id).single().execute()
            room = res.data
            if not room or not bool(room['availability_status']):
                return jsonify({"status": "error", "message": "This room is currently turned off by the admin."}), 400

            check_in = datetime.strptime(check_in_date, '%Y-%m-%d')
            check_out = datetime.strptime(check_out_date, '%Y-%m-%d')
            num_days = (check_out - check_in).days
            if num_days <= 0:
                return jsonify({"status": "error", "message": "Invalid date range."}), 400

            # 2. Check for overlaps
            # Overlap logic: existing.check_in < new.check_out AND existing.check_out > new.check_in
            bookings_res = supabase.table('BOOKINGS')\
                .select("booking_id")\
                .eq("room_id", room_id)\
                .lt("check_in_date", check_out_date)\
                .gt("check_out_date", check_in_date)\
                .execute()
            
            if bookings_res.data:
                return jsonify({"status": "error", "message": "Room is already booked for these dates."}), 400

            total_price = num_days * float(room['price_per_night'])

            # 3. Create booking
            booking_data = {
                "user_id": self.user_id,
                "room_id": room_id,
                "check_in_date": check_in_date,
                "check_out_date": check_out_date,
                "total_price": total_price,
            }
            b_res = supabase.table('BOOKINGS').insert(booking_data).execute()
            booking_id = b_res.data[0]['booking_id']

            # 4. Create payment
            payment_data = {
                "booking_id": booking_id,
                "payment_method": payment_method,
                "amount": total_price,
                "payment_status": 'completed',
                "payment_date": datetime.now().isoformat()
            }
            supabase.table('PAYMENTS').insert(payment_data).execute()

            return jsonify({"status": "success", "message": "Booking and payment successful!", "booking_id": booking_id})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    def cancelBooking(self, booking_id):
        try:
            # 1. Verify access
            res = supabase.table('BOOKINGS').select("*").eq("booking_id", booking_id).eq("user_id", self.user_id).execute()
            if not res.data:
                return jsonify({"status": "error", "message": "Booking not found or no permission."}), 404

            # 2. Delete related records
            supabase.table('PAYMENTS').delete().eq("booking_id", booking_id).execute()
            supabase.table('BOOKINGS').delete().eq("booking_id", booking_id).execute()
            return jsonify({"status": "success", "message": "Booking cancelled successfully."})
        except Exception as err:
            return jsonify({"status": "error", "message": str(err)}), 400

    def viewBookings(self):
        try:
            # Use PostgREST's logic to fetch joined data
            # Format: ROOMS(*) fetches the related room, ROOMS(PROPERTIES(*)) fetches the related property
            res = supabase.table('BOOKINGS')\
                .select("*, ROOMS(*, PROPERTIES(*))")\
                .eq("user_id", self.user_id)\
                .execute()
            
            result = []
            for b in res.data:
                # Flatten the data to match the expected frontend format
                room = b.get('ROOMS') or {}
                prop = room.get('PROPERTIES') or {}
                bd = {
                    "booking_id": b['booking_id'],
                    "check_in_date": b['check_in_date'],
                    "check_out_date": b['check_out_date'],
                    "total_price": b['total_price'],
                    "room_type": room.get('room_type'),
                    "address": prop.get('address')
                }
                result.append(bd)
            return jsonify({"bookings": result})
        except Exception as err:
            return jsonify({"bookings": [], "error": str(err)})

    @staticmethod
    def viewPropertyDetails(property_id):
        try:
            # 1. Fetch property, amenities, and rooms in one nested query
            # We can't easily fetch reviews nested under rooms in one call with PostgREST 
            # if the relationship is complex, so we'll fetch property depth 1 first.
            p_res = supabase.table('PROPERTIES')\
                .select("*, AMENITIES(*), ROOMS(*)")\
                .eq("property_id", property_id)\
                .single().execute()
            
            p_data = p_res.data
            amenities = p_data.get('AMENITIES') or []
            rooms = p_data.get('ROOMS') or []
            
            # 2. Fetch reviews for these rooms
            room_ids = [r['room_id'] for r in rooms]
            rev_res = supabase.table('REVIEWS')\
                .select("*, USERS(name)")\
                .in_("room_id", room_ids)\
                .order("created_at", desc=True)\
                .execute()
            
            room_reviews = {str(rid): [] for rid in room_ids}
            for rev in rev_res.data:
                r_id = str(rev['room_id'])
                rev_formatted = {
                    "rating": rev['rating'],
                    "comment": rev['comment'],
                    "user_name": rev.get('USERS', {}).get('name', 'Unknown User'),
                    "created_at": rev['created_at']
                }
                if r_id in room_reviews:
                    room_reviews[r_id].append(rev_formatted)

            # Cleanup the property dictionary to remove nested lists
            clean_p = {k: v for k, v in p_data.items() if k not in ['AMENITIES', 'ROOMS']}
            
            return clean_p, amenities, rooms, room_reviews
        except Exception as e:
            print(f"Error in viewPropertyDetails: {e}")
            return None, [], [], {}

    @staticmethod
    def addReview(room_id, user_id, rating, comment, property_id):
        try:
            review_data = {
                "room_id": room_id,
                "user_id": user_id,
                "rating": int(rating),
                "comment": comment
            }
            supabase.table('REVIEWS').insert(review_data).execute()
            return jsonify({"status": "success", "message": "Your review has been added."})
        except Exception as err:
            return jsonify({"status": "error", "message": "An error occurred. Please try again."}), 400


class Scheduler:
    @staticmethod
    def updateRoomAvailability():
        try:
            today = datetime.now().date().isoformat()
            # Fetch bookings that have ended
            res = supabase.table('BOOKINGS').select("room_id").lte("check_out_date", today).execute()
            expired_room_ids = {b['room_id'] for b in res.data}
            
            if expired_room_ids:
                # Update room availability status
                for rid in expired_room_ids:
                    supabase.table('ROOMS').update({"availability_status": True}).eq("room_id", rid).execute()
                print(f"Updated availability for {len(expired_room_ids)} room(s).")
        except Exception as err:
            print(f"Error updating room availability: {err}")


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

    try:
        res = supabase.table('ROOMS').select("*").eq("room_id", room_id).single().execute()
        room = res.data
        return jsonify({"room": room, "property_id": property_id})
    except Exception:
        return jsonify({"room": None, "property_id": property_id})

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
        print(f"DEBUG: Image upload error: {str(err)}")
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
    try:
        res = supabase.table('PROPERTIES')\
            .select("*")\
            .eq("property_id", property_id)\
            .eq("owner_id", session['user_id'])\
            .single().execute()
        return jsonify({"property": res.data})
    except Exception:
        return jsonify({"property": None})

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
    try:
        res = supabase.table('AMENITIES').select("*").eq("amenity_id", amenity_id).single().execute()
        return jsonify({"amenity": res.data})
    except Exception:
        return jsonify({"amenity": None})

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

    if request.method == 'PUT':
        data = request.get_json()
        return Admin.editRoom(
            room_id, data['room_type'], data['capacity'],
            data['price_per_night'], data.get('availability_status', True),
            data.get('property_id')
        )
    try:
        res = supabase.table('ROOMS').select("*, PROPERTIES(property_id)").eq("room_id", room_id).single().execute()
        return jsonify({"room": res.data})
    except Exception:
        return jsonify({"status": "error", "message": "Room not found."}), 404

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5001))
    app.run(debug=True, port=port)
