import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { aiRouter } from "./ai-routes";
import { setupAiStorage } from "./ai-setup";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const originalResJson = res.json;
  let capturedJsonResponse: Record<string, any> | undefined;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      log(logLine.length > 80 ? logLine.slice(0, 79) + "…" : logLine);
    }
  });
  next();
});

(async () => {
  try {
    await setupAiStorage();
  } catch (error) {
    // Keep the core scanner usable on PostgreSQL installations without pgvector.
    // RAG endpoints will report a clear database/API configuration error.
    console.warn("[ai] pgvector setup unavailable:", error instanceof Error ? error.message : error);
  }

  // AI routes must be registered before /api/documents/:id in the legacy router.
  app.use(aiRouter);
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  if (app.get("env") === "development") await setupVite(app, server);
  else serveStatic(app);

  server.listen(5000, "localhost", () => {
    console.log("Server is running on http://localhost:5000");
  });
})();
