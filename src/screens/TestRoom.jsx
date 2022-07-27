import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import socket from '../Socket';


function TestRoom() {
    const callerVideo = useRef()
    const receiverVideo = useRef()
  
    const [callerStream, setCallerStream] = useState()
    const [callerSignal, setCallerSignal] = useState()
    const [caller, setCaller] = useState(null)
  
    const [receivingCall, setReceivingCall] = useState(false)
    const [answered, setAnswered] = useState(false)
    const [connectedUsers, setConnectedUsers] = useState([])
  
    useEffect(() => {
      if(!socket.connected) socket.connect()
  
      socket.onAny((event, ...args) => {
        console.log(event, args)
      })
      socket.on('error', (error) => {
        console.log(error)
      })
  
      socket.on('allUsers', users => {
        setConnectedUsers(users)
      })
  
      socket.on('hey', data => {
        setReceivingCall(true)
        setCaller(data.from)
        setCallerSignal(data.signal)
        socket.emit('acceptedCall', { signal: data, to: caller })
      })
  
    }, [socket])
  
    useEffect(() => {
      startStream()
      callerVideo.current.srcObject = callerStream
    }, [callerStream])
  
    async function startStream() {
      if (!callerStream) {
        try {
          let stream = await navigator.mediaDevices.getUserMedia({
            audio: false, video: true
          })
          setCallerStream(stream)
          console.log('streaming...')
        } catch (error) {
          alert(error)
          console.log(error)
        }
      }
    }
  
    function startCall(id) {
      console.log('calling...')
      const peerOptions = {
        initiator: true,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun1.1.google.com:19302' },
            { urls: 'stun:stun2.1.google.com:19302' }
          ]
        },
        stream: callerStream,
      }
      const peer = new Peer(peerOptions)
  
      peer.on('signal', (data) => {
        socket.emit('callUser', { userToCall: id, signalData: data, from: socket.id })
      })
  
      peer.on('stream', stream => {
        receiverVideo.current.srcObject = stream
      })
  
      socket.on('callAccepted', signal => {
        console.log('answered!')
        setAnswered(true)
        peer.signal(signal)
      })
    }
  
    function answerCall() {
      console.log('answering...')
      const peerOptions = {
        initiator: false,
        trickle: false,
        stream: callerStream
      }
      const peer = new Peer(peerOptions)
  
      peer.signal(callerSignal)
  
      peer.on('signal', data => {
        console.log('Remote signal data: ', data)
        socket.emit('acceptedCall', { signal: data, to: caller })
        setAnswered('true')
      })
  
      peer.on('stream', stream => {
        console.log('streaming...', stream)
        receiverVideo.current.srcObject = stream
      })
    }
  
    return (
      <div className="App">
        <div className='row border justify-content-center'>
          <div className='col-md-6 col-sm-12 caller-video border'>
            <video style={{width: '90%', height: 'auto'}} ref={callerVideo} autoPlay></video>
          </div>
          <div className='col-md-6 col-sm-12 receiver-video border'>
            <video style={{width: '90%', height: 'auto'}} ref={receiverVideo} autoPlay></video>
          </div>
        </div>
        <div className='row justify-content-center' style={{display: (receivingCall) ? 'block' : 'none'}}>
          <div className='p-3 col-sm-12 col-md-8 col-lg-6 shadow-sm rounded'>
            <p className=''>
              Incoming call from {caller}
            </p>
            <div className='d-flex justify-content-end align-items-center'>
              <div className='text-success' onClick={() => answerCall()} style={{flex: '1'}} >
                Answer
              </div>
              <div className='text-danger' onClick={() => console.log('')} style={{flex: '1'}} >
                Decline
              </div>
            </div>
          </div>
        </div>
        <div className='p-3'>
          {
            connectedUsers?.map((user, idx) => {
              return (
                <div key={idx} className='d-flex justify-content-center align-items-center mb-3'>
                  <span>{user?.id}</span>
                  <span onClick={() => startCall(user?.id)} className='btn btn-success mx-3'>Call</span>
                </div>
              )
            })
          }
        </div>
      </div>
    );
  }
  
export default TestRoom