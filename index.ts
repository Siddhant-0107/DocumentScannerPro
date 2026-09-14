import express from "express";
import app from "./server/index.ts";

// Keep Express as a direct dependency of the Vercel entrypoint so Vercel
// can reliably detect this file as the server function.
void express;

export default app;
