import { Router } from "express";
import {
  getAllUsers,
  handleSignIn,
  handleSignup,
  validateSignin,
  validateSignup,
} from "../controller/user";
import { authenticateToken } from "../middleware/auth";
import { AuthRequest } from "../types";

const userRouter = Router();

userRouter.post("/signin", validateSignin, handleSignIn);
userRouter.post("/signup", validateSignup, handleSignup);
userRouter.get("/getAllUsers", authenticateToken, getAllUsers);

userRouter.get("/profile", authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default userRouter;
