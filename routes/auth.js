import express from "express";
import bcrypt from 'bcrypt';
import User from "../models/User.js";

const router =  express.Router();

router.post('/register', async(req, res) =>{
    const {username, password, role} = req.body;
    const hashed  = await bcrypt.hash(password, 10);
    const user = new User({username, password:hashed, role});
    await user.save();
    res.json({message: "User Registered!!"});
});

router.post('/login', async(req, res) => {
    const {username, password, role} = req.body;
    const user = await User.findOne({username});
    if(!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({message: "Invalid Credentials!!"});
    }
    req.session.userId = user._id;
    req.session.role = user.role;
    res.json({message: "Logged In!!", role: user.role});
});

router.post('/logout', (req,res) =>{
    req.session.destroy();
    res.json({message: "Logged out."});
});

export default router;