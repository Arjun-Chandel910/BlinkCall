import React, { useEffect, useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { io } from "socket.io-client";

export default function VideoMeet() {
  const [permissions, setPermissions] = useState({
    mic: false,
    cam: false,
    screen: false,
  });

  const [mediaState, setMediaState] = useState({
    micOn: true,
    camOn: true,
    screenSharing: false,
  });
  const videoRef = useRef(null); // webcam video when we enter the username.

  const checkPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const audioAllowed = stream.getAudioTracks().length > 0;
      const videoAllowed = stream.getVideoTracks().length > 0;

      setPermissions({
        mic: audioAllowed,
        cam: videoAllowed,
      });

      if (stream && videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      console.log("error : " + e);
    }
  };
  useEffect(() => {
    console.log(videoRef.current);
    checkPermission();
    console.log(videoRef.current);
  }, []);

  return (
    <div className="">
      <h1>Welcome to BlickCall</h1>
      <br />
      <input type="text" placeholder="username" />
      <button>connect</button>
      <br />

      <video ref={videoRef} muted autoPlay></video>
    </div>
  );
}
