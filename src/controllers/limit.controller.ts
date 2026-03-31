import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { calculateAvailableLimit } from "../services/limit.service";
import { AppError } from "../utils/app-error";

const paramsSchema = z.object({ userId: z.coerce.number().int().positive() });

export async function getAvailableLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(400, "INVALID_USER_ID", "userId must be a positive integer", parsed.error.flatten());
    }

    const data = await calculateAvailableLimit(parsed.data.userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}