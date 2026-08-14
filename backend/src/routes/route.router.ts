import { Router, Request, Response } from "express";
import { RouteService } from "../services/route.service";
import { RouteQuerySchema } from "../utils/validation";

const router = Router();

router.get("/route", async (req: Request, res: Response) => {
  try {
    const parseResult = RouteQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid route query parameters", details: parseResult.error.format() });
    }

    const { fromLat, fromLng, toLat, toLng } = parseResult.data;
    const route = await RouteService.getRoute(fromLat, fromLng, toLat, toLng);

    return res.status(200).json({
      success: true,
      ...route,
    });
  } catch (err: any) {
    console.error("[RouteRouter Error]", err.message);
    return res.status(500).json({ error: "Failed to calculate route", details: err.message });
  }
});

export default router;
