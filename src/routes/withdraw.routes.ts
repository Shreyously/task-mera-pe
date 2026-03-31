import { Router } from "express";
import { withdraw } from "../controllers/withdraw.controller";

const withdrawRouter = Router();
withdrawRouter.post("/", withdraw);

export { withdrawRouter };