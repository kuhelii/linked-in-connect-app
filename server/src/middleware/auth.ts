import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import type { IUser } from "../types";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate("jwt", { session: false }, (err: any, user: IUser) => {
    if (err) {
      return res.status(500).json({ error: "Authentication error" });
    }
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    (req as any).user = user;
    next();
  })(req, res, next);
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate("jwt", { session: false }, (err: any, user: IUser) => {
    if (user) {
      (req as any).user = user;
    }
    next();
  })(req, res, next);
};
