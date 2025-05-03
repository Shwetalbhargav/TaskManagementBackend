import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import tasksRoutes from "./routes/tasks.js";
import notificationRoutes from "./routes/notification.js";

dotenv.config();
const app =express();

//middleware
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.MONGO_URI})
}));

//Routes
app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);
app.use('/notification', notificationRoutes)

//DB Connection and start server
mongoose.connect(process.env.MONGO_URI)
     .then(() =>{
        app.listen(process.env.PORT, () =>
            console.log(`Server is running on Port ${process.env.PORT}`)
        );
     })
     .catch((err) =>console.error(err));