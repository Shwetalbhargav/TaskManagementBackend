import express from "express";
import Task from "../models/Task.js";
import {isAuthenticated,hasRole} from "../middleware/authMiddleware.js";
import {sendNotification} from "../utils/notifications.js";
import { sendSocketNotifications } from "../index.js";
import {logAction} from "../utils/Audit.js";
import mongoose from "mongoose";
import Team from "../models/Team.js";

const router = express.Router();

//Create Task(manager or admin)
router.post('/', isAuthenticated, hasRole(['manager', 'admin']), async (req, res) => {
    try {
        let { assignedTo, ...taskData } = req.body;

        if (!Array.isArray(assignedTo)) assignedTo = [assignedTo];
        assignedTo = assignedTo.flat().map(id => new mongoose.Types.ObjectId(id));

        const task = new Task({
            ...taskData,
            createdBy: req.session.userId,
            assignedTo
        });

        await task.save();
        await logAction(req.session.userId, 'UPDATE', 'TASK', task._id);

        for (const userId of assignedTo) {
            await sendNotification(userId, `You have been assigned a new task: "${task.title}"`);
            sendSocketNotifications(userId, `You have been assigned a new task: "${task.title}"`);
        }

        res.json(task);
    } catch (err) {
        console.error("Task creation error:", err);
        res.status(500).json({ error: "Task creation failed", details: err.message });
    }
});


//Get All Task with filters(All  authenticated users)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const { title, createdBy, priority, status, dueDateFrom, dueDateTo } = req.query;

        const query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }

        if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
            query.createdBy = new mongoose.Types.ObjectId(createdBy);
        }

        if (priority) {
            query.priority = priority;
        }

        if (status) {
            query.status = status;
        }

        if (dueDateFrom || dueDateTo) {
            query.dueDate = {};
            if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
            if (dueDateTo) query.dueDate.$lt = new Date(dueDateTo);
        }

        const tasks = await Task.find(query)
            .populate('createdBy', 'username')
            .populate('assignedTo', 'name'); // assuming assignedTo refers to Team model

        res.json(tasks);
    } catch (err) {
        console.error("Failed to fetch tasks:", err);
        res.status(500).json({ error: "Failed to fetch tasks", details: err.message });
    }
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
    await logAction(req.session.userId, 'UPDATE', 'Task', task._id);
    res.json(task);
});

//Delete Task(Admin or Manager)
router.delete('/:id', isAuthenticated, hasRole(['manager', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid Task ID" });
        }

        const task = await Task.findByIdAndDelete(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        await logAction(req.session.userId, 'DELETE', 'Task', task._id);
        res.json({ message: "Deleted!" });
    } catch (err) {
        console.error("Task deletion error:", err);
        res.status(500).json({ error: "Failed to delete task", details: err.message });
    }
});

//Dashboard:tasks created by, assigned to, and overdue status
router.get('/dashboard', isAuthenticated, async(req, res) =>{
    const userId = req.session.userId;
    const now = new Date();

    const [createdTasks, assignedTasks, overdueTasks] = await Promise.all([
        Task.find({createdBy:userId}),
        Task.find({assignedTo:userId}),
        Task.find({
            assignedTo:userId,
            dueDate:{$lt: now},
            status: {$ne: "completed"}
        })
    ]);

    res.json({
        createdTasks,
        assignedTasks,
        overdueTasks
    });
});

export default router;