import  Message  from "../models/message.js";  

export default function (io, online, socketsByName) {
  io.on('connection', socket => {
   
    socket.on('login', username => {
      console.log(`User ${username} logged in with socket ID: ${socket.id}`);
      online.set(socket.id, username);
      socketsByName.set(username, socket.id);
      io.emit('users', Array.from(online.values()));
    });

   
    socket.on('test-event', (data) => {
      console.log('Test event received:', data);
    });

    
    socket.on('join-room', async ({ room }) => {
      socket.join(room);
      const history = await Message.find({ room }).sort({ timestamp: 1 });
      socket.emit('chat-history', history.map(msg => msg.toJSON()));
    });

  
    socket.on('private-message', async ({ room, cipher, from }) => {
      const msg = await Message.create({ room, from, cipher });
      socket.to(room).emit('private-message', { cipher, from, id: msg.id, timestamp: msg.timestamp });
      socket.emit('private-message', { cipher, from, id: msg.id, timestamp: msg.timestamp });

      const [userA, userB] = room.split('|');
      const receiver = from === userA ? userB : userA;
      const receiverSocketId = socketsByName.get(receiver);
      if (receiverSocketId) io.to(receiverSocketId).emit('notify-message', { from });
    });

    socket.on('typing', ({ room, from }) => {
      socket.to(room).emit('typing', { from });
    });

    socket.on('video-offer', ({ to, offer, from }) => {
      console.log(`Relaying video-offer from ${from} to ${to}`);
      const receiverSocketId = socketsByName.get(to);
      if (receiverSocketId) {
        console.log(`Found receiver socket: ${receiverSocketId}`);
        io.to(receiverSocketId).emit('video-offer', { offer, from });
      } else {
        console.log(`Receiver ${to} not found online`);
      }
    });
    socket.on('video-answer', ({ to, answer, from }) => {
      console.log(`Relaying video-answer from ${from} to ${to}`);
      const receiverSocketId = socketsByName.get(to);
      if (receiverSocketId) {
        console.log(`Found receiver socket: ${receiverSocketId}`);
        io.to(receiverSocketId).emit('video-answer', { answer, from });
      } else {
        console.log(`Receiver ${to} not found online`);
      }
    });
    socket.on('ice-candidate', ({ to, candidate, from }) => {
      console.log(`Relaying ice-candidate from ${from} to ${to}`);
      const receiverSocketId = socketsByName.get(to);
      if (receiverSocketId) {
        console.log(`Found receiver socket: ${receiverSocketId}`);
        io.to(receiverSocketId).emit('ice-candidate', { candidate, from });
      } else {
        console.log(`Receiver ${to} not found online`);
      }
    });
    socket.on('video-reject', ({ to, from }) => {
      console.log(`Relaying video-reject from ${from} to ${to}`);
      const receiverSocketId = socketsByName.get(to);
      if (receiverSocketId) {
        console.log(`Found receiver socket: ${receiverSocketId}`);
        io.to(receiverSocketId).emit('video-reject', { from });
      } else {
        console.log(`Receiver ${to} not found online`);
      }
    });
    socket.on('video-end', ({ to, from }) => {
      console.log(`Relaying video-end from ${from} to ${to}`);
      const receiverSocketId = socketsByName.get(to);
      if (receiverSocketId) {
        console.log(`Found receiver socket: ${receiverSocketId}`);
        io.to(receiverSocketId).emit('video-end', { from });
      } else {
        console.log(`Receiver ${to} not found online`);
      }
    });

    // jjjj

    // Handle message deletion
    socket.on('delete-message', async ({ messageId, from }) => {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      if (msg.from !== from) return; // Only allow owner to delete
      // Only allow deletion if message is less than 1 minute old
      const now = new Date();
      const sent = new Date(msg.timestamp);
      if ((now - sent) > 60 * 1000) return; // 1 minute in ms
      await Message.deleteOne({ _id: messageId });
      io.to(msg.room).emit('message-deleted', { messageId });
    });

    
    // 5️⃣ Disconnect cleanup
    socket.on('disconnect', () => {
      const username = online.get(socket.id);
      online.delete(socket.id);
      socketsByName.delete(username);
      io.emit('users', Array.from(online.values()));
    });
  });
};