import { api } from "encore.dev/api";

// Returns a simple health status to verify the backend is up.
interface PingResponse {
  ok: boolean;
  service: string;
  time: Date;
}

export const ping = api<void, PingResponse>(
  { expose: true, method: "GET", path: "/ping" },
  async () => {
    return { ok: true, service: "health", time: new Date() };
  }
);
