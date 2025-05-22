import { Server } from "socket.io";

export const connectToSocket = (server) => {
  const connections = {};
  const messages = {};

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: "*",
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    console.log(socket.id);
  });
  //

  return io;
};
