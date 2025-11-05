import { app } from "./app.js";
import dotenv from "dotenv";
import http from "http";

dotenv.config({ path: "./.env" });
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Login service is running on port ${PORT}`);
});