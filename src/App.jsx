
import { useEffect, useRef, useState } from "react";
import "./App.css";
import Peer from "peerjs";

function App() {
  const myVideoRef = useRef(null);
  const otherVideoRef = useRef(null);
  const [callMade, setCallMade] = useState(false)
  const [callAccepted, setCallAccepted] = useState(false);
  const [incommingCall, setIncommingCall] = useState(false);
  const [myPeerId, setMyPeerId] = useState(null);
  const [remotePeerId, setRemotePeerId] = useState(null);
  const [peer, setPeer] = useState(null);
  const [incommingStream, setIncommingStream] = useState(null);

  const peerProvider = (peer) => {
    setPeer(peer);
  };

  useEffect(() => {
    const peer = new Peer({
      host: `${import.meta.env.VITE_BASE_URL}`,
      port: `${import.meta.env.VITE_PORT}`,
      path: '/peerjs/myapp'
    });
    peerProvider(peer);
    peer.on("open", (id) => {
      setMyPeerId(id);
      console.log(id);
    });

    
  }, []);

  useEffect(() => {
    if (peer) {
      peer.on("call", (call) => {
        if (call) {
          setIncommingCall(true);
          setIncommingStream(call);
        }
      });
    }
  }, [peer]);

  const call = (remotePeerId) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
          if (myVideoRef.current.paused || myVideoRef.current.ended) {
            myVideoRef.current.play();
          }
        }

        const call = peer.call(remotePeerId, stream);
        call.on("stream", (remoteStream) => {
          if (otherVideoRef.current) {
            otherVideoRef.current.srcObject = remoteStream;
            if (otherVideoRef.current.paused || otherVideoRef.current.ended) {
              otherVideoRef.current.play();
            }
          }
        });
      })
      .catch((err) => {
        console.log("Failed to get local stream", err);
      });
  };


  const acceptCall = (incomingCall) => {
     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          myVideoRef.current.srcObject = stream;
          if (myVideoRef.current.paused || myVideoRef.current.ended) {
            myVideoRef.current.play();
          }
          incomingCall.answer(stream);
          incomingCall.on("stream", (remoteStream) => {
            otherVideoRef.current.srcObject = remoteStream;
            if (otherVideoRef.current.paused || otherVideoRef.current.ended) {
              otherVideoRef.current.play();
            }
            
          });
        })
        .catch((err) => {
          console.log("Failed to get local stream", err);
        });
      }

  return (
    <>
      <div>
        <h2>Enter Peer ID of other person</h2>
        <input type="text" onChange={(e) => { setRemotePeerId(e.target.value) }} />
        <p>Your Peer ID: {myPeerId}</p>
      </div>
      <button onClick={() => { call(remotePeerId); setCallMade(true) }}>Call</button>
      {(callMade==true || callAccepted==true) && <div style={{ display: "flex", alignItems: "center" }}>
        <div>
          <h2>My video</h2>
          <video
            ref={myVideoRef}
            style={{
              width: "500px",
              height: "300px",
              border: "1px solid white",
            }}
            muted
          ></video>
        </div>
        <div>
          <h2>Other person videos</h2>
          <video
            ref={otherVideoRef}
            style={{
              width: "500px",
              height: "300px",
              border: "1px solid white",
            }}
          ></video>
        </div>
      </div>}
      {incommingCall==true&&<div><button onClick={()=>{
        setCallAccepted(true);
        acceptCall(incommingStream);
        setIncommingCall(false);
      }}>Accept Call</button></div>}
      {(callMade==true || callAccepted==true) &&  <div><button onClick={()=>{
        
        peer.destroy();
        setCallAccepted(false)
        setCallMade(false)
        if (myVideoRef.current && myVideoRef.current.srcObject) {
          myVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
          myVideoRef.current.srcObject = null;
        }
        if (otherVideoRef.current && otherVideoRef.current.srcObject) {
          otherVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
          otherVideoRef.current.srcObject = null;
        }
      }}>End Call</button></div>}
    
    </>
  );
}

export default App;