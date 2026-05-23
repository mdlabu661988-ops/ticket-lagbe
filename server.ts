import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import fs from 'fs';
import dotenv from 'dotenv';
import multer from 'multer';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp as initializeAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getFirestore as getFirestoreAdmin } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.use(express.json());
const DB_PATH = path.join(process.cwd(), 'database.sqlite');

// Initialize Firebase Admin
let firestoreAdmin: any;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    const adminApp = getAdminApps().length === 0 
      ? initializeAdminApp({ 
          projectId: firebaseConfig.projectId 
        })
      : getAdminApps()[0];
    
    const dbId = firebaseConfig.firestoreDatabaseId;
    console.log(`Initializing Firestore Admin. Project: ${firebaseConfig.projectId}, Database: ${dbId || '(default)'}`);
    
    if (dbId) {
      firestoreAdmin = getFirestoreAdmin(adminApp, dbId);
    } else {
      firestoreAdmin = getFirestoreAdmin(adminApp);
    }
    
    console.log('Firebase Admin initialized successfully');
    
    // Sync logic
    const syncFromFirestore = async () => {
      try {
        console.log('Syncing data from Firestore to SQLite...');
        const collections = ['buses', 'routes', 'schedules'];
        
        for (const col of collections) {
          let snapshot: any = null;
          let syncSuccessful = false;

          // Try Admin SDK first
          if (firestoreAdmin) {
            try {
              snapshot = await firestoreAdmin.collection(col).get();
              console.log(`Fetched ${col} via Admin SDK`);
              syncSuccessful = true;
            } catch (adminError: any) {
              if (adminError.code === 7 || adminError.message?.includes('PERMISSION_DENIED')) {
                console.warn(`Admin SDK sync permission denied for ${col}. Will use fallback.`);
              } else {
                console.error(`Admin SDK sync failed for ${col}:`, adminError.message);
              }
            }
          }

          // Fallback to Client SDK
          if (!syncSuccessful && firestore) {
            try {
              console.warn(`Falling back to Client SDK for ${col} sync`);
              const clientSnapshot = await getDocs(collection(firestore, col));
              // Convert client snapshot to a format we can use like the admin one
              snapshot = clientSnapshot.docs.map(d => ({
                id: d.id,
                data: () => d.data()
              }));
              console.log(`Fetched ${col} via Client SDK`);
              syncSuccessful = true;
            } catch (clientError: any) {
              console.error(`Client SDK sync failed for ${col}:`, clientError.message);
            }
          }

          if (snapshot && syncSuccessful) {
            snapshot.forEach((doc: any) => {
              const data = doc.data();
              const id = doc.id;
              if (col === 'buses') {
                db.prepare('INSERT OR REPLACE INTO buses (id, name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                  .run(id, data.name, data.name_en || data.name, data.name_bn || data.name, data.reg_no, data.driver, data.driver_phone, data.status, data.route, data.last_maintenance, data.next_maintenance, data.capacity, data.owner_id, data.image_url);
              } else if (col === 'routes') {
                db.prepare('INSERT OR REPLACE INTO routes (id, from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                  .run(id, data.from_city, data.from_city_en || data.from_city, data.from_city_bn || data.from_city, data.to_city, data.to_city_en || data.to_city, data.to_city_bn || data.to_city, data.distance, data.duration, data.fare, data.status);
              } else if (col === 'schedules') {
                db.prepare('INSERT OR REPLACE INTO schedules (id, bus_id, route_id, departure_time, arrival_time, date, status, available_seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                  .run(id, data.bus_id, data.route_id, data.departure_time, data.arrival_time, data.date, data.status, data.available_seats);
              }
            });
          }
        }
        console.log('Firestore sync complete');
      } catch (error) {
        console.error('Firestore sync failed with unexpected error:', error);
      }
    };
    syncFromFirestore();
  }
} catch (error) {
  console.error('Firebase Admin initialization failed:', error);
}

// Initialize Firebase for mock tracking (keep existing for backward compatibility)
let firebaseApp: any;
let firestore: any;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    firebaseApp = initializeApp(firebaseConfig);
    firestore = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log('Firebase initialized successfully');
  } else {
    console.warn('firebase-applet-config.json not found');
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

// Initialize SQLite
let db: Database.Database;
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
} catch (error) {
  console.error('Database connection failed:', error);
  process.exit(1); // Exit if DB fails as it's critical
}

// Seed default users if they don't exist
try {
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get('admin', 'admin@ticketlagbe.com') as any;
  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (username, password, role, name, email, phone, address, member_since)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run('admin', 'admin123', 'admin', 'System Admin', 'admin@ticketlagbe.com', '', '');
    console.log('✓ Default admin user created (admin / admin123)');
  }
} catch (error) {
  console.error('Error seeding default users:', error);
}

// Ledger Helper
function addLedgerEntry(userId: number | null, description: string, referenceId: string, referenceType: string, debit: number, credit: number) {
  try {
    const lastBalance = db.prepare('SELECT balance FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId) as any;
    const currentBalance = (lastBalance?.balance || 0) + (debit - credit);
    db.prepare(`
      INSERT INTO ledger (user_id, description, reference_id, reference_type, debit, credit, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, description, referenceId, referenceType, debit, credit, currentBalance);
  } catch (error) {
    console.error('Error adding ledger entry:', error);
  }
}

// Migration for buses, routes, schedules to TEXT IDs
try {
  const busInfo = db.prepare("PRAGMA table_info(buses)").all() as any[];
  const idType = busInfo.find(c => c.name === 'id')?.type;
  if (idType === 'INTEGER') {
    db.exec(`
      DROP TABLE IF EXISTS schedules;
      DROP TABLE IF EXISTS buses;
      DROP TABLE IF EXISTS routes;
    `);
    console.log('Dropped legacy tables for ID type migration');
  }
} catch (e) {
  // Tables might not exist yet
}

// Create tables if they don't exist
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

// Migration: Remove unique constraint from bank_accounts.owner_id if it exists
try {
  const tableInfo = db.prepare("PRAGMA table_info(bank_accounts)").all() as any[];
  if (tableInfo.length > 0) {
    const indexList = db.prepare("PRAGMA index_list(bank_accounts)").all() as any[];
    const hasUniqueOwnerId = indexList.some(idx => idx.unique === 1); 
    // Recreating the table is the safest way to remove UNIQUE constraints in SQLite
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
      console.log('Successfully migrated bank_accounts table to remove unique constraint');
    }
  }
} catch (error: any) {
  console.error('Migration error for bank_accounts:', error.message);
  try { db.exec('ROLLBACK;'); } catch(e) {}
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
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('heroTitle_bn', 'বাংলাদেশে কর্পোরেট মোবিলিটিতে বিপ্লব আনা');
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('heroSubtitle_en', 'Streamline your employee transportation with our tech-enabled, safe, and reliable corporate mobility solutions.');
  INSERT OR IGNORE INTO corporate_settings (key, value) VALUES ('heroSubtitle_bn', 'আমাদের প্রযুক্তি-নির্ভর, নিরাপদ এবং নির্ভরযোগ্য কর্পোরেট মোবিলিটি সমাধানের মাধ্যমে আপনার কর্মীদের পরিবহন ব্যবস্থা সহজতর করুন।');
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

// Insert mock corporate vehicles
const count = db.prepare('SELECT count(*) as count FROM corporate_vehicles').get() as any;
if (count.count === 0) {
  const insertVehicle = db.prepare('INSERT INTO corporate_vehicles (name, type, image_url, capacity, fare_per_km) VALUES (?, ?, ?, ?, ?)');
  insertVehicle.run('Toyota Axio', 'Sedan', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800', 4, 15);
  insertVehicle.run('Toyota Allion', 'Sedan', 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=800', 4, 18);
  insertVehicle.run('Hiace', 'Microbus', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800', 12, 35);
  insertVehicle.run('Toyota Land Cruiser Prado', 'SUV', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800', 7, 50);
  insertVehicle.run('TATA 407', 'Truck', 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800', 3, 40);
  insertVehicle.run('Eicher Lorry', 'Lorry', 'https://images.unsplash.com/photo-1586339941406-3b048472986f?auto=format&fit=crop&q=80&w=800', 2, 80);
  insertVehicle.run('Mahindra Pickup', 'Pickup', 'https://images.unsplash.com/photo-1591860454448-58133b218406?auto=format&fit=crop&q=80&w=800', 2, 25);
}

// Corporate Vehicles API
app.get('/api/corporate/vehicles', (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM corporate_vehicles';
    const params: any[] = [];
    if (type && type !== 'All') {
      query += ' WHERE type = ?';
      params.push(type);
    }
    const vehicles = db.prepare(query).all(...params);
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Driver Profile API
app.get('/api/corporate/drivers/:userId', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(req.params.userId);
    res.json(profile || { message: 'Profile not found' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/corporate/drivers', (req, res) => {
  const { user_id, bio, experience, license_number, profile_image } = req.body;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO driver_profiles (user_id, bio, experience, license_number, profile_image)
      VALUES (?, ?, ?, ?, ?)
    `).run(user_id, bio, experience, license_number, profile_image);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Corporate Booking API
app.post('/api/corporate/bookings', (req, res) => {
  const { user_id, vehicle_id, pickup_location, drop_location, date, amount, advance_paid, payment_method } = req.body;
  try {
    const info = db.prepare(`
      INSERT INTO corporate_bookings (user_id, vehicle_id, pickup_location, drop_location, date, amount, advance_paid, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, vehicle_id, pickup_location, drop_location, date, amount, advance_paid, payment_method);
    
    const bookingId = info.lastInsertRowid;

    // Add to ledger
    addLedgerEntry(user_id, `Corporate Booking: ${pickup_location} to ${drop_location}`, String(bookingId), 'CorporateBooking', amount, 0);

    // Automatic Assignment Logic (Simple: find an available driver)
    const availableDriver = db.prepare(`
      SELECT user_id FROM driver_profiles 
      ORDER BY RANDOM() LIMIT 1
    `).get() as any;

    if (availableDriver) {
      db.prepare('UPDATE corporate_bookings SET driver_id = ?, status = ? WHERE id = ?')
        .run(availableDriver.user_id, 'Assigned', bookingId);
    }

    res.json({ success: true, bookingId });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Corporate Settings API
app.get('/api/corporate/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM corporate_settings').all() as any[];
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/admin/corporate/settings', (req, res) => {
  const settings = req.body;
  try {
    const insert = db.prepare('INSERT OR REPLACE INTO corporate_settings (key, value) VALUES (?, ?)');
    const transaction = db.transaction((settingsData) => {
      for (const [key, value] of Object.entries(settingsData)) {
        insert.run(key, value);
      }
    });
    transaction(settings);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Corporate Management API
app.get('/api/admin/corporate/bookings', (req, res) => {
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bank Account API
app.get('/api/bank-account/:ownerId', (req, res) => {
  try {
    const bankAccounts = db.prepare('SELECT * FROM bank_accounts WHERE owner_id = ?').all(req.params.ownerId);
    res.json(bankAccounts || []);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/bank-account', (req, res) => {
  const { id, owner_id, bank_name, account_name, account_number, branch_name, routing_number, is_primary } = req.body;
  try {
    console.log('Bank account update/create request:', { id, owner_id, bank_name });
    
    // If setting as primary, unset other primary accounts for this owner
    if (is_primary) {
      db.prepare('UPDATE bank_accounts SET is_primary = 0 WHERE owner_id = ?').run(owner_id);
    }

    if (id) {
      const result = db.prepare(`
        UPDATE bank_accounts 
        SET bank_name = ?, account_name = ?, account_number = ?, branch_name = ?, routing_number = ?, is_primary = ?
        WHERE id = ? AND owner_id = ?
      `).run(bank_name, account_name, account_number, branch_name, routing_number, is_primary ? 1 : 0, id, owner_id);
      
      console.log('Update result:', result);
      if (result.changes === 0) {
        return res.status(404).json({ success: false, message: 'Account not found or owner mismatch' });
      }
    } else {
      const result = db.prepare(`
        INSERT INTO bank_accounts (owner_id, bank_name, account_name, account_number, branch_name, routing_number, is_primary)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(owner_id, bank_name, account_name, account_number, branch_name, routing_number, is_primary ? 1 : 0);
      console.log('Insert result:', result);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Bank Account Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/bank-account/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM bank_accounts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/admin/corporate/drivers', (req, res) => {
  try {
    const drivers = db.prepare(`
      SELECT u.id, u.name, u.phone, dp.experience, dp.license_number
      FROM users u
      JOIN driver_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'driver' OR EXISTS(SELECT 1 FROM driver_profiles WHERE user_id = u.id)
    `).all();
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/admin/corporate/bookings/:id/assign', (req, res) => {
  const { driver_id } = req.body;
  const { id } = req.params;
  try {
    db.prepare('UPDATE corporate_bookings SET driver_id = ?, status = ? WHERE id = ?')
      .run(driver_id, 'Assigned', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Migration for existing users table
// Helper function for safeMigrations
function addColumnIfNotExists(tableName: string, columnName: string, columnDef: string) {
  try {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
    if (!columns.map(c => c.name).includes(columnName)) {
      db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`).run();
    }
  } catch (error: any) {
    if (!error.message?.includes('duplicate column name')) {
      console.error(`Migration error adding ${columnName} to ${tableName}:`, error.message);
    }
  }
}

// Ensure columns exist across tables
addColumnIfNotExists('users', 'phone', 'TEXT');
addColumnIfNotExists('users', 'address', 'TEXT');
addColumnIfNotExists('users', 'profile_image', 'TEXT');
addColumnIfNotExists('users', 'member_since', 'DATETIME');

// Re-run update for member_since if it's null (handles existing rows after migration)
try {
  db.prepare("UPDATE users SET member_since = CURRENT_TIMESTAMP WHERE member_since IS NULL").run();
} catch (e) {}

addColumnIfNotExists('users', 'owner_id', 'INTEGER');

addColumnIfNotExists('bookings', 'phone_number', 'TEXT');
addColumnIfNotExists('bookings', 'seats', 'TEXT');
addColumnIfNotExists('bookings', 'travel_date', 'TEXT');
addColumnIfNotExists('bookings', 'passenger_id', 'TEXT');
addColumnIfNotExists('bookings', 'address', 'TEXT');
addColumnIfNotExists('bookings', 'passengers_json', 'TEXT');
addColumnIfNotExists('bookings', 'payment_status', "TEXT DEFAULT 'Pending'");
addColumnIfNotExists('bookings', 'transaction_id', 'TEXT');

addColumnIfNotExists('buses', 'owner_id', 'INTEGER');
addColumnIfNotExists('buses', 'name_en', 'TEXT');
addColumnIfNotExists('buses', 'name_bn', 'TEXT');
addColumnIfNotExists('buses', 'image_url', 'TEXT');

addColumnIfNotExists('counters', 'owner_id', 'INTEGER');
addColumnIfNotExists('counters', 'name_en', 'TEXT');
addColumnIfNotExists('counters', 'name_bn', 'TEXT');
addColumnIfNotExists('counters', 'location_en', 'TEXT');
addColumnIfNotExists('counters', 'location_bn', 'TEXT');

addColumnIfNotExists('routes', 'from_city_en', 'TEXT');
addColumnIfNotExists('routes', 'from_city_bn', 'TEXT');
addColumnIfNotExists('routes', 'to_city_en', 'TEXT');
addColumnIfNotExists('routes', 'to_city_bn', 'TEXT');

addColumnIfNotExists('corporate_bookings', 'driver_id', 'INTEGER');
addColumnIfNotExists('corporate_bookings', 'advance_paid', 'REAL DEFAULT 0');
addColumnIfNotExists('corporate_bookings', 'payment_method', 'TEXT');
addColumnIfNotExists('driver_applications', 'license_number', 'TEXT');

// User Profile API
app.get('/api/profile/:userId', (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, role, name, email, phone, address, profile_image, member_since FROM users WHERE id = ?').get(req.params.userId) as any;
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, profile: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/profile/:userId', (req, res) => {
  const { name, email, phone, address, profile_image } = req.body;
  try {
    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, phone = ?, address = ?, profile_image = ?
      WHERE id = ?
    `).run(name, email, phone, address, profile_image, req.params.userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Seed some data if empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('admin', 'admin123', 'admin', 'System Admin', 'admin@ticketlagbe.com');

  // Seed some buses
  const insertBus = db.prepare('INSERT INTO buses (id, name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertBus.run('1', 'Hanif-A1', 'Hanif-A1', 'হানিফ-এ১', 'Dhaka Metro-Ba-11-2233', 'Abul Kashem', '01711223344', 'Active', 'Dhaka - Chattogram', '2024-02-15', '2024-05-15', 40);
  insertBus.run('2', 'Ena-B4', 'Ena-B4', 'এনা-বি৪', 'Dhaka Metro-Ba-12-4455', 'Siddiqur Rahman', '01822334455', 'Active', 'Dhaka - Sylhet', '2024-01-20', '2024-04-20', 40);

  // Seed some counters
  const insertCounter = db.prepare('INSERT INTO counters (name, name_en, name_bn, location, location_en, location_bn, phone) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertCounter.run('Mohakhali Counter', 'Mohakhali Counter', 'মহাখালী কাউন্টার', 'Dhaka', 'Dhaka', 'ঢাকা', '01911223344');
  insertCounter.run('Gabtoli Counter', 'Gabtoli Counter', 'গাবতলী কাউন্টার', 'Dhaka', 'Dhaka', 'ঢাকা', '01722334455');

  // Seed some routes
  const insertRoute = db.prepare('INSERT INTO routes (id, from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertRoute.run('1', 'Dhaka', 'Dhaka', 'ঢাকা', 'Chattogram', 'Chattogram', 'চট্টগ্রাম', '240 km', '6h', '700', 'Active');
  insertRoute.run('2', 'Dhaka', 'Dhaka', 'ঢাকা', 'Sylhet', 'Sylhet', 'সিলেট', '250 km', '5h', '600', 'Active');
}

// Ensure the admin user exists and has the correct password
const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@ticketlagbe.com');
if (!adminUser) {
  db.prepare('INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)')
    .run('admin', 'admin123', 'admin', 'System Admin', 'admin@ticketlagbe.com');
} else {
  // Reset admin password to admin123 to ensure login works as requested
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run('admin123', 'admin@ticketlagbe.com');
}

// Seed default menus if empty
const menuCount = db.prepare('SELECT count(*) as count FROM menus').get() as { count: number };
if (menuCount.count === 0) {
  const insertMenu = db.prepare('INSERT INTO menus (label_en, label_bn, path, order_index) VALUES (?, ?, ?, ?)');
  insertMenu.run('Home', 'হোম', '/', 0);
  insertMenu.run('Offers', 'অফার', '#offers', 1);
  insertMenu.run('About Us', 'আমাদের সম্পর্কে', 'about', 2);
  insertMenu.run('Contact', 'যোগাযোগ', 'contact', 3);
}

// Update existing menus if necessary (optional migration)
try {
  db.prepare("UPDATE menus SET path = 'about' WHERE label_en = 'About Us'").run();
  db.prepare("UPDATE menus SET path = 'contact' WHERE label_en = 'Contact'").run();
} catch (e) {}

const allUsers = db.prepare('SELECT username, email, role, password FROM users').all();
console.log('Seeded users with passwords:', allUsers);

// Ensure the specific user mlabu050@gmail.com exists for testing/fixing login
const testUser = db.prepare('SELECT id FROM users WHERE email = ?').get('mlabu050@gmail.com');
if (!testUser) {
  db.prepare('INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)')
    .run('mlabu050@gmail.com', 'password123', 'user', 'Test User', 'mlabu050@gmail.com');
  
  const newUser = db.prepare('SELECT id FROM users WHERE email = ?').get('mlabu050@gmail.com') as any;
  if (newUser) {
    const insertTx = db.prepare('INSERT INTO transactions (user_id, amount, type, method, status) VALUES (?, ?, ?, ?, ?)');
    insertTx.run(newUser.id, '1400', 'Payment', 'bKash', 'Success');
    insertTx.run(newUser.id, '700', 'Payment', 'Nagad', 'Success');
  }
}

// Ensure the mock booking for notification exists
const mockBooking = db.prepare('SELECT id FROM bookings WHERE id = 8824').get();
if (!mockBooking) {
  const insertBooking = db.prepare('INSERT INTO bookings (id, user_id, passenger_name, phone_number, bus_id, route, time, travel_date, seats, status, amount, counter, staff) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertBooking.run(8824, 1, 'Tanvir Rahman', '01711223344', 1, 'Dhaka to Chattogram', '10:00 AM', new Date().toISOString().split('T')[0], 'A1, A2', 'Confirmed', '1400', 'Gabtoli Counter', 'System Admin');
}

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// API Routes
app.get('/api/health', async (req, res) => {
  let firestoreAdminStatus = 'not_initialized';
  let firestoreAdminError = null;
  
  if (firestoreAdmin) {
    try {
      // Try a simple doc read as a connection test (less prone to permission errors than listCollections)
      await firestoreAdmin.collection('_health').doc('check').get();
      firestoreAdminStatus = 'connected';
    } catch (error: any) {
      // If it's just a permission error on the health check collection, we might still be "connected"
      if (error.code === 7 || error.code === 9) {
        firestoreAdminStatus = 'connected_with_permission_warning';
      } else {
        firestoreAdminStatus = 'error';
        firestoreAdminError = error.message;
      }
    }
  }
  res.json({
    status: 'ok',
    firestoreAdminStatus,
    firestoreAdminError
  });
});

// Initialize Gemini safely on server-side with dynamic validation
let lastKnownApiKey: string | null = null;
let geminiClient: any = null;

const isPlaceholderKey = (key: string): boolean => {
  const normalized = key.toLowerCase().trim();
  return (
    !normalized ||
    normalized.length < 15 || // Real keys are usually much longer
    normalized.includes("placeholder") ||
    normalized.includes("your") ||
    normalized.includes("api_key") ||
    normalized.includes("<") ||
    normalized.includes(">") ||
    normalized === "undefined" ||
    normalized === "null"
  );
};

const getGeminiClient = () => {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || isPlaceholderKey(key)) {
    geminiClient = null;
    lastKnownApiKey = null;
    return null;
  }
  
  if (key !== lastKnownApiKey) {
    lastKnownApiKey = key;
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
};

// Stateless chat proxy
app.post('/api/gemini/chat', async (req, res) => {
  const { messages, systemInstruction } = req.body;
  const offlineText = `আসসালামু আলাইকুম! আমি "টিকিট লাগবে" প্ল্যাটফর্মের কৃত্রিম বুদ্ধিমত্তা সম্পন্ন চ্যাট অ্যাসিস্ট্যান্ট। 🤖✨
        
সরাসরি উত্তর পেতে অনুগ্রহ করে আপনার প্রজেক্ট সেটিংসে **Secrets** প্যানেলে **GEMINI_API_KEY** যুক্ত করুন।

অফলাইন মোড অনুযায়ী আমাদের কাছে থাকা সাধারণ তথ্যের কিছু সময়সূচী নিচে তুলে ধরা হলো:
- **ঢাকা থেকে চট্টগ্রাম**: সকাল ৮:৩০ (৮০০ টাকা) এবং দুপুর ২:০০ (১২০০ টাকা)।
- **ঢাকা থেকে সিলেট**: সকাল ৯:১৫ (৮০০ টাকা) এবং রাত ১১:০০ (১০০০ টাকা)।
- **ঢাকা থেকে রাজশাহী**: সকাল ১০:০০ (১৫০০ টাকা) এবং দুপুর ১:০০ (১১০০ টাকা)।

আপনার পরবর্তী যাত্রা শুভ হোক!`;

  try {
    const client = getGeminiClient();
    if (!client) {
      return res.json({ text: offlineText });
    }

    // Format messages for @google/genai: { role: 'user'|'model', parts: [{ text: '...' }] }
    const recentMessages = messages.slice(-15);
    const contents = recentMessages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemInstruction || "You are a helpful assistant.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    const errorStr = String(error.message || error);
    const isApiKeyError = errorStr.includes("API key not valid") || 
                          errorStr.includes("API_KEY_INVALID") || 
                          errorStr.includes("INVALID_ARGUMENT") ||
                          errorStr.includes("key");

    if (isApiKeyError) {
      console.warn("⚠️ [Gemini Alert] Detected an invalid GEMINI_API_KEY on client request. Resetting client cache.");
      geminiClient = null;
      lastKnownApiKey = null;
      
      return res.json({ 
        text: `⚠️ **এপিআই কি সমস্যা (Invalid API Key)** ⚠️

আপনার প্রজেক্ট সেটিংসে **Settings > Secrets** প্যানেলে যে **GEMINI_API_KEY** যুক্ত করা হয়েছে, সেটি গুগল এপিআই সার্ভার কর্তৃক প্রত্যাখ্যাত হয়েছে (ভুল বা মেয়াদোত্তীর্ণ কী)। অনুগ্রহ করে আপনার সঠিক গুগল এআই স্টুডিও জেমিনি এপিআই কি যুক্ত করুন।

---
**অফলাইন মোড চ্যাট অ্যাসিস্ট্যান্ট উত্তর:**
${offlineText}` 
      });
    }

    console.warn("Gemini Server Error (Falling back to simulator mode):", error.message || error);
    res.json({ text: offlineText });
  }
});

// Spark customized travel planner endpoint
app.post('/api/gemini/spark-planner', async (req, res) => {
  const { destination, days = 3 } = req.body;
  if (!destination) {
    return res.status(400).json({ error: "Destination is required" });
  }

  const cleanDestination = destination.trim();
  const getOfflineText = () => `### ✨ জেমিনি স্পার্ক ট্যুর প্ল্যানার: ${cleanDestination} ✨ (সিমুলেশন মোড)
        
*সম্পূর্ণ লাইভ ভ্রমণের পরিকল্পনা জেনারেট করতে প্রজেক্টের **Settings > Secrets** থেকে **GEMINI_API_KEY** যুক্ত করুন।*

#### 🗺️ আকর্ষণীয় স্থানসমূহ (Top Attractions)
১. **প্রধান স্পট**: ${cleanDestination} এলাকার সবচেয়ে সেরা এবং জনপ্রিয় দর্শনীয় স্থানগুলো ঘুরে দেখুন।
২. **প্রাকৃতিক মনোরম পরিবেশ**: নদী, সবুজ প্রকৃতি কিংবা পাহাড়ের অপরূপ মিলন উপভোগ করুন।
৩. **ঐতিহাসিক বা সাংস্কৃতিক ঐতিহ্য**: অঞ্চলের মূল সংস্কৃতি এবং ঐতিহ্যবাহী নিদর্শনের খোঁজ করুন।

#### 🍲 স্থানীয় বিখ্যাত খাবার
- স্থানীয় বিখ্যাত ও ঐতিহ্যবাহী খাবারগুলোর অনন্য স্বাদ পরখ করতে ভুলবেন না!

#### 💡 টিকিট লাগবে ট্রাভেলার টিপস
- ভ্রমণের সময়ে প্রয়োজনীয় কাগজপত্র এবং ব্যক্তিগত সুরক্ষার ঔষধ সঙ্গে রাখুন।
- বাসের টিকেট অগ্রিম বুক করুন **টিকিট লাগবে** প্ল্যাটফর্ম থেকে!`;

  try {
    const client = getGeminiClient();
    if (!client) {
      return res.json({ text: getOfflineText() });
    }

    const prompt = `Create a spectacular travel guide and itinerary for a ${days}-day trip to ${cleanDestination}. 
The response MUST be written in beautiful, encouraging Bengali (বাংলা) language with English headings/keys parsed elegantly (Benglish/Bengali mix).
Structure the guide with the following sections using styled markdown support:
1. **✨ Overview & Vibe (সংক্ষিপ্ত ধারণা ও পরিবেশ)**
2. **🗺️ Top 3 Must-Visit Attractions (অবশ্যই দর্শনীয় ৩টি স্থান)** — with brief, exciting description for each.
3. **🍲 Famous Local Delecasies (স্থানীয় জিভে জল আনা খাবার)** — 2-3 local food suggestions.
4. **📅 Day-by-Day Travel Itinerary (দিনভিত্তিক ভ্রমণ পরিকল্পনা)** — outline of Day 1, Day 2, Day 3 shortly.
5. **💡 Pro-Tips for Ticket Lagbe Travelers (গুরুত্বপূর্ণ টিপস)** — with 2 helpful suggestions.

Keep the output concise, energetic, easy to read, with spacious margins.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Gemini Spark ✨, the ultimate tour advisor integrated inside 'Ticket Lagbe' bus booking platform. You suggest incredibly engaging travel tips, food options, plans, and itinerary detail in Bengali.",
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    const errorStr = String(error.message || error);
    const isApiKeyError = errorStr.includes("API key not valid") || 
                          errorStr.includes("API_KEY_INVALID") || 
                          errorStr.includes("INVALID_ARGUMENT") ||
                          errorStr.includes("key");

    if (isApiKeyError) {
      console.warn("⚠️ [Gemini Alert] Detected an invalid GEMINI_API_KEY inside Spark Travel Planner. Resetting client cache.");
      geminiClient = null;
      lastKnownApiKey = null;
      
      return res.json({ 
        text: `⚠️ **এপিআই কি সমস্যা (Invalid API Key)** ⚠️

আপনার প্রজেক্ট সেটিংসে **Settings > Secrets** প্যানেলে যে **GEMINI_API_KEY** যুক্ত করা হয়েছে, সেটি সঠিক নয় (Invalid)। অনুগ্রহ করে আপনার সঠিক গুগল জেমিনি এপিআই কি দিন।

---
${getOfflineText()}` 
      });
    }

    console.warn("Gemini Spark Planner error (Falling back to simulator mode):", error.message || error);
    res.json({ text: getOfflineText() });
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Driver Application API
app.post('/api/driver/apply', (req, res) => {
  const { name, phone, address, license_number, profile_image } = req.body;
  
  if (!name || !phone || !address || !license_number) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO driver_applications (name, phone, address, license_number, profile_image)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, phone, address, license_number, profile_image);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/admin/driver/applications', (req, res) => {
  try {
    const applications = db.prepare('SELECT * FROM driver_applications ORDER BY applied_at DESC').all();
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Backup Endpoint
app.get('/api/backup', (req, res) => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return res.status(404).json({ error: 'Database file not found' });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-${timestamp}.sqlite`;
    
    res.download(DB_PATH, backupFilename, (err) => {
      if (err) {
        console.error('Backup download error:', err);
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Auth APIs
app.post('/api/change-password', (req, res) => {
  const { userId, currentPassword, oldPassword, newPassword } = req.body;
  const passwordToCheck = currentPassword || oldPassword;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND password = ?').get(userId, passwordToCheck) as any;
  
  if (user) {
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, userId);
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect current password' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const trimmedUsername = username?.trim();
  const trimmedPassword = password?.trim();
  console.log('Login attempt for:', trimmedUsername);
  // Using LOWER() for case-insensitive username/email matching
  const user = db.prepare('SELECT * FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND password = ?').get(trimmedUsername, trimmedUsername, trimmedPassword) as any;
  
  if (user) {
    console.log('Login successful for:', user.username);
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
    console.log('Login failed for:', username);
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/register', (req, res) => {
  const { username, password, name, email, phone = '', address = '', role = 'user', counter_id = null, owner_id = null } = req.body;
  try {
    const info = db.prepare(`
      INSERT INTO users (username, password, name, email, phone, address, role, counter_id, owner_id, member_since) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(username, password, name, email, phone, address, role, counter_id, owner_id);
    res.json({ success: true, userId: info.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND password = ?').get(userId, oldPassword) as any;
  
  if (user) {
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, userId);
    res.json({ success: true, message: 'Password updated successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid old password' });
  }
});

// Transactions APIs
app.get('/api/transactions', (req, res) => {
  const { userId } = req.query;
  let query = 'SELECT * FROM transactions';
  let params: any[] = [];
  
  if (userId) {
    query += ' WHERE user_id = ?';
    params.push(userId);
  }
  
  query += ' ORDER BY transaction_date DESC';
  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});

// Bus Tracking API (Mock)
app.get('/api/bus-location/:id', (req, res) => {
  // Mock location data
  const locations = [
    { lat: 23.8103, lng: 90.4125, status: 'On Time', speed: '45 km/h', nextStop: 'Gazipur' },
    { lat: 24.3636, lng: 88.6241, status: 'Delayed', speed: '30 km/h', nextStop: 'Rajshahi' },
    { lat: 22.3569, lng: 91.7832, status: 'On Time', speed: '55 km/h', nextStop: 'Chattogram' }
  ];
  const location = locations[Math.floor(Math.random() * locations.length)];
  res.json(location);
});

// Buses APIs
app.get('/api/buses', async (req, res) => {
  const { ownerId, lang = 'en' } = req.query;
  const nameField = lang === 'bn' ? 'COALESCE(name_bn, name)' : 'COALESCE(name_en, name)';
  
  try {
    // If firestore is available, we could sync or just use SQLite as cache
    // For now, let's just use SQLite which holds the synced Firestore data
    let query = `SELECT id, ${nameField} as name, name_en, name_bn, reg_no as regNo, driver, driver_phone as driverPhone, status, route, last_maintenance as lastMaintenance, next_maintenance as nextMaintenance, capacity, owner_id as ownerId, image_url as imageUrl FROM buses`;
    let params: any[] = [];
    
    if (ownerId) {
      query += ' WHERE owner_id = ?';
      params.push(ownerId);
    }
    
    const buses = db.prepare(query).all(...params);
    res.json(buses);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/buses', async (req, res) => {
  const { name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id = null, image_url = null } = req.body;
  
  try {
    let busId: string;

    if (firestore) {
      try {
        const docRef = await addDoc(collection(firestore, 'buses'), {
          name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        busId = docRef.id;
      } catch (clientErr: any) {
        console.warn('Firestore bus add failed, using local ID fallback:', clientErr.message);
        busId = `local_${Date.now()}`;
      }
    } else {
      busId = `local_${Date.now()}`;
    }

    db.prepare('INSERT INTO buses (id, name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(busId, name, name_en || name, name_bn || name, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url);
    
    res.json({ id: busId });
  } catch (error: any) {
    console.error('Error creating bus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/buses/:id', async (req, res) => {
  const { name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url } = req.body;
  const { id } = req.params;
  
  try {
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'buses', id), {
          name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (clientErr: any) {
        console.warn('Firestore bus update failed:', clientErr.message);
      }
    }

    db.prepare('UPDATE buses SET name = ?, name_en = ?, name_bn = ?, reg_no = ?, driver = ?, driver_phone = ?, status = ?, route = ?, last_maintenance = ?, next_maintenance = ?, capacity = ?, owner_id = ?, image_url = ? WHERE id = ?').run(name, name_en, name_bn, reg_no, driver, driver_phone, status, route, last_maintenance, next_maintenance, capacity, owner_id, image_url, id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating bus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/buses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (firestore) {
      try {
        await deleteDoc(doc(firestore, 'buses', id));
      } catch (clientErr: any) {
        console.warn('Firestore bus delete failed:', clientErr.message);
      }
    }
    db.prepare('DELETE FROM buses WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Counters APIs
app.get('/api/counters', (req, res) => {
  const { ownerId, lang = 'en' } = req.query;
  const nameField = lang === 'bn' ? 'COALESCE(name_bn, name)' : 'COALESCE(name_en, name)';
  const locationField = lang === 'bn' ? 'COALESCE(location_bn, location)' : 'COALESCE(location_en, location)';
  
  let query = `SELECT id, ${nameField} as name, name_en, name_bn, ${locationField} as location, location_en, location_bn, phone, owner_id as ownerId FROM counters`;
  let params: any[] = [];
  
  if (ownerId) {
    query += ' WHERE owner_id = ?';
    params.push(ownerId);
  }
  
  const counters = db.prepare(query).all(...params);
  res.json(counters);
});

app.post('/api/counters', (req, res) => {
  const { name, name_en, name_bn, location, location_en, location_bn, phone, owner_id = null } = req.body;
  const info = db.prepare('INSERT INTO counters (name, name_en, name_bn, location, location_en, location_bn, phone, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(name, name_en || name, name_bn || name, location, location_en || location, location_bn || location, phone, owner_id);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/counters/:id', (req, res) => {
  const { name, name_en, name_bn, location, location_en, location_bn, phone, owner_id } = req.body;
  db.prepare('UPDATE counters SET name = ?, name_en = ?, name_bn = ?, location = ?, location_en = ?, location_bn = ?, phone = ?, owner_id = ? WHERE id = ?').run(name, name_en, name_bn, location, location_en, location_bn, phone, owner_id, req.params.id);
  res.json({ success: true });
});

app.delete('/api/counters/:id', (req, res) => {
  db.prepare('DELETE FROM counters WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Routes APIs
app.get('/api/routes', (req, res) => {
  const { lang = 'en' } = req.query;
  const fromField = lang === 'bn' ? 'COALESCE(from_city_bn, from_city)' : 'COALESCE(from_city_en, from_city)';
  const toField = lang === 'bn' ? 'COALESCE(to_city_bn, to_city)' : 'COALESCE(to_city_en, to_city)';
  
  try {
    const routes = db.prepare(`SELECT id, ${fromField} as "from", from_city_en, from_city_bn, ${toField} as "to", to_city_en, to_city_bn, distance, duration, fare, status FROM routes`).all();
    res.json(routes);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/routes', async (req, res) => {
  const { from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status } = req.body;
  
  try {
    let routeId: string;
    if (firestore) {
      try {
        const docRef = await addDoc(collection(firestore, 'routes'), {
          from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        routeId = docRef.id;
      } catch (clientErr: any) {
        console.warn('Firestore route add failed, using local ID fallback:', clientErr.message);
        routeId = `local_route_${Date.now()}`;
      }
    } else {
      routeId = `local_route_${Date.now()}`;
    }

    db.prepare('INSERT INTO routes (id, from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(routeId, from_city, from_city_en || from_city, from_city_bn || from_city, to_city, to_city_en || to_city, to_city_bn || to_city, distance, duration, fare, status);
    res.json({ id: routeId });
  } catch (error: any) {
    console.error('Error creating route:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/routes/:id', async (req, res) => {
  const { from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status } = req.body;
  const { id } = req.params;
  
  try {
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'routes', id), {
          from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (clientErr: any) {
        console.warn('Firestore route update failed, continuing with local:', clientErr.message);
      }
    }
    db.prepare('UPDATE routes SET from_city = ?, from_city_en = ?, from_city_bn = ?, to_city = ?, to_city_en = ?, to_city_bn = ?, distance = ?, duration = ?, fare = ?, status = ? WHERE id = ?').run(from_city, from_city_en, from_city_bn, to_city, to_city_en, to_city_bn, distance, duration, fare, status, id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating route:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/routes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (firestore) {
      try {
        await deleteDoc(doc(firestore, 'routes', id));
      } catch (clientErr: any) {
        console.warn('Firestore route delete failed, continuing with local:', clientErr.message);
      }
    }
    db.prepare('DELETE FROM routes WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting route:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Users APIs
app.get('/api/users', (req, res) => {
  const { ownerId, role } = req.query;
  let query = `
    SELECT 
      u.id, u.username, u.role, u.name, u.email, u.phone, u.password,
      u.counter_id as counterId, u.owner_id as ownerId,
      c.name as counterName
    FROM users u
    LEFT JOIN counters c ON u.counter_id = c.id
  `;
  let params: any[] = [];
  let conditions: string[] = [];
  
  if (ownerId) {
    conditions.push('u.owner_id = ?');
    params.push(ownerId);
  }
  
  if (role) {
    conditions.push('u.role = ?');
    params.push(role);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  const users = db.prepare(query).all(...params);
  res.json(users);
});

app.put('/api/users/:id', (req, res) => {
  const { name, email, role, counter_id, owner_id, phone, password } = req.body;
  try {
    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updatedName = name !== undefined ? name : existingUser.name;
    const updatedEmail = email !== undefined ? email : existingUser.email;
    const updatedRole = role !== undefined ? role : existingUser.role;
    const updatedCounterId = counter_id !== undefined ? counter_id : existingUser.counter_id;
    const updatedOwnerId = owner_id !== undefined ? owner_id : existingUser.owner_id;
    const updatedPhone = phone !== undefined ? phone : existingUser.phone;
    const updatedPassword = password !== undefined ? password : existingUser.password;

    db.prepare('UPDATE users SET name = ?, email = ?, role = ?, counter_id = ?, owner_id = ?, phone = ?, password = ? WHERE id = ?')
      .run(updatedName, updatedEmail, updatedRole, updatedCounterId, updatedOwnerId, updatedPhone, updatedPassword, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Bookings APIs
function cleanupExpiredReservations() {
  try {
    // Cancel "Reserved" bookings older than 24 hours (1 day)
    db.prepare(`
      UPDATE bookings 
      SET status = 'Cancelled' 
      WHERE status = 'Reserved' 
      AND datetime(booking_date) < datetime('now', '-24 hours')
    `).run();
  } catch (err) {
    console.error('Error cleaning up expired reservations:', err);
  }
}

app.get('/api/bookings', (req, res) => {
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
    let params: any[] = [];
    
    if (ownerId) {
      query += ' WHERE bus.owner_id = ?';
      params.push(ownerId);
    }
    
    const bookings = db.prepare(query).all(...params);
    res.json(bookings);
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/bookings', (req, res) => {
  const { user_id, passenger_name, phone_number, passenger_id, address, bus_id, route, time, travel_date, seats, status, amount, counter, staff, passengers_json } = req.body;
  try {
    const info = db.prepare(`
      INSERT INTO bookings (user_id, passenger_name, phone_number, passenger_id, address, bus_id, route, time, travel_date, seats, status, amount, counter, staff, passengers_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, passenger_name, phone_number, passenger_id, address, bus_id, route, time, travel_date, seats, status, amount, counter, staff, passengers_json);
    
    const bookingId = info.lastInsertRowid;
    const cleanAmount = parseFloat(amount.toString().replace(/[৳,]/g, '')) || 0;
    
    // Add to ledger for person who booked
    if (user_id) {
      addLedgerEntry(user_id, `Bus Booking: ${route} (${seats})`, String(bookingId), 'Booking', cleanAmount, 0);
    }

    // Add to ledger for Bus Owner (for online bookings)
    const bus = db.prepare('SELECT owner_id FROM buses WHERE id = ?').get(bus_id) as any;
    if (bus?.owner_id && (!counter || counter === 'Online')) {
      addLedgerEntry(bus.owner_id, `Online Booking: ${route} (${seats}) - ${passenger_name}`, String(bookingId), 'Booking', cleanAmount, 0);
    }

    const newBooking = db.prepare('SELECT booking_date FROM bookings WHERE id = ?').get(bookingId) as any;
    res.json({ id: bookingId, booking_date: newBooking?.booking_date });
  } catch (error: any) {
    console.error('Booking Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/bookings/:id', (req, res) => {
  const { status } = req.body;
  try {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/bookings/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Schedules APIs
app.get('/api/schedules', (req, res) => {
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/schedules', async (req, res) => {
  const { bus_id, route_id, departure_time, arrival_time, date, status, available_seats } = req.body;
  try {
    let scheduleId: string;
    if (firestore) {
      try {
        const docRef = await addDoc(collection(firestore, 'schedules'), {
          bus_id, route_id, departure_time, arrival_time, date, status, available_seats,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        scheduleId = docRef.id;
      } catch (clientErr: any) {
        console.warn('Firestore schedule add failed, using local ID fallback:', clientErr.message);
        scheduleId = `local_schedule_${Date.now()}`;
      }
    } else {
      scheduleId = `local_schedule_${Date.now()}`;
    }

    db.prepare('INSERT INTO schedules (id, bus_id, route_id, departure_time, arrival_time, date, status, available_seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(scheduleId, bus_id.toString(), route_id.toString(), departure_time, arrival_time, date, status, available_seats);
    res.json({ id: scheduleId });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/schedules/:id', async (req, res) => {
  const { bus_id, route_id, departure_time, arrival_time, date, status, available_seats } = req.body;
  const { id } = req.params;
  try {
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'schedules', id), {
          bus_id, route_id, departure_time, arrival_time, date, status, available_seats,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (clientErr: any) {
        console.warn('Firestore schedule update failed:', clientErr.message);
      }
    }
    db.prepare('UPDATE schedules SET bus_id = ?, route_id = ?, departure_time = ?, arrival_time = ?, date = ?, status = ?, available_seats = ? WHERE id = ?').run(bus_id.toString(), route_id.toString(), departure_time, arrival_time, date, status, available_seats, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/schedules/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (firestore) {
      try {
        await deleteDoc(doc(firestore, 'schedules', id));
      } catch (clientErr: any) {
        console.warn('Firestore schedule delete failed:', clientErr.message);
      }
    }
    db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Routes
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all() as any[];
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', (req, res) => {
  const settings = req.body;
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        stmt.run(key, String(value));
      }
    });
    transaction(settings);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/settings/theme', (req, res) => {
  try {
    const keys = [
      'theme_mode',
      'color_primary',
      'color_secondary',
      'color_text',
      'color_bg',
      'custom_css',
      'font_family',
      'base_font_size'
    ];
    const settings = db.prepare('SELECT * FROM settings WHERE key IN (?, ?, ?, ?, ?, ?, ?, ?)').all(keys) as any[];
    const themeSettings: any = {
      theme_mode: 'light',
      color_primary: '#2563eb',
      color_secondary: '#475569',
      color_text: '#0f172a',
      color_bg: '#f8fafc',
      custom_css: '/* Custom styles here */',
      font_family: 'Inter',
      base_font_size: '16'
    };
    settings.forEach((s) => {
      themeSettings[s.key] = s.value;
    });
    res.json(themeSettings);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch theme settings', details: error.message });
  }
});

app.post('/api/settings/theme', (req, res) => {
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

  if (theme_mode && !['light', 'dark', 'custom'].includes(theme_mode)) {
    return res.status(400).json({ error: 'Invalid theme mode' });
  }

  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const transaction = db.transaction((data: any) => {
      if (data.theme_mode !== undefined) stmt.run('theme_mode', String(data.theme_mode));
      if (data.color_primary !== undefined) stmt.run('color_primary', String(data.color_primary));
      if (data.color_secondary !== undefined) stmt.run('color_secondary', String(data.color_secondary));
      if (data.color_text !== undefined) stmt.run('color_text', String(data.color_text));
      if (data.color_bg !== undefined) stmt.run('color_bg', String(data.color_bg));
      if (data.custom_css !== undefined) stmt.run('custom_css', String(data.custom_css));
      if (data.font_family !== undefined) stmt.run('font_family', String(data.font_family));
      if (data.base_font_size !== undefined) stmt.run('base_font_size', String(data.base_font_size));
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

    res.json({ success: true, message: 'Theme settings updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update theme settings', details: error.message });
  }
});

app.get('/api/accounts/summary', (req, res) => {
  try {
    cleanupExpiredReservations();
    const totalSales = db.prepare("SELECT SUM(CAST(REPLACE(REPLACE(amount, '৳', ''), ',', '') AS INTEGER)) as total FROM bookings WHERE status != 'Cancelled'").get() as any;
    const onlineSales = db.prepare("SELECT SUM(CAST(REPLACE(REPLACE(amount, '৳', ''), ',', '') AS INTEGER)) as total FROM bookings WHERE (counter IS NULL OR counter = 'Online') AND status != 'Cancelled'").get() as any;
    const counterSales = db.prepare("SELECT SUM(CAST(REPLACE(REPLACE(amount, '৳', ''), ',', '') AS INTEGER)) as total FROM bookings WHERE counter IS NOT NULL AND counter != 'Online' AND status != 'Cancelled'").get() as any;
    const totalPaidToOwners = db.prepare("SELECT SUM(amount) as total FROM payments_to_owners").get() as any;
    
    res.json({
      totalSales: totalSales.total || 0,
      onlineSales: onlineSales.total || 0,
      counterSales: counterSales.total || 0,
      totalPaidToOwners: totalPaidToOwners.total || 0,
      netBalance: (onlineSales.total || 0) - (totalPaidToOwners.total || 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch account summary' });
  }
});

app.post('/api/payment/initiate', async (req, res) => {
  const { bookingId, amount } = req.body;
  
  try {
    const settings = db.prepare('SELECT * FROM settings').all() as any[];
    const config = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    if (!config.ssl_store_id || !config.ssl_store_password) {
      return res.status(400).json({ error: 'SSLCommerz is not configured' });
    }

    const tran_id = `REF${Date.now()}`;
    
    // Update booking with transaction ID
    db.prepare('UPDATE bookings SET transaction_id = ? WHERE id = ?').run(tran_id, bookingId);

    const isSandbox = config.ssl_is_sandbox === 'true';
    const baseUrl = isSandbox ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';
    
    // In a real integration, you would call SSLCommerz API here.
    // For this demo, we'll simulate a successful initiation and return a mock URL.
    res.json({
      success: true,
      gatewayUrl: `${baseUrl}/gwprocess/v4/api.php?store_id=${config.ssl_store_id}&tran_id=${tran_id}&total_amount=${amount}&currency=BDT&success_url=${req.protocol}://${req.get('host')}/api/payment/success&fail_url=${req.protocol}://${req.get('host')}/api/payment/fail&cancel_url=${req.protocol}://${req.get('host')}/api/payment/cancel`
    });
  } catch (error) {
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

app.post('/api/payment/success', (req, res) => {
  const { tran_id } = req.body;
  try {
    db.prepare("UPDATE bookings SET payment_status = 'Paid', status = 'Confirmed' WHERE transaction_id = ?").run(tran_id);
    res.redirect('/payment-success');
  } catch (error) {
    res.redirect('/payment-error');
  }
});

// Menus APIs
app.get('/api/menus', (req, res) => {
  try {
    const menus = db.prepare('SELECT * FROM menus ORDER BY order_index ASC').all();
    res.json(menus);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/menus', (req, res) => {
  const { label_en, label_bn, path, order_index } = req.body;
  try {
    const info = db.prepare('INSERT INTO menus (label_en, label_bn, path, order_index) VALUES (?, ?, ?, ?)').run(label_en, label_bn, path, order_index);
    res.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/menus/:id', (req, res) => {
  const { label_en, label_bn, path, order_index, is_active } = req.body;
  try {
    db.prepare('UPDATE menus SET label_en = ?, label_bn = ?, path = ?, order_index = ?, is_active = ? WHERE id = ?')
      .run(label_en, label_bn, path, order_index, is_active, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/menus/reorder', (req, res) => {
  const { items } = req.body; // Array of {id, order_index}
  try {
    const updateStmt = db.prepare('UPDATE menus SET order_index = ? WHERE id = ?');
    const transaction = db.transaction((items) => {
      for (const item of items) {
        updateStmt.run(item.order_index, item.id);
      }
    });
    transaction(items);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/menus/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM menus WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Owner Payments
app.get('/api/owner-payments', (req, res) => {
  const { owner_id } = req.query;
  try {
    let payments;
    if (owner_id) {
      payments = db.prepare('SELECT * FROM payments_to_owners WHERE owner_id = ? ORDER BY payment_date DESC').all(owner_id);
    } else {
      payments = db.prepare('SELECT * FROM payments_to_owners ORDER BY payment_date DESC').all();
    }
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.post('/api/owner-payments', (req, res) => {
  const { owner_id, amount, reference } = req.body;
  if (!owner_id || !amount) {
    return res.status(400).json({ error: 'Owner ID and amount are required' });
  }
  try {
    const result = db.prepare('INSERT INTO payments_to_owners (owner_id, amount, reference) VALUES (?, ?, ?)')
      .run(owner_id, amount, reference || '');
    
    const paymentId = result.lastInsertRowid;

    // Add to ledger (Payment out to owner)
    addLedgerEntry(owner_id, `Payment Received: ${reference || 'Owner Payment'}`, String(paymentId), 'OwnerPayment', 0, amount);

    res.json({ id: paymentId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Ledger API
app.get(['/api/ledger', '/api/ledger-entries'], (req, res) => {
  const userId = req.query.userId || req.query.owner_id;
  try {
    let query = 'SELECT * FROM ledger';
    let params: any[] = [];
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY date DESC';
    const entries = db.prepare(query).all(...params);
    res.json(entries);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mock Real-time Tracking Updates
const updateMockLocations = async () => {
  const buses = [
    { id: '1', route: 'Dhaka - Chattogram', stops: ['Gazipur', 'Comilla', 'Feni', 'Chattogram'] },
    { id: '2', route: 'Dhaka - Sylhet', stops: ['Narsingdi', 'Bhairab', 'Habiganj', 'Sylhet'] }
  ];

  for (const bus of buses) {
    const randomStop = bus.stops[Math.floor(Math.random() * bus.stops.length)];
    const randomSpeed = Math.floor(Math.random() * 40) + 40; // 40-80 km/h
    const statuses = ['On Time', 'On Time', 'Delayed', 'On Time'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const locationData = {
      busId: bus.id,
      lat: 23.8103 + (Math.random() - 0.5) * 0.1,
      lng: 90.4125 + (Math.random() - 0.5) * 0.1,
      status: randomStatus,
      speed: `${randomSpeed} km/h`,
      nextStop: randomStop,
      lastUpdated: new Date().toISOString()
    };

    try {
      let updateSuccessful = false;

      // Emit via WebSocket immediately for real-time experience
      if (io) {
        io.emit('bus_location_update', locationData);
        console.log(`Emitted mock location for bus ${bus.id} via WebSockets`);
      }

      // Try Client SDK first as it has been verified to work with the current rules
      if (firestore) {
        try {
          await setDoc(doc(firestore, 'bus_locations', bus.id), locationData);
          console.log(`Updated mock location for bus ${bus.id} via Client SDK`);
          updateSuccessful = true;
        } catch (clientError: any) {
          console.error(`Client SDK update failed for bus ${bus.id}:`, clientError.message);
        }
      }

      // Try Admin SDK as secondary/verify only if Client fails or for testing
      if (!updateSuccessful && firestoreAdmin) {
        try {
          await firestoreAdmin.collection('bus_locations').doc(bus.id).set(locationData);
          console.log(`Updated mock location for bus ${bus.id} via Admin SDK`);
          updateSuccessful = true;
        } catch (adminError: any) {
          // If it's a permission error, we log it more quietly as it might be an environment limitation
          if (adminError.code === 7 || adminError.message?.includes('PERMISSION_DENIED')) {
            console.warn(`Admin SDK permission denied for bus ${bus.id} update. This is expected in some sandboxed environments.`);
          } else {
            console.error(`Admin SDK update failed for bus ${bus.id}:`, adminError.message);
          }
        }
      }

      if (!updateSuccessful) {
        console.error(`All firestore update attempts failed for bus ${bus.id}`);
      }
    } catch (error: any) {
      console.error(`Unexpected error in updateMockLocations for bus ${bus.id}:`, error);
    }
  }
};

// Update every 5 seconds for smoother real-time feel
setInterval(updateMockLocations, 5000);
// Initial update
updateMockLocations();

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('Client connected to WebSocket:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from WebSocket');
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
