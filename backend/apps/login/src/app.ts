import express from "express";
import cors from "cors";
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import loginRouter from "./routes/login.route.js"
app.use("/api/v1", loginRouter);

export { app };