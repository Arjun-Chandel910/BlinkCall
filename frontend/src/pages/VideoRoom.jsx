import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
export default function VideoRoom() {
  const { state } = useLocation();
  const [messageButton, setMessageButton] = useState(false);
  const [preMessages, setPrevMessages] = useState({});

  console.log(state.roomId, state.name);
  const [mediaState, setMediaState] = useState({
    micOn: true,
    camOn: true,
    screenSharing: false,
  });
  const videoRef = useRef(null); // webcam video when we enter the username.

  const socket = useRef(null);
  const id = "ewjw";
  const joinCall = () => {
    socket.current = io("http://localhost:8000");
    socket.current.emit("join-call", state.roomId);
    socket.current.on("user-joined", (id) => {
      console.log(id + " has joined");
    });
    socket.current.on("send-prev-messages", ({ msg }) => {
      const roomId = state.roomId;
      setPrevMessages((prev) => {
        return {
          ...prev,
          [roomId]: prev[roomId] ? [...prev[roomId], msg] : [msg],
        };
      });
    });
  };

  useEffect(() => {
    joinCall();
  }, []);

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left: Video Section */}
      <div className="w-2/3 p-4 border-r border-gray-800 flex flex-col items-center justify-center">
        {/* Put your video elements here */}
      </div>

      {/* Right: Chat Section */}
      <div className="w-1/3 flex flex-col p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {/* Map your messages here */}
        </div>

        {/* Input Bar */}
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 p-4 rounded-xl bg-gray-800 text-white text-lg focus:outline-none"
            placeholder="Type your message..."
          />
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
