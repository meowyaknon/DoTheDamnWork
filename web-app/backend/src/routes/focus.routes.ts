import { Router } from "express"

import {
    getFocusStatus,
    startFocus,
    pauseFocus,
    resetFocus,
    setFocusDuration,
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

router.post("/focus/duration", (req, res) => {
    const minutes = req.body?.minutes;

    if (
        typeof minutes !== "number" ||
        !Number.isInteger(minutes) ||
        minutes < 5 ||
        minutes > 60 ||
        minutes % 5 !== 0
    ) {
        res.status(400).json({
            status: "error",
            message:
                "minutes must be an integer from 5 to 60 in steps of 5",
        });
        return;
    }

    try {
        res.status(200).json({
            status: "ok",
            data: setFocusDuration(minutes),
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(409).json({
                status: "error",
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            status: "error",
            message: "Unable to update focus duration",
        });
    }
});

export default router;