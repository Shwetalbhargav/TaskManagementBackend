import http from 'http';
import { Server } from 'socket-io';
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import teamRoutes from "./routes/team.js";
import authRoutes from "./routes/auth.js";
import tasksRoutes from "./routes/tasks.js";
import notificationRoutes from "./routes/notification.js";
import { Socket } from 'dgram';

dotenv.config();
const app =express();
const server = http.createServer(app);
const io = new Server(server);

//middleware


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.MONGO_URI})
}));

//Routes
app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);
app.use('/teams', tasksRoutes);
app.use(session({secret: 'secret', resave: false, saveUninitialized: true}));
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