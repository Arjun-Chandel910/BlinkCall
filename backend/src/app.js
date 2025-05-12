import dotenv from "dotenv";
dotenv.config();
import express from "express";
const app = express();
import { createServer } from "http";
const server = createServer(app);
import mongoose from "mongoose";
import cors from "cors";
import { connectToSocket } from "./controllers/socketManagement.js";
import userRoute from "./routes/users.routes.js";
const io = connectToSocket(server);

const port = process.env.PORT || 8000;

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use(cors());

app.use("/api/v1/users", userRoute);

const start = async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log(`MONGO connected db HOST : ${mongoose.connection.host}`);
  server.listen(port, () => {
    console.log("LISTENING TO 8000");
  });
};

start();
