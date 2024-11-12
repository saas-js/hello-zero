# Hello Zero

## Option 1: Run this repo

First, install dependencies:

```sh
npm i
```

Next, run docker:

```sh
npm run docker-up
```

**In a second terminal**, run the zero cache server:

```sh
npx zero-cache
```

**In a third terminal**, run the Vite dev server:

```sh
npm run dev
```

## Option 2: Install Zero in your own project

This guide explains how to set up Zero in your React application, using this
repository as a reference implementation.

### Prerequisites

**1. PostgreSQL database with Write-Ahead Logging (WAL) enabled**

See (this Notion doc for
instructions)[https://www.notion.so/replicache/Connecting-to-Postgres-12b3bed8954581db8e05e1ac77c77515]

**2. Environment Variables**

Set the following environment variables. `ZSTART_DB` is the URL to your Postgres
database.

```js
ZSTART_DB=postgresql://user:password@localhost:5432/postgres
JWT_SECRET=your-secret-here
ZSTART_REPLICA_DB_FILE=path/to/replica.db
VITE_PUBLIC_SERVER=http://localhost:4848
```

### Setup

1. **Install Zero**

```bash
npm install @rocicorp/zero
```

This is a private repository. You'll need NPM access.

2. **Create Schema** Define your database schema using Zero's schema builder.
   See [schema.ts](src/schema.ts) for example:

```typescript
import { createSchema, createTableSchema } from "@rocicorp/zero/schema";

const userSchema = createTableSchema({
  tableName: "user",
  columns: {
    id: { type: "string" },
    name: { type: "string" },
  },
  primaryKey: ["id"],
});

export const schema = createSchema({
  version: 1,
  tables: {
    user: userSchema,
  },
});

export type Schema = typeof schema;
```

3. **Configure Zero** Create [zero.config.ts](zero.config.ts) in your project
   root:

```typescript
import { defineConfig } from "@rocicorp/zero/config";
import { schema, type Schema } from "./src/schema";

// The contents of your decoded JWT
type AuthData = {
  sub: string;
};

export default defineConfig<AuthData, Schema>(schema, (query) => {
  const allowIfLoggedIn = (authData: AuthData) =>
    query.user.where("id", "=", authData.sub);

  const allowIfMessageSender = (authData: AuthData, row: Message) => {
    return query.message
      .where("id", row.id)
      .where("senderID", "=", authData.sub);
  };

  return {
    upstreamDBConnStr: must(process.env.ZSTART_DB),
    cvrDBConnStr: must(process.env.ZSTART_DB),
    changeDBConnStr: must(process.env.ZSTART_DB),
    replicaDBFile: must(process.env.ZSTART_REPLICA_DB_FILE),
    jwtSecret: must(process.env.JWT_SECRET),

    numSyncWorkers: undefined, // this means numCores - 1

    log: {
      level: "debug",
      format: "text",
    },

    authorization: {
      // Example authorization rules
      message: {
        row: {
          insert: undefined, // anyone can insert
          update: [allowIfMessageSender], // only sender can edit their messages
          delete: [allowIfLoggedIn], // must be logged in to delete
        },
      },

      // you can add more authorization rules here for each table
    },
  };
});
```

4. **Initialize Zero Client-Side** Set up the Zero provider in your app entry
   point. See [main.tsx](src/main.tsx):

```tsx
import { Zero } from "@rocicorp/zero";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema } from "./schema";

// In a real app, you might initialize this inside of useMemo
// and use a real auth token
const z = new Zero({
  userID: "your-user-id",
  auth: "your-auth-token",
  server: import.meta.env.VITE_PUBLIC_SERVER,
  schema,
  kvStore: "mem", // or "idb" for IndexedDB persistence
});

createRoot(document.getElementById("root")!).render(
  <ZeroProvider zero={z}>
    <App />
  </ZeroProvider>
);
```

5. **Using Zero in Components** Example usage in React components. See
   [App.tsx](src/App.tsx):

```typescript
import { useQuery, useZero } from "@rocicorp/zero/react";
import { Schema } from "./schema";

// You may want to put this in its own file
const useZ = useZero<Schema>;

export function UsersPage() {
  const z = useZ();
  const users = useQuery(z.query.user);

  if (!users) {
    return null;
  }

  // Use the data...
  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

For more examples of queries, mutations, and relationships, explore the
[App.tsx](src/App.tsx) file in this repository.

### Optional: Authentication

This example includes JWT-based authentication. See [api/index.ts](api/index.ts)
for an example implementation using Hono.

### Development

**1. Start the PostgreSQL database:**

If you are using Docker (referencing the example in
[docker](docker/docker-compose.yml)), run:

```bash
npm run docker-up
```

**2. Start the zero cache server (in a separate terminal):**

```bash
npx zero-cache
```

**3. Start your React dev server**

```bash
npm run dev # this depends on your react app setup
```
