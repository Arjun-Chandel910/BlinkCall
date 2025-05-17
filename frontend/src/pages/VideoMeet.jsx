import React, { useEffect, useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import "../styles/videoComponent.css";
import { io } from "socket.io-client";

export default function VideoMeet() {
  const server_url = "http://localhost:8000";
  const connections = {};
  const peerConnectionConfig = {
    iceServers: [{ url: "stun:stun.l.google.com:19302" }],
  };
  const socket = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState();
  const [audio, setAudio] = useState();
  const [screen, setScreen] = useState();
  const [screenAvailable, setScreenAvailable] = useState(true);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const videoRef = useRef([]);
  const [videos, setVideos] = useState([]);

  //setPermissions
  const setPermissions = async () => {
    try {
      //video
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
      } else {
        setVideoAvailable(false);
      }

      //audio
      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  };
  //
  useEffect(() => {
    setPermissions();
  }, []);

  //
  const getMediaUserStream = (streem) => {};

  const getUserMdeia = () => {
    // to detect changes in the video calling app ,like muting or unmuting of mic
    if ((audio && audioAvailable) || (video && videoAvailable)) {
      navigator.mediaDevices
        .getUserMedia({
          audio: audio,
          video: video,
        })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => {
          console.log(e);
        });
    } else {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((i) => {
        i.stop();
      });
    }
  };
  //
  useEffect(() => {
    if (audio != undefined && video != undefined) {
      getUserMedia();
    }
  }, [audio, video]);
  //
  const connectToSocketServer = () => {
    socketIdRef.current = io.connect(server_url, { secure: false });
  };
  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  useEffect(() => {
    setPermissions().then(() => {
      getMedia();
    });
  }, []);

  const connect = () => {};
  return (
    <div>
      {askForUsername === true ? (
        <div>
          <h1>Enter into lobby</h1>
          <TextField id="outlined-basic" label="Outlined" variant="outlined" />
          <Button variant="contained" onClick={connect}>
            Contained
          </Button>
          <div>
            <video ref={localVideoRef} muted autoPlay></video>
            <div ref={socketIdRef}></div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
