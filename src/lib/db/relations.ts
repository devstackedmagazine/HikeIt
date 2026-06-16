import { relations } from "drizzle-orm";

import {
  accounts,
  notifications,
  organizationMembers,
  organizations,
  reviews,
  sessions,
  trails,
  tripPhotos,
  tripRegistrations,
  trips,
  users,
  weatherAlerts,
} from "@/lib/db/schema";

export const usersRelations = relations(users, ({ many }) => ({
  ownedOrganizations: many(organizations),
  organizationMemberships: many(organizationMembers),
  tripRegistrations: many(tripRegistrations),
  reviews: many(reviews),
  tripPhotos: many(tripPhotos),
  notifications: many(notifications),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [organizations.ownerId],
      references: [users.id],
    }),
    members: many(organizationMembers),
    trips: many(trips),
  }),
);

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
  }),
);

export const trailsRelations = relations(trails, ({ many }) => ({
  trips: many(trips),
  reviews: many(reviews),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [trips.organizationId],
    references: [organizations.id],
  }),
  trail: one(trails, {
    fields: [trips.trailId],
    references: [trails.id],
  }),
  registrations: many(tripRegistrations),
  photos: many(tripPhotos),
  weatherAlerts: many(weatherAlerts),
}));

export const tripRegistrationsRelations = relations(
  tripRegistrations,
  ({ one }) => ({
    trip: one(trips, {
      fields: [tripRegistrations.tripId],
      references: [trips.id],
    }),
    user: one(users, {
      fields: [tripRegistrations.userId],
      references: [users.id],
    }),
  }),
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  trail: one(trails, {
    fields: [reviews.trailId],
    references: [trails.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const tripPhotosRelations = relations(tripPhotos, ({ one }) => ({
  trip: one(trips, {
    fields: [tripPhotos.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripPhotos.userId],
    references: [users.id],
  }),
}));

export const weatherAlertsRelations = relations(weatherAlerts, ({ one }) => ({
  trip: one(trips, {
    fields: [weatherAlerts.tripId],
    references: [trips.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
