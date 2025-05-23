import { Server } from "socket.io";

export const connectToSocket = (server) => {
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
    console.log("socket connected : " + socket.id);

    //join call
    socket.on("join-call", (roomId) => {
      socket.join(roomId); // client joins a room.
      socket.to(roomId).emit("user-joined", socket.id); // notifies everyone in the room that the client has joined.

      if (messages[roomId]) {
        // send previous messages in the room to the newly joined client
        messages[roomId].forEach((msg) => {
          socket.emit("send-prev-messages", { msg });
        });
      }
    });
    //message handling
    socket.on("message", (roomId, sender, content) => {
      if (messages[roomId] == undefined) {
        messages[roomId] = [];
      }
      messages[roomId].push({ sender, content });
      socket.to(roomId).emit("new-message", { sender, content });
    });

    //handle disconnection
    socket.on("disconnect", () => {
      const rooms = socket.rooms; //  gives all rooms the socket is in
      rooms.forEach((roomId) => {
        if (roomId === socket.id) return; // skip the personal room that is created after the socket.id
        const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
        if (!socketsInRoom || socketsInRoom.size == 0) {
          delete messages[roomId];
        }
      });
    });
  });
  //

  return io;
};
