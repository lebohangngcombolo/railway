import { io } from 'socket.io-client';
const socket = io('http://localhost:5001'); // Use your backend URL if different
export default socket;
