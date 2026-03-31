import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { processWithdrawal } from "../services/withdraw.service";
import { AppError } from "../utils/app-error";

const bodySchema = z.object({
  userId: z.number().int().positive(),
  amount: z.number().positive()
});

export async function withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idempotencyKey = req.header("Idempotency-Key");
    if (!idempotencyKey) {
      throw new AppError(400, "MISSING_IDEMPOTENCY_KEY", "Idempotency-Key header is required");
    }

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "INVALID_PAYLOAD", "Invalid withdrawal payload", parsed.error.flatten());
    }

    const result = await processWithdrawal({
      userId: parsed.data.userId,
      amountRupees: parsed.data.amount,
      idempotencyKey
    });

    if (result.status === "FAILED" && result.reason === "MONTHLY_WITHDRAWAL_LIMIT_REACHED") {
      res.status(429).json(result);
      return;
    }

    if (result.status === "FAILED") {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}