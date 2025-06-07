import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

export default function VideoRoom() {
  const { state } = useLocation();
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const socket = useRef(null);
  const peerConnections = useRef({});

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

    window.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
  };

  useEffect(() => {
    joinCall();
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);
  //offer logic
  useEffect(() => {
    const handleOfferRequest = async ({ targetId }) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerConnections.current[targetId] = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit("ice-candidate", {
            targetId,
            candidate: event.candidate,
            senderId: socket.current.id,
          });
        }
      };

      const stream = window.localStream;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.current.emit("offer", {
        offer: pc.localDescription,
        senderId: socket.current.id,
        targetId,
      });
    };

    socket.current.on("offer-request", handleOfferRequest);

    return () => {
      socket.current.off("offer-request", handleOfferRequest);
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
    };
  }, []);

  //answer  logic
  useEffect(() => {
    const handleAnswer = async (offer, senderId) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnections.current[senderId] = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit("ice-candidate", {
            targetId: senderId,
            candidate: event.candidate,
            senderId: socket.current.id,
          });
        }
      };

      const stream = window.localStream;
      await pc.setRemoteDescription(offer);
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.current.emit("answer", {
        targetId: senderId,
        answer: pc.localDescription,
        senderId: socket.current.id,
      });
    };

    socket.current.on("receive-offer", handleAnswer);
    return () => {
      socket.current.off("receive-offer", handleAnswer);
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
    };
  }, []);

  //receive answer
  useEffect(() => {
    const handleReceiveAnswer = async ({ answer, senderId }) => {
      const pc = peerConnections.current[senderId];
      await pc.setRemoteDescription(answer);
      if (pc) {
        await pc.setRemoteDescription(answer);
      } else {
        console.error("No peer connection found for answer from:", senderId);
      }
    };
    socket.current.on("receive-answer", handleReceiveAnswer);

    return () => {
      socket.current.off("receive-answer", handleReceiveAnswer);
    };
  }, []);

  //handle-ice-candidates
  useEffect(() => {
    const handleIceCandidates = async ({ candidate, senderId }) => {
      const pc = peerConnections.current[senderId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Failed to add ICE candidate", err);
        }
      }
    };
    socket.current.on("ice-candidate", handleIceCandidates);
    return () => {
      socket.current.off("ice-candidate", handleIceCandidates);
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
