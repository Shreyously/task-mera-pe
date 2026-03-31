import { Router } from "express";
import { getAvailableLimit } from "../controllers/limit.controller";

const limitRouter = Router();
limitRouter.get("/:userId", getAvailableLimit);

export { limitRouter };