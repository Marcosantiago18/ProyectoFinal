import { io } from 'socket.io-client';

// Configura el cliente de Socket.IO
// Conectará al mismo host que sirve la página web pero en el path definido en el proxy
const URL = import.meta.env.PROD ? undefined : 'http://localhost:5000';

export const socket = io(URL as string, {
  path: '/socket.io/',
  autoConnect: true,
  transports: ['websocket', 'polling']
});
