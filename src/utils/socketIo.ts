import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import ChatMessage from '../model/chatMessageModel'; // Ensure your model path is correct


// Initialize the Socket.IO server
const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: 'http://localhost:4200',
      methods: ['GET', 'POST']
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    // console.log('A user connected:', socket.id);

    // Join a room
    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
      // console.log(`Socket ${socket.id} joined room ${roomId}`);
      // console.log("joined the rooooom");

    });

    // Leave a room
    socket.on('leaveRoom', (roomId: string) => {
      socket.leave(roomId);
      // console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // Handle sending messages
    socket.on('sendMessage', async (data: { senderId: string; receiverId: string; message: string }) => {
      const { senderId, receiverId, message } = data;
      // console.log("The data is",message,receiverId);

      // Save message to MongoDB
      try {
        const newMessage = new ChatMessage({ senderId, receiverId, message });
        const savedMessage = await newMessage.save();
        // console.log('Saved message:', savedMessage);

        // Emit message to the room
        const roomId = getRoomId(senderId, receiverId);
        io.to(roomId).emit('receiveMessage', savedMessage);

        // console.log("The saved message is",savedMessage);

      } catch (error) {
        // console.error('Error saving message:', error);
      }
    });

    // Handle audio message
    socket.on('audioMessage', async (data: { senderId: string; receiverId: string; audioBuffer: ArrayBuffer }) => {
      const { senderId, receiverId, audioBuffer } = data;
      // Save audio message to MongoDB if necessary
      // const newAudioMessage = new ChatMessage({ senderId, receiverId, audioBuffer });
      // const savedAudioMessage = await newAudioMessage.save();

      // Emit audio message to the room
      const roomId = getRoomId(senderId, receiverId);
      io.to(roomId).emit('receiveAudioMessage', { senderId, receiverId, audioBuffer });
      console.log("the received audio message is", audioBuffer);
    });

    //WebRTC methods for video chatting.
    // Handle WebRTC signaling
    socket.on('offer', (offer, roomId) => {
      console.log('Received offer:', offer);
      socket.to(roomId).emit('offer', offer);
    });

    socket.on('answer', (answer, roomId) => {
      console.log('Received answer:', answer);
      socket.to(roomId).emit('answer', answer);
    });

    socket.on('candidate', (candidate, roomId) => {
      console.log('Received candidate:', candidate);
      socket.to(roomId).emit('candidate', candidate);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // console.log(`Socket ${socket.id} disconnected`);
    });
  });

  return io;
};

// Function to generate a unique room ID based on sender and receiver IDs
function getRoomId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

export default initializeSocket;

