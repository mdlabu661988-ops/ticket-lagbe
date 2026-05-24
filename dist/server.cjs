var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_app2 = require("firebase-admin/app");
var import_firestore2 = require("firebase-admin/firestore");
var import_socket = require("socket.io");
var import_http = require("http");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
var httpServer = (0, import_http.createServer)(app);
var io = new import_socket.Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.use(import_express.default.json());
var DB_PATH = import_path.default.join(process.cwd(), "database.sqlite");
var firestoreAdmin;
try {
  const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
    const adminApp = (0, import_app2.getApps)().length === 0 ? (0, import_app2.initializeApp)({
      projectId: firebaseConfig.projectId
    }) : (0, import_app2.getApps)()[0];
    const dbId = firebaseConfig.firestoreDatabaseId;
    console.log(`Initializing Firestore Admin. Project: ${firebaseConfig.projectId}, Database: ${dbId || "(default)"}`);
    if (dbId) {
      firestoreAdmin = (0, import_firestore2.getFirestore)(adminApp, dbId);
    } else {
      firestoreAdmin = (0, import_firestore2.getFirestore)(adminApp);
    }
    console.log("Firebase Admin initialized successfully");
    const syncFromFirestore = async () => {
      try {
        console.log("Syncing data from Firestore to SQLite...");
        const collections = ["buses", "routes", "schedules"];
        for (const col of collections) {
          let snapshot = null;
          let syncSuccessful = false;
          if (firestoreAdmin) {
            try {
              snapshot = await firestoreAdmin.collection(col).get();
              console.log(`Fetched ${col} via Admin SDK`);
              syncSuccessful = true;
            } catch (adminError) {
              if (adminError.code === 7 || adminError.message?.includes("PERMISSION_DENIED")) {
                console.warn(`Admin SDK sync permission denied for ${col}. Will use fallback.`);
              } else {
                console.error(`Admin SDK sync failed for ${col}:`, adminError.message);
              }
            }
          }
          if (!syncSuccessful && firestore) {
            try {
              console.warn(`Falling back to Client SDK for ${col} sync`);
              const clientSnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(firestore, col));
              snapshot = clientSnapshot.docs.map((d) => ({
                id: d.id,
                data: () => d.data()
              }));
              console.log(`Fetched ${col} via Client SDK`);
              syncSuccessful = true;
            } catch (clientError) {
              console.error(`Client SDK sync failed for ${col}:`, clientError.message);
            }
          }
          if (snapshot && syncSuccessful) {
            snapshot.forEach((doc2) => {
              const data = doc2.data();
              const id = doc2.id;
              if (col === "buses") {
                db.prepare("INSERT OR REPLACE INTO buses (id, name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.name, data.name_en || data.name, data.name_bn || data.name, data.reg_no, data.driver, data.driver_phone, data.status, data.route, data.last_maintenance, data.next_maintenance, data.capacity, data.owner_id, data.image_url);
              } else if (col === "routes") {
                db.prepare("INSERT OR REPLACE INTO routes (id, from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.from_city, data.from_city_en || data.from_city, data.from_city_bn || data.from_city, data.to_city, data.to_city_en || data.to_city, data.to_city_bn || data.to_city, data.distance, data.duration, data.fare, data.status);
              } else if (col === "schedules") {
                db.prepare("INSERT OR REPLACE INTO schedules (id, bus_id, route_id, departure_time, arrival_time, date, status, available_seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.bus_id, data.route_id, data.departure_time, data.arrival_time, data.date, data.status, data.available_seats);
              }
            });
          }
        }
        console.log("Firestore sync complete");
      } catch (error) {
        console.error("Firestore sync failed with unexpected error:", error);
      }
    };
    syncFromFirestore();
  }
} catch (error) {
  console.error("Firebase Admin initialization failed:", error);
}
var firebaseApp;
var firestore;
try {
  const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
    firebaseApp = (0, import_app.initializeApp)(firebaseConfig);
    firestore = (0, import_firestore.getFirestore)(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("firebase-applet-config.json not found");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}
var db;
try {
  db = new import_better_sqlite3.default(DB_PATH);
  db.pragma("journal_mode = WAL");
} catch (error) {
  console.error("Database connection failed:", error);
  process.exit(1);
}
function addLedgerEntry(userId, description, referenceId, referenceType, debit, credit) {
  try {
    const lastBalance = db.prepare("SELECT balance FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(userId);
    const currentBalance = (lastBalance?.balance || 0) + (debit - credit);
    db.prepare(`
      INSERT INTO ledger (user_id, description, reference_id, reference_type, debit, credit, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, description, referenceId, referenceType, debit, credit, currentBalance);
  } catch (error) {
    console.error("Error adding ledger entry:", error);
  }
}
try {
  const busInfo = db.prepare("PRAGMA table_info(buses)").all();
  const idType = busInfo.find((c) => c.name === "id")?.type;
  if (idType === "INTEGER") {
    db.exec(`
      DROP TABLE IF EXISTS schedules;
      DROP TABLE IF EXISTS buses;
      DROP TABLE IF EXISTS routes;
    `);
    console.log("Dropped legacy tables for ID type migration");
  }
} catch (e) {
}
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    profile_image TEXT,
    member_since DATETIME DEFAULT CURRENT_TIMESTAMP,
    counter_id INTEGER,
    owner_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS driver_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    address TEXT,
    license_number TEXT,
    profile_image TEXT,
    status TEXT DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS buses (
    id TEXT PRIMARY KEY,
    name TEXT,
    name_en TEXT,
    name_bn TEXT,
    reg_no TEXT,
    driver TEXT,
    driver_phone TEXT,
    status TEXT,
    route TEXT,
    last_maintenance TEXT,
    next_maintenance TEXT,
    capacity INTEGER,
    owner_id INTEGER,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS counters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    name_en TEXT,
    name_bn TEXT,
    location TEXT,
    location_en TEXT,
    location_bn TEXT,
    phone TEXT,
    owner_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    from_city TEXT,
    from_city_en TEXT,
    from_city_bn TEXT,
    to_city TEXT,
    to_city_en TEXT,
    to_city_bn TEXT,
    distance TEXT,
    duration TEXT,
    fare TEXT,
    status TEXT
  );
  
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    passenger_name TEXT,
    phone_number TEXT,
    passenger_id TEXT,
    address TEXT,
    bus_id TEXT,
    route TEXT,
    time TEXT,
    travel_date TEXT,
    seats TEXT,
    status TEXT,
    amount TEXT,
    counter TEXT,
    staff TEXT,
    passengers_json TEXT,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    bus_id TEXT,
    route_id TEXT,
    departure_time TEXT,
    arrival_time TEXT,
    date TEXT,
    status TEXT,
    available_seats INTEGER,
    FOREIGN KEY(bus_id) REFERENCES buses(id),
    FOREIGN KEY(route_id) REFERENCES routes(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    booking_id INTEGER,
    amount TEXT,
    type TEXT, -- 'Payment', 'Refund'
    method TEXT, -- 'bKash', 'Nagad', 'Card'
    status TEXT, -- 'Success', 'Pending', 'Failed'
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  );

  CREATE TABLE IF NOT EXISTS payments_to_owners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    amount REAL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    reference TEXT,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    reference_id TEXT,
    reference_type TEXT,
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS corporate_vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT, -- 'Sedan', 'SUV', 'Microbus', 'Truck', 'Pickup', 'Lorry'
    image_url TEXT,
    capacity INTEGER,
    fare_per_km REAL,
    driver_id INTEGER,
    status TEXT DEFAULT 'available',
    FOREIGN KEY(driver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS driver_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    bio TEXT,
    experience TEXT,
    license_number TEXT,
    profile_image TEXT,
    rating REAL DEFAULT 4.5,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);
try {
  const tableInfo = db.prepare("PRAGMA table_info(bank_accounts)").all();
  if (tableInfo.length > 0) {
    const indexList = db.prepare("PRAGMA index_list(bank_accounts)").all();
    const hasUniqueOwnerId = indexList.some((idx) => idx.unique === 1);
    if (hasUniqueOwnerId) {
      db.exec(`
        BEGIN TRANSACTION;
        ALTER TABLE bank_accounts RENAME TO bank_accounts_old;
        CREATE TABLE bank_accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          owner_id INTEGER,
          bank_name TEXT,
          account_name TEXT,
          account_number TEXT,
          branch_name TEXT,
          routing_number TEXT,
          is_primary INTEGER DEFAULT 0,
          FOREIGN KEY(owner_id) REFERENCES users(id)
        );
        INSERT INTO bank_accounts (id, owner_id, bank_name, account_name, account_number, branch_name, routing_number, is_primary)
        SELECT id, owner_id, bank_name, account_name, account_number, branch_name, routing_number, is_primary FROM bank_accounts_old;
        DROP TABLE bank_accounts_old;
        COMMIT;
      `);
      console.log("Successfully migrated bank_accounts table to remove unique constraint");
    }
  }
} catch (error) {
  console.error("Migration error for bank_accounts:", error.message);
  try {
    db.exec("ROLLBACK;");
  } catch (e) {
  }
}
db.exec(`
  CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    branch_name TEXT,
    routing_number TEXT,
    is_primary INTEGER DEFAULT 0,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS corporate_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    vehicle_id INTEGER,
    driver_id INTEGER,
    pickup_location TEXT,
    drop_location TEXT,
    date TEXT,
    status TEXT DEFAULT 'Pending',
    amount REAL,
    advance_paid REAL DEFAULT 0,
    payment_method TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(vehicle_id) REFERENCES corporate_vehicles(id),
    FOREIGN KEY(driver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label_en TEXT,
    label_bn TEXT,
    path TEXT,
    order_index INTEGER,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS corporate_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  -- Insert default corporate settings if not exists
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('heroTitle_en', 'Revolutionizing Corporate Mobility in Bangladesh');
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('heroTitle_bn', '\u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7 \u0995\u09B0\u09CD\u09AA\u09CB\u09B0\u09C7\u099F \u09AE\u09CB\u09AC\u09BF\u09B2\u09BF\u099F\u09BF\u09A4\u09C7 \u09AC\u09BF\u09AA\u09CD\u09B2\u09AC \u0986\u09A8\u09BE');
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('heroSubtitle_en', 'Streamline your employee transportation with our tech-enabled, safe, and reliable corporate mobility solutions.');
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('heroSubtitle_bn', '\u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09AA\u09CD\u09B0\u09AF\u09C1\u0995\u09CD\u09A4\u09BF-\u09A8\u09BF\u09B0\u09CD\u09AD\u09B0, \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6 \u098F\u09AC\u0982 \u09A8\u09BF\u09B0\u09CD\u09AD\u09B0\u09AF\u09CB\u0997\u09CD\u09AF \u0995\u09B0\u09CD\u09AA\u09CB\u09B0\u09C7\u099F \u09AE\u09CB\u09AC\u09BF\u09B2\u09BF\u099F\u09BF \u09B8\u09AE\u09BE\u09A7\u09BE\u09A8\u09C7\u09B0 \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09B0\u09CD\u09AE\u09C0\u09A6\u09C7\u09B0 \u09AA\u09B0\u09BF\u09AC\u09B9\u09A8 \u09AC\u09CD\u09AF\u09AC\u09B8\u09CD\u09A5\u09BE \u09B8\u09B9\u099C\u09A4\u09B0 \u0995\u09B0\u09C1\u09A8\u0964');
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('stats_clients', '500+');
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('stats_trips', '1M+');
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('stats_drivers', '10k+');
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('stats_ontime', '99.9%');
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('heroImage', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1920');

  -- Insert default settings if not exists
  INSERT OR IGNORE INTO settings (key, value) VALUES ('ssl_store_id', '');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('ssl_store_password', '');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('ssl_is_sandbox', 'true');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('banner_title', 'Best Discount!');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('banner_subtitle', 'Weekly Mega Offer');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('banner_button', 'AIRTEL NETWORK');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('banner_image', 'https://picsum.photos/seed/promo/1200/400');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('theme_mode', 'light');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('color_primary', '#2563eb');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('color_secondary', '#475569');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('color_text', '#0f172a');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('color_bg', '#f8fafc');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('custom_css', '/* Custom styles here */');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('font_family', 'Inter');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('base_font_size', '16');
`);
var count = db.prepare("SELECT count(*) as count FROM corporate_vehicles").get();
if (count.count === 0) {
  const insertVehicle = db.prepare("INSERT INTO corporate_vehicles (name, type, image_url, capacity, fare_per_km) VALUES (?, ?, ?, ?, ?)");
  insertVehicle.run("Toyota Axio", "Sedan", "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800", 4, 15);
  insertVehicle.run("Toyota Allion", "Sedan", "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=800", 4, 18);
  insertVehicle.run("Hiace", "Microbus", "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800", 12, 35);
  insertVehicle.run("Toyota Land Cruiser Prado", "SUV", "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800", 7, 50);
  insertVehicle.run("TATA 407", "Truck", "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800", 3, 40);
  insertVehicle.run("Eicher Lorry", "Lorry", "https://images.unsplash.com/photo-1586339941406-3b048472986f?auto=format&fit=crop&q=80&w=800", 2, 80);
  insertVehicle.run("Mahindra Pickup", "Pickup", "https://images.unsplash.com/photo-1591860454448-58133b218406?auto=format&fit=crop&q=80&w=800", 2, 25);
}
app.get("/api/corporate/vehicles", (req, res) => {
  try {
    const { type } = req.query;
    let query = "SELECT * FROM corporate_vehicles";
    const params = [];
    if (type && type !== "All") {
      query += " WHERE type = ?";
      params.push(type);
    }
    const vehicles = db.prepare(query).all(...params);
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/corporate/drivers/:userId", (req, res) => {
  try {
    const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.params.userId);
    res.json(profile || { message: "Profile not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/corporate/drivers", (req, res) => {
  const { user_id, bio, experience, license_number, profile_image } = req.body;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO driver_profiles (user_id, bio, experience, license_number, profile_image)
      VALUES (?, ?, ?, ?, ?)
    `).run(user_id, bio, experience, license_number, profile_image);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
app.post("/api/corporate/bookings", (req, res) => {
  const { user_id, vehicle_id, pickup_location, drop_location, date, amount, advance_paid, payment_method } = req.body;
  try {
    const info = db.prepare(`
      INSERT INTO corporate_bookings (user_id, vehicle_id, pickup_location, drop_location, date, amount, advance_paid, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, vehicle_id, pickup_location, drop_location, date, amount, advance_paid, payment_method);
    const bookingId = info.lastInsertRowid;
    addLedgerEntry(user_id, `Corporate Booking: ${pickup_location} to ${drop_location}`, String(bookingId), "CorporateBooking", amount, 0);
    const availableDriver = db.prepare(`
      SELECT user_id FROM driver_profiles 
      ORDER BY RANDOM() LIMIT 1
    `).get();
    if (availableDriver) {
      db.prepare("UPDATE corporate_bookings SET driver_id = ?, status = ? WHERE id = ?").run(availableDriver.user_id, "Assigned", bookingId);
    }
    res.json({ success: true, bookingId });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
app.get("/api/corporate/settings", (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM corporate_settings").all();
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/admin/corporate/settings", (req, res) => {
  const settings = req.body;
  try {
    const insert = db.prepare("INSERT OR REPLACE INTO corporate_settings (key, value) VALUES (?, ?)");
    const transaction = db.transaction((settingsData) => {
      for (const [key, value] of Object.entries(settingsData)) {
        insert.run(key, value);
      }
    });
    transaction(settings);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/admin/corporate/bookings", (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT cb.*, u.name as user_name, v.name as vehicle_name, d.name as driver_name
      FROM corporate_bookings cb
      JOIN users u ON cb.user_id = u.id
      JOIN corporate_vehicles v ON cb.vehicle_id = v.id
      LEFT JOIN users d ON cb.driver_id = d.id
      ORDER BY cb.id DESC
    `).all();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/bank-account/:ownerId", (req, res) => {
  try {
    const bankAccounts = db.prepare("SELECT * FROM bank_accounts WHERE owner_id = ?").all(req.params.ownerId);
    res.json(bankAccounts || []);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/bank-account", (req, res) => {
  const { id, owner_id, bank_name, account_name, account_number, branch_name, routing_number, is_primary } = req.body;
  try {
    console.log("Bank account update/create request:", { id, owner_id, bank_name });
    if (is_primary) {
      db.prepare("UPDATE bank_accounts SET is_primary = 0 WHERE owner_id = ?").run(owner_id);
    }
    if (id) {
      const result = db.prepare(`
        UPDATE bank_accounts 
        SET bank_name = ?, account_name = ?, account_number = ?, branch_name = ?, routing_number = ?, is_primary = ?
        WHERE id = ? AND owner_id = ?
      `).run(bank_name, account_name, account_number, branch_name, routing_number, is_primary ? 1 : 0, id, owner_id);
      console.log("Update result:", result);
      if (result.changes === 0) {
        return res.status(404).json({ success: false, message: "Account not found or owner mismatch" });
      }
    } else {
      const result = db.prepare(`
        INSERT INTO bank_accounts (owner_id, bank_name, account_name, account_number, branch_name, routing_number, is_primary)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(owner_id, bank_name, account_name, account_number, branch_name, routing_number, is_primary ? 1 : 0);
      console.log("Insert result:", result);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Bank Account Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});
app.delete("/api/bank-account/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM bank_accounts WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/admin/corporate/drivers", (req, res) => {
  try {
    const drivers = db.prepare(`
      SELECT u.id, u.name, u.phone, dp.experience, dp.license_number
      FROM users u
      JOIN driver_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'driver' OR EXISTS(SELECT 1 FROM driver_profiles WHERE user_id = u.id)
    `).all();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.put("/api/admin/corporate/bookings/:id/assign", (req, res) => {
  const { driver_id } = req.body;
  const { id } = req.params;
  try {
    db.prepare("UPDATE corporate_bookings SET driver_id = ?, status = ? WHERE id = ?").run(driver_id, "Assigned", id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
function addColumnIfNotExists(tableName, columnName, columnDef) {
  try {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    if (!columns.map((c) => c.name).includes(columnName)) {
      db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`).run();
    }
  } catch (error) {
    if (!error.message?.includes("duplicate column name")) {
      console.error(`Migration error adding ${columnName} to ${tableName}:`, error.message);
    }
  }
}
addColumnIfNotExists("users", "phone", "TEXT");
addColumnIfNotExists("users", "address", "TEXT");
addColumnIfNotExists("users", "profile_image", "TEXT");
addColumnIfNotExists("users", "member_since", "DATETIME");
try {
  db.prepare("UPDATE users SET member_since = CURRENT_TIMESTAMP WHERE member_since IS NULL").run();
} catch (e) {
}
addColumnIfNotExists("users", "owner_id", "INTEGER");
addColumnIfNotExists("bookings", "phone_number", "TEXT");
addColumnIfNotExists("bookings", "seats", "TEXT");
addColumnIfNotExists("bookings", "travel_date", "TEXT");
addColumnIfNotExists("bookings", "passenger_id", "TEXT");
addColumnIfNotExists("bookings", "address", "TEXT");
addColumnIfNotExists("bookings", "passengers_json", "TEXT");
addColumnIfNotExists("bookings", "payment_status", "TEXT DEFAULT 'Pending'");
addColumnIfNotExists("bookings", "transaction_id", "TEXT");
addColumnIfNotExists("buses", "owner_id", "INTEGER");
addColumnIfNotExists("buses", "name_en", "TEXT");
addColumnIfNotExists("buses", "name_bn", "TEXT");
addColumnIfNotExists("buses", "image_url", "TEXT");
addColumnIfNotExists("counters", "owner_id", "INTEGER");
addColumnIfNotExists("counters", "name_en", "TEXT");
addColumnIfNotExists("counters", "name_bn", "TEXT");
addColumnIfNotExists("counters", "location_en", "TEXT");
addColumnIfNotExists("counters", "location_bn", "TEXT");
addColumnIfNotExists("routes", "from_city_en", "TEXT");
addColumnIfNotExists("routes", "from_city_bn", "TEXT");
addColumnIfNotExists("routes", "to_city_en", "TEXT");
addColumnIfNotExists("routes", "to_city_bn", "TEXT");
addColumnIfNotExists("corporate_bookings", "driver_id", "INTEGER");
addColumnIfNotExists("corporate_bookings", "advance_paid", "REAL DEFAULT 0");
addColumnIfNotExists("corporate_bookings", "payment_method", "TEXT");
addColumnIfNotExists("driver_applications", "license_number", "TEXT");
app.get("/api/profile/:userId", (req, res) => {
  try {
    const user = db.prepare("SELECT id, username, role, name, email, phone, address, profile_image, member_since FROM users WHERE id = ?").get(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, profile: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.put("/api/profile/:userId", (req, res) => {
  const { name, email, phone, address, profile_image } = req.body;
  try {
    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, phone = ?, address = ?, profile_image = ?
      WHERE id = ?
    `).run(name, email, phone, address, profile_image, req.params.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
var userCount = db.prepare("SELECT count(*) as count FROM users").get();
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)");
  insertUser.run("admin", "admin123", "admin", "System Admin", "admin@ticketlagbe.com");
  const insertBus = db.prepare("INSERT INTO buses (id, name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertBus.run("1", "Hanif-A1", "Hanif-A1", "\u09B9\u09BE\u09A8\u09BF\u09AB-\u098F\u09E7", "Dhaka Metro-Ba-11-2233", "Abul Kashem", "01711223344", "Active", "Dhaka - Chattogram", "2024-02-15", "2024-05-15", 40);
  insertBus.run("2", "Ena-B4", "Ena-B4", "\u098F\u09A8\u09BE-\u09AC\u09BF\u09EA", "Dhaka Metro-Ba-12-4455", "Siddiqur Rahman", "01822334455", "Active", "Dhaka - Sylhet", "2024-01-20", "2024-04-20", 40);
  const insertCounter = db.prepare("INSERT INTO counters (name, name_en, name_bn, location, location_en, location_bn, phone) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertCounter.run("Mohakhali Counter", "Mohakhali Counter", "\u09AE\u09B9\u09BE\u0996\u09BE\u09B2\u09C0 \u0995\u09BE\u0989\u09A8\u09CD\u099F\u09BE\u09B0", "Dhaka", "Dhaka", "\u09A2\u09BE\u0995\u09BE", "01911223344");
  insertCounter.run("Gabtoli Counter", "Gabtoli Counter", "\u0997\u09BE\u09AC\u09A4\u09B2\u09C0 \u0995\u09BE\u0989\u09A8\u09CD\u099F\u09BE\u09B0", "Dhaka", "Dhaka", "\u09A2\u09BE\u0995\u09BE", "01722334455");
  const insertRoute = db.prepare("INSERT INTO routes (id, from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertRoute.run("1", "Dhaka", "Dhaka", "\u09A2\u09BE\u0995\u09BE", "Chattogram", "Chattogram", "\u099A\u099F\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE", "240 km", "6h", "700", "Active");
  insertRoute.run("2", "Dhaka", "Dhaka", "\u09A2\u09BE\u0995\u09BE", "Sylhet", "Sylhet", "\u09B8\u09BF\u09B2\u09C7\u099F", "250 km", "5h", "600", "Active");
}
var adminUser = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@ticketlagbe.com");
if (!adminUser) {
  db.prepare("INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)").run("admin", "admin123", "admin", "System Admin", "admin@ticketlagbe.com");
} else {
  db.prepare("UPDATE users SET password = ? WHERE email = ?").run("admin123", "admin@ticketlagbe.com");
}
var menuCount = db.prepare("SELECT count(*) as count FROM menus").get();
if (menuCount.count === 0) {
  const insertMenu = db.prepare("INSERT INTO menus (label_en, label_bn, path, order_index) VALUES (?, ?, ?, ?)");
  insertMenu.run("Home", "\u09B9\u09CB\u09AE", "/", 0);
  insertMenu.run("Offers", "\u0985\u09AB\u09BE\u09B0", "#offers", 1);
  insertMenu.run("About Us", "\u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7", "about", 2);
  insertMenu.run("Contact", "\u09AF\u09CB\u0997\u09BE\u09AF\u09CB\u0997", "contact", 3);
}
try {
  db.prepare("UPDATE menus SET path = 'about' WHERE label_en = 'About Us'").run();
  db.prepare("UPDATE menus SET path = 'contact' WHERE label_en = 'Contact'").run();
} catch (e) {
}
var allUsers = db.prepare("SELECT username, email, role, password FROM users").all();
console.log("Seeded users with passwords:", allUsers);
var testUser = db.prepare("SELECT id FROM users WHERE email = ?").get("mlabu050@gmail.com");
if (!testUser) {
  db.prepare("INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)").run("mlabu050@gmail.com", "password123", "user", "Test User", "mlabu050@gmail.com");
  const newUser = db.prepare("SELECT id FROM users WHERE email = ?").get("mlabu050@gmail.com");
  if (newUser) {
    const insertTx = db.prepare("INSERT INTO transactions (user_id, amount, type, method, status) VALUES (?, ?, ?, ?, ?)");
    insertTx.run(newUser.id, "1400", "Payment", "bKash", "Success");
    insertTx.run(newUser.id, "700", "Payment", "Nagad", "Success");
  }
}
var mockBooking = db.prepare("SELECT id FROM bookings WHERE id = 8824").get();
if (!mockBooking) {
  const insertBooking = db.prepare("INSERT INTO bookings (id, user_id, passenger_name, phone_number, bus_id, route, time, travel_date, seats, status, amount, counter, staff) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertBooking.run(8824, 1, "Tanvir Rahman", "01711223344", 1, "Dhaka to Chattogram", "10:00 AM", (/* @__PURE__ */ new Date()).toISOString().split("T")[0], "A1, A2", "Confirmed", "1400", "Gabtoli Counter", "System Admin");
}
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = import_path.default.join(process.cwd(), "uploads");
    if (!import_fs.default.existsSync(uploadDir)) {
      import_fs.default.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + import_path.default.extname(file.originalname));
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  }
});
app.get("/api/health", async (req, res) => {
  let firestoreAdminStatus = "not_initialized";
  let firestoreAdminError = null;
  if (firestoreAdmin) {
    try {
      await firestoreAdmin.collection("_health").doc("check").get();
      firestoreAdminStatus = "connected";
    } catch (error) {
      if (error.code === 7 || error.code === 9) {
        firestoreAdminStatus = "connected_with_permission_warning";
      } else {
        firestoreAdminStatus = "error";
        firestoreAdminError = error.message;
      }
    }
  }
  res.json({
    status: "ok",
    firestoreAdminStatus,
    firestoreAdminError
  });
});
var lastKnownApiKey = null;
var geminiClient = null;
var isPlaceholderKey = (key) => {
  const normalized = key.toLowerCase().trim();
  return !normalized || normalized.length < 15 || // Real keys are usually much longer
  normalized.includes("placeholder") || normalized.includes("your") || normalized.includes("api_key") || normalized.includes("<") || normalized.includes(">") || normalized === "undefined" || normalized === "null";
};
var getGeminiClient = () => {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || isPlaceholderKey(key)) {
    geminiClient = null;
    lastKnownApiKey = null;
    return null;
  }
  if (key !== lastKnownApiKey) {
    lastKnownApiKey = key;
    geminiClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return geminiClient;
};
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, systemInstruction } = req.body;
  const offlineText = `\u0986\u09B8\u09B8\u09BE\u09B2\u09BE\u09AE\u09C1 \u0986\u09B2\u09BE\u0987\u0995\u09C1\u09AE! \u0986\u09AE\u09BF "\u099F\u09BF\u0995\u09BF\u099F \u09B2\u09BE\u0997\u09AC\u09C7" \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09AB\u09B0\u09CD\u09AE\u09C7\u09B0 \u0995\u09C3\u09A4\u09CD\u09B0\u09BF\u09AE \u09AC\u09C1\u09A6\u09CD\u09A7\u09BF\u09AE\u09A4\u09CD\u09A4\u09BE \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u099A\u09CD\u09AF\u09BE\u099F \u0985\u09CD\u09AF\u09BE\u09B8\u09BF\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u099F\u0964 \u{1F916}\u2728
        
\u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u0989\u09A4\u09CD\u09A4\u09B0 \u09AA\u09C7\u09A4\u09C7 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u099C\u09C7\u0995\u09CD\u099F \u09B8\u09C7\u099F\u09BF\u0982\u09B8\u09C7 **Secrets** \u09AA\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 **GEMINI_API_KEY** \u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09C1\u09A8\u0964

\u0985\u09AB\u09B2\u09BE\u0987\u09A8 \u09AE\u09CB\u09A1 \u0985\u09A8\u09C1\u09AF\u09BE\u09DF\u09C0 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u0995\u09BE\u099B\u09C7 \u09A5\u09BE\u0995\u09BE \u09B8\u09BE\u09A7\u09BE\u09B0\u09A3 \u09A4\u09A5\u09CD\u09AF\u09C7\u09B0 \u0995\u09BF\u099B\u09C1 \u09B8\u09AE\u09DF\u09B8\u09C2\u099A\u09C0 \u09A8\u09BF\u099A\u09C7 \u09A4\u09C1\u09B2\u09C7 \u09A7\u09B0\u09BE \u09B9\u09B2\u09CB:
- **\u09A2\u09BE\u0995\u09BE \u09A5\u09C7\u0995\u09C7 \u099A\u099F\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE**: \u09B8\u0995\u09BE\u09B2 \u09EE:\u09E9\u09E6 (\u09EE\u09E6\u09E6 \u099F\u09BE\u0995\u09BE) \u098F\u09AC\u0982 \u09A6\u09C1\u09AA\u09C1\u09B0 \u09E8:\u09E6\u09E6 (\u09E7\u09E8\u09E6\u09E6 \u099F\u09BE\u0995\u09BE)\u0964
- **\u09A2\u09BE\u0995\u09BE \u09A5\u09C7\u0995\u09C7 \u09B8\u09BF\u09B2\u09C7\u099F**: \u09B8\u0995\u09BE\u09B2 \u09EF:\u09E7\u09EB (\u09EE\u09E6\u09E6 \u099F\u09BE\u0995\u09BE) \u098F\u09AC\u0982 \u09B0\u09BE\u09A4 \u09E7\u09E7:\u09E6\u09E6 (\u09E7\u09E6\u09E6\u09E6 \u099F\u09BE\u0995\u09BE)\u0964
- **\u09A2\u09BE\u0995\u09BE \u09A5\u09C7\u0995\u09C7 \u09B0\u09BE\u099C\u09B6\u09BE\u09B9\u09C0**: \u09B8\u0995\u09BE\u09B2 \u09E7\u09E6:\u09E6\u09E6 (\u09E7\u09EB\u09E6\u09E6 \u099F\u09BE\u0995\u09BE) \u098F\u09AC\u0982 \u09A6\u09C1\u09AA\u09C1\u09B0 \u09E7:\u09E6\u09E6 (\u09E7\u09E7\u09E6\u09E6 \u099F\u09BE\u0995\u09BE)\u0964

\u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09B0\u09AC\u09B0\u09CD\u09A4\u09C0 \u09AF\u09BE\u09A4\u09CD\u09B0\u09BE \u09B6\u09C1\u09AD \u09B9\u09CB\u0995!`;
  try {
    const client = getGeminiClient();
    if (!client) {
      return res.json({ text: offlineText });
    }
    const recentMessages = messages.slice(-15);
    const contents = recentMessages.map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemInstruction || "You are a helpful assistant."
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    const errorStr = String(error.message || error);
    const isApiKeyError = errorStr.includes("API key not valid") || errorStr.includes("API_KEY_INVALID") || errorStr.includes("INVALID_ARGUMENT") || errorStr.includes("key");
    if (isApiKeyError) {
      console.warn("\u26A0\uFE0F [Gemini Alert] Detected an invalid GEMINI_API_KEY on client request. Resetting client cache.");
      geminiClient = null;
      lastKnownApiKey = null;
      return res.json({
        text: `\u26A0\uFE0F **\u098F\u09AA\u09BF\u0986\u0987 \u0995\u09BF \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE (Invalid API Key)** \u26A0\uFE0F

\u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u099C\u09C7\u0995\u09CD\u099F \u09B8\u09C7\u099F\u09BF\u0982\u09B8\u09C7 **Settings > Secrets** \u09AA\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09C7 **GEMINI_API_KEY** \u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7, \u09B8\u09C7\u099F\u09BF \u0997\u09C1\u0997\u09B2 \u098F\u09AA\u09BF\u0986\u0987 \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u0995\u09B0\u09CD\u09A4\u09C3\u0995 \u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09BE\u0996\u09CD\u09AF\u09BE\u09A4 \u09B9\u09DF\u09C7\u099B\u09C7 (\u09AD\u09C1\u09B2 \u09AC\u09BE \u09AE\u09C7\u09DF\u09BE\u09A6\u09CB\u09A4\u09CD\u09A4\u09C0\u09B0\u09CD\u09A3 \u0995\u09C0)\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09A0\u09BF\u0995 \u0997\u09C1\u0997\u09B2 \u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u099C\u09C7\u09AE\u09BF\u09A8\u09BF \u098F\u09AA\u09BF\u0986\u0987 \u0995\u09BF \u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09C1\u09A8\u0964

---
**\u0985\u09AB\u09B2\u09BE\u0987\u09A8 \u09AE\u09CB\u09A1 \u099A\u09CD\u09AF\u09BE\u099F \u0985\u09CD\u09AF\u09BE\u09B8\u09BF\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u099F \u0989\u09A4\u09CD\u09A4\u09B0:**
${offlineText}`
      });
    }
    console.warn("Gemini Server Error (Falling back to simulator mode):", error.message || error);
    res.json({ text: offlineText });
  }
});
app.post("/api/gemini/spark-planner", async (req, res) => {
  const { destination, days = 3 } = req.body;
  if (!destination) {
    return res.status(400).json({ error: "Destination is required" });
  }
  const cleanDestination = destination.trim();
  const getOfflineText = () => `### \u2728 \u099C\u09C7\u09AE\u09BF\u09A8\u09BF \u09B8\u09CD\u09AA\u09BE\u09B0\u09CD\u0995 \u099F\u09CD\u09AF\u09C1\u09B0 \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u09A8\u09BE\u09B0: ${cleanDestination} \u2728 (\u09B8\u09BF\u09AE\u09C1\u09B2\u09C7\u09B6\u09A8 \u09AE\u09CB\u09A1)
        
*\u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u09B2\u09BE\u0987\u09AD \u09AD\u09CD\u09B0\u09AE\u09A3\u09C7\u09B0 \u09AA\u09B0\u09BF\u0995\u09B2\u09CD\u09AA\u09A8\u09BE \u099C\u09C7\u09A8\u09BE\u09B0\u09C7\u099F \u0995\u09B0\u09A4\u09C7 \u09AA\u09CD\u09B0\u099C\u09C7\u0995\u09CD\u099F\u09C7\u09B0 **Settings > Secrets** \u09A5\u09C7\u0995\u09C7 **GEMINI_API_KEY** \u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09C1\u09A8\u0964*

#### \u{1F5FA}\uFE0F \u0986\u0995\u09B0\u09CD\u09B7\u09A3\u09C0\u09DF \u09B8\u09CD\u09A5\u09BE\u09A8\u09B8\u09AE\u09C2\u09B9 (Top Attractions)
\u09E7. **\u09AA\u09CD\u09B0\u09A7\u09BE\u09A8 \u09B8\u09CD\u09AA\u099F**: ${cleanDestination} \u098F\u09B2\u09BE\u0995\u09BE\u09B0 \u09B8\u09AC\u099A\u09C7\u09DF\u09C7 \u09B8\u09C7\u09B0\u09BE \u098F\u09AC\u0982 \u099C\u09A8\u09AA\u09CD\u09B0\u09BF\u09DF \u09A6\u09B0\u09CD\u09B6\u09A8\u09C0\u09DF \u09B8\u09CD\u09A5\u09BE\u09A8\u0997\u09C1\u09B2\u09CB \u0998\u09C1\u09B0\u09C7 \u09A6\u09C7\u0996\u09C1\u09A8\u0964
\u09E8. **\u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u09AE\u09A8\u09CB\u09B0\u09AE \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6**: \u09A8\u09A6\u09C0, \u09B8\u09AC\u09C1\u099C \u09AA\u09CD\u09B0\u0995\u09C3\u09A4\u09BF \u0995\u09BF\u0982\u09AC\u09BE \u09AA\u09BE\u09B9\u09BE\u09DC\u09C7\u09B0 \u0985\u09AA\u09B0\u09C2\u09AA \u09AE\u09BF\u09B2\u09A8 \u0989\u09AA\u09AD\u09CB\u0997 \u0995\u09B0\u09C1\u09A8\u0964
\u09E9. **\u0990\u09A4\u09BF\u09B9\u09BE\u09B8\u09BF\u0995 \u09AC\u09BE \u09B8\u09BE\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF\u0995 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF**: \u0985\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09AE\u09C2\u09B2 \u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF \u098F\u09AC\u0982 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09A8\u09BF\u09A6\u09B0\u09CD\u09B6\u09A8\u09C7\u09B0 \u0996\u09CB\u0981\u099C \u0995\u09B0\u09C1\u09A8\u0964

#### \u{1F372} \u09B8\u09CD\u09A5\u09BE\u09A8\u09C0\u09DF \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u0996\u09BE\u09AC\u09BE\u09B0
- \u09B8\u09CD\u09A5\u09BE\u09A8\u09C0\u09DF \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u0993 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0996\u09BE\u09AC\u09BE\u09B0\u0997\u09C1\u09B2\u09CB\u09B0 \u0985\u09A8\u09A8\u09CD\u09AF \u09B8\u09CD\u09AC\u09BE\u09A6 \u09AA\u09B0\u0996 \u0995\u09B0\u09A4\u09C7 \u09AD\u09C1\u09B2\u09AC\u09C7\u09A8 \u09A8\u09BE!

#### \u{1F4A1} \u099F\u09BF\u0995\u09BF\u099F \u09B2\u09BE\u0997\u09AC\u09C7 \u099F\u09CD\u09B0\u09BE\u09AD\u09C7\u09B2\u09BE\u09B0 \u099F\u09BF\u09AA\u09B8
- \u09AD\u09CD\u09B0\u09AE\u09A3\u09C7\u09B0 \u09B8\u09AE\u09DF\u09C7 \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u09C0\u09DF \u0995\u09BE\u0997\u099C\u09AA\u09A4\u09CD\u09B0 \u098F\u09AC\u0982 \u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4 \u09B8\u09C1\u09B0\u0995\u09CD\u09B7\u09BE\u09B0 \u0994\u09B7\u09A7 \u09B8\u0999\u09CD\u0997\u09C7 \u09B0\u09BE\u0996\u09C1\u09A8\u0964
- \u09AC\u09BE\u09B8\u09C7\u09B0 \u099F\u09BF\u0995\u09C7\u099F \u0985\u0997\u09CD\u09B0\u09BF\u09AE \u09AC\u09C1\u0995 \u0995\u09B0\u09C1\u09A8 **\u099F\u09BF\u0995\u09BF\u099F \u09B2\u09BE\u0997\u09AC\u09C7** \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09AB\u09B0\u09CD\u09AE \u09A5\u09C7\u0995\u09C7!`;
  try {
    const client = getGeminiClient();
    if (!client) {
      return res.json({ text: getOfflineText() });
    }
    const prompt = `Create a spectacular travel guide and itinerary for a ${days}-day trip to ${cleanDestination}. 
The response MUST be written in beautiful, encouraging Bengali (\u09AC\u09BE\u0982\u09B2\u09BE) language with English headings/keys parsed elegantly (Benglish/Bengali mix).
Structure the guide with the following sections using styled markdown support:
1. **\u2728 Overview & Vibe (\u09B8\u0982\u0995\u09CD\u09B7\u09BF\u09AA\u09CD\u09A4 \u09A7\u09BE\u09B0\u09A3\u09BE \u0993 \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6)**
2. **\u{1F5FA}\uFE0F Top 3 Must-Visit Attractions (\u0985\u09AC\u09B6\u09CD\u09AF\u0987 \u09A6\u09B0\u09CD\u09B6\u09A8\u09C0\u09AF\u09BC \u09E9\u099F\u09BF \u09B8\u09CD\u09A5\u09BE\u09A8)** \u2014 with brief, exciting description for each.
3. **\u{1F372} Famous Local Delecasies (\u09B8\u09CD\u09A5\u09BE\u09A8\u09C0\u09AF\u09BC \u099C\u09BF\u09AD\u09C7 \u099C\u09B2 \u0986\u09A8\u09BE \u0996\u09BE\u09AC\u09BE\u09B0)** \u2014 2-3 local food suggestions.
4. **\u{1F4C5} Day-by-Day Travel Itinerary (\u09A6\u09BF\u09A8\u09AD\u09BF\u09A4\u09CD\u09A4\u09BF\u0995 \u09AD\u09CD\u09B0\u09AE\u09A3 \u09AA\u09B0\u09BF\u0995\u09B2\u09CD\u09AA\u09A8\u09BE)** \u2014 outline of Day 1, Day 2, Day 3 shortly.
5. **\u{1F4A1} Pro-Tips for Ticket Lagbe Travelers (\u0997\u09C1\u09B0\u09C1\u09A4\u09CD\u09AC\u09AA\u09C2\u09B0\u09CD\u09A3 \u099F\u09BF\u09AA\u09B8)** \u2014 with 2 helpful suggestions.

Keep the output concise, energetic, easy to read, with spacious margins.`;
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Gemini Spark \u2728, the ultimate tour advisor integrated inside 'Ticket Lagbe' bus booking platform. You suggest incredibly engaging travel tips, food options, plans, and itinerary detail in Bengali.",
        temperature: 0.7
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    const errorStr = String(error.message || error);
    const isApiKeyError = errorStr.includes("API key not valid") || errorStr.includes("API_KEY_INVALID") || errorStr.includes("INVALID_ARGUMENT") || errorStr.includes("key");
    if (isApiKeyError) {
      console.warn("\u26A0\uFE0F [Gemini Alert] Detected an invalid GEMINI_API_KEY inside Spark Travel Planner. Resetting client cache.");
      geminiClient = null;
      lastKnownApiKey = null;
      return res.json({
        text: `\u26A0\uFE0F **\u098F\u09AA\u09BF\u0986\u0987 \u0995\u09BF \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE (Invalid API Key)** \u26A0\uFE0F

\u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u099C\u09C7\u0995\u09CD\u099F \u09B8\u09C7\u099F\u09BF\u0982\u09B8\u09C7 **Settings > Secrets** \u09AA\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09C7 **GEMINI_API_KEY** \u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7, \u09B8\u09C7\u099F\u09BF \u09B8\u09A0\u09BF\u0995 \u09A8\u09DF (Invalid)\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09A0\u09BF\u0995 \u0997\u09C1\u0997\u09B2 \u099C\u09C7\u09AE\u09BF\u09A8\u09BF \u098F\u09AA\u09BF\u0986\u0987 \u0995\u09BF \u09A6\u09BF\u09A8\u0964

---
${getOfflineText()}`
      });
    }
    console.warn("Gemini Spark Planner error (Falling back to simulator mode):", error.message || error);
    res.json({ text: getOfflineText() });
  }
});
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});
app.post("/api/driver/apply", (req, res) => {
  const { name, phone, address, license_number, profile_image } = req.body;
  if (!name || !phone || !address || !license_number) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  try {
    const result = db.prepare(`
      INSERT INTO driver_applications (name, phone, address, license_number, profile_image)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, phone, address, license_number, profile_image);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/admin/driver/applications", (req, res) => {
  try {
    const applications = db.prepare("SELECT * FROM driver_applications ORDER BY applied_at DESC").all();
    res.json(applications);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/backup", (req, res) => {
  try {
    if (!import_fs.default.existsSync(DB_PATH)) {
      return res.status(404).json({ error: "Database file not found" });
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const backupFilename = `backup-${timestamp}.sqlite`;
    res.download(DB_PATH, backupFilename, (err) => {
      if (err) {
        console.error("Backup download error:", err);
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create backup" });
  }
});
app.post("/api/change-password", (req, res) => {
  const { userId, currentPassword, oldPassword, newPassword } = req.body;
  const passwordToCheck = currentPassword || oldPassword;
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND password = ?").get(userId, passwordToCheck);
  if (user) {
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, userId);
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Incorrect current password" });
  }
});
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const trimmedUsername = username?.trim();
  const trimmedPassword = password?.trim();
  console.log("Login attempt for:", trimmedUsername);
  const user = db.prepare("SELECT * FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND password = ?").get(trimmedUsername, trimmedUsername, trimmedPassword);
  if (user) {
    console.log("Login successful for:", user.username);
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profile_image: user.profile_image,
        member_since: user.member_since,
        counterId: user.counter_id,
        ownerId: user.owner_id
      }
    });
  } else {
    console.log("Login failed for:", username);
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});
app.post("/api/register", (req, res) => {
  const { username, password, name, email, phone = "", address = "", role = "user", counter_id = null, owner_id = null } = req.body;
  try {
    const info = db.prepare(`
      INSERT INTO users (username, password, name, email, phone, address, role, counter_id, owner_id, member_since) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(username, password, name, email, phone, address, role, counter_id, owner_id);
    res.json({ success: true, userId: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
app.post("/api/change-password", (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND password = ?").get(userId, oldPassword);
  if (user) {
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, userId);
    res.json({ success: true, message: "Password updated successfully" });
  } else {
    res.status(400).json({ success: false, message: "Invalid old password" });
  }
});
app.get("/api/transactions", (req, res) => {
  const { userId } = req.query;
  let query = "SELECT * FROM transactions";
  let params = [];
  if (userId) {
    query += " WHERE user_id = ?";
    params.push(userId);
  }
  query += " ORDER BY transaction_date DESC";
  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});
app.get("/api/bus-location/:id", (req, res) => {
  const locations = [
    { lat: 23.8103, lng: 90.4125, status: "On Time", speed: "45 km/h", nextStop: "Gazipur" },
    { lat: 24.3636, lng: 88.6241, status: "Delayed", speed: "30 km/h", nextStop: "Rajshahi" },
    { lat: 22.3569, lng: 91.7832, status: "On Time", speed: "55 km/h", nextStop: "Chattogram" }
  ];
  const location = locations[Math.floor(Math.random() * locations.length)];
  res.json(location);
});
app.get("/api/buses", async (req, res) => {
  const { ownerId, lang = "en" } = req.query;
  const nameField = lang === "bn" ? "COALESCE(name_bn, name)" : "COALESCE(name_en, name)";
  try {
    let query = `SELECT id, ${nameField} as name, name_en, name_bn, reg_no as regNo, driver, driver_phone as driverPhone, status, route, last_maintenance as lastMaintenance, next_maintenance as nextMaintenance, capacity, owner_id as ownerId, image_url as imageUrl FROM buses`;
    let params = [];
    if (ownerId) {
      query += " WHERE owner_id = ?";
      params.push(ownerId);
    }
    const buses = db.prepare(query).all(...params);
    res.json(buses);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/buses", async (req, res) => {
  const { name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id = null, image_url = null } = req.body;
  try {
    let busId;
    if (firestore) {
      try {
        const docRef = await (0, import_firestore.addDoc)((0, import_firestore.collection)(firestore, "buses"), {
          name,
          name_en,
          name_bn,
          reg_no,
          driver,
          driver_phone,
          status,
          route,
          last_maintenance,
          next_maintenance,
          capacity,
          owner_id,
          image_url,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        busId = docRef.id;
      } catch (clientErr) {
        console.warn("Firestore bus add failed, using local ID fallback:", clientErr.message);
        busId = `local_${Date.now()}`;
      }
    } else {
      busId = `local_${Date.now()}`;
    }
    db.prepare("INSERT INTO buses (id, name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(busId, name, name_en || name, name_bn || name, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url);
    res.json({ id: busId });
  } catch (error) {
    console.error("Error creating bus:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.put("/api/buses/:id", async (req, res) => {
  const { name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url } = req.body;
  const { id } = req.params;
  try {
    if (firestore) {
      try {
        await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestore, "buses", id), {
          name,
          name_en,
          name_bn,
          reg_no,
          driver,
          driver_phone,
          status,
          route,
          last_maintenance,
          next_maintenance,
          capacity,
          owner_id,
          image_url,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }, { merge: true });
      } catch (clientErr) {
        console.warn("Firestore bus update failed:", clientErr.message);
      }
    }
    db.prepare("UPDATE buses SET name = ?, name_en = ?, name_bn = ?, reg_no = ?, driver = ?, driver_phone = ?, status = ?, route = ?, last_maintenance = ?, next_maintenance = ?, capacity = ?, owner_id = ?, image_url = ? WHERE id = ?").run(name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url, id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating bus:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.delete("/api/buses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (firestore) {
      try {
        await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(firestore, "buses", id));
      } catch (clientErr) {
        console.warn("Firestore bus delete failed:", clientErr.message);
      }
    }
    db.prepare("DELETE FROM buses WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/counters", (req, res) => {
  const { ownerId, lang = "en" } = req.query;
  const nameField = lang === "bn" ? "COALESCE(name_bn, name)" : "COALESCE(name_en, name)";
  const locationField = lang === "bn" ? "COALESCE(location_bn, location)" : "COALESCE(location_en, location)";
  let query = `SELECT id, ${nameField} as name, name_en, name_bn, ${locationField} as location, location_en, location_bn, phone, owner_id as ownerId FROM counters`;
  let params = [];
  if (ownerId) {
    query += " WHERE owner_id = ?";
    params.push(ownerId);
  }
  const counters = db.prepare(query).all(...params);
  res.json(counters);
});
app.post("/api/counters", (req, res) => {
  const { name, name_en, name_bn, location, location_en, location_bn, phone, owner_id = null } = req.body;
  const info = db.prepare("INSERT INTO counters (name, name_en, name_bn, location, location_en, location_bn, phone, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(name, name_en || name, name_bn || name, location, location_en || location, location_bn || location, phone, owner_id);
  res.json({ id: info.lastInsertRowid });
});
app.put("/api/counters/:id", (req, res) => {
  const { name, name_en, name_bn, location, location_en, location_bn, phone, owner_id } = req.body;
  db.prepare("UPDATE counters SET name = ?, name_en = ?, name_bn = ?, location = ?, location_en = ?, location_bn = ?, phone = ?, owner_id = ? WHERE id = ?").run(name, name_en, name_bn, location, location_en, location_bn, phone, owner_id, req.params.id);
  res.json({ success: true });
});
app.delete("/api/counters/:id", (req, res) => {
  db.prepare("DELETE FROM counters WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});
app.get("/api/routes", (req, res) => {
  const { lang = "en" } = req.query;
  const fromField = lang === "bn" ? "COALESCE(from_city_bn, from_city)" : "COALESCE(from_city_en, from_city)";
  const toField = lang === "bn" ? "COALESCE(to_city_bn, to_city)" : "COALESCE(to_city_en, to_city)";
  try {
    const routes = db.prepare(`SELECT id, ${fromField} as "from", from_city_en, from_city_bn, ${toField} as "to", to_city_en, to_city_bn, distance, duration, fare, status FROM routes`).all();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/routes", async (req, res) => {
  const { from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status } = req.body;
  try {
    let routeId;
    if (firestore) {
      try {
        const docRef = await (0, import_firestore.addDoc)((0, import_firestore.collection)(firestore, "routes"), {
          from_city,
          from_city_en,
          from_city_bn,
          to_city,
          to_city_en,
          to_city_bn,
          distance,
          duration,
          fare,
          status,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        routeId = docRef.id;
      } catch (clientErr) {
        console.warn("Firestore route add failed, using local ID fallback:", clientErr.message);
        routeId = `local_route_${Date.now()}`;
      }
    } else {
      routeId = `local_route_${Date.now()}`;
    }
    db.prepare("INSERT INTO routes (id, from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(routeId, from_city, from_city_en || from_city, from_city_bn || from_city, to_city, to_city_en || to_city, to_city_bn || to_city, distance, duration, fare, status);
    res.json({ id: routeId });
  } catch (error) {
    console.error("Error creating route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.put("/api/routes/:id", async (req, res) => {
  const { from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status } = req.body;
  const { id } = req.params;
  try {
    if (firestore) {
      try {
        await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestore, "routes", id), {
          from_city,
          from_city_en,
          from_city_bn,
          to_city,
          to_city_en,
          to_city_bn,
          distance,
          duration,
          fare,
          status,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }, { merge: true });
      } catch (clientErr) {
        console.warn("Firestore route update failed, continuing with local:", clientErr.message);
      }
    }
    db.prepare("UPDATE routes SET from_city = ?, from_city_en = ?, from_city_bn = ?, to_city = ?, to_city_en = ?, to_city_bn = ?, distance = ?, duration = ?, fare = ?, status = ? WHERE id = ?").run(from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status, id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.delete("/api/routes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (firestore) {
      try {
        await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(firestore, "routes", id));
      } catch (clientErr) {
        console.warn("Firestore route delete failed, continuing with local:", clientErr.message);
      }
    }
    db.prepare("DELETE FROM routes WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/users", (req, res) => {
  const { ownerId, role } = req.query;
  let query = `
    SELECT 
      u.id, u.username, u.role, u.name, u.email, u.phone, u.password,
      u.counter_id as counterId, u.owner_id as ownerId,
      c.name as counterName
    FROM users u
    LEFT JOIN counters c ON u.counter_id = c.id
  `;
  let params = [];
  let conditions = [];
  if (ownerId) {
    conditions.push("u.owner_id = ?");
    params.push(ownerId);
  }
  if (role) {
    conditions.push("u.role = ?");
    params.push(role);
  }
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  const users = db.prepare(query).all(...params);
  res.json(users);
});
app.put("/api/users/:id", (req, res) => {
  const { name, email, role, counter_id, owner_id, phone, password } = req.body;
  try {
    const existingUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const updatedName = name !== void 0 ? name : existingUser.name;
    const updatedEmail = email !== void 0 ? email : existingUser.email;
    const updatedRole = role !== void 0 ? role : existingUser.role;
    const updatedCounterId = counter_id !== void 0 ? counter_id : existingUser.counter_id;
    const updatedOwnerId = owner_id !== void 0 ? owner_id : existingUser.owner_id;
    const updatedPhone = phone !== void 0 ? phone : existingUser.phone;
    const updatedPassword = password !== void 0 ? password : existingUser.password;
    db.prepare("UPDATE users SET name = ?, email = ?, role = ?, counter_id = ?, owner_id = ?, phone = ?, password = ? WHERE id = ?").run(updatedName, updatedEmail, updatedRole, updatedCounterId, updatedOwnerId, updatedPhone, updatedPassword, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
app.delete("/api/users/:id", (req, res) => {
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});
function cleanupExpiredReservations() {
  try {
    db.prepare(`
      UPDATE bookings 
      SET status = 'Cancelled' 
      WHERE status = 'Reserved' 
      AND datetime(booking_date) < datetime('now', '-24 hours')
    `).run();
  } catch (err) {
    console.error("Error cleaning up expired reservations:", err);
  }
}
app.get("/api/bookings", (req, res) => {
  cleanupExpiredReservations();
  const { ownerId } = req.query;
  try {
    let query = `
      SELECT 
        b.id, 
        b.passenger_name as passenger, 
        b.phone_number as phone, 
        b.passenger_id as passengerId,
        b.address,
        b.passengers_json as passengersJson,
        bus.name as bus,
        bus.name as busName, 
        b.route, 
        b.time, 
        b.travel_date as travelDate,
        b.seats, 
        b.booking_date as date, 
        b.status, 
        b.amount,
        b.counter,
        b.staff
      FROM bookings b
      LEFT JOIN buses bus ON b.bus_id = bus.id
    `;
    let params = [];
    if (ownerId) {
      query += " WHERE bus.owner_id = ?";
      params.push(ownerId);
    }
    const bookings = db.prepare(query).all(...params);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/bookings", (req, res) => {
  const { user_id, passenger_name, phone_number, passenger_id, address, bus_id, route, time, travel_date, seats, status, amount, counter, staff, passengers_json } = req.body;
  try {
    const info = db.prepare(`
      INSERT INTO bookings (user_id, passenger_name, phone_number, passenger_id, address, bus_id, route, time, travel_date, seats, status, amount, counter, staff, passengers_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, passenger_name, phone_number, passenger_id, address, bus_id, route, time, travel_date, seats, status, amount, counter, staff, passengers_json);
    const bookingId = info.lastInsertRowid;
    const cleanAmount = parseFloat(amount.toString().replace(/[৳,]/g, "")) || 0;
    if (user_id) {
      addLedgerEntry(user_id, `Bus Booking: ${route} (${seats})`, String(bookingId), "Booking", cleanAmount, 0);
    }
    const bus = db.prepare("SELECT owner_id FROM buses WHERE id = ?").get(bus_id);
    if (bus?.owner_id && (!counter || counter === "Online")) {
      addLedgerEntry(bus.owner_id, `Online Booking: ${route} (${seats}) - ${passenger_name}`, String(bookingId), "Booking", cleanAmount, 0);
    }
    const newBooking = db.prepare("SELECT booking_date FROM bookings WHERE id = ?").get(bookingId);
    res.json({ id: bookingId, booking_date: newBooking?.booking_date });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});
app.put("/api/bookings/:id", (req, res) => {
  const { status } = req.body;
  try {
    db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
app.delete("/api/bookings/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM bookings WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/schedules", (req, res) => {
  try {
    const schedules = db.prepare(`
      SELECT 
        s.*, 
        b.name as busName, 
        r.from_city as routeFrom, 
        r.to_city as routeTo,
        r.fare
      FROM schedules s
      JOIN buses b ON s.bus_id = b.id
      JOIN routes r ON s.route_id = r.id
    `).all();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/schedules", async (req, res) => {
  const { bus_id, route_id, departure_time, arrival_time, date, status, available_seats } = req.body;
  try {
    let scheduleId;
    if (firestore) {
      try {
        const docRef = await (0, import_firestore.addDoc)((0, import_firestore.collection)(firestore, "schedules"), {
          bus_id,
          route_id,
          departure_time,
          arrival_time,
          date,
          status,
          available_seats,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        scheduleId = docRef.id;
      } catch (clientErr) {
        console.warn("Firestore schedule add failed, using local ID fallback:", clientErr.message);
        scheduleId = `local_schedule_${Date.now()}`;
      }
    } else {
      scheduleId = `local_schedule_${Date.now()}`;
    }
    db.prepare("INSERT INTO schedules (id, bus_id, route_id, departure_time, arrival_time, date, status, available_seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(scheduleId, bus_id.toString(), route_id.toString(), departure_time, arrival_time, date, status, available_seats);
    res.json({ id: scheduleId });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
app.put("/api/schedules/:id", async (req, res) => {
  const { bus_id, route_id, departure_time, arrival_time, date, status, available_seats } = req.body;
  const { id } = req.params;
  try {
    if (firestore) {
      try {
        await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestore, "schedules", id), {
          bus_id,
          route_id,
          departure_time,
          arrival_time,
          date,
          status,
          available_seats,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }, { merge: true });
      } catch (clientErr) {
        console.warn("Firestore schedule update failed:", clientErr.message);
      }
    }
    db.prepare("UPDATE schedules SET bus_id = ?, route_id = ?, departure_time = ?, arrival_time = ?, date = ?, status = ?, available_seats = ? WHERE id = ?").run(bus_id.toString(), route_id.toString(), departure_time, arrival_time, date, status, available_seats, id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
app.delete("/api/schedules/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (firestore) {
      try {
        await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(firestore, "schedules", id));
      } catch (clientErr) {
        console.warn("Firestore schedule delete failed:", clientErr.message);
      }
    }
    db.prepare("DELETE FROM schedules WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/settings", (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});
app.post("/api/settings", (req, res) => {
  const settings = req.body;
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        stmt.run(key, String(value));
      }
    });
    transaction(settings);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});
app.get("/api/settings/theme", (req, res) => {
  try {
    const keys = [
      "theme_mode",
      "color_primary",
      "color_secondary",
      "color_text",
      "color_bg",
      "custom_css",
      "font_family",
      "base_font_size"
    ];
    const settings = db.prepare("SELECT * FROM settings WHERE key IN (?, ?, ?, ?, ?, ?, ?, ?)").all(keys);
    const themeSettings = {
      theme_mode: "light",
      color_primary: "#2563eb",
      color_secondary: "#475569",
      color_text: "#0f172a",
      color_bg: "#f8fafc",
      custom_css: "/* Custom styles here */",
      font_family: "Inter",
      base_font_size: "16"
    };
    settings.forEach((s) => {
      themeSettings[s.key] = s.value;
    });
    res.json(themeSettings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch theme settings", details: error.message });
  }
});
app.post("/api/settings/theme", (req, res) => {
  const {
    theme_mode,
    color_primary,
    color_secondary,
    color_text,
    color_bg,
    custom_css,
    font_family,
    base_font_size
  } = req.body;
  if (theme_mode && !["light", "dark", "custom"].includes(theme_mode)) {
    return res.status(400).json({ error: "Invalid theme mode" });
  }
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    const transaction = db.transaction((data) => {
      if (data.theme_mode !== void 0) stmt.run("theme_mode", String(data.theme_mode));
      if (data.color_primary !== void 0) stmt.run("color_primary", String(data.color_primary));
      if (data.color_secondary !== void 0) stmt.run("color_secondary", String(data.color_secondary));
      if (data.color_text !== void 0) stmt.run("color_text", String(data.color_text));
      if (data.color_bg !== void 0) stmt.run("color_bg", String(data.color_bg));
      if (data.custom_css !== void 0) stmt.run("custom_css", String(data.custom_css));
      if (data.font_family !== void 0) stmt.run("font_family", String(data.font_family));
      if (data.base_font_size !== void 0) stmt.run("base_font_size", String(data.base_font_size));
    });
    transaction({
      theme_mode,
      color_primary,
      color_secondary,
      color_text,
      color_bg,
      custom_css,
      font_family,
      base_font_size
    });
    res.json({ success: true, message: "Theme settings updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update theme settings", details: error.message });
  }
});
app.get("/api/accounts/summary", (req, res) => {
  try {
    cleanupExpiredReservations();
    const totalSales = db.prepare("SELECT SUM(CAST(REPLACE(REPLACE(amount, '\u09F3', ''), ',', '') AS INTEGER)) as total FROM bookings WHERE status != 'Cancelled'").get();
    const onlineSales = db.prepare("SELECT SUM(CAST(REPLACE(REPLACE(amount, '\u09F3', ''), ',', '') AS INTEGER)) as total FROM bookings WHERE (counter IS NULL OR counter = 'Online') AND status != 'Cancelled'").get();
    const counterSales = db.prepare("SELECT SUM(CAST(REPLACE(REPLACE(amount, '\u09F3', ''), ',', '') AS INTEGER)) as total FROM bookings WHERE counter IS NOT NULL AND counter != 'Online' AND status != 'Cancelled'").get();
    const totalPaidToOwners = db.prepare("SELECT SUM(amount) as total FROM payments_to_owners").get();
    res.json({
      totalSales: totalSales.total || 0,
      onlineSales: onlineSales.total || 0,
      counterSales: counterSales.total || 0,
      totalPaidToOwners: totalPaidToOwners.total || 0,
      netBalance: (onlineSales.total || 0) - (totalPaidToOwners.total || 0)
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch account summary" });
  }
});
app.post("/api/payment/initiate", async (req, res) => {
  const { bookingId, amount } = req.body;
  try {
    const settings = db.prepare("SELECT * FROM settings").all();
    const config = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    if (!config.ssl_store_id || !config.ssl_store_password) {
      return res.status(400).json({ error: "SSLCommerz is not configured" });
    }
    const tran_id = `REF${Date.now()}`;
    db.prepare("UPDATE bookings SET transaction_id = ? WHERE id = ?").run(tran_id, bookingId);
    const isSandbox = config.ssl_is_sandbox === "true";
    const baseUrl = isSandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
    res.json({
      success: true,
      gatewayUrl: `${baseUrl}/gwprocess/v4/api.php?store_id=${config.ssl_store_id}&tran_id=${tran_id}&total_amount=${amount}&currency=BDT&success_url=${req.protocol}://${req.get("host")}/api/payment/success&fail_url=${req.protocol}://${req.get("host")}/api/payment/fail&cancel_url=${req.protocol}://${req.get("host")}/api/payment/cancel`
    });
  } catch (error) {
    res.status(500).json({ error: "Payment initiation failed" });
  }
});
app.post("/api/payment/success", (req, res) => {
  const { tran_id } = req.body;
  try {
    db.prepare("UPDATE bookings SET payment_status = 'Paid', status = 'Confirmed' WHERE transaction_id = ?").run(tran_id);
    res.redirect("/payment-success");
  } catch (error) {
    res.redirect("/payment-error");
  }
});
app.get("/api/menus", (req, res) => {
  try {
    const menus = db.prepare("SELECT * FROM menus ORDER BY order_index ASC").all();
    res.json(menus);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/menus", (req, res) => {
  const { label_en, label_bn, path: path2, order_index } = req.body;
  try {
    const info = db.prepare("INSERT INTO menus (label_en, label_bn, path, order_index) VALUES (?, ?, ?, ?)").run(label_en, label_bn, path2, order_index);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
app.put("/api/menus/:id", (req, res) => {
  const { label_en, label_bn, path: path2, order_index, is_active } = req.body;
  try {
    db.prepare("UPDATE menus SET label_en = ?, label_bn = ?, path = ?, order_index = ?, is_active = ? WHERE id = ?").run(label_en, label_bn, path2, order_index, is_active, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
app.post("/api/menus/reorder", (req, res) => {
  const { items } = req.body;
  try {
    const updateStmt = db.prepare("UPDATE menus SET order_index = ? WHERE id = ?");
    const transaction = db.transaction((items2) => {
      for (const item of items2) {
        updateStmt.run(item.order_index, item.id);
      }
    });
    transaction(items);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.delete("/api/menus/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM menus WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get("/api/owner-payments", (req, res) => {
  const { owner_id } = req.query;
  try {
    let payments;
    if (owner_id) {
      payments = db.prepare("SELECT * FROM payments_to_owners WHERE owner_id = ? ORDER BY payment_date DESC").all(owner_id);
    } else {
      payments = db.prepare("SELECT * FROM payments_to_owners ORDER BY payment_date DESC").all();
    }
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});
app.post("/api/owner-payments", (req, res) => {
  const { owner_id, amount, reference } = req.body;
  if (!owner_id || !amount) {
    return res.status(400).json({ error: "Owner ID and amount are required" });
  }
  try {
    const result = db.prepare("INSERT INTO payments_to_owners (owner_id, amount, reference) VALUES (?, ?, ?)").run(owner_id, amount, reference || "");
    const paymentId = result.lastInsertRowid;
    addLedgerEntry(owner_id, `Payment Received: ${reference || "Owner Payment"}`, String(paymentId), "OwnerPayment", 0, amount);
    res.json({ id: paymentId });
  } catch (error) {
    res.status(500).json({ error: "Failed to record payment" });
  }
});
app.get(["/api/ledger", "/api/ledger-entries"], (req, res) => {
  const userId = req.query.userId || req.query.owner_id;
  try {
    let query = "SELECT * FROM ledger";
    let params = [];
    if (userId) {
      query += " WHERE user_id = ?";
      params.push(userId);
    }
    query += " ORDER BY date DESC";
    const entries = db.prepare(query).all(...params);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
var updateMockLocations = async () => {
  const buses = [
    { id: "1", route: "Dhaka - Chattogram", stops: ["Gazipur", "Comilla", "Feni", "Chattogram"] },
    { id: "2", route: "Dhaka - Sylhet", stops: ["Narsingdi", "Bhairab", "Habiganj", "Sylhet"] }
  ];
  for (const bus of buses) {
    const randomStop = bus.stops[Math.floor(Math.random() * bus.stops.length)];
    const randomSpeed = Math.floor(Math.random() * 40) + 40;
    const statuses = ["On Time", "On Time", "Delayed", "On Time"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const locationData = {
      busId: bus.id,
      lat: 23.8103 + (Math.random() - 0.5) * 0.1,
      lng: 90.4125 + (Math.random() - 0.5) * 0.1,
      status: randomStatus,
      speed: `${randomSpeed} km/h`,
      nextStop: randomStop,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      let updateSuccessful = false;
      if (io) {
        io.emit("bus_location_update", locationData);
        console.log(`Emitted mock location for bus ${bus.id} via WebSockets`);
      }
      if (firestore) {
        try {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestore, "bus_locations", bus.id), locationData);
          console.log(`Updated mock location for bus ${bus.id} via Client SDK`);
          updateSuccessful = true;
        } catch (clientError) {
          console.error(`Client SDK update failed for bus ${bus.id}:`, clientError.message);
        }
      }
      if (!updateSuccessful && firestoreAdmin) {
        try {
          await firestoreAdmin.collection("bus_locations").doc(bus.id).set(locationData);
          console.log(`Updated mock location for bus ${bus.id} via Admin SDK`);
          updateSuccessful = true;
        } catch (adminError) {
          if (adminError.code === 7 || adminError.message?.includes("PERMISSION_DENIED")) {
            console.warn(`Admin SDK permission denied for bus ${bus.id} update. This is expected in some sandboxed environments.`);
          } else {
            console.error(`Admin SDK update failed for bus ${bus.id}:`, adminError.message);
          }
        }
      }
      if (!updateSuccessful) {
        console.error(`All firestore update attempts failed for bus ${bus.id}`);
      }
    } catch (error) {
      console.error(`Unexpected error in updateMockLocations for bus ${bus.id}:`, error);
    }
  }
};
setInterval(updateMockLocations, 5e3);
updateMockLocations();
io.on("connection", (socket) => {
  console.log("Client connected to WebSocket:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected from WebSocket");
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.use("/uploads", import_express.default.static(import_path.default.join(process.cwd(), "uploads")));
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
