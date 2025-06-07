import { Server } from "socket.io";

export const connectToSocket = (server) => {
  const messages = {};

  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      allowedHeaders: "*",
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    console.log("socket connected : " + socket.id);

    //join call
    socket.on("join-call", (roomId) => {
      const existingPeers = io.sockets.adapter.rooms.get(roomId);

      existingPeers.forEach((peerId) => {
        io.to(peerId).emit("offer-request", { targetId: socket.id });
      });

      console.log("join-call : " + roomId);
      socket.join(roomId); // client joins a room.
      socket.to(roomId).emit("user-joined", socket.id); // notifies everyone in the room that the client has joined.

      if (messages[roomId]) {
        // send previous messages in the room to the newly joined client
        socket.emit("send-prev-messages", { msgs: messages[roomId] });
      }
    });
    //message handling
    socket.on("message", (roomId, sender, content) => {
      if (messages[roomId] == undefined) {
        messages[roomId] = [];
      }
      messages[roomId].push({ sender, content });
      io.to(roomId).emit("new-message", { sender, content });
    });

    //signaling channels
    socket.on("offer", ({ offer, senderId, targetId }) => {
      console.log("offer : " + offer);
      socket.to(targetId).emit("receive-offer", { offer, senderId });
    });

    socket.on("answer", ({ answer, senderId, targetId }) => {
      console.log("answer : " + answer);
      socket.to(targetId).emit("receive-answer", { answer, senderId });
    });

    socket.on("ice-candidate", ({ candidate, senderId, targetId }) => {
      socket.to(targetId).emit("ice-candidate", { candidate, senderId });
    });

    //handle disconnection
    socket.on("disconnect", () => {
      const rooms = socket.rooms; //  gives all rooms the socket is in
      rooms.forEach((roomId) => {
        if (roomId === socket.id) return; // skip the personal room that is created after that socket's socket.id
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
