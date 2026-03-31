import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ code: "NOT_FOUND", message: "Route not found" });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ code: error.code, message: error.message, details: error.details });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ code: "VALIDATION_ERROR", message: "Validation failed", details: error.flatten() });
    return;
  }

  console.error(error);
  res.status(500).json({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" });
}