import express from "express";
import Task from "../models/Task.js";
import {isAuthenticated,hasRole} from "../middleware/authMiddleware.js";

const router = express.Router();

//Create Task(manager or admin)
router.post('/', isAuthenticated, hasRole(['manager', 'admin']), async(req,res) => {
    const task = new Task({...req.body, createdBy: req.session.userId});
    await task.save();
    res.json(task);
});

//Get All Task(All  authenticated users)
router.get('/', isAuthenticated, async(req, res) =>{
    const tasks = await Task.find();
    res.json(tasks);
});

//Update Task(Admin or Manager)
router.put('/:id', isAuthenticated, async(req, res) =>{
    const task = await Task.findById(req.params.id);
    if(!task) return res.status(404).json({message: "Not found."});

    if(task.createdBy.toString() !==req.session.userId && req.session.role !=='admin'){
        return res.status(403).json({message: "Forbidden!!"});
    }

    Object.assign(task, req.body);
    await task.save();
    res.json(task);
});

//Delete Task(Admin or Manager)
router.delete('/:id', isAuthenticated, hasRole(['manager', 'admin']), async(req,res) => {
    await Task.findByIdAndDelete(req.params.id);
    res.json({message: "Deleted!!"})
});

export default router;