import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    name: String,
    members: [{type: mongoose.Schema.Types.ObjectId, ref:'User'}]
});

export default mongoose.model('Team', taskSchema);
