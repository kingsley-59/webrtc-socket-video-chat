import { io, Socket } from "socket.io-client";


const SOCKET_URL = "https://localhost:5001";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionDelay: 10000,
});
socket.connect()

socket.onAny((event, ...args) => {
  console.log(event, args);
});
socket.on("error", (error) => {
  console.log(error);
});

export default socket