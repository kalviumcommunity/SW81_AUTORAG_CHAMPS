# 🚗 AuraAutomotiveOS - Enterprise Service Intelligence Platform

**AuraAutomotiveOS** is a production-grade, AI-powered intelligent automotive service operating system designed for modern workshops, dealership service departments, and fleet maintenance teams. It features a high-performance **Python FastAPI** backend, a **React + TypeScript** frontend, persistent **SQLite** database isolation, and a domain-guarded **Retrieval-Augmented Generation (RAG)** engine for OEM service manual citations and diagnostic troubleshooting.

---

## 🌟 Key Platform Features

* **🔒 Role-Based Access & Security**: Clean separation between **Technician** and **Manager** public workflows. **Super Admin** access is strictly hidden behind a secure secret gate (3-click logo easter egg, PIN `8899`, or `/super-admin`).
* **⚡ Python FastAPI Backend**: Fast, asynchronous REST API with JWT authentication, CORS support, password hashing, and user-isolated database sessions (`auraos.db`).
* **🔍 Automotive RAG Vector Search Engine**:
  * **Automotive Domain Guardrails**: Intercepts and gracefully rejects non-automotive queries (e.g., *"What is the song?"*).
  * **Token-Aware Chunking & 128D Vector Embeddings**: Pre-computed TF-IDF frequency embeddings for precise OEM manual retrieval.
  * **Grounded Generation & Citation Badges**: Answers queries with explicit `[Citation #1]` badges and citation inspection drawers.
* **📷 Dynamic VIN Scanner & OBD-II Pairing**:
  * 17-character VIN decoder supporting Honda, Toyota, Ford, BMW, Chevrolet, and Tesla OEM specifications.
  * OBD-II diagnostic tool pairing modal with real-time ECU DTC clearing.
* **📊 Live Technician ↔ Manager Field Sync**:
  * Technicians can complete repair steps and click **"✓ Complete Job"**.
  * Managers monitor real-time active field sessions and completion status on the **Live Command Center Overseer**.
* **🎫 Integrated Support Center**: Helpdesk page (`/support`) with FAQ accordion and support ticket logging.

---

## 🔑 Pre-Seeded Credentials & Access Gates

| Role | Email | Password | Access / Route |
| :--- | :--- | :--- | :--- |
| **Technician** | `alex.reyes@auraos.io` | `Tech@2026!` | Standard Login (`/`) ➔ `/technician-dashboard` |
| **Manager** | `sarah.kim@auraos.io` | `Mgr@2026!` | Standard Login (`/`) ➔ `/manager-portal` |
| **Super Admin** | `admin.master@auraos.io` | `AdminMaster@2026!` | **Secret Gate**: 3-click logo, PIN `8899`, or `/#/super-admin` |

---

## 🛠️ Tech Stack Architecture

### Frontend
* **Framework**: React 18 with TypeScript
* **Router**: React Router DOM v6
* **Styling**: Tailwind CSS with custom dark mode theme
* **Icons & Notifications**: Lucide React & Sonner Toasts
* **Build Tool**: Vite v5

### Backend
* **Language & Server**: Python 3.10+ / FastAPI + Uvicorn
* **Authentication**: PyJWT & bcrypt password hashing
* **Database**: SQLite3 (`auraos.db`) with dynamic column migrations
* **AI & RAG Core**: Frequency vector embeddings, cosine distance similarity search, token estimation, cost matrix, and domain intent classifier

---

## 🚀 How to Run the Project

### Prerequisites
* **Python**: `Python 3.10` or higher installed
* **Node.js**: `Node.js 18` or higher installed

### Step 1: Install Dependencies

1. **Python Backend Packages**:
   ```bash
   pip install fastapi uvicorn pyjwt passlib bcrypt python-multipart
   ```

2. **Frontend Packages**:
   ```bash
   npm install
   ```

---

### Step 2: Start the Python Backend Server

Run the Python FastAPI server on port `5000`:

```bash
python -m uvicorn server.main:app --port 5000 --host 0.0.0.0
```

> The server will automatically initialize `auraos.db` and seed demo users, documents, and RAG vector chunks.
> *API Base URL*: `http://localhost:5000/`

---

### Step 3: Start the Frontend Application

You can run either the Vite development server or production preview server:

* **Production Build & Preview (Port 4173)**:
  ```bash
  npx vite build
  npx vite preview --port 4173 --host
  ```

* **Development Server (Port 5173)**:
  ```bash
  npm run dev
  ```

> Open your browser and navigate to: **`http://localhost:4173/`** or **`http://localhost:5173/`**

---

## 🔄 End-to-End Role Workflows

### 1. 🔧 Technician Workflow
1. Log in on the public sign-in form as **Technician** (`alex.reyes@auraos.io`).
2. Click **Scan New VIN** or select a pre-existing VIN to decode vehicle specifications and initiate a persistent diagnostic session in `auraos.db`.
3. Click **Pair OBD Scanner** to connect a diagnostic tool (Bluetooth LE, WiFi, USB, CAN).
4. Navigate to **Diagnostic Hub** to query OEM manuals or use **Repair Guide** for step-by-step repair procedures.
5. Click **Clear DTC Codes** to clear ECU errors.
6. Click **✓ Complete Job** to finalize the work order and update the Manager Portal in real-time.

### 2. 📊 Manager Workflow
1. Log in on the public sign-in form as **Manager** (`sarah.kim@auraos.io`).
2. View **Command Center** for published document metrics and the **Live Technician Field Sessions & Job Completion Status** table.
3. Go to **Knowledge Base Upload** to drag-and-drop PDF/DOCX manuals, tag metadata (Make, Model, Year, DocType), and trigger RAG vector indexing.
4. View **Audit Panel** to inspect user actions, uploads, and system events.

### 3. 👑 Super Admin Command Center (Restricted Access)
1. **To Access**:
   * Click the **AuraOS** logo in the header 3 times in rapid succession.
   * Or navigate directly to `http://localhost:4173/#/super-admin`.
2. Enter the Master Security PIN: **`8899`**.
3. **Features**:
   * **Live System Health**: View Node/Python uptime, heap memory usage, SQLite file size, and RAG token expenditure ($).
   * **User Governance**: Change user roles (`technician`, `manager`, `super_admin`) or delete accounts.
   * **RAG Overseer**: Re-index vector chunks on demand.
   * **Emergency Maintenance**: Toggle system maintenance mode.
   * **CSV Audit Export**: Export full database audit logs as a downloadable CSV.

### 4. 🎫 Support Center & Helpdesk
1. Click **Support** in the collapsible sidebar or footer link (`/#/support`).
2. Search common diagnostic questions in the **FAQ Accordion**.
3. Fill out the **Support Ticket** form to send issues (`OEM Manual Request`, `DTC Assistance`, `Compliance Escalation`) directly to the Python backend.

---

## 📡 Key API Reference Cheat-Sheet

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticates user & issues JWT token |
| `POST` | `/api/auth/signup` | Registers a new technician or manager |
| `GET` | `/api/sessions/active` | Fetches active diagnostic session for user email |
| `GET` | `/api/sessions/all` | Fetches all technician sessions for Manager oversight |
| `POST` | `/api/sessions` | Initiates new vehicle diagnostic session |
| `PATCH` | `/api/sessions/{id}` | Updates session status, completed steps, or DTC state |
| `POST` | `/api/vin/decode` | Decodes 17-character VIN into vehicle specifications |
| `GET` | `/api/devices` | Lists paired OBD-II diagnostic devices for user |
| `POST` | `/api/devices` | Pairs a new OBD-II diagnostic scanner |
| `POST` | `/api/rag/grounded-prompt` | Executes vector search & checks **Automotive Guardrails** |
| `GET` | `/api/documents` | Lists all indexed service manuals with search filters |
| `POST` | `/api/documents/upload` | Uploads OEM manual & generates 128D RAG vector chunks |
| `POST` | `/api/support/tickets` | Creates a new technical helpdesk support ticket |
| `GET` | `/api/admin/system-health` | Retrieves Super Admin telemetry & database file stats |
| `PATCH` | `/api/admin/users/{id}/role` | Updates user access role in database |

---

## 🔒 Security & Persistence Notes

* **Local Database Storage**: All application data is stored in `auraos.db` at the project root.
* **Session Persistence**: Login tokens and active profiles are synchronized across `localStorage` and `sessionStorage`, ensuring page reloads never lose session state.

---

*© 2026 AuraAutomotiveOS · Intelligent Automotive Diagnostics & Operating System*
