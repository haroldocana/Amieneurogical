const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

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

// 2. CONEXIÓN A MONGODB ATLAS
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:amie2026@cluster0.mongodb.net/amie_clinical_db?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Conectada con éxito'))
  .catch(err => console.error('❌ Error de conexión a MongoDB:', err.message));

// 3. RUTAS DE COMPROBACIÓN DE SALUD (HEALTH CHECK)
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/status', (req, res) => {
  return res.status(200).json({
    success: true,
    engine: 'AMIE Gemini 3.8 Flash',
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      clinicalAnalysis: 'operational',
      jitaiSentinel: 'operational',
      vrTelemetry: 'operational'
    }
  });
});

// 4. IMPORTAR Y REGISTRAR RUTAS
try {
  const vrTelemetryRouter = require('./routes/vrTelemetry');
  app.use('/api/vr', vrTelemetryRouter);
} catch (e) {
  try {
    const vrTelemetryRouter = require('./server/routes/vrTelemetry');
    app.use('/api/vr', vrTelemetryRouter);
  } catch (err) {
    console.warn('⚠️ No se pudo cargar módulo externo de vrTelemetry, usando integrado');
  }
}

// Endpoint de respaldo para /api/vr/telemetry (soporta formato directo y sessionData)
app.post('/api/vr/telemetry', async (req, res) => {
  try {
    const { patientId, moduleId, taskName, kpis, telemetryLog, sessionData } = req.body;
    const targetPatient = patientId || 'PAC-8104';
    const activeTask = moduleId || taskName || sessionData?.taskName || 'VR_MODULE';

    const VrSessionSchema = new mongoose.Schema({
      patientId: String,
      taskName: String,
      metrics: mongoose.Schema.Types.Mixed,
      telemetryLog: [mongoose.Schema.Types.Mixed]
    }, { timestamps: true });

    const VrSession = mongoose.models.VrSession || mongoose.model('VrSession', VrSessionSchema);

    const saved = await VrSession.create({
      patientId: targetPatient,
      taskName: activeTask,
      metrics: kpis || sessionData?.metrics || {},
      telemetryLog: telemetryLog || sessionData?.telemetryLog || []
    });

    console.log(`[MongoDB] Telemetría guardada para: ${targetPatient}`);
    return res.status(200).json({ success: true, sessionId: saved._id });
  } catch (err) {
    console.error('Error guardando telemetría VR:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Proxy Shim para Vertex AI
app.post('/api-proxy', async (req, res) => {
  if (req.headers['x-app-proxy'] !== 'FMFLYlU8uZv2lv1YA5t5UhwoUbb8DJHJ') {
    return res.status(401).json({ error: 'Acceso denegado: Proxy no autorizado' });
  }
  try {
    const { originalUrl, method, headers, body } = req.body;
    const response = await fetch(originalUrl, {
      method: method || 'POST',
      headers: { ...headers, 'Host': new URL(originalUrl).host, 'Origin': '', 'Referer': '' },
      body: typeof body === 'object' ? JSON.stringify(body) : body
    });
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy Request Failed', details: error.message });
  }
});

// 5. SERVIDOR WEBSOCKET GLOBAL (PICO 3 <-> CHROMEBOOK)
const wss = new WebSocketServer({ server });
const connectedClients = new Set();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Interceptor Proxy Gemini Live WS
  if (url.pathname === '/ws-proxy') {
    const target = url.searchParams.get('target');
    if (!target) return ws.close();

    const targetWs = new WebSocket(target);
    ws.on('message', (msg) => { if (targetWs.readyState === WebSocket.OPEN) targetWs.send(msg); });
    targetWs.on('message', (msg) => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); });
    targetWs.on('close', () => ws.close());
    ws.on('close', () => targetWs.close());
    return;
  }

  // Telemetría VR AMIE
  connectedClients.add(ws);
  console.log('🔌 Cliente conectado al WebSocket VR Bridge');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const patientId = data.patientId || 'PAC-8104';

      if (data.type === 'HANDSHAKE' || data.type === 'JOIN_ROOM') {
        ws.send(JSON.stringify({ type: 'HANDSHAKE_ACK', patientId }));
      }

      // Rebotar paquetes a los demás clientes conectados
      connectedClients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (e) {
      console.error('Error procesando mensaje WS:', e);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log('❌ Cliente desconectado del WebSocket');
  });
});

// 6. INICIAR PUERTO
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Backend AMIE listo y corriendo en puerto ${PORT}`);
});
