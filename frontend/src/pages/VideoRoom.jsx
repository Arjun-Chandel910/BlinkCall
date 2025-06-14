import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import MessageIcon from "@mui/icons-material/Message";
import LogoutIcon from "@mui/icons-material/Logout";
import Particles from "../utils/Particles";

export default function VideoRoom() {
  const navigate = useNavigate();
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
  const remoteStreamsRef = useRef({});
  const [version, setVersion] = useState(0);

  const joinCall = async () => {
    socket.current = io("https://blinkcall.onrender.com");
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
      pc.ontrack = (event) => {
        if (!remoteStreamsRef.current[id]) {
          remoteStreamsRef.current[id] = new MediaStream();
        }
        event.streams[0].getTracks().forEach((track) => {
          remoteStreamsRef.current[id].addTrack(track);
          setVersion((v) => v + 1);
        });

        console.log(state.name, remoteStreamsRef.current);
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

    socket.current.on("user-left", ({ id }) => {
      if (peerConnections.current[id]) {
        peerConnections.current[id].close();
        delete peerConnections.current[id];
      }
      if (remoteStreamsRef.current[id]) {
        remoteStreamsRef.current[id].getTracks().forEach((track) => {
          track.stop();
        });
        delete remoteStreamsRef.current[id];
        setVersion((v) => v - 1);
      }
      alert(id, " left. ");
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

  // main body

  return (
    <div className="relative w-full h-screen bg-[#111] overflow-hidden">
      {/* Particles Background */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={400}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col md:flex-row h-full">
        {/* Video Section */}
        <div
          className={`flex flex-wrap justify-center items-start p-2 gap-4 transition-all duration-300 ${
            isChatVisible ? "w-full md:w-2/3" : "w-full"
          }`}
        >
          {/* Local Video */}
          <div className="relative w-[90%] sm:w-[320px] md:w-[400px] h-[220px] md:h-[300px] rounded-xl overflow-hidden shadow-lg bg-gray-800">
            <video
              ref={localVideoRef}
              muted
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-sm md:text-lg italic bg-black bg-opacity-50 px-3 py-1 rounded-md shadow">
              You
            </p>
          </div>

          {/* Remote Videos */}
          {Object.entries(remoteStreamsRef.current).map(([id, stream]) => (
            <div
              className="relative w-[90%] sm:w-[320px] md:w-[400px] h-[220px] md:h-[300px] rounded-xl overflow-hidden shadow-lg bg-gray-800"
              key={id}
            >
              <video
                ref={(el) => el && (el.srcObject = stream)}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Chat Section */}
        {isChatVisible && (
          <div className="w-full md:w-1/3 h-full flex flex-col bg-gray-950 bg-opacity-90 border-l border-gray-800 shadow-inner z-20">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600">
              {messages[state.roomId]?.length > 0 ? (
                messages[state.roomId].map((el, idx) => (
                  <div
                    key={idx}
                    className={`w-fit max-w-[80%] px-4 py-2 rounded-xl shadow-md text-sm break-words ${
                      el.sender === state.name
                        ? "ml-auto bg-blue-600 text-white rounded-br-none"
                        : "mr-auto bg-gray-800 text-white rounded-bl-none"
                    }`}
                  >
                    <div className="text-xs font-medium opacity-70 mb-1">
                      {el.sender}
                    </div>
                    <div>{el.content}</div>
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
              className="p-3 bg-gray-900 flex gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type something badass..."
                className="flex-1 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black bg-opacity-70 px-6 py-3 rounded-full shadow-lg z-30">
        <button
          onClick={() => setIsVideoOn((prev) => !prev)}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-white transition-all ${
            isVideoOn
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isVideoOn ? (
            <VideocamIcon fontSize="small" />
          ) : (
            <VideocamOffIcon fontSize="small" />
          )}
        </button>

        <button
          onClick={() => setIsAudioOn((prev) => !prev)}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-white transition-all ${
            isAudioOn
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isAudioOn ? (
            <MicIcon fontSize="small" />
          ) : (
            <MicOffIcon fontSize="small" />
          )}
        </button>

        <button
          onClick={() => setIsChatVisible((prev) => !prev)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageIcon fontSize="small" />
        </button>

        <button
          onClick={() => {
            navigate("/");
            alert("Call ended successfully");
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white"
        >
          <LogoutIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
}
