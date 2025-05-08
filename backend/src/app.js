import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server); //
const port = process.env.PORT || 8000;

app.get("/home", (req, res) => {
  res.json({ home: "hello" });
});

const start = async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log(`MONGO connected db HOST : ${mongoose.connection.host}`);
  server.listen(port, () => {
    console.log("LISTENING TO 8000");
  });
};

start();
