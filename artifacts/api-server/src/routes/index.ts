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
import socialRouter from "./social";
import calendarRouter from "./calendar";
import itinerariesRouter from "./itineraries";

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
router.use(socialRouter);
router.use(calendarRouter);
router.use(itinerariesRouter);

export default router;
