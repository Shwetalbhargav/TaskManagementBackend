import express from "express";
import Team from "../models/Team.js";
import USer from "../models/User.js";
import Task from "../models/Task.js";
import {isAuthenticated , hasRole} from "../middleware/authMiddleware.js";
import sendNotification from "../utils/notifications.js";
import {senSocketNotification} from "../index.js";
import team from "../models/Team.js";

const router = express.Router();

//create team
router.post('/create', isAuthenticated, hasRole(['admin', 'manager']), async(req,res) =>{
    const {name, members} =req.body;
    const team = await Team.create({name, members});

    for( const m of members){
        await sendNotification(m.USer, `You have been added to team "${name}" as ${m.role}`);
        senSocketNotification(m.USer, `You have been added to team "${name}" as ${m.role}`);    
    }

    res.status(201).json(team);
});

//Assign or update team members
router.put('/:teamId/members', isAuthenticated, hasRole(['admin','manager']), async(req, res) =>{
    const {teamId} = req.params;
    const {members} = req.params;

    for( const m of members){
        await sendNotification(m.USer,`Your team membership in "${team.name}" has been updated to ${m.role}`);
        senSocketNotification(m.USer, `Team role in "${team.name}" updated to ${m.role}`);    
    }
    res.json(team);
});

//Asign a task to team
router.post('/:teamId/assign-task', isAuthenticated,hasRole(['admin','manager']), async(req, res) =>{
    const {title, description, dueDate, priority} = req.body;
    const {teamId} = req.body;

    const team = await Team.findById(teamId).populate('members.user', 'username');
    if(!team ) return res.status(404).json({message: "Team noy found."});

    const task = await Task.create({
        title,
        description,
        dueDate,
        priority,
        status: 'pending',
        createdBy: req.session.userId,
        assignedTeam: team._id
    });

    //notify team members
    for(const m of team.members){
        await sendNotification(m.user._id, `A new task "${title}" has been assigned to your team "${team.name}"`);
        sendSocketNotification(m.user._id, `Task "${title}" assigned to team "${team.name}"`);
    }
    res.status(201).json(task);
});