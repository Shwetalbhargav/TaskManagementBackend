import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    name: {type: String, required: true},
    members: [{
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        role: {type: String, enum: ['admin','manager', 'user']}
    }]
        
}, {timestamps: true});

export default mongoose.model('Team', taskSchema);
