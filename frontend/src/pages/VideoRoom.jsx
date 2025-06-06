import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

export default function VideoRoom() {
  const { state } = useLocation();
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const socket = useRef(null);
  const peerConnectionRef = useRef(null);

  const joinCall = () => {
    socket.current = io("http://localhost:8000");
    socket.current.emit("join-call", state.roomId);

    socket.current.on("user-joined", (id) => {
      console.log(id + " has joined");
    });

    socket.current.on("send-prev-messages", ({ msgs }) => {
      setMessages((prev) => ({
        ...prev,
        [state.roomId]: msgs,
      }));
    });

    socket.current.on("new-message", ({ sender, content }) => {
      setMessages((prev) => ({
        ...prev,
        [state.roomId]: prev[state.roomId]
          ? [...prev[state.roomId], { sender, content }]
          : [{ sender, content }],
      }));
    });
  };

  //offer creation
  useEffect(() => {
    peerConnectionRef.current = new RTCPeerConnection({
      iceservers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("ice-candidate", {
          roomId: state.roomId,
          candidate: event.candidate,
          senderId: state.name,
        });
      }
    };
    const sendOffer = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });
      const offer = await peerConnectionRef.current.createOffer();
      peerConnectionRef.current.setLocalDescription(offer);

      socket.current.emit("offer", {
        roomId: state.roomId,
        offer: peerConnectionRef.current.localDescription,
        senderId: state.name,
      });
    };
    sendOffer();
  }, []);

  useEffect(() => {
    joinCall();
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim() === "") return; // No sending empty
    socket.current.emit("message", state.roomId, state.name, inputMessage);
    setInputMessage("");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black text-white">
      {/* Left: Video Section */}
      <div className="md:w-2/3 w-full p-4 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col items-center justify-center">
        {/* Video Elements Go Here */}
        <div className="w-full h-96 md:h-full bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">
          Video Area
        </div>
      </div>

      {/* Right: Chat Section */}
      <div className="md:w-1/3 w-full flex flex-col p-4">
        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-700"
          style={{ wordBreak: "break-word" }}
        >
          {messages[state.roomId]?.map((el, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-full break-words ${
                el.sender === state.name
                  ? "bg-blue-600 self-end text-white"
                  : "bg-gray-700 self-start text-white"
              }`}
            >
              <div className="text-xs font-semibold mb-1 opacity-80">
                {el.sender}
              </div>
              <div className="text-base">{el.content}</div>
            </div>
          )) || (
            <p className="text-gray-500 text-center mt-5">No messages yet</p>
          )}
        </div>

        {/* Input Bar */}
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            type="text"
            className="flex-grow p-4 rounded-xl bg-gray-800 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button
            type="submit"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
