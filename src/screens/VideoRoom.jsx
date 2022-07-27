import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import socket from "../Socket";
import Peer from "simple-peer";
import { useParams } from 'react-router-dom';



function VideoRoom() {
  const { userId } = useParams()
  const localVideo = useRef();
  const remoteVideo = useRef();

  const [localStream, setLocalStream] = useState();
  const [audioIsPlaying, setAudioIsPlaying] = useState(true);
  const [videoIsPlaying, setVideoIsPlaying] = useState(true);
  const [callerSignal, setCallerSignal] = useState();
  const [caller, setCaller] = useState(null);
  const [recipient, setRecipient] = useState(null)

  const [calling, setCalling] = useState(false)
  const [receivingCall, setReceivingCall] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);

  function handleAnswer() {
    setReceivingCall(false)
    answerCall()
  }

  function handleDecline() {
    setReceivingCall(false)
  }


  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on("allUsers", (users) => {
      setConnectedUsers(users);
    });

    socket.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data?.signal);
      socket.emit("acceptedCall", { signal: data, to: caller });
      console.log('should run once.')
    });
  }, [socket]);

  useEffect(() => {
    startStream();
    localVideo.current.srcObject = localStream;
  }, [localStream, audioIsPlaying, videoIsPlaying]);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    if (!userId) return;
    setRecipient(userId)
    startCall(userId)
  }, [userId])


  async function startStream(audioIsPlaying = false, videoIsPlaying = true) {
    if (localStream) return;
    let mediaOptions = {
      audio: audioIsPlaying,
      video: videoIsPlaying,
    };
    try {
      let stream = await navigator.mediaDevices.getUserMedia(mediaOptions);
      setLocalStream(stream);
      console.log("local video streaming...");
    } catch (error) {
      alert(error);
      console.log(error);
    }
  }

  function startCall(receiverId) {
    console.log("calling...");
    setCalling(true)
    const peerOptions = {
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          { urls: "stun:stun1.1.google.com:19302" },
          { urls: "stun:stun2.1.google.com:19302" },
        ],
      },
      stream: localStream,
    };
    const peer = new Peer(peerOptions);

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: receiverId,
        signalData: data,
        from: socket.id,
      });
    });

    peer.on("stream", (stream) => {
      remoteVideo.current.srcObject = stream;
    });

    socket.on("callAccepted", (signal) => {
      console.log("answered!");
      setCalling(false)
      setAnswered(true);
      peer.signal(signal);
    });
  }

  function answerCall() {
    console.log("answering...");
    const peerOptions = {
      initiator: false,
      trickle: false,
      stream: localStream,
    };
    const peer = new Peer(peerOptions);

    peer.signal(callerSignal);

    peer.on("signal", (data) => {
      console.log("Remote signal data: ", data);
      socket.emit("acceptedCall", { signal: data, to: caller });
      setAnswered("true");
    });

    peer.on("stream", (stream) => {
      console.log("streaming...", stream);
      remoteVideo.current.srcObject = stream;
    });
  }

  return (
    <div>
      <Body>
        <CallAlert className=" bg-light p-3" style={{display: (receivingCall) ? 'block': 'none'}}>
          <p className="mb-2 text-dark">Incoming call...</p>
          <div className="d-flex justify-content-end align-items-center gap-3">
            <span className="text-danger fw-bold btn" onClick={handleDecline}>Decline</span>
            <span className="text-success fw-bold btn" onClick={handleAnswer}>Answer</span>
          </div>
        </CallAlert>
        <Header className="bg-secondary bg-gradient bg-opacity-50 ">
          <div className="m-auto">{calling ? 'Calling...' : (recipient ?? caller)}</div>
        </Header>
        <VideoWrapper>
          <LocalVideo className="m-auto bg-dark bg-gradient " ref={localVideo} autoPlay></LocalVideo>
          <div style={{display: answered ? 'block': 'none'}}>
            <RemoteVideo className="bg-secondary rounded-3" ref={remoteVideo} autoPlay></RemoteVideo>
          </div>
        </VideoWrapper>
        <CallOptions className="bg-secondary bg-gradient bg-opacity-50">
          <div className="d-flex align-items-center justify-content-evenly gap-5">
            <span className=" fs-3 btn">
              <i className="bi bi-camera-video-fill text-light"></i>
            </span>
            <span className=" fs-3 btn">
              <i className="bi bi-mic-fill text-light"></i>
            </span>
            <span className=" fs-3 btn">
              <i className="bi bi-telephone-x-fill text-danger"></i>
            </span>
          </div>
        </CallOptions>
      </Body>
    </div>
  );
}

export default VideoRoom;

const Body = styled.div`
  background-color: #afafaf00;
  max-height: 100vh;
  color: #fafafa;
  position: relative;
`;
const CallAlert = styled.div`
  width: fit-content;
  min-width: 300px;
  position: absolute;
  z-index: 2;
  top: 10px;
  left: 0;
  right: 0;
  margin: auto;
  border-radius: 15px;
`
const Header = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
`;
const VideoWrapper = styled.section`
  height: 100vh;
  position: relative;
`;
const LocalVideo = styled.video`
  width: 100%;
  height: 100%;
  max-height: 600px;
  aspect-ratio: 16 / 9;
`;
const RemoteVideo = styled.video`
  position: absolute;
  bottom: 20%;
  right: 20px;
  height: 35%;
  aspect-ratio: 9 / 16;
`
const CallOptions = styled.footer`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 15px 20px;
  display: flex;
  justify-content: center;
`;
