import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (
    _req,
    res,
    _next,
) => {
    res.status(404).json({
        status: "error",
        message: "Not Found",
        path: _req.originalUrl,
    });
}