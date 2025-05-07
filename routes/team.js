import express from "express";
import mongoose from "mongoose";
import Team from "../models/Team.js";
import Task from "../models/Task.js";
import { isAuthenticated, hasRole } from "../middleware/authMiddleware.js";
import { sendNotification } from "../utils/notifications.js";
import { sendSocketNotifications } from "../index.js";
import { logAction } from "../utils/Audit.js";

const router = express.Router();

// Create a team
router.post('/', isAuthenticated, hasRole(['admin', 'manager']), async (req, res) => {
    try {
        const { name, members } = req.body;

        const team = await Team.create({ name, members });

        // Notify members
        for (const m of members) {
            await sendNotification(m.user, `You have been added to team "${name}" as ${m.role}`);
            sendSocketNotifications(m.user, `You have been added to team "${name}" as ${m.role}`);
        }

        await logAction(req.session.userId, 'CREATE', 'Team', team._id);
        res.status(201).json(team);
    } catch (err) {
        console.error("Error creating team:", err);
        res.status(500).json({ error: "Failed to create team", details: err.message });
    }
});

// Update team members
router.put('/:teamId/members', isAuthenticated, hasRole(['admin', 'manager']), async (req, res) => {
    try {
        const { teamId } = req.params;
        const { members } = req.body;

        const team = await Team.findByIdAndUpdate(
            teamId,
            { members },
            { new: true }
        );

        if (!team) return res.status(404).json({ message: "Team not found" });

        for (const m of members) {
            await sendNotification(m.user, `Your role in team "${team.name}" is updated to ${m.role}`);
            sendSocketNotifications(m.user, `Updated role in team "${team.name}" to ${m.role}`);
        }

        await logAction(req.session.userId, 'UPDATE', 'Team', team._id);
        res.json(team);
    } catch (err) {
        console.error("Error updating members:", err);
        res.status(500).json({ error: "Failed to update team members", details: err.message });
    }
});

// Assign a task to a team
router.post('/:teamId/assign-task', isAuthenticated, hasRole(['admin', 'manager']), async (req, res) => {
    try {
        const { title, description, dueDate, priority } = req.body;
        const { teamId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ error: "Invalid team ID" });
        }

        const team = await Team.findById(teamId).populate('members.user', 'username');
        if (!team) return res.status(404).json({ message: "Team not found" });

        const task = await Task.create({
            title,
            description,
            dueDate,
            priority,
            status: 'pending',
            createdBy: req.session.userId,
            assignedTeam: [team._id]
        });

        for (const m of team.members) {
            await sendNotification(m.user._id, `A new task "${title}" has been assigned to team "${team.name}"`);
            sendSocketNotifications(m.user._id, `Task "${title}" assigned to your team "${team.name}"`);
        }

        await logAction(req.session.userId, 'ASSIGN', 'Team', team._id);
        res.status(201).json(task);
    } catch (err) {
        console.error("Error assigning task:", err);
        res.status(500).json({ error: "Failed to assign task to team", details: err.message });
    }
});
export default router;
