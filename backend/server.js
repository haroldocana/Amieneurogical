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
  durationSeconds: { type: Number, default: 0 },
  metrics: {
    avgReactionTimeMs: { type: Number, default: 0 },
    omissions: { type: Number, default: 0 },
    commissions: { type: Number, default: 0 },
    frontalEngagementPct: { type: Number, default: 0 },
    binauralBetaHz: { type: Number, default: 15.0 }
  },
  aiLogs: [{ type: String }],
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });
const VrSession = mongoose.model('VrSession', vrSessionSchema);

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

// Ruta para recibir el streaming en vivo
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

// ¡NUEVO! Ruta para guardar el informe en MongoDB
app.post('/api/vr/telemetry', async (req, res) => {
  try {
    const { patientId, sessionData } = req.body;
    const targetPatient = patientId || 'PAC-8104';

    vrLiveStreams.delete(targetPatient);

    const savedSession = await VrSession.create({
      patientId: targetPatient,
      taskName: sessionData?.taskName || 'ExecutiveControl',
      durationSeconds: sessionData?.durationSeconds || 0,
      metrics: {
        avgReactionTimeMs: sessionData?.metrics?.avgReactionTimeMs || 0,
        omissions: sessionData?.metrics?.omissions || 0,
        commissions: sessionData?.metrics?.commissions || 0,
        frontalEngagementPct: sessionData?.metrics?.frontalEngagementPct || 0,
        binauralBetaHz: sessionData?.metrics?.binauralBetaHz || 15.0
      },
      aiLogs: sessionData?.aiLogs || [],
      completedAt: new Date()
    });

    broadcastToClients({
      type: 'VR_SESSION_COMPLETED',
      patientId: targetPatient,
      session: savedSession
    });

    return res.status(200).json({
      success: true,
      message: 'Reporte guardado exitosamente.',
      sessionId: savedSession._id
    });
  } catch (err) {
    console.error('Error guardando reporte VR:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/health', (req, res) => { res.status(200).json({ status: 'OK' }); });

// 4. WEBSOCKET SERVER GLOBAL
const wss = new WebSocketServer({ server });
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
    if (client !== senderWs && client.readyState === 1) { 
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
