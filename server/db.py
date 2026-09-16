import os
import time
import json
import sqlite3
from datetime import datetime
import bcrypt

# Attempt importing psycopg2 for PostgreSQL support
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

DB_PATH = os.path.join(os.path.dirname(__file__), "../auraos.db")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "../uploads")

if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR, exist_ok=True)

# Load environment variables from .env if present
def load_env():
    for env_path in [os.path.join(os.path.dirname(__file__), "../.env"), os.path.join(os.path.dirname(__file__), ".env")]:
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip()

load_env()

# Connection environment variables
PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = os.getenv("POSTGRES_PORT", "5432")
PG_DB = os.getenv("POSTGRES_DB", "auraos_db")
PG_USER = os.getenv("POSTGRES_USER", "postgres")
PG_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")

# Global engine state
DB_ENGINE = "sqlite"

class DBConnectionWrapper:
    def __init__(self, mode="sqlite", conn=None):
        self.mode = mode
        self.conn = conn

    def cursor(self):
        return DBCursorWrapper(self.mode, self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

class DBCursorWrapper:
    def __init__(self, mode, cursor):
        self.mode = mode
        self.cursor = cursor
        self.lastrowid = None

    def execute(self, sql, params=()):
        # Convert SQLite ? parameter placeholder to PostgreSQL %s if in postgres mode
        if self.mode == "postgres":
            pg_sql = sql.replace("?", "%s")

            # Replace SQLite AUTOINCREMENT / rowid logic for PostgreSQL
            if "INSERT INTO" in pg_sql and "RETURNING" not in pg_sql:
                # Add RETURNING id if id column exists
                if "users" in pg_sql or "documents" in pg_sql or "audit_logs" in pg_sql or "support_tickets" in pg_sql or "diagnostics" in pg_sql or "feedback" in pg_sql or "document_chunks" in pg_sql:
                    pg_sql += " RETURNING id"

            self.cursor.execute(pg_sql, params)
            if "RETURNING id" in pg_sql:
                try:
                    res = self.cursor.fetchone()
                    if res:
                        self.lastrowid = res[0] if isinstance(res, (tuple, list)) else res.get("id")
                except Exception:
                    pass
        else:
            self.cursor.execute(sql, params)
            self.lastrowid = getattr(self.cursor, "lastrowid", None)
        return self

    def executemany(self, sql, params_list):
        if self.mode == "postgres":
            pg_sql = sql.replace("?", "%s")
            self.cursor.executemany(pg_sql, params_list)
        else:
            self.cursor.executemany(sql, params_list)
        return self

    def executescript(self, script_sql):
        if self.mode == "postgres":
            # Split and execute individual statements for PostgreSQL
            statements = script_sql.split(";")
            for stmt in statements:
                stmt_clean = stmt.strip()
                if stmt_clean:
                    pg_stmt = stmt_clean.replace("DATETIME DEFAULT CURRENT_TIMESTAMP", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
                    pg_stmt = pg_stmt.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
                    try:
                        self.cursor.execute(pg_stmt)
                    except Exception as e:
                        pass
        else:
            self.cursor.executescript(script_sql)

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        if isinstance(row, dict) or isinstance(row, sqlite3.Row):
            return dict(row)
        if hasattr(self.cursor, "description"):
            colnames = [desc[0] for desc in self.cursor.description]
            return dict(zip(colnames, row))
        return row

    def fetchall(self):
        rows = self.cursor.fetchall()
        if not rows:
            return []
        formatted = []
        for r in rows:
            if isinstance(r, dict) or isinstance(r, sqlite3.Row):
                formatted.append(dict(r))
            elif hasattr(self.cursor, "description"):
                colnames = [desc[0] for desc in self.cursor.description]
                formatted.append(dict(zip(colnames, r)))
            else:
                formatted.append(r)
        return formatted

def get_db():
    global DB_ENGINE
    if DB_ENGINE == "postgres" and POSTGRES_AVAILABLE:
        try:
            conn = psycopg2.connect(dbname=PG_DB, user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT, cursor_factory=RealDictCursor)
            return DBConnectionWrapper("postgres", conn)
        except Exception:
            pass
    
    # SQLite Fallback
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return DBConnectionWrapper("sqlite", conn)

def init_db():
    global DB_ENGINE
    pg_success = False

    # Attempt PostgreSQL Connection & Schema Setup if available
    if POSTGRES_AVAILABLE:
        try:
            # First try connecting to default postgres db to create target db if needed
            root_conn = psycopg2.connect(dbname="postgres", user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
            root_conn.autocommit = True
            root_cur = root_conn.cursor()
            root_cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{PG_DB}';")
            if not root_cur.fetchone():
                root_cur.execute(f"CREATE DATABASE {PG_DB};")
            root_conn.close()

            # Connect to target PostgreSQL DB
            pg_conn = psycopg2.connect(dbname=PG_DB, user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT, cursor_factory=RealDictCursor)
            DB_ENGINE = "postgres"
            pg_success = True
            print(f"[DB] Connected successfully to PostgreSQL server at {PG_HOST}:{PG_PORT}/{PG_DB}")
            db_wrap = DBConnectionWrapper("postgres", pg_conn)
        except Exception as e:
            print(f"[DB] PostgreSQL service offline/unreachable on port {PG_PORT} ({e}). Using SQLite High-Availability Mode.")

    if not pg_success:
        DB_ENGINE = "sqlite"
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        db_wrap = DBConnectionWrapper("sqlite", conn)

    cursor = db_wrap.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            avatar TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            filename TEXT NOT NULL,
            filePath TEXT NOT NULL,
            fileSize INTEGER NOT NULL,
            fileType TEXT NOT NULL,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER NOT NULL,
            region TEXT NOT NULL,
            version TEXT NOT NULL,
            docType TEXT NOT NULL,
            status TEXT NOT NULL,
            uploadedBy TEXT NOT NULL,
            validatedBy TEXT,
            notes TEXT,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS document_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            documentId INTEGER REFERENCES documents(id) ON DELETE CASCADE,
            chunkIndex INTEGER NOT NULL,
            title TEXT,
            content TEXT NOT NULL,
            tokenCount INTEGER DEFAULT 0,
            embedding TEXT,
            make TEXT,
            model TEXT,
            docType TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS rag_queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            retrievedCount INTEGER NOT NULL,
            topSimilarity REAL NOT NULL,
            promptTokens INTEGER NOT NULL,
            completionTokens INTEGER NOT NULL,
            estimatedCost REAL NOT NULL,
            latencyMs INTEGER NOT NULL,
            user TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS diagnostic_chat_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            technicianEmail TEXT NOT NULL,
            vin TEXT,
            query TEXT NOT NULL,
            response TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'answered',
            retrievedCount INTEGER DEFAULT 0,
            make TEXT,
            model TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            document TEXT NOT NULL,
            make TEXT,
            model TEXT,
            year INTEGER,
            user TEXT NOT NULL,
            userInitials TEXT NOT NULL,
            note TEXT,
            details TEXT,
            version TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            userId INTEGER,
            userEmail TEXT NOT NULL,
            vin TEXT NOT NULL,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER NOT NULL,
            startedAt TEXT NOT NULL,
            status TEXT NOT NULL,
            mileage INTEGER NOT NULL,
            dtcCodes TEXT NOT NULL,
            dtcCleared INTEGER DEFAULT 0,
            technicianNote TEXT,
            completedSteps TEXT,
            pairedDeviceId TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            userEmail TEXT NOT NULL,
            name TEXT NOT NULL,
            protocol TEXT NOT NULL,
            macAddress TEXT NOT NULL,
            status TEXT NOT NULL,
            batteryLevel INTEGER DEFAULT 100,
            lastConnected DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS support_tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticketId TEXT NOT NULL,
            userEmail TEXT NOT NULL,
            userRole TEXT NOT NULL,
            subject TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'Open',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vehicles (
            vin TEXT PRIMARY KEY,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER NOT NULL,
            type TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS diagnostics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vin TEXT NOT NULL REFERENCES vehicles(vin),
            query TEXT NOT NULL,
            response TEXT NOT NULL,
            createdBy TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            docId INTEGER REFERENCES documents(id),
            submittedBy TEXT NOT NULL,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Column migrations
    for col, table, defn in [
        ("title", "document_chunks", "TEXT"),
        ("tokenCount", "document_chunks", "INTEGER DEFAULT 0"),
        ("embedding", "document_chunks", "TEXT"),
        ("userId", "sessions", "INTEGER"),
        ("userEmail", "sessions", "TEXT DEFAULT 'alex.reyes@auraos.io'"),
        ("dtcCleared", "sessions", "INTEGER DEFAULT 0"),
        ("completedSteps", "sessions", "TEXT"),
        ("pairedDeviceId", "sessions", "TEXT"),
        ("createdAt", "sessions", "DATETIME DEFAULT CURRENT_TIMESTAMP"),
        ("validatedBy", "documents", "TEXT"),
        ("details", "audit_logs", "TEXT"),
    ]:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {defn};")
        except Exception:
            pass

    db_wrap.commit()
    seed_initial_data(db_wrap)
    db_wrap.close()

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        plain_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hash_bytes)
    except Exception:
        return False

def seed_initial_data(db_wrap):
    cursor = db_wrap.cursor()

    # Seed demo users if empty
    cursor.execute("SELECT COUNT(*) as count FROM users")
    user_cnt_row = cursor.fetchone()
    user_count = user_cnt_row["count"] if user_cnt_row else 0
    if user_count == 0:
        tech_hash = hash_password("Tech@2026!")
        mgr_hash = hash_password("Mgr@2026!")
        admin_hash = hash_password("AdminMaster@2026!")

        cursor.executemany("""
            INSERT INTO users (fullName, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)
        """, [
            ("Alex Reyes", "alex.reyes@auraos.io", tech_hash, "technician", "AR"),
            ("Sarah Kim", "sarah.kim@auraos.io", mgr_hash, "manager", "SK"),
            ("Master Administrator", "admin.master@auraos.io", admin_hash, "super_admin", "SA")
        ])
        print(f"[OK] Demo users & Master Admin seeded into {DB_ENGINE.upper()} database.")
    else:
        cursor.execute("SELECT * FROM users WHERE email = ?", ("admin.master@auraos.io",))
        if not cursor.fetchone():
            admin_hash = hash_password("AdminMaster@2026!")
            cursor.execute("""
                INSERT INTO users (fullName, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)
            """, ("Master Administrator", "admin.master@auraos.io", admin_hash, "super_admin", "SA"))
            print(f"[MASTER ADMIN] Master Admin account seeded into {DB_ENGINE.upper()} database.")

    # Seed vehicles if empty
    cursor.execute("SELECT COUNT(*) as count FROM vehicles")
    veh_cnt_row = cursor.fetchone()
    veh_count = veh_cnt_row["count"] if veh_cnt_row else 0
    if veh_count == 0:
        initial_vehicles = [
            ('1HGCR2F83PA001892', 'Honda', 'Accord EX-L', 2023, 'Sedan'),
            ('4T1B11HK4NU102934', 'Toyota', 'Camry XSE', 2022, 'Sedan'),
            ('1FTVW1EL8PW048123', 'Ford', 'F-150 Lightning', 2024, 'Pickup Truck / EV'),
            ('WBA53AY05PFP12389', 'BMW', '330i xDrive', 2023, 'Luxury Sedan'),
            ('1GCPC1C47RZ198234', 'Chevrolet', 'Silverado 1500', 2024, 'Pickup Truck'),
            ('7SAYGDEF0PF918234', 'Tesla', 'Model Y Long Range', 2024, 'Electric SUV'),
            ('JTD45678901234567', 'Toyota', 'Prius Prime', 2025, 'Plug-in Hybrid'),
            ('KM8KR4567PA123456', 'Hyundai', 'Ioniq 5 Limited', 2023, 'Electric Crossover'),
            ('4S4BTDCD8R3109283', 'Subaru', 'Outback XT', 2024, 'Crossover AWD'),
            ('1N4AZ1CP8RC291029', 'Nissan', 'Leaf SV Plus', 2024, 'Electric Hatchback')
        ]
        cursor.executemany("""
            INSERT INTO vehicles (vin, make, model, year, type)
            VALUES (?, ?, ?, ?, ?)
        """, initial_vehicles)
        print(f"[OK] 10 OEM showcase vehicles seeded into {DB_ENGINE.upper()} database.")

    # Seed demo documents if empty
    cursor.execute("SELECT COUNT(*) as count FROM documents")
    doc_cnt_row = cursor.fetchone()
    doc_count = doc_cnt_row["count"] if doc_cnt_row else 0
    if doc_count == 0:
        initial_docs = [
            ('Engine Control System Manual', 'honda_accord_2023_ecs.pdf', '/uploads/honda_accord_2023_ecs.pdf', 18862080, 'PDF', 'Honda', 'Accord', 2023, 'North America', '3.2.1', 'Service Manual', 'Published', 'Sarah Kim', 'Approved after peer review. Includes DTC P0301 guide.', 'Sep 09, 2026'),
            ('Brake System Overhaul Guide', 'toyota_camry_2022_brakes.pdf', '/uploads/toyota_camry_2022_brakes.pdf', 10066329, 'PDF', 'Toyota', 'Camry', 2022, 'North America', '2.0.0', 'Service Manual', 'Flagged', 'Marcus Webb', 'Torque values on page 14 require verification.', 'Sep 08, 2026'),
            ('Ignition Wiring Diagram Set', 'ford_f150_2024_wiring.pdf', '/uploads/ford_f150_2024_wiring.pdf', 5754880, 'PDF', 'Ford', 'F-150', 2024, 'North America', '1.4.2', 'Wiring Diagram', 'Published', 'Priya Nair', 'Updated high voltage isolation procedures.', 'Sep 07, 2026'),
            ('Transmission Fluid Service Bulletin', 'bmw_3series_transmission.pdf', '/uploads/bmw_3series_transmission.pdf', 3287040, 'PDF', 'BMW', '3 Series', 2023, 'Europe', '1.1.0', 'Technical Service Bulletin', 'Under Review', 'Sarah Kim', 'Submitted for manager review.', 'Sep 06, 2026'),
            ('HVAC System Diagnostics Manual', 'chevy_silverado_hvac.pdf', '/uploads/chevy_silverado_hvac.pdf', 15052800, 'PDF', 'Chevrolet', 'Silverado', 2024, 'North America', '2.3.0', 'Service Manual', 'Published', 'Marcus Webb', 'Complete HVAC dual-zone diagnostics.', 'Sep 05, 2026'),
            ('Hybrid Battery Replacement Procedure', 'prius_2025_hybrid.pdf', '/uploads/prius_2025_hybrid.pdf', 22630400, 'PDF', 'Toyota', 'Prius', 2025, 'Global', '1.0.0', 'Service Manual', 'Draft', 'Priya Nair', 'Draft version for 2025 model.', 'Sep 04, 2026'),
            ('Fuel Injector Recall Bulletin 23V-441', 'honda_recall_23v441.pdf', '/uploads/honda_recall_23v441.pdf', 1269760, 'PDF', 'Honda', 'Accord', 2023, 'North America', '1.0.0', 'Recall Bulletin', 'Published', 'Marcus Webb', 'Active NHTSA recall bulletin.', 'Aug 28, 2026'),
            ('ICCU High Voltage Fuse Replacement Bulletin', 'hyundai_ioniq5_iccu.pdf', '/uploads/hyundai_ioniq5_iccu.pdf', 4120000, 'PDF', 'Hyundai', 'Ioniq 5', 2023, 'Global', '1.2.0', 'Technical Service Bulletin', 'Published', 'Sarah Kim', 'ICCU charging software and fuse procedure.', 'Sep 01, 2026'),
            ('EyeSight Camera Calibration & Steering Angle Guide', 'subaru_outback_eyesight.pdf', '/uploads/subaru_outback_eyesight.pdf', 8430000, 'PDF', 'Subaru', 'Outback', 2024, 'North America', '2.1.0', 'Service Manual', 'Published', 'Priya Nair', 'ADAS calibration procedure.', 'Aug 29, 2026'),
            ('Pyrofuse & HV Battery Contactors Diagnostic Procedure', 'tesla_modely_pyrofuse.pdf', '/uploads/tesla_modely_pyrofuse.pdf', 9120000, 'PDF', 'Tesla', 'Model Y', 2024, 'North America', '3.0.0', 'Service Manual', 'Published', 'Marcus Webb', 'High voltage pyrofuse safety guide.', 'Sep 03, 2026')
        ]
        cursor.executemany("""
            INSERT INTO documents (title, filename, filePath, fileSize, fileType, make, model, year, region, version, docType, status, uploadedBy, notes, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_docs)
        print(f"[OK] Demo documents seeded into {DB_ENGINE.upper()} database.")

    # Seed document_chunks for RAG vector search if empty
    cursor.execute("SELECT COUNT(*) as count FROM document_chunks")
    chunk_cnt_row = cursor.fetchone()
    chunk_count = chunk_cnt_row["count"] if chunk_cnt_row else 0
    if chunk_count == 0:
        cursor.execute("SELECT id, title, make, model, year, docType FROM documents")
        docs = [dict(r) for r in cursor.fetchall()]
        from server.rag_engine import chunk_document

        for doc in docs:
            make = doc["make"]
            model = doc["model"]
            year = doc["year"]
            doc_id = doc["id"]
            doc_type = doc["docType"]
            title = doc["title"]

            if make == 'Honda' and model == 'Accord':
                content = (
                    f"OEM Technical Diagnostic Procedure for {make} {model} ({year}) - {title}:\n"
                    f"1. Diagnostic Troubleshooting for DTC P0301 (Cylinder 1 Misfire Detected):\n"
                    f"   - Prepare work area: Park vehicle on level ground, engage electric parking brake, turn ignition OFF, allow engine to cool for 30 minutes.\n"
                    f"   - Disconnect negative 12V battery terminal (10mm wrench, torque 4.4 ft-lbs / 6 Nm upon reinstallation).\n"
                    f"   - Remove engine plastic trim cover by lifting clips upward.\n"
                    f"   - Unplug 4-pin electrical connector from Ignition Coil 1.\n"
                    f"   - Remove 10mm ignition coil hold-down bolt. Inspect coil boot for oil contamination, carbon tracking, or hairline cracks.\n"
                    f"   - Remove spark plug using 5/8 inch magnetic spark plug socket. Check electrode gap: OEM Spec 0.039 - 0.043 in (1.0 - 1.1 mm).\n"
                    f"   - Thread new NGK ILZKAR8H8S laser iridium spark plug hand-tight. Torque to 13 ft-lbs (18 Nm).\n"
                    f"   - Reinstall ignition coil and torque hold-down bolt to 7 ft-lbs (9.8 Nm).\n"
                    f"   - Connect OBD-II scan tool, clear diagnostic codes, start engine, and monitor live cylinder misfire counts.\n"
                    f"2. NHTSA Recall Bulletin 23V-441: High-pressure fuel pump impeller swelling may cause fuel starvation on 2.0L Turbo variants. Replace pump assembly if fuel rail pressure drops below 450 PSI under load."
                )
            elif make == 'Toyota' and model == 'Camry':
                content = (
                    f"OEM Technical Diagnostic Procedure for {make} {model} ({year}) - {title}:\n"
                    f"1. Diagnostic Troubleshooting for DTC P0171 (System Too Lean Bank 1):\n"
                    f"   - Inspect Mass Air Flow (MAF) sensor wire element for oil residue or dust contamination.\n"
                    f"   - Clean MAF sensor using dedicated aerosol electrical contact cleaner. Allow 15 minutes to air dry.\n"
                    f"   - Perform intake smoke test to check for air leaks downstream of MAF sensor at intake boot and PCV hose joints.\n"
                    f"   - Verify fuel pressure at fuel rail adapter plug: Specification 44 - 50 PSI at idle.\n"
                    f"   - Front Air-Fuel Ratio (A/F) Sensor Inspection: Check heater circuit resistance across Pin 1 and Pin 2 (Spec 1.8 - 3.4 ohms at 20°C). Torque sensor to 33 ft-lbs (44 Nm).\n"
                    f"2. Brake System Caliper Overhaul Specification: Torque front caliper mounting bracket bolts to 79 ft-lbs (107 Nm). Torque guide pin bolts to 25 ft-lbs (34 Nm)."
                )
            elif make == 'Ford' and model == 'F-150':
                content = (
                    f"OEM Technical Diagnostic Procedure for {make} {model} ({year}) - {title}:\n"
                    f"1. High Voltage Battery Isolation & Safety Disconnect (DTC P0A80):\n"
                    f"   - ALWAYS wear Class 00 (500V rated) insulated rubber gloves with leather protectors when working near HV components.\n"
                    f"   - Remove High Voltage Manual Service Disconnect (MSD) plug under rear seat and wait 10 minutes for internal capacitors to discharge.\n"
                    f"   - Verify zero potential (< 5.0V DC) across HV positive and negative busbars using a CAT IV 1000V rated Digital Multimeter.\n"
                    f"   - Isolation Resistance Test: Measure resistance between HV positive busbar and chassis ground. Minimum OEM requirement: 500 ohms per volt.\n"
                    f"   - CAN Bus Diagnostics: Verify 60 ohms termination resistance across OBD-II Pin 6 (CAN-H) and Pin 14 (CAN-L)."
                )
            elif make == 'BMW' and model == '3 Series':
                content = (
                    f"OEM Technical Diagnostic Procedure for {make} {model} ({year}) - {title}:\n"
                    f"1. Wastegate Actuator Adjustment & Boost Pressure Diagnostics (DTC P112F / P052E):\n"
                    f"   - Inspect electronic turbocharger wastegate actuator rod movement using ISTA+ diagnostic system.\n"
                    f"   - Pre-load actuator rod to exactly 0.5 mm pre-tension using BMW special tool 11 9 240.\n"
                    f"   - Torque wastegate locknut to 10 ft-lbs (14 Nm).\n"
                    f"2. Automatic Transmission Fluid Service (GA8HP51Z 8-Speed): Check fluid level at oil pan fill plug between 35°C and 45°C. Fill using ZF LifeguardFluid 8 until slight overflow occurs."
                )
            elif make == 'Tesla' and model == 'Model Y':
                content = (
                    f"OEM Technical Diagnostic Procedure for {make} {model} ({year}) - {title}:\n"
                    f"1. High Voltage Pyrofuse Replacement & Battery Contactor Safety (Alert BMS_a066):\n"
                    f"   - Open First Responder Loop wire cut loop behind front trunk access panel.\n"
                    f"   - Access HV Battery Penthouse under rear seat. Remove 18 10mm penthouse lid bolts.\n"
                    f"   - Remove Pyrofuse assembly and replace with OEM part # 1500398-00-B. Torque pyrofuse terminal bolts to 9 Nm (80 in-lbs).\n"
                    f"   - Clear BMS safety flags using Tesla Toolbox 3 diagnostic platform."
                )
            else:
                content = (
                    f"OEM Technical Diagnostic Procedure for {make} {model} ({year}) - {title}:\n"
                    f"1. General Diagnostic & System Safety Specification:\n"
                    f"   - Ensure 12V auxiliary battery voltage is above 12.6V before initiating ECU flash or diagnostic scan.\n"
                    f"   - DTC Diagnostics: Follow OEM step-by-step flowchart. Verify pinout voltages with DMM.\n"
                    f"   - Fastener Torque Rules: Torque all chassis, brake, and engine fasteners strictly to OEM specification. Always replace single-use TTY stretch bolts."
                )

            chunks = chunk_document(content, {"make": make, "model": model, "docType": doc_type})
            for c in chunks:
                cursor.execute("""
                    INSERT INTO document_chunks (documentId, chunkIndex, title, content, tokenCount, embedding, make, model, docType)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (doc_id, c["chunkIndex"], title, c["content"], c["tokenCount"], json.dumps(c["embedding"]), make, model, doc_type))

        print(f"[OK] Real OEM RAG document chunks seeded into {DB_ENGINE.upper()} database.")

    # Seed demo devices if empty
    cursor.execute("SELECT COUNT(*) as count FROM devices")
    dev_cnt_row = cursor.fetchone()
    dev_count = dev_cnt_row["count"] if dev_cnt_row else 0
    if dev_count == 0:
        initial_devices = [
            ('dev-101', 'alex.reyes@auraos.io', 'OBDLink MX+ Bluetooth', 'STN1170 Bluetooth LE', '00:1A:7D:DA:71:12', 'connected', 98),
            ('dev-102', 'sarah.kim@auraos.io', 'Veepeak BLE+ Adapter', 'ELM327 BLE v2.2', '00:1A:7D:88:42:19', 'connected', 92),
            ('dev-103', 'marcus.webb@auraos.io', 'BlueDriver Pro Scan Tool', 'Bluetooth 4.2', '00:1A:7D:F3:99:01', 'disconnected', 75)
        ]
        cursor.executemany("""
            INSERT INTO devices (id, userEmail, name, protocol, macAddress, status, batteryLevel)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, initial_devices)
        print(f"[OK] Paired OBD-II scan tools seeded into {DB_ENGINE.upper()} database.")

    # Seed demo sessions if empty
    cursor.execute("SELECT COUNT(*) as count FROM sessions")
    sess_cnt_row = cursor.fetchone()
    sess_count = sess_cnt_row["count"] if sess_cnt_row else 0
    if sess_count == 0:
        initial_sessions = [
            ('session-1001', 1, 'alex.reyes@auraos.io', '1HGCR2F83PA001892', 'Honda', 'Accord EX-L', 2023, '08:30 AM', 'in-progress', 28450, json.dumps(['P0301', 'P0420']), 0, 'Inspecting Cylinder 1 spark plug & coil boot.', json.dumps([1, 2]), 'dev-101'),
            ('session-1002', 2, 'marcus.webb@auraos.io', '4T1B11HK4NU102934', 'Toyota', 'Camry XSE', 2022, '09:15 AM', 'in-progress', 41200, json.dumps(['P0171']), 0, 'Cleaned MAF sensor and checking fuel pressure.', json.dumps([1]), 'dev-103'),
            ('session-1003', 3, 'priya.nair@auraos.io', '1FTVW1EL8PW048123', 'Ford', 'F-150 Lightning', 2024, '07:45 AM', 'completed', 14200, json.dumps(['P0A80']), 1, 'HV isolation test passed (>500k ohm). High voltage contactor cleared.', json.dumps([1, 2, 3, 4, 5, 6]), 'dev-102')
        ]
        cursor.executemany("""
            INSERT INTO sessions (id, userId, userEmail, vin, make, model, year, startedAt, status, mileage, dtcCodes, dtcCleared, technicianNote, completedSteps, pairedDeviceId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_sessions)
        print(f"[OK] Live technician field sessions seeded into {DB_ENGINE.upper()} database.")

    # Seed demo audit logs if empty
    cursor.execute("SELECT COUNT(*) as count FROM audit_logs")
    audit_cnt_row = cursor.fetchone()
    audit_count = audit_cnt_row["count"] if audit_cnt_row else 0
    if audit_count == 0:
        initial_audits = [
            ('Published', 'Engine Control System Manual', 'Honda', 'Accord', 2023, 'Sarah Kim', 'SK', 'Approved after peer review. Supersedes v3.1.0.', '3.2.1'),
            ('Flagged', 'Brake System Overhaul Guide', 'Toyota', 'Camry', 2022, 'Marcus Webb', 'MW', 'Torque values on page 14 do not match OEM spec. Requires correction.', '2.0.0'),
            ('Uploaded', 'BMW 3 Series Electrical Wiring', 'BMW', '3 Series', 2025, 'Priya Nair', 'PN', 'New document upload. Pending manager review.', '1.0.0'),
            ('Approved', 'Silverado Transmission Service', 'Chevrolet', 'Silverado', 2024, 'Marcus Webb', 'MW', 'Reviewed and approved. Ready for publish.', '2.3.0'),
        ]
        cursor.executemany("""
            INSERT INTO audit_logs (action, document, make, model, year, user, userInitials, note, version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_audits)
        print(f"[OK] Demo audit logs seeded into {DB_ENGINE.upper()} database.")

    # Seed demo feedback if empty
    cursor.execute("SELECT COUNT(*) as count FROM feedback")
    fb_cnt_row = cursor.fetchone()
    feedback_count = fb_cnt_row["count"] if fb_cnt_row else 0
    if feedback_count == 0:
        initial_feedback = [
            (1, 'alex.reyes@auraos.io', 'Unclear', 'Step 4 torque specification for Cylinder 1 spark plug is unclear for 2023 Accord trim.', 'Pending'),
            (2, 'alex.reyes@auraos.io', 'Outdated', 'Brake caliper bracket torque values on page 14 do not match latest OEM TSB bulletin.', 'Reviewed')
        ]
        cursor.executemany("""
            INSERT INTO feedback (docId, submittedBy, type, message, status)
            VALUES (?, ?, ?, ?, ?)
        """, initial_feedback)
        print(f"[OK] Demo technician feedback items seeded into {DB_ENGINE.upper()} database.")

    # Seed demo diagnostic chat logs if empty
    cursor.execute("SELECT COUNT(*) as count FROM diagnostic_chat_logs")
    chat_cnt_row = cursor.fetchone()
    chat_count = chat_cnt_row["count"] if chat_cnt_row else 0
    if chat_count == 0:
        initial_chat_logs = [
            ("alex.reyes@auraos.io", "1HGCR2F83PA001892", "Check DTC P0301 Cylinder 1 Misfire procedure and spark plug torque spec", "Diagnostic Troubleshooting for DTC P0301 (Cylinder 1 Misfire):\n1. Inspect ignition coil 1 boot for oil contamination or cracks.\n2. Spark Plug Torque Spec: OEM Spec 13 ft-lbs (18 Nm). Electrode gap: 0.039 - 0.043 in.", "answered", 3, "Honda", "Accord"),
            ("marcus.webb@auraos.io", "4T1B11HK4NU102934", "What is the MAF sensor cleaning procedure for Camry DTC P0171?", "Clean Mass Air Flow (MAF) sensor using aerosol contact cleaner. Inspect air intake boot joints for downstream air leaks. Fuel pressure spec: 44-50 PSI.", "answered", 2, "Toyota", "Camry"),
            ("alex.reyes@auraos.io", "1FTVW1EL8PW048123", "How do I fix a flat tire on my bicycle?", "⚠️ Out-of-Domain Query Refused: This platform is strictly restricted to OEM automotive service manuals and OBD-II diagnostics.", "refused", 0, "Ford", "F-150"),
            ("priya.nair@auraos.io", "1FTVW1EL8PW048123", "High voltage battery disconnect procedure for F-150 Lightning (P0A80)", "Wear Class 00 (500V rated) rubber safety gloves. Remove HV Manual Service Disconnect (MSD) plug under rear seat and wait 10 minutes. Verify zero potential (< 5V DC).", "answered", 4, "Ford", "F-150")
        ]
        cursor.executemany("""
            INSERT INTO diagnostic_chat_logs (technicianEmail, vin, query, response, status, retrievedCount, make, model)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_chat_logs)
        print(f"[OK] Seeded initial diagnostic chat logs into {DB_ENGINE.upper()} database.")

    db_wrap.commit()
