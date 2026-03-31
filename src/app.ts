import express from "express";
import { limitRouter } from "./routes/limit.routes";
import { withdrawRouter } from "./routes/withdraw.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/limit", limitRouter);
app.use("/api/withdraw", withdrawRouter);

app.use(notFoundHandler);
app.use(errorHandler);