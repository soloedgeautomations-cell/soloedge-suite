import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
  time,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 320 }),
  business_type: varchar("business_type", { length: 128 }),
  message: text("message"),
  language: varchar("language", { length: 32 }).default("English"),
  source: varchar("source", { length: 64 }).default("website"),
  status: varchar("status", { length: 32 }).default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  mode: varchar("mode", { length: 32 }).default("receptionist"),
  language: varchar("language", { length: 32 }).default("en"),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  language: varchar("language", { length: 32 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  customerName: varchar("customerName", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 64 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  serviceType: varchar("serviceType", { length: 128 }),
  preferredDate: date("preferredDate"),
  preferredTime: time("preferredTime"),
  duration: int("duration").default(60), // minutes
  notes: text("notes"),
  status: varchar("status", { length: 32 }).default("pending"),
  language: varchar("language", { length: 32 }).default("en"),
  confirmedAt: timestamp("confirmedAt"),
  cancelledAt: timestamp("cancelledAt"),
  rescheduledFrom: int("rescheduledFrom"), // original booking id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: varchar("planId", { length: 64 }).notNull(),
  planName: varchar("planName", { length: 128 }),
  suite: varchar("suite", { length: 64 }),
  status: varchar("status", { length: 32 }).default("active"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const whiteLabelClients = mysqlTable("white_label_clients", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId"),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  businessName: varchar("businessName", { length: 255 }),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 32 }).default("#2563eb"),
  accentColor: varchar("accentColor", { length: 32 }).default("#0ea5e9"),
  planId: varchar("planId", { length: 64 }),
  status: varchar("status", { length: 32 }).default("active"),
  aiMode: varchar("aiMode", { length: 32 }).default("receptionist"),
  sttProvider: varchar("sttProvider", { length: 64 }).default("whisper"),
  llmProvider: varchar("llmProvider", { length: 64 }).default("manus"),
  ttsProvider: varchar("ttsProvider", { length: 64 }).default("manus"),
  customDomain: varchar("customDomain", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const constructionLogs = mysqlTable("construction_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  logType: varchar("logType", { length: 64 }).notNull(),
  jobSite: varchar("jobSite", { length: 255 }),
  crewMember: varchar("crewMember", { length: 255 }),
  content: text("content").notNull(),
  language: varchar("language", { length: 32 }).default("en"),
  translatedContent: text("translatedContent"),
  jargonTerms: text("jargonTerms"),
  status: varchar("status", { length: 32 }).default("logged"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const interpreterSessions = mysqlTable("interpreter_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionType: varchar("sessionType", { length: 32 }).default("one-on-one"),
  languageA: varchar("languageA", { length: 32 }).default("en"),
  languageB: varchar("languageB", { length: 32 }).default("es"),
  summary: text("summary"),
  duration: int("duration").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type WhiteLabelClient = typeof whiteLabelClients.$inferSelect;
export type ConstructionLog = typeof constructionLogs.$inferSelect;
export type InterpreterSession = typeof interpreterSessions.$inferSelect;
