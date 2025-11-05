import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import tokenRouter from "./routes/token.route.js"
app.use("/api/v1", tokenRouter);

export { app };