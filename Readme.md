# 🏨 StayNGo

StayNGo is a premium, web-based platform designed to address the challenges faced by middle-class and lower-income individuals in accessing affordable temporary lodging, especially when seeking medical care in distant cities. Inspired by the long waiting periods at renowned hospitals like Tata Memorial, StayNGo provides a centralized solution for finding budget-friendly accommodations near essential healthcare services.

---

## 🚀 The Mission

Many patients and their families travel significant distances to access quality healthcare. During lengthy waiting periods (5-7 days or more) for medical appointments or procedures, they require temporary lodging. Conventional options are often prohibitively expensive. StayNGo bridges this gap by offering a transparent, efficient, and affordable marketplace for temporary housing.

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

StayNGo is built on a highly resilient, modern, and containerized microservices architecture:

- **Frontend:** [Next.js](https://nextjs.org/) (React, TypeScript, Tailwind CSS)
- **Backend:** [Flask](https://flask.palletsprojects.com/) (Python) running on heavily-threaded Gunicorn.
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL & Supabase Auth)
- **API Client:** Supabase Python/TypeScript SDKs (HTTP-based for stateless maximum connectivity)
- **Infrastructure:** AWS EC2 (Ubuntu), orchestrated via Terraform & Ansible.
- **CI/CD Pipeline:** Fully automated **Jenkins** pipeline integrated with **SonarQube** and Docker Hub.
- **Containerization:** Docker & Docker Compose V2

---

## 🏗️ Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+ & npm
- Docker (optional for local testing)
- Supabase account (for DB, Auth, and Storage)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create a .env file with:
# SECRET_KEY=your_secret
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key

python app.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Next.js will automatically proxy /api requests to http://localhost:5001 in development mode.
npm run dev
```

### 3. Supabase Configuration
To ensure everything works correctly:
1. **Database**: Execute the schema migration below to create tables linked to Supabase Auth.
2. **Storage**: Create a **Public** bucket named `property-images`.
3. **Policies**: Add an **INSERT** and **SELECT** policy to the bucket to allow image access.

---

## 🌩️ Production CI/CD & Deployment

This project implements a fully automated enterprise-grade CI/CD lifecycle using Jenkins and AWS EC2.

### The Pipeline Architecture
1. **Source Control:** GitHub push triggers Jenkins Webhook.
2. **Code Quality:** Natively runs **SonarQube Scanner** with remote token authorization to enforce code quality gates.
3. **Build Stage:** 
   - Dynamically pulls and invalidates Docker layers (`--no-cache`).
   - Securely injects `NEXT_PUBLIC_` Supabase keys via `.env.production` explicitly isolated for the Next.js static Webpack bundle compilation.
4. **Deploy Stage:** 
   - Builds scalable Docker Images (`mayankc1533262/stayngo-frontend`, `stayngo-backend`).
   - Pushes to Docker Hub.
   - Executes remote SSH deployment commands onto the AWS EC2 Host.
   - Deploys natively using **Docker Compose V2**.

### Production Infrastructure Notes
- **Resilient Backend:** The Flask backend is deployed behind a multi-threaded Gunicorn WSGI server (`--workers 3 --threads 4`) to ensure total immunity against slow-client DDoS (e.g. EC2 Health Checks/Scanners opening empty TCP sockets).
- **Environment Isolation:** Next.js Edge variables are explicitly matched (e.g., `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) and statically burned during Jenkins `npm run build`, successfully decoupling the Docker runtime from the React client.
- **Dynamic Proxying:** Next.js `next.config.ts` dynamically evaluates `NEXT_PUBLIC_API_URL` to flawlessly route Next.js API Routes over the network directly to the backend IP dynamically, bypassing `localhost` Docker networking constraints.

---

## 📊 Database Schema

StayNGo's robust data model is designed for efficiency and scale within Supabase PostgreSQL.

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

-- BOOKINGS & PAYMENTS
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

CREATE TABLE "PAYMENTS" (
    payment_id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'completed',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚙️ Troubleshooting Guide

- **Next.js Supabase Error (`Error: Your project's URL and Key are required`)**:
  Variables prefixed with `NEXT_PUBLIC_` must be available at *build time*. Ensure `frontend/.env.production` is copied inside the scope of the `Dockerfile` and that Jenkins runs the build dynamically with `--no-cache` to force Layer invalidation. Check variable names carefully (e.g. `_ANON_KEY` versus `_PUBLISHABLE_KEY`).
  
- **ECONNREFUSED `127.0.0.1:5001` in Production**:
  Ensure `frontend/next.config.ts` dynamically evaluates `process.env.NEXT_PUBLIC_API_URL`. Hardcoded `localhost` inside a Docker container proxy route points exclusively to itself, freezing backend access.
  
- **Gunicorn Backend Freezes (`WORKER TIMEOUT`)**:
  Occurs when raw TCP scanners open sockets on an exposed port without sending HTTP data. Fix: Scale Gunicorn asynchronously or use threaded workers (`--workers 3 --threads 4`).

---

## 📈 Future Scalability
- **Map Integration:** Visual search via interactive maps.
- **AI Recommendations:** Optimized lodging suggestions based on medical appointment schedules.
