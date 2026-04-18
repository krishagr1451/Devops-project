# StayNGo

StayNGo is a premium, web-based platform designed to address the challenges faced by middle-class and lower-income individuals in accessing affordable temporary lodging, especially when seeking medical care in distant cities. Inspired by the long waiting periods at renowned hospitals like Tata Memorial, StayNGo provides a centralized solution for finding budget-friendly accommodations near essential healthcare services.

---

## 🚀 The Mission

Many patients and their families travel significant distances to access quality healthcare. During lengthy waiting periods (5-7 days or more) for medical appointments or procedures, they require temporary lodging. conventional options are often prohibitively expensive. StayNGo bridges this gap by offering a transparent, efficient, and affordable marketplace for temporary housing.

---

## ✨ Key Features

- **Affordable Rentals:** Curated listings focusing on cost-effectiveness for long-term recovery stays.
- **Smart Filtering:** Search by proximity to specific hospitals, budget, and essential amenities (kitchen, Wi-Fi, laundry).
- **Comprehensive Reviews:** User-driven ratings and comments to ensure transparency and trust.
- **Admin Dashboard:** Effortless management of properties, rooms, and amenities for property owners.
- **Integrated Payments:** Secure booking and payment tracking within the platform.
- **Automated Scheduling:** Real-time availability updates powered by a backend scheduler.

---

## 🛠️ Technology Stack

StayNGo uses a modern, scalable architecture:

- **Frontend:** [Next.js](https://nextjs.org/) (React, TypeScript, Tailwind CSS)
- **Backend:** [Flask](https://flask.palletsprojects.com/) (Python)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (Hosted on Supabase)
- **Authentication:** [Supabase Auth](https://supabase.com/auth)
- **Storage:** [Supabase Storage](https://supabase.com/storage) (for property images)

---

## 🏗️ Getting Started

### Prerequisites
- Python 3.x
- Node.js & npm
- Supabase account (for DB, Auth, and Storage)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Create a .env file with:
# SECRET_KEY=your_secret
# DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME
# SUPABASE_URL, SUPABASE_KEY
python app.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Create a .env file with backend API URL
npm run dev
```

---

## 📊 Database Schema

StayNGo's robust data model is designed for efficiency and scale.

```sql
-- USERS table (Integrated with Supabase Auth)
CREATE TABLE "USERS" (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'admin', 'user'
    phone_number VARCHAR(15),
    auth_id UUID UNIQUE, -- Linked to Supabase auth.users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROPERTIES table
CREATE TABLE "PROPERTIES" (
    property_id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES "USERS"(user_id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    image_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROOMS table
CREATE TABLE "ROOMS" (
    room_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES "PROPERTIES"(property_id) ON DELETE CASCADE,
    room_type VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL,
    availability_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AMENITIES table
CREATE TABLE "AMENITIES" (
    amenity_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES "PROPERTIES"(property_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOOKINGS table
CREATE TABLE "BOOKINGS" (
    booking_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES "USERS"(user_id) ON DELETE CASCADE,
    room_id INT REFERENCES "ROOMS"(room_id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAYMENTS table
CREATE TABLE "PAYMENTS" (
    payment_id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'completed',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REVIEWS table
CREATE TABLE "REVIEWS" (
    review_id SERIAL PRIMARY KEY,
    room_id INT REFERENCES "ROOMS"(room_id) ON DELETE CASCADE,
    user_id INT REFERENCES "USERS"(user_id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📈 Future Scalability

StayNGo is built to expand. The modular architecture allows for easy addition of:
- **Map Integration:** Visual search via interactive maps.
- **Multi-lingual Support:** To serve a diverse waitlist of patients.
- **AI Recommendations:** Optimized lodging suggestions based on medical appointment schedules.
