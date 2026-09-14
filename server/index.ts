import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { aiRouter } from "./ai-routes.js";
import { setupAiStorage } from "./ai-setup.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

try {
  await setupAiStorage();
} catch (error) {
  console.warn(
    "[ai] pgvector setup unavailable:",
    error instanceof Error ? error.message : error,
  );
}

app.use(aiRouter);
await registerRoutes(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

if (!process.env.VERCEL) {
  const { createServer } = await import("http");
  const server = createServer(app);
  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
