// These data structures define your client-side schema.
// They must be equal to or a subset of the server-side schema.
// Note the "relationships" field, which defines first-class
// relationships between tables.
// See https://github.com/rocicorp/mono/blob/main/apps/zbugs/src/domain/schema.ts
// for more complex examples, including many-to-many.
//
// Typically these will go in a different file to keep your root UI files tidy.

const userSchema = {
  tableName: "user",
  columns: {
    id: { type: "string" },
    name: { type: "string" },
  },
  primaryKey: ["id"],
  relationships: {},
} as const;

const mediumSchema = {
  tableName: "medium",
  columns: {
    id: { type: "string" },
    name: { type: "string" },
  },
  primaryKey: ["id"],
  relationships: {},
} as const;

const messageSchema = {
  tableName: "message",
  columns: {
    id: { type: "string" },
    senderID: { type: "string" },
    replyToID: { type: "string", optional: true },
    mediumID: { type: "string" },
    body: { type: "string" },
    timestamp: { type: "number" },
  },
  primaryKey: ["id"],
  relationships: {
    sender: {
      source: "senderID",
      dest: {
        schema: () => userSchema,
        field: "id",
      },
    },
    medium: {
      source: "mediumID",
      dest: {
        schema: () => mediumSchema,
        field: "id",
      },
    },
    replies: {
      source: "id",
      dest: {
        schema: () => messageSchema,
        field: "replyToID",
      },
    },
  },
} as const;

export const schema = {
  version: 1,
  tables: {
    user: userSchema,
    medium: mediumSchema,
    message: messageSchema,
  },
} as const;

export type Schema = typeof schema;
