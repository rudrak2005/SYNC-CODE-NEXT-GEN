import { io } from "socket.io-client";


const socket = io(
  "https://sync-code-next-gen-2.onrender.com",
  {
    autoConnect: false,

    reconnection: true,

    reconnectionAttempts: Infinity,

    reconnectionDelay: 1000,

    reconnectionDelayMax: 5000,

    randomizationFactor: 0.5,

    timeout: 10000,

    transports: [
      "websocket",
      "polling"
    ]
  }
);


export default socket;
