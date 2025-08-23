import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import type { IUser } from "../types";

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}
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
      console.log("Broda, User not found");
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
