import { Router } from "express";

const router = Router();

router.get("/status", (_req, res) => {
  res.status(200).json({
    status: "ok",
    data: {
        server: "online",
        focus: "idle",
        device: "disconnected",
    },
    message: "System route is working",
  });
});

export default router;