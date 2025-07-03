import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDB from "./config/connectDB.js";

import http from "http";
import { Server as socketIO } from "socket.io";
import path from "path";

import cookieParser from "cookie-parser";
import cors from "cors";

import userRoute from "./routes/user.js";
import adminRoute from "./routes/admin.js";

import { fileURLToPath } from "url";
import { dirname } from "path";
import User from "./models/Users.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

const online = new Map();
const socketsByName = new Map();

await connectDB();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", userRoute);
app.use("/admin", adminRoute);

import setupChat from "./sockets/chat.js";
setupChat(io, online, socketsByName);


server.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Chat running at: http://localhost:${process.env.PORT}`);
});
