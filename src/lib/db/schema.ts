import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/** Application-wide user roles. */
export const userRole = pgEnum("user_role", [
  "hiker",
  "club_admin",
  "super_admin",
]);

/** Billing tier of an organization. */
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro",
  "team",
]);

/** A member's role within a single organization. */
export const orgMemberRoleEnum = pgEnum("org_member_role", [
  "admin",
  "organizer",
  "member",
]);

/** Trail/trip difficulty. Shared by `trails` and `trips`. */
export const difficultyEnum = pgEnum("difficulty", [
  "easy",
  "moderate",
  "hard",
  "expert",
]);

/** Shape of a trail route. */
export const trailTypeEnum = pgEnum("trail_type", [
  "loop",
  "out_and_back",
  "point_to_point",
]);

/** Lifecycle state of a trip. */
export const tripStatusEnum = pgEnum("trip_status", [
  "draft",
  "open",
  "full",
  "in_progress",
  "completed",
  "canceled",
]);

/** Weather severity shown on a trip (includes the "all clear" state). */
export const weatherAlertLevelEnum = pgEnum("weather_alert_level", [
  "clear",
  "warning",
  "alert",
  "danger",
]);

/** State of a single participant's registration for a trip. */
export const registrationStatusEnum = pgEnum("registration_status", [
  "pending",
  "confirmed",
  "waitlisted",
  "canceled",
  "attended",
  "no_show",
]);

/** Payment state of a registration. */
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "refunded",
  "failed",
  "free",
]);

/**
 * Severity of a generated weather alert. Distinct from `weatherAlertLevelEnum`:
 * an alert only exists when there's something to report, so there's no "clear".
 */
export const weatherSeverityEnum = pgEnum("weather_severity", [
  "warning",
  "alert",
  "danger",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  // User preferences: language + weather alert sensitivity.
  preferences: jsonb("preferences").$type<{
    language?: "sq" | "en";
    alertSensitivity?: "low" | "medium" | "high";
  }>(),
  role: userRole("role").notNull().default("hiker"),
  onboardingCompleted: boolean("onboarding_completed")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    // Bump the timestamp automatically on every update issued through Drizzle.
    .$onUpdate(() => new Date()),
  // Soft delete: non-null when the row is logically deleted.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  website: text("website"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  city: text("city"),
  foundedYear: integer("founded_year"),
  // Owner kept nullable so deleting the user orphans the org rather than deleting it.
  ownerId: uuid("owner_id").references(() => users.id, {
    onDelete: "set null",
  }),
  subscriptionTier: subscriptionTierEnum("subscription_tier")
    .notNull()
    .default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  subscriptionStatus: text("subscription_status"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: orgMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (t) => [
    unique("organization_members_org_user_unique").on(
      t.organizationId,
      t.userId,
    ),
    index("organization_members_user_id_idx").on(t.userId),
    index("organization_members_organization_id_idx").on(t.organizationId),
  ],
);

export const trails = pgTable(
  "trails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    region: text("region"),
    city: text("city"),
    countryCode: text("country_code").notNull().default("XK"),
    difficulty: difficultyEnum("difficulty").notNull(),
    distanceKm: numeric("distance_km", { precision: 6, scale: 2 }),
    elevationGainM: integer("elevation_gain_m"),
    estimatedDurationMin: integer("estimated_duration_min"),
    trailType: trailTypeEnum("trail_type"),
    startLat: numeric("start_lat", { precision: 10, scale: 7 }),
    startLng: numeric("start_lng", { precision: 10, scale: 7 }),
    endLat: numeric("end_lat", { precision: 10, scale: 7 }),
    endLng: numeric("end_lng", { precision: 10, scale: 7 }),
    gpxUrl: text("gpx_url"),
    // Sampled elevation profile: ordered points along the trail.
    elevationProfile:
      jsonb("elevation_profile").$type<
        Array<{ distance: number; elevation: number }>
      >(),
    seasons: text("seasons").array(),
    features: text("features").array(),
    coverImageUrl: text("cover_image_url"),
    submittedBy: uuid("submitted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("trails_region_idx").on(t.region),
    index("trails_difficulty_idx").on(t.difficulty),
    index("trails_country_code_idx").on(t.countryCode),
  ],
);

export const trips = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    trailId: uuid("trail_id").references(() => trails.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    startDatetime: timestamp("start_datetime", {
      withTimezone: true,
    }).notNull(),
    endDatetime: timestamp("end_datetime", { withTimezone: true }),
    meetingPoint: text("meeting_point"),
    meetingLat: numeric("meeting_lat", { precision: 10, scale: 7 }),
    meetingLng: numeric("meeting_lng", { precision: 10, scale: 7 }),
    maxParticipants: integer("max_participants"),
    minParticipants: integer("min_participants").notNull().default(1),
    priceEur: numeric("price_eur", { precision: 8, scale: 2 })
      .notNull()
      .default("0"),
    difficulty: difficultyEnum("difficulty"),
    requirements: text("requirements"),
    included: text("included"),
    gpxUrl: text("gpx_url"),
    status: tripStatusEnum("status").notNull().default("draft"),
    canceledReason: text("canceled_reason"),
    weatherAlertLevel: weatherAlertLevelEnum("weather_alert_level")
      .notNull()
      .default("clear"),
    coverImageUrl: text("cover_image_url"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("trips_organization_id_idx").on(t.organizationId),
    index("trips_status_idx").on(t.status),
    index("trips_start_datetime_idx").on(t.startDatetime),
  ],
);

export const tripRegistrations = pgTable(
  "trip_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: registrationStatusEnum("status").notNull().default("pending"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("free"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    amountPaidEur: numeric("amount_paid_eur", { precision: 8, scale: 2 }),
    waiverSignedAt: timestamp("waiver_signed_at", { withTimezone: true }),
    notes: text("notes"),
    registeredAt: timestamp("registered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
  },
  (t) => [
    unique("trip_registrations_trip_user_unique").on(t.tripId, t.userId),
    index("trip_registrations_trip_id_idx").on(t.tripId),
    index("trip_registrations_user_id_idx").on(t.userId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trailId: uuid("trail_id")
      .notNull()
      .references(() => trails.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    conditionReport: text("condition_report"),
    hikedAt: date("hiked_at"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("reviews_trail_user_unique").on(t.trailId, t.userId),
    check("reviews_rating_range", sql`${t.rating} BETWEEN 1 AND 5`),
  ],
);

export const tripPhotos = pgTable("trip_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const weatherAlerts = pgTable(
  "weather_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    level: weatherSeverityEnum("level").notNull(),
    condition: text("condition").notNull(),
    value: numeric("value").notNull(),
    threshold: numeric("threshold").notNull(),
    forecastFor: timestamp("forecast_for", { withTimezone: true }).notNull(),
    // Null until the alert has been dispatched to participants.
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("weather_alerts_trip_id_idx").on(t.tripId),
    index("weather_alerts_sent_at_idx").on(t.sentAt),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    link: text("link"),
    // Null while unread.
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Partial index: the common query is "my unread notifications", so we only
    // index unread rows — smaller and exactly matched to that filter.
    index("notifications_unread_user_id_idx")
      .on(t.userId)
      .where(sql`${t.readAt} IS NULL`),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Kept nullable + set null so audit history survives user deletion.
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_logs_user_id_idx").on(t.userId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ],
);

/** Early-access signups captured from the public landing page. */
export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("landing"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Better Auth-owned tables. Better Auth reads/writes these via the Drizzle
 * adapter; field (property) names must match Better Auth's expected schema.
 * IDs are uuids generated by Postgres to match our `users.id`.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    // Bcrypt hash for the email/password ("credential") provider.
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

export type WaitlistEntry = typeof waitlist.$inferSelect;
export type NewWaitlistEntry = typeof waitlist.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

export type Trail = typeof trails.$inferSelect;
export type NewTrail = typeof trails.$inferInsert;

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

export type TripRegistration = typeof tripRegistrations.$inferSelect;
export type NewTripRegistration = typeof tripRegistrations.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type TripPhoto = typeof tripPhotos.$inferSelect;
export type NewTripPhoto = typeof tripPhotos.$inferInsert;

export type WeatherAlert = typeof weatherAlerts.$inferSelect;
export type NewWeatherAlert = typeof weatherAlerts.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
