import cron from 'node-cron';
import http from 'http';
import { Server } from 'socket.io';
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import teamRoutes from "./routes/team.js"; 
import authRoutes from "./routes/auth.js";
import tasksRoutes from "./routes/tasks.js";
import notificationRoutes from "./routes/notification.js";
import Task from "./models/Task.js";
import cors from "cors";
import { Socket } from 'dgram';


dotenv.config();
const app =express();
const server = http.createServer(app);
const io = new Server(server);

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin:['http://localhost:3000', 'http://192.168.1.7:3000'],
    credentials:true
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.MONGO_URI})
}));

//Routes
app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);
app.use('/teams', teamRoutes);
app.use(express.json());

const  connectedUsers = {};

io.on('connection', socket =>{
    console.log("user connected.");

    socket.on('register', userId =>{
        connectedUsers[userId]= socket;
    });

    socket.on('disconnect', () =>{
        for(const [id, s] of Object.entries(connectedUsers)){
            if(s===socket) delete connectedUsers[id];
        }
    });
});
cron.schedule(' 0 0 * * * ', async() =>{
    const now = new Date();
    const recurringTasks = await Task.find({
        recurrence: {$ne: 'none' },
        dueDate: {$lte: now}
    });

    for(const task of recurringTasks) {
        let nextDue = new Date(task.dueDate);
        if(task.recurrence === 'daily') nextDue.setDate(nextDue.getDate() + 1);
        if(task.recurrence === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
        if(task.recurrence === 'monthly') nextDue.setDate(nextDue.getDate() + 1);

        const newTask  = new Task({
            ...task.toObject(),
            _id: undefined,
            dueDate: nextDue,
            status: "pending",
            originalTask: task._id
        });

        await newTask.save();
    }
    console.log(`Recurring tasks generated at ${new Date().toISOString()}`)

})
export const sendSocketNotifications = (userId, message) =>{
      const socket =connectedUsers[userId];
      if(socket) socket.emit('notifications', message);
};

app.use('/notification', notificationRoutes);
//DB Connection and start server
mongoose.connect(process.env.MONGO_URI)
     .then(() =>{
        app.listen(process.env.PORT, () =>
            console.log(`Server is running on Port ${process.env.PORT}`)
        );
     })
     .catch((err) =>console.error(err));