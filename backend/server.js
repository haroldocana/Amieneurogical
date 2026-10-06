import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const server = http.createServer(app);

// 1. MIDDLEWARES & CORS
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-app-proxy', 'x-user-id', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. MONGODB ATLAS & ESQUEMAS
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:amie2026@cluster0.mongodb.net/amie_clinical_db?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Conectada'))
  .catch(err => console.error('❌ Error MongoDB:', err.message));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, default: 'Dr. Alejandro Morales Rivera' },
  aiTokensTotal: { type: Number, default: 100 },
  aiTokensUsed: { type: Number, default: 0 },
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const vrSessionSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  taskName: { type: String, required: true },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });
const VrSession = mongoose.model('VrSession', vrSessionSchema);

// ¡CORREGIDO! JS puro no usa <string, any>
const vrLiveStreams = new Map();

// 3. RUTAS HTTP API
app.get('/api/saas/profile', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'harold01';
    let user = await User.findOne({ username: userId });
    if (!user) user = await User.create({ username: userId });
    return res.status(200).json({ success: true, data: user });
  } catch (err) { 
    return res.status(500).json({ success: false, error: err.message }); 
  }
});

app.post('/api/vr/stream', (req, res) => {
  try {
    const payload = req.body;
    const patientId = payload.patientId || 'PAC-8104';
    vrLiveStreams.set(patientId, payload);
    broadcastToClients({ type: 'VR_LIVE_STREAM', ...payload });
    return res.status(200).json({ success: true, message: 'OK' });
  } catch (err) { 
    return res.status(500).json({ success: false, error: err.message }); 
  }
});

app.get('/api/vr/stream', (req, res) => {
  const patientId = req.query.patientId || 'PAC-8104';
  const currentStream = vrLiveStreams.get(patientId);
  if (currentStream) return res.status(200).json(currentStream);
  return res.status(200).json({ patientId, status: 'WAITING_STREAM' });
});

app.get('/health', (req, res) => { res.status(200).json({ status: 'OK' }); });

// 4. WEBSOCKET SERVER GLOBAL
const wss = new WebSocketServer({ server });

// ¡CORREGIDO! JS puro no usa <WebSocket>
const connectedClients = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const patientId = data.patientId || 'PAC-8104';
      if (data && data.metrics) vrLiveStreams.set(patientId, data);
      
      if (data.type === 'HANDSHAKE' || data.type === 'JOIN_ROOM') {
        ws.send(JSON.stringify({ type: 'HANDSHAKE_ACK', patientId }));
      }
      broadcastToClients(data, ws);
    } catch (e) { 
      console.error('Error WSS:', e); 
    }
  });
  ws.on('close', () => { connectedClients.delete(ws); });
});

function broadcastToClients(data, senderWs = null) {
  const payload = JSON.stringify(data);
  connectedClients.forEach(client => {
    if (client !== senderWs && client.readyState === 1) { // 1 significa estado OPEN
      client.send(payload);
    }
  });
}

// 5. INICIO DE SERVIDOR
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
  console.log(`📡 WebSocket endpoint listo`);
});
