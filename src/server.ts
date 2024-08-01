import app from './app';
import dotenv from 'dotenv';
import { connectDatabase } from './providers/database';
import { createServer } from "http";
import initializeSocket from "./utils/socketIo";

import express from 'express';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import doctorRoutes from './routes/doctorRoutes';

dotenv.config();
connectDatabase();

const port = process.env.PORT || 3001;

// Create an HTTP server using Express app
const server = createServer(app);

// Initialize Socket.IO with the HTTP server
const io = initializeSocket(server);

// Middleware setup
app.use(express.json());
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/doctor', doctorRoutes);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

