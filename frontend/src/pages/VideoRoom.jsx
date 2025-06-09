import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import MessageIcon from "@mui/icons-material/Message";

export default function VideoRoom() {
  const { state } = useLocation();

  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const socket = useRef(null);
  const peerConnections = useRef({});
  const settingRemoteAnswer = useRef({});

  const joinCall = async () => {
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

    localStreamRef.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    const createPeerConnection = (id) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit("ice-candidate", {
            targetId: id,
            candidate: event.candidate,
            senderId: socket.current.id,
          });
        }
      };

      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      peerConnections.current[id] = pc;
      return pc;
    };

    socket.current.on("offer-request", async ({ targetId }) => {
      const pc = createPeerConnection(targetId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.current.emit("offer", {
        offer: pc.localDescription,
        senderId: socket.current.id,
        targetId,
      });
    });

    socket.current.on("receive-offer", async ({ offer, senderId }) => {
      const pc = createPeerConnection(senderId);

      if (pc.signalingState === "stable") {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.current.emit("answer", {
          targetId: senderId,
          answer: pc.localDescription,
          senderId: socket.current.id,
        });
      } else {
        console.warn(
          `Cannot set remote offer from ${senderId}. State: ${pc.signalingState}`
        );
      }
    });

    socket.current.on("receive-answer", async ({ answer, senderId }) => {
      const pc = peerConnections.current[senderId];
      if (!pc || settingRemoteAnswer.current[senderId]) return;
      settingRemoteAnswer.current[senderId] = true;
      try {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error(" Error setting remote description (answer):", err);
      } finally {
        settingRemoteAnswer.current[senderId] = false;
      }
    });

    socket.current.on("ice-candidate", async ({ candidate, senderId }) => {
      const pc = peerConnections.current[senderId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Failed to add ICE candidate", err);
        }
      }
    });
  };

  useEffect(() => {
    joinCall();
    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      settingRemoteAnswer.current = {};
    };
  }, []);

  useEffect(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (videoTrack) videoTrack.enabled = isVideoOn;
      if (audioTrack) audioTrack.enabled = isAudioOn;
    }
  }, [isVideoOn, isAudioOn]);

  const sendMessage = () => {
    if (inputMessage.trim() === "") return;
    socket.current.emit("message", state.roomId, state.name, inputMessage);
    setInputMessage("");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black text-white overflow-hidden">
      {/* Video Section */}
      <div
        className={`flex flex-col flex-1 relative ${isChatVisible ? "md:w-2/3" : "w-full"}`}
      >
        <video
          ref={localVideoRef}
          muted
          autoPlay
          playsInline
          className="flex-1 object-cover w-full h-full bg-black rounded-none"
        />

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-wrap justify-center gap-4 bg-black bg-opacity-60 p-3 rounded-xl z-10 max-w-full">
          <button
            onClick={() => setIsVideoOn((prev) => !prev)}
            className={`w-12 h-12 flex items-center justify-center rounded-full text-white ${isVideoOn ? "bg-green-600" : "bg-red-600"}`}
          >
            {isVideoOn ? <VideocamIcon /> : <VideocamOffIcon />}
          </button>
          <button
            onClick={() => setIsAudioOn((prev) => !prev)}
            className={`w-12 h-12 flex items-center justify-center rounded-full text-white ${isAudioOn ? "bg-green-600" : "bg-red-600"}`}
          >
            {isAudioOn ? <MicIcon /> : <MicOffIcon />}
          </button>
          <button
            onClick={() => setIsChatVisible((prev) => !prev)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white"
          >
            <MessageIcon />
          </button>
        </div>
      </div>

      {/* Chat Section */}
      {isChatVisible && (
        <div className="w-full md:w-1/3 flex flex-col bg-gray-950 border-l border-gray-800 shadow-inner">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages[state.roomId]?.length > 0 ? (
              messages[state.roomId].map((el, idx) => (
                <div
                  key={idx}
                  className={`w-fit max-w-[75%] px-5 py-3 rounded-xl shadow-md ${
                    el.sender === state.name
                      ? "ml-auto bg-blue-600 text-white rounded-br-none"
                      : "mr-auto bg-gray-800 text-white rounded-bl-none"
                  }`}
                >
                  <div className="text-xs font-medium opacity-70 mb-1">
                    {el.sender}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {el.content}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No messages yet</p>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-4 bg-gray-900 flex gap-3"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type something badass..."
              className="flex-1 p-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 text-white font-semibold"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
