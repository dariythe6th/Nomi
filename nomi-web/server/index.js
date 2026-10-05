import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const PORT = 3001;

const app = express();
app.use(cors());

// Простой health-check на /
app.get('/', (req, res) => res.send('Nomi GPS tracker is running'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

/**
 * In-memory хранилище: id → { id, name, lat, lng, accuracy, lastSeen, socketId }
 * Данные живут, пока сервер запущен. Для диплома — самое то.
 */
const users = new Map();

io.on('connection', (socket) => {
  console.log(`[CONNECT] socket=${socket.id}`);

  // Клиент регистрируется — присылает стабильный id и имя
  socket.on('register', ({ id, name }) => {
    const user = {
      id,
      name: name || 'Без имени',
      lat: null,
      lng: null,
      accuracy: null,
      lastSeen: Date.now(),
      socketId: socket.id,
    };
    users.set(id, user);
    socket.data.userId = id;

    console.log(`[REGISTER] ${id} "${user.name}" — всего: ${users.size}`);

    // Новому клиенту отдаём список уже известных нам пользователей с координатами
    const others = [...users.values()]
      .filter((u) => u.id !== id && u.lat !== null)
      .map(({ socketId, ...rest }) => rest);

    socket.emit('init', { you: user, others });

    // Остальным сообщаем, что появился новый пользователь
    socket.broadcast.emit('user-joined', {
      id: user.id,
      name: user.name,
      lat: user.lat,
      lng: user.lng,
      accuracy: user.accuracy,
      lastSeen: user.lastSeen,
    });
  });

  // Обновление координат
  socket.on('location', ({ id, lat, lng, accuracy }) => {
    const user = users.get(id);
    if (!user) return;

    user.lat = lat;
    user.lng = lng;
    user.accuracy = accuracy;
    user.lastSeen = Date.now();

    socket.broadcast.emit('location-update', {
      id,
      lat,
      lng,
      accuracy,
      lastSeen: user.lastSeen,
    });
  });

  socket.on('disconnect', () => {
    const id = socket.data.userId;
    if (id && users.has(id)) {
      users.delete(id);
      io.emit('user-left', { id });
      console.log(`[DISCONNECT] ${id} — осталось: ${users.size}`);
    } else {
      console.log(`[DISCONNECT] socket=${socket.id}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Nomi GPS-трекер запущен: http://localhost:${PORT}`);
  console.log(`Для локальной сети — используйте IP вашего ПК вместо localhost`);
});