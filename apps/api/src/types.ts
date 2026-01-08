import type { Context } from "hono";

export interface AppEnv {
  Variables: {
    userId?: string;
    requestId: string;
  };
}

export type AppContext = Context<AppEnv>;
