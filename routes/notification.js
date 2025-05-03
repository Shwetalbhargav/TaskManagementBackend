import express from "express";
import Notification from "../models/Notification.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import router from "./auth.js";

const Router = express.Router();

router.get('/', isAuthenticated, async(req,res) =>{
    const notification = await Notification.findById({user: req.session.userId}).sort({createdAt: -1});
    res.json(notification);
});

export default router;
