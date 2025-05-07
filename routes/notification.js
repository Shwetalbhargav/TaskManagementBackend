import express from "express";
import Notification from "../models/Notification.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import router from "./auth.js";
import {logAction} from "../utils/Audit.js";

const Router = express.Router();

router.get('/', isAuthenticated, async(req,res) =>{
    try{
    const notification = await Notification.find({user: req.session.userId}).sort({createdAt: -1});
    res.json(notification);
    }catch(err){
        res.status(500).json({ error: "Failed to fetch notifications", details: err.message });
    }
});

router.get('/:id/read', isAuthenticated, async(req, res) =>{
    try{
    const notification = await Notification.findOne({_id:req.params.id, user:req.session.userId});4
    if(!notification) return res.status(404).json({message: "not found."})

        notification.read = true;
        await notification.save();
        res.json({message:"Marked as read."});
        }catch(err){
            res.status(500).json({ error: "Failed to mark as read", details: err.message });
        };
});
export default router;
