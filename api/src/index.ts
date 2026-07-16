import { Hono } from "hono";
import { cors } from "hono/cors";

// Type-safe bindings — stub for now, real D1 / KV / R2 to be added after CF API Token lands.
type Bindings = {
  // Phase 2 wiring (post-token):
  // DB: D1Database;
  // MODULES: KVNamespace;
  // R2_BLOB: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// ── CORS ────────────────────────────────────────────────────────────
// quill.maplespike.ca (frontend) → this Worker (SaaS backend)
app.use(
  "*",
  cors({
    origin: [
      "https://quill.maplespike.ca",
      "https://maplespike.ca",
      // OCI self-host origins (to be added when user runs container build):
      // "http://localhost:8080",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// ── Root catch-all ──────────────────────────────────────────────────
app.get("/", (c) =>
  c.json({
    service: "quill-api",
    description:
      "Hono.js CF Worker \u2014 SaaS edge for the Maplespike MCP + REST monolith. Pascal mirror of packages/api-server (reverb256/maplespike).",
    endpoints: ["/", "/v1/health", "/v1/modules", "/v1/openapi.json"],
    dual_mode: "SaaS (this) \u2016 self-host (Node Hono fork @ packages/api-server)",
    deploy_status: "Stub phase \u2014 D1/KV bindings land with CF API Token.",
    version: "0.2.0-stub",
  })
);

// ── Health check ────────────────────────────────────────────────────
app.get("/v1/health", (c) =>
  c.json({
    status: "ok",
    service: "quill-api",
    variant: "mcp-and-rest",
    version: "0.2.0-stub",
    timestamp: new Date().toISOString(),
    bindings_active: [],
  })
);

// ── Modules list stub ──────────────────────────────────────────────
const ModuleListSchema = {
  type: "object",
  properties: {
    note: { type: "string" },
    count_target: { type: "integer", description: "198 modules across federal/provincial/regulatory/corporate" },
    handoff: { type: "string" },
    sample: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          sha256: { type: "string" },
          source: { type: "string" },
          fetched: { type: "string", format: "date-time" },
        },
        required: ["id", "sha256", "source", "fetched"],
      },
    },
    next_steps: { type: "array", items: { type: "string" } },
  },
  required: ["note", "count_target", "handoff"],
};

app.get("/v1/modules", (c) =>
    c.json({
      note: "stub-modules-list",
      count_target: 198,
      handoff:
        "Federated via reverb256/maplespike/packages/pipeline-core. Live at api.maplespike.ca once CF API Token enables Zone:Edit + D1 binding.",
      sample: [
        {
          id: "lobbying_registry_2026",
          sha256: "9f2e3c0a7b41a0",
          source: "https://open.canada.ca/lobbying_registry.csv",
          fetched: "2026-06-29T14:02:11Z",
        },
      ],
      next_steps: ["bind D1", "wire pipeline-core", "expose auth"],
    })
);

// ── OpenAPI 3.1.0 spec ──────────────────────────────────────────────
app.get("/v1/openapi.json", (c) =>
  c.json({
    openapi: "3.1.0",
    info: {
      title: "MapleSpike API",
      version: "0.2.0-stub",
      description:
        "SaaS edge for MapleSpike MCP + REST. 198 modules, 164 MCP tools, SHA-256 provenance on every record.",
    },
    servers: [
      { url: "https://quill-api.j-kroeker.workers.dev", description: "Cloudflare Workers stub" },
      { url: "https://api.maplespike.ca", description: "Production (pending CF API Token + custom domain attach)" },
    ],
    paths: {
      "/v1/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { status: { type: "string" }, service: { type: "string" }, version: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
      "/v1/modules": {
        get: {
          tags: ["modules"],
          summary: "List all modules (Canada\u2019s public record)",
          responses: {
            "200": { description: "Module list", content: { "application/json": { schema: ModuleListSchema } } },
          },
        },
      },
    },
    components: {
      schemas: {
        Module: {
          type: "object",
          required: ["id", "sha256", "source", "fetched"],
          properties: {
            id: { type: "string" },
            sha256: { type: "string" },
            source: { type: "string", format: "uri" },
            fetched: { type: "string", format: "date-time" },
            pipeline: { type: "string", description: "pipeline-core version that produced this record" },
          },
        },
        ModuleList: ModuleListSchema,
      },
    },
  })
);

export default app;
