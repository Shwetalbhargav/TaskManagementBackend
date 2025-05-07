import mongoose from "mongoose";
import { type } from "os";

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    dueDate: Date,
    priority: {
        type: String,
        enum: ['1-Critical', '2-High', '3-Medium', '4-Low', '5-Planning']
    },
    status: {
        type: String,
        enum: ['inProgress', 'completed','discarded', 'pending']
    },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    assignedTo: [{type: mongoose.Schema.Types.ObjectId, ref: 'Team'}],
    assignedTeam: [{type: mongoose.Schema.Types.ObjectId, ref:'Team'}],
    recurrence:{
        type: String,
        enum: ['daily','weekly','monthly']
    },
    originalTaskId: {type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null}
});

export default mongoose.model('Task', taskSchema);