import express from "express";
import Notification from "../models/Notification.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import router from "./auth.js";

const Router = express.Router();

router.get('/', isAuthenticated, async(req,res) =>{
    const notification = await Notification.findById({user: req.session.userId}).sort({createdAt: -1});
    res.json(notification);
});

router.get('/:id/read', isAuthenticated, async(req, res) =>{
    const notification = await Notification.findOne({_id:req.params.id, user:req.session.userId});4
    if(!notification) return res.status(404).json({message: "not found."})

        notification.read = true;
        await notification.save();
        res.json({message:"Marked as read."});
});
export default router;
