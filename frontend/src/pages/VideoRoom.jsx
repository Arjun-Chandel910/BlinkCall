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
    <div className="h-screen w-screen flex flex-col md:flex-row">
      {/* Messages Sidebar */}
      <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-r border-gray-300 p-4 flex flex-col justify-between">
        <div className="flex-grow overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <div className="overflow-y-auto max-h-64 md:max-h-[calc(100vh-200px)] pr-2">
            {messages.map((msg, index) => (
              <div key={index} className="mb-2 break-words">
                <strong>{msg.user}:</strong> {msg.message}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="Type your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            Send
          </button>
        </div>
      </div>

      {/* Main Call Area */}
      <div className="w-full md:w-3/4 p-4 flex flex-col flex-grow">
        {/* Room Join Input */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <input
            type="text"
            placeholder="Enter room code"
            className="border p-2 rounded w-full sm:w-auto flex-grow"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button
            onClick={joinCall}
            className="bg-green-500 text-white px-4 py-2 rounded w-full sm:w-auto"
          >
            Join Call
          </button>
        </div>

        {/* Username and Preview */}
        {!joined && (
          <div className="mb-4 flex flex-col sm:flex-row items-center gap-4">
            <input
              type="text"
              placeholder="Enter your name"
              className="border p-2 rounded w-full sm:w-auto"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div className="w-full sm:w-1/2">
              <video
                ref={myVideoRef}
                autoPlay
                muted
                className="w-full h-48 sm:h-64 bg-black rounded"
              />
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow overflow-y-auto">
          {joined && (
            <video
              ref={myVideoRef}
              autoPlay
              muted
              className="w-full h-48 sm:h-64 bg-black rounded"
            />
          )}
          {Object.entries(peers).map(([peerId, stream]) => (
            <video
              key={peerId}
              ref={(el) => {
                if (el && stream && !el.srcObject) {
                  el.srcObject = stream;
                }
              }}
              autoPlay
              playsInline
              className="w-full h-48 sm:h-64 bg-black rounded"
            />
          ))}
        </div>

        {/* Mic/Camera Controls */}
        {joined && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={toggleMic}
              className={`px-4 py-2 rounded text-white ${
                micOn ? "bg-red-500" : "bg-gray-600"
              }`}
            >
              {micOn ? "Mute Mic" : "Unmute Mic"}
            </button>
            <button
              onClick={toggleVideo}
              className={`px-4 py-2 rounded text-white ${
                videoOn ? "bg-red-500" : "bg-gray-600"
              }`}
            >
              {videoOn ? "Turn Off Video" : "Turn On Video"}
            </button>
            <button
              onClick={leaveCall}
              className="px-4 py-2 rounded bg-black text-white"
            >
              Leave Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
