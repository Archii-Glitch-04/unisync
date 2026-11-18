// UniSync shared backend (Netlify Function v2 + Netlify Blobs)
// Public:  GET /api/db, GET /api/file/:key, POST /api/login
// Admin:   PUT /api/db/:collection, POST /api/reset, POST /api/password,
//          POST /api/file, DELETE /api/file/:key   (header: x-admin-password)

import { getStore } from "@netlify/blobs";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

const COLLECTIONS = ["subjects", "config", "notices", "schedule", "buses", "notes", "assignments", "quizzes", "activity"];
const FALLBACK_PASSWORD = "Admin@12345"; // used only if ADMIN_PASSWORD env var is not set and no password was changed in the app
const MAX_FILE_BYTES = 5 * 1024 * 1024; // Netlify Functions accept ~6 MB request bodies
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const sha = (s) => createHash("sha256").update("unisync:" + s).digest("hex");

function safeEqual(a, b) {
  try {
    return timingSafeEqual(Buffer.from(sha(a)), Buffer.from(sha(b)));
  } catch {
    return false;
  }
}

const isStrong = (p) =>
  typeof p === "string" && p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);

async function checkPassword(db, pw) {
  if (!pw) return false;
  const stored = await db.get("_admin_hash"); // set when the admin changes the password in the app
  if (stored) {
    try {
      return timingSafeEqual(Buffer.from(sha(pw)), Buffer.from(stored));
    } catch {
      return false;
    }
  }
  return safeEqual(pw, process.env.ADMIN_PASSWORD || FALLBACK_PASSWORD);
}

export default async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const method = req.method;
  const db = getStore("unisync-data");
  const files = getStore("unisync-files");
  const pw = req.headers.get("x-admin-password") || "";

  try {
    // ---------- public routes ----------
    if (parts[0] === "db" && parts.length === 1 && method === "GET") {
      const data = {};
      await Promise.all(
        COLLECTIONS.map(async (c) => {
          data[c] = await db.get(c, { type: "json" });
        })
      );
      return json({ data });
    }

    if (parts[0] === "login" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      return (await checkPassword(db, body.password)) ? json({ ok: true }) : json({ error: "Incorrect password" }, 401);
    }

    if (parts[0] === "file" && parts[1] && method === "GET") {
      const entry = await files.getWithMetadata(parts[1], { type: "arrayBuffer" });
      if (!entry) return json({ error: "Not found" }, 404);
      const meta = entry.metadata || {};
      const safeName = String(meta.name || "file").replace(/[^\w.\- ]+/g, "_");
      return new Response(entry.data, {
        headers: {
          "content-type": meta.type || "application/octet-stream",
          "content-disposition": `inline; filename="${safeName}"`,
          "cache-control": "public, max-age=3600",
          "x-content-type-options": "nosniff",
        },
      });
    }

    // ---------- admin-only routes ----------
    if (!(await checkPassword(db, pw))) return json({ error: "Unauthorized" }, 401);

    if (parts[0] === "db" && parts.length === 2 && method === "PUT") {
      const name = parts[1];
      if (!COLLECTIONS.includes(name)) return json({ error: "Unknown collection" }, 404);
      const text = await req.text();
      if (text.length > 1_000_000) return json({ error: "Payload too large" }, 413);
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      await db.setJSON(name, data);
      return json({ ok: true });
    }

    if (parts[0] === "reset" && method === "POST") {
      await Promise.all(COLLECTIONS.map((c) => db.delete(c)));
      const { blobs } = await files.list();
      await Promise.all(blobs.map((b) => files.delete(b.key)));
      return json({ ok: true });
    }

    if (parts[0] === "password" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (!isStrong(body.newPassword)) return json({ error: "Password does not meet the security rules." }, 400);
      await db.set("_admin_hash", sha(body.newPassword));
      return json({ ok: true });
    }

    if (parts[0] === "file" && parts.length === 1 && method === "POST") {
      const type = (req.headers.get("content-type") || "").split(";")[0].trim();
      if (!ALLOWED_TYPES.includes(type)) return json({ error: "Only PDF, PNG, JPG or WEBP files are allowed." }, 415);
      const buf = await req.arrayBuffer();
      if (!buf.byteLength) return json({ error: "Empty file." }, 400);
      if (buf.byteLength > MAX_FILE_BYTES) return json({ error: "File is larger than 5 MB." }, 413);
      let name = "file";
      try {
        name = decodeURIComponent(req.headers.get("x-file-name") || "file");
      } catch {}
      const key = randomUUID();
      await files.set(key, buf, { metadata: { name: name.slice(0, 200), type } });
      return json({ key });
    }

    if (parts[0] === "file" && parts[1] && method === "DELETE") {
      await files.delete(parts[1]);
      return json({ ok: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("API error:", err);
    return json({ error: "Server error" }, 500);
  }
};

export const config = { path: "/api/*" };
