import { defineConfig } from "@rocicorp/zero/config";
import { schema, type Schema } from "./src/schema.js";

// The contents of your decoded JWT.
type AuthData = {
  sub: string;
};

export default defineConfig<AuthData, Schema>(schema, () => {
  return {
    upstreamDBConnStr: "postgresql://127.0.0.1:5432/zerotest",
    cvrDBConnStr: "postgresql://127.0.0.1:5432/zerotest",
    changeDBConnStr: "postgresql://127.0.0.1:5432/zerotest",

    numSyncWorkers: undefined, // this means numCores - 1

    replicaDBFile: "/tmp/zerotest-sync-replica.db",
    jwtSecret: undefined,

    log: {
      level: "debug",
      format: "text",
    },

    authorization: {},
  };
});
