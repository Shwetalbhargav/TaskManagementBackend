import express from "express";
import Task from "../models/Task.js";
import {isAuthenticated,hasRole} from "../middleware/authMiddleware.js";
import sendNotification from "../utils/notifications.js";
import { sendSocketNotifications } from "../index.js";

const router = express.Router();

//Create Task(manager or admin)
router.post('/', isAuthenticated, hasRole(['manager', 'admin']), async(req,res) => {
    const {assignedTo, ...taskData}= req.body;
    const task = new Task({
        ...taskData,
        createdBy: req.session.userId,
        assignedTo: Array.isArray(assignedTo) ? assignedTo : [assignedTo]
    });

    await task.save();

    if(assignedTo){
       const assignedUsers = Array.isArray(assignedTo) ? assignedTo: [assignedTo];
       for (const userId of assignedUsers){
        await sendNotification(userId, `You have been assigned a new task: "${task.title}"`);
        sendSocketNotifications(userId, `You have been assigned a new task: "${task.title}"`);

        await sendNotification(leaderId, `You have been assigned as the Team Leader for ${team.name}`);
        sendSocketNotification(leaderId, `You are now the Team Leader for ${team.name}`);

       }
    }
    res.json(task);
});

//Get All Task with filters(All  authenticated users)
router.get('/', isAuthenticated, async(req, res) =>{
    const {title, createdBy,priority, status, dueDateFrom, dueDateTo} = req.body;

    const query = {};

    if(title){
        query.title = {$regex:title, $options:'i'};
    }
    if(createdBy){
        query.createdBy;
    }
    if(priority){
        query.priority;
    }
    if(status){
        query.status;
    }

    if(dueDateFrom || dueDateTo){
        query.dueDate = {};
        if(dueDateFrom){
            query.dueDate.$gte = new Date(dueDateFrom);
        }
        if(dueDateTo){
            query.dueDate.$lt = new Date(dueDateTo);
        }
    }

    const tasks = await Task.find(query).populate('createdBy assignedTo', 'username');
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