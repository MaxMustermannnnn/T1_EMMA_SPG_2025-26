const { pgTable, serial, varchar, text, integer, timestamp, boolean, date, decimal } = require("drizzle-orm/pg-core");

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  username: varchar("username", { length: 50 }),
  first_name: varchar("first_name", { length: 50 }),
  last_name: varchar("last_name", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow()
});

const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  type: varchar("type", { length: 50 }),
  brand: varchar("brand", { length: 50 }),
  model: varchar("model", { length: 50 }),
  licensePlate: varchar("licensePlate", { length: 50 }),
  vin: varchar("vin", { length: 50 }),
  mileage: integer("mileage"),
  color: varchar("color", { length: 50 }),
  purchaseDate: date("purchaseDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  lastUpdated: timestamp("lastUpdated").defaultNow(),
  bildurl: text("bildurl")
});

const maintenances = pgTable("maintenances", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicleId").references(() => vehicles.id),
  type: varchar("type", { length: 50 }),
  category: varchar("category", { length: 50 }),
  date: date("date"),
  mileageAtService: integer("mileageAtService"),
  description: text("description"),
  location: varchar("location", { length: 100 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 5 }),
  nextDueDate: date("nextDueDate"),
  nextDueMileage: integer("nextDueMileage"),
  reminderDate: date("reminderDate"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow()
});

module.exports = { users, vehicles, maintenances };
