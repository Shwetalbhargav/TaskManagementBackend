import mongoose from "mongoose";

const passwordValidator = function(password){
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])/;
    return regex.test(password);
}

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique:true},
    password: {
        type: String,
        required: true,
        validate: {
            validator: passwordValidator,
            message: "Password must contain at least one uppercase and one special character."
        }
    },
    
    role: {type: String , enum: ['admin', 'manager','user']},

    teams: [{
        teamId: {type: mongoose.Schema.Types.ObjectId, ref: 'Team'},
        role: {type: String, enum:['Team Leader', 'member']}
    }]
});



export default mongoose.model('User', userSchema)

