import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const PORT = 3001;

const app = express();
app.use(cors());
app.get('/', (req, res) => res.send('Nomi GPS tracker is running'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

/** In-memory хранилище пользователей */
const users = new Map();
/** Хранилище дружбы: userId -> Set(friendIds) */
const friendships = new Map();

// Функция для расчёта дистанции в метрах (Haversine)
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lat2 === null) return Infinity;
  const R = 6371e3; // радиус Земли в метрах
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

io.on('connection', (socket) => {
  console.log(`[CONNECT] socket=${socket.id}`);

  // Клиент регистрируется
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

    // Отдаём новому клиенту координаты ТОЛЬКО ЕГО ДРУЗЕЙ (Relevance)
    const myFriends = friendships.get(id) || new Set();
    const others = [...users.values()]
      .filter((u) => myFriends.has(u.id) && u.lat !== null)
      .map(({ socketId, ...rest }) => rest);

    socket.emit('init', { you: user, others });

    // Остальным сообщаем, что появился новый пользователь
    socket.broadcast.emit('user-joined', {
      id: user.id, name: user.name, lat: user.lat, lng: user.lng,
      accuracy: user.accuracy, lastSeen: user.lastSeen,
    });
  });

  // Клиент присылает свой обновленный список друзей
  socket.on('update_friends', ({ userId, friendIds }) => {
    friendships.set(userId, new Set(friendIds));
    console.log(`[FRIENDS] ${userId} обновил список друзей: ${friendIds.length}`);
  });

  // Обновление координат
  socket.on('location', ({ id, lat, lng, accuracy }) => {
    const user = users.get(id);
    if (!user) return;

    // Оптимизация Net Dormancy на сервере
    const dist = getDistanceMeters(user.lat, user.lng, lat, lng);
    if (dist < 2 && user.lat !== null) {
      return; // Если сдвиг меньше 2 метров, не рассылаем пакеты
    }

    // Оптимизация Квантование на сервере
    user.lat = +lat.toFixed(5);
    user.lng = +lng.toFixed(5);
    user.accuracy = accuracy;
    user.lastSeen = Date.now();

    // Оптимизация Relevance: рассылаем только тем, у кого этот юзер в друзьях
    users.forEach((otherUser) => {
      const theirFriends = friendships.get(otherUser.id);
      if (theirFriends && theirFriends.has(id)) {
        io.to(otherUser.socketId).emit('location-update', {
          id,
          name: user.name,
          lat: user.lat,
          lng: user.lng,
          accuracy,
          lastSeen: user.lastSeen,
        });
      }
    });
  });

  socket.on('disconnect', () => {
    const id = socket.data.userId;
    if (id && users.has(id)) {
      users.delete(id);
      friendships.delete(id);
      io.emit('user-left', { id });
      console.log(`[DISCONNECT] ${id} — осталось: ${users.size}`);
    } else {
      console.log(`[DISCONNECT] socket=${socket.id}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Nomi GPS-трекер запущен: http://localhost:${PORT}`);
});