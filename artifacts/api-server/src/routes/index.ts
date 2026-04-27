import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import statsRouter from "./stats";
import destinationsRouter from "./destinations";
import churchesRouter from "./churches";
import marketplaceRouter from "./marketplace";
import mezmursRouter from "./mezmurs";
import newsRouter from "./news";
import adminRouter from "./admin";
import qaRouter from "./qa";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(statsRouter);
router.use(destinationsRouter);
router.use(churchesRouter);
router.use(marketplaceRouter);
router.use(mezmursRouter);
router.use(newsRouter);
router.use(adminRouter);
router.use(qaRouter);

export default router;
