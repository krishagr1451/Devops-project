# SQL Commands Documentation

This document centralizes the SQL queries used in the StayNGo Flask application. The application uses **PostgreSQL** (hosted on Supabase) and `psycopg2` for database interaction.

## 🗄️ Database Table Standards
- **Case Sensitivity**: All table and column names are defined in **UPPERCASE** and should be referenced using double quotes in queries (e.g., `"USERS"`).
- **Primary Keys**: Auto-incrementing using the `SERIAL` type.
- **Relationships**: Foreign keys are used with `ON DELETE CASCADE` for data integrity.

---

## 🔍 Queries by Module

### 1. User Management

#### Register New User
Linked with Supabase Auth via `auth_id`.
```sql
INSERT INTO "USERS" (name, email, role, phone_number, auth_id) 
VALUES (%s, %s, %s, %s, %s);
```

#### User Login
```sql
SELECT * FROM "USERS" 
WHERE auth_id = %s AND role = %s;
```

---

### 2. Property & Room Management

#### Add Property
```sql
INSERT INTO "PROPERTIES" 
(owner_id, address, city, state, country, description, image_url, image_description)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
RETURNING property_id;
```

#### Update Property
```sql
UPDATE "PROPERTIES" 
SET address = %s, city = %s, state = %s, country = %s,
    description = %s, image_url = %s, image_description = %s
WHERE property_id = %s AND owner_id = %s;
```

#### Delete Property
*Note: Associated rooms and amenities are deleted via CASCADE.*
```sql
DELETE FROM "PROPERTIES" 
WHERE property_id = %s AND owner_id = %s;
```

#### Add Room
```sql
INSERT INTO "ROOMS" (property_id, room_type, capacity, price_per_night, availability_status)
VALUES (%s, %s, %s, %s, %s);
```

#### Room Availability Status (Admin Dashboard)
Dynamic check for current bookings.
```sql
SELECT r.room_id, r.room_type, r.capacity, r.price_per_night,
       EXISTS (
           SELECT 1 FROM "BOOKINGS" b 
           WHERE b.room_id = r.room_id 
             AND b.check_out_date > CURRENT_DATE 
             AND b.check_in_date <= CURRENT_DATE
       ) AS is_booked
FROM "ROOMS" r
WHERE r.property_id = %s;
```

---

### 3. Bookings & Payments

#### Check for Overlapping Bookings
Used to prevent double-booking before insertion.
```sql
SELECT booking_id FROM "BOOKINGS" 
WHERE room_id = %s 
  AND check_in_date < %s 
  AND check_out_date > %s;
```

#### Create Booking
```sql
INSERT INTO "BOOKINGS" (user_id, room_id, check_in_date, check_out_date, total_price, created_at, updated_at)
VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
RETURNING booking_id;
```

#### Record Payment
```sql
INSERT INTO "PAYMENTS" (booking_id, payment_method, amount, payment_status, payment_date)
VALUES (%s, %s, %s, 'completed', NOW());
```

---

### 4. Reviews

#### Fetch Reviews with User Data
```sql
SELECT r.rating, r.comment, u.name AS user_name, r.created_at
FROM "REVIEWS" r
JOIN "USERS" u ON r.user_id = u.user_id
WHERE r.room_id = %s
ORDER BY r.created_at DESC;
```

---

### 5. Automated Scheduler (Background)

#### Update Expired Access
Bulk update room availability based on check-out dates.
```sql
-- Step 1: Find expired bookings
SELECT room_id FROM "BOOKINGS" WHERE check_out_date <= CURRENT_DATE;

-- Step 2: Release rooms
UPDATE "ROOMS" SET availability_status = TRUE WHERE room_id = %s;
```

---

## 🛠️ Implementation Details

### Parameterized Queries
All values are passed via `psycopg2` placeholders `%s` to prevent SQL injection.
```python
cursor.execute('SELECT * FROM "USERS" WHERE email=%s', (email,))
```

### Connection Pool
Connections are created with `sslmode="require"` for secure Supabase PostgreSQL access.
```python
psycopg2.connect(
    host=os.getenv("DB_HOST"),
    sslmode="require",
    cursor_factory=psycopg2.extras.RealDictCursor
)
```
