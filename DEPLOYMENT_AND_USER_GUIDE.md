# ⚡ GYMHQ — Production Deployment & Gym Owner's Operational Guide

A complete, production-ready guide for deploying and operating the **GYMHQ** gym management platform.

---

## 📑 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Deploy-Ready Quickstart (Docker Compose)](#deploy-ready-quickstart-docker-compose)
3. [Manual Production Deployment (VPS / Cloud Server)](#manual-production-deployment-vps--cloud-server)
4. [Domain & SSL Setup (HTTPS)](#domain--ssl-setup-https)
5. [Automated Database Backups](#automated-database-backups)
6. [Gym Owner's Daily Operational Guide](#gym-owners-daily-operational-guide)
   - [Athlete Enrollment & Plans](#1-athlete-enrollment--plans)
   - [Daily Front-Desk Check-In Routine](#2-daily-front-desk-check-in-routine)
   - [Recording Fee Payments & Receipts](#3-recording-fee-payments--receipts)
   - [Dues Reconciliation & WhatsApp Reminders](#4-dues-reconciliation--whatsapp-reminders)
   - [Non-Destructive Renewals](#5-non-destructive-renewals)
   - [Reports & CSV Financial Audits](#6-reports--csv-financial-audits)

---

## 🏢 System Architecture Overview

```
                          ┌──────────────────────────┐
                          │   Internet / Gym Desk    │
                          └────────────┬─────────────┘
                                       │ Port 80 / 443
                                       ▼
                     ┌───────────────────────────────────┐
                     │          Nginx Web Server         │
                     │  - Serves React SPA (HTML/JS/CSS) │
                     │  - Proxies /api/ to FastAPI       │
                     └─────────────────┬─────────────────┘
                                       │ Port 8000
                                       ▼
                     ┌───────────────────────────────────┐
                     │          FastAPI Backend          │
                     │  - JWT Bearer Authentication      │
                     │  - Member / Attendance / Payments │
                     │  - Reports & CSV Generator        │
                     └─────────────────┬─────────────────┘
                                       │ Port 5432
                                       ▼
                     ┌───────────────────────────────────┐
                     │        PostgreSQL Database        │
                     │  - Persistent Volume              │
                     │  - ACID Transactions              │
                     └───────────────────────────────────┘
```

---

## 🚀 Deploy-Ready Quickstart (Docker Compose)

GYMHQ includes production Docker configurations for 1-command deployment on any Linux server, macOS, or Windows machine.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Step 1: Clone or Copy Repository to Server

```bash
git clone <your-repository-url> /opt/gymhq
cd /opt/gymhq
```

### Step 2: Configure Environment Variables

Create `.env` in the root folder:

```bash
cat << 'EOF' > .env
# Database Settings
POSTGRES_USER=gymhq_admin
POSTGRES_PASSWORD=UseAStrongRandomPassword2026!
POSTGRES_DB=gym_management

# Backend Security
SECRET_KEY=generate-a-strong-64-character-jwt-secret-key-here
EOF
```

### Step 3: Launch the Stack

```bash
docker-compose up -d --build
```

### Step 4: Verify Running Services

```bash
docker-compose ps
```

You will see:
- `gymhq_postgres`: PostgreSQL 16 database (port 5432)
- `gymhq_backend`: FastAPI Python server (port 8000)
- `gymhq_frontend`: Nginx serving optimized React client (port 80)

Visit `http://<your-server-ip>` in your browser to access the live GYMHQ platform.

---

## 🛠️ Manual Production Deployment (VPS / Cloud Server)

If deploying directly on an Ubuntu/Debian VPS without Docker:

### 1. System Packages & PostgreSQL

```bash
sudo apt update && sudo apt install -y python3-pip python3-venv postgresql postgresql-contrib nginx git

# Create database and user
sudo -u postgres psql -c "CREATE USER gymhq_admin WITH PASSWORD 'SecurePassword123';"
sudo -u postgres psql -c "CREATE DATABASE gym_management OWNER gymhq_admin;"
```

### 2. Backend Setup & Systemd Service

```bash
cd /opt/gymhq/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations and initial setup
python3 seed_db.py
```

Create a systemd unit file at `/etc/systemd/system/gymhq-backend.service`:

```ini
[Unit]
Description=GYMHQ FastAPI Backend
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/opt/gymhq/backend
Environment="PATH=/opt/gymhq/backend/venv/bin"
EnvironmentFile=/opt/gymhq/backend/.env
ExecStart=/opt/gymhq/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 3

[Install]
WantedBy=multi-user.target
```

Enable and start backend:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gymhq-backend
```

### 3. Frontend Production Build

```bash
cd /opt/gymhq/frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/gymhq/
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/gymhq`:

```nginx
server {
    listen 80;
    server_name yourgymdomain.com;

    root /var/www/gymhq;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/gymhq /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

---

## 🔒 Domain & SSL Setup (HTTPS)

Secure your gym's data with free automated Let's Encrypt SSL certificates:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourgymdomain.com
```

Certbot will automatically configure HTTPS redirects and certificate renewals.

---

## 💾 Automated Database Backups

To protect member records and financial ledgers, configure an automated daily backup:

Create backup script `/usr/local/bin/backup_gymhq.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/gymhq"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

pg_dump -U gymhq_admin -h localhost gym_management | gzip > "$BACKUP_DIR/gymhq_backup_$TIMESTAMP.sql.gz"

# Keep last 30 days only
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
```

Make executable and add to crontab:
```bash
chmod +x /usr/local/bin/backup_gymhq.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup_gymhq.sh") | crontab -
```

---

## 📖 Gym Owner's Daily Operational Guide

### 1. Athlete Enrollment & Plans
- Navigate to **Athletes & Members** → **+ Add New Member**.
- Input the athlete's **Full Name** and **Phone Number** (unique identifier).
- Select their **Membership Plan**:
  - `Monthly`: 1 month duration
  - `Quarterly`: 3 months duration
  - `Semi-Annual`: 6 months duration
  - `Annual`: 12 months duration
- The start and end dates automatically adjust. You can customize the fee rate for individual athletes.

### 2. Daily Front-Desk Check-In Routine
- Keep the **Floor Attendance** screen open at the front desk, or use the **Fast Check-In** button in the top navigation bar from any page.
- Choose the athlete from the quick dropdown and click **✓ Log Check-In**.
- **Double-Scan Guard**: If an athlete tries to check in twice on the same calendar day, the system alerts staff and prevents duplicate records.
- The top bar displays live count of athletes training on your floor today.

### 3. Recording Fee Payments & Receipts
- When an athlete pays their dues, go to **Payments & Receipts** → **+ Record Fee Payment**.
- Select the athlete, input the amount, and choose the payment channel:
  - **UPI / QR Scan**: Instant payment via mobile wallet
  - **Card**: Credit or Debit card terminal
  - **Cash**: Direct physical currency
  - **Wire**: Direct bank wire transfer
- Select the **Fee Month** (which month the fee covers, e.g., `2026-10`) and **Payment Date** (the date payment was received).

### 4. Dues Reconciliation & WhatsApp Reminders
- Go to **Dues & Reports** → **Monthly Fees & Dues**.
- Select the month to view:
  - **Expected Fees**: Total fees expected from all active members
  - **Fees Paid**: Total fees actually settled
  - **Outstanding Dues**: Remaining uncollected balance
- For members with unpaid or partial dues, click **💬 Reminder**.
  - This copies a polite message to your clipboard:
    > *"Hi Rahul, this is a friendly reminder from GYMHQ. Your membership fee of ₹1,500.00 for 2026-10 is currently due. Please clear your dues at the front desk or via UPI. Thank you!"*
  - Paste directly into WhatsApp or SMS to notify the member in seconds.

### 5. Non-Destructive Renewals
- When an athlete's membership expires:
  1. Click **Renew** on the Dashboard alerts card or in the Members list.
  2. Select the renewal plan (Monthly, Quarterly, etc.).
  3. The system extends the membership window into the future and sets their status back to **Active**.
  4. **Important**: All previous attendance logs, transaction receipts, and payment histories are permanently preserved.

### 6. Reports & CSV Financial Audits
- For tax accountants or monthly revenue reviews, GYMHQ provides instant CSV exports:
  - **Fee Ledger Export**: Full member-by-member payment and balance breakdown.
  - **Attendance Log Export**: Timestamped record of gym visits.
  - **Collection Summary Export**: Total revenue broken down by payment channel (Cash vs UPI vs Card vs Bank Wire).
