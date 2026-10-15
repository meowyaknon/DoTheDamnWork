import { Router } from "express"

import {
    getFocusStatus,
    startFocus,
    pauseFocus,
    resetFocus,
} from "../services/focus.service.js"

const router = Router();

router.get("/focus",(_req, res) => {
    res.status(200).json({
        status: "ok",
        data: getFocusStatus(),
    });
});

router.post("/focus/start", (_req, res) => {
    res.status(200).json({
        status: "ok",
        data: startFocus(),
    });
});

router.post("/focus/pause", (_req, res) => {
    res.status(200).json({
        status: "ok",
        data: pauseFocus(),
    });
});

router.post("/focus/reset", (_req, res) => {
    res.status(200).json({
        status: "ok",
        data: resetFocus(),
    });
});

export default router;