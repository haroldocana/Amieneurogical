import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Controladores Clínicos y de Inteligencia Artificial
import { analyzePatientData } from './controllers/analyzePatientData.js';
import { 
  getSaasProfile, 
  rechargeAiTokens, 
  consumeAiTokens 
} from './controllers/authAndLicenseController.js';
import { manualGrantByAdmin } from './controllers/adminPanelController.js';

// Modelos de Base de Datos
import PatientRecord from './models/PatientRecord.js';
import { DoctorUserModel, OrganizationModel } from './models/AuthAndLicenseModels.js';
import User from './models/User.js';

// Middlewares
import { optionalAuth, requireAuth } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ============================================================================
// 1. CONFIGURACIÓN DE CORS & BODY PARSERS
// ============================================================================
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite peticiones sin origin (gafas VR, WebXR nativo, curl, apps móviles)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || origin.includes('onrender.com') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback permisivo para estaciones clínicas
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-app-proxy', 'x-user-id', 'x-amie-proxy-header', 'Accept']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ============================================================================
// 2. CONEXIÓN A MONGODB ATLAS
// ============================================================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:amie2026@cluster0.mongodb.net/amie_clinical_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ [MongoDB Atlas] Conectado exitosamente al clúster clínico'))
  .catch((err: Error) => console.error('❌ [MongoDB Atlas] Error de conexión:', err.message));

// Esquema y Modelo de Telemetría VR Unificado
const VrSessionSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  taskName: String,
  moduleId: String,
  protocol: String,
  category: String,
  metrics: mongoose.Schema.Types.Mixed,
  telemetryLog: [mongoose.Schema.Types.Mixed],
  rawSessionData: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const VrSession = mongoose.models.VrSession || mongoose.model('VrSession', VrSessionSchema);

// ============================================================================
// 3. RUTAS DE SALUD & STATUS (Públicas para Render y Monitores)
// ============================================================================
app.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({ 
    status: 'OK', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
});

app.get('/status', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    engine: 'AMIE Gemini 3.8 Flash (Execution: gemini-2.5-flash)',
    status: 'online',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    services: {
      clinicalAnalysis: 'operational',
      jitaiSentinel: 'operational',
      vrTelemetry: 'operational',
      saasBilling: 'operational'
    }
  });
});

// Alias compatible bajo /api
app.get('/api/status', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    status: 'online',
    engine: 'AMIE Clinical Engine v3.8',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============================================================================
// 4. MOTOR CLÍNICO AMIE & ANÁLISIS MULTIAXIAL (Gemini 2.5/3.8 Flash)
// ============================================================================
app.post('/api/analyze', optionalAuth, analyzePatientData);
app.post('/api/clinical/analyze', optionalAuth, analyzePatientData);

// Sincronización y consulta de expediente de paciente
app.get('/api/patients/:patientId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    let patient = await PatientRecord.findOne({
      $or: [{ id: patientId }, { patientId: patientId }, { 'metadata.patientId': patientId }]
    });

    if (!patient) {
      // Auto-generación de expediente base seguro si es nuevo
      patient = await PatientRecord.create({
        id: patientId,
        patientId: patientId,
        metadata: {
          patientId,
          sessionGuid: `SESS-${Date.now()}`,
          facilityId: 'AMIE-CLINIC-CENTRAL',
          operatorId: 'harold01'
        }
      });
    }

    return res.status(200).json({ success: true, patient });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 5. BOLSÓN DE IA, LICENCIAS & CONTROL SAAS
// ============================================================================
app.get('/api/saas/profile', optionalAuth, getSaasProfile);
app.post('/api/saas/recharge', optionalAuth, rechargeAiTokens);
app.post('/api/admin/manual-grant', optionalAuth, manualGrantByAdmin);

// ============================================================================
// 6. ENDPOINTS DE TELEMETRÍA VR (PICO 3 / QUEST / CHROMIE SYNC)
// ============================================================================
app.post('/api/vr/telemetry', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { patientId, moduleId, taskName, kpis, telemetryLog, sessionData } = req.body;
    const targetPatient = patientId || sessionData?.patientId || 'PAC-8104';
    const activeTask = moduleId || taskName || sessionData?.taskName || 'VR_MODULE';

    const saved = await VrSession.create({
      patientId: targetPatient,
      taskName: activeTask,
      moduleId: moduleId || activeTask,
      metrics: kpis || sessionData?.metrics || {},
      telemetryLog: telemetryLog || sessionData?.telemetryLog || [],
      rawSessionData: req.body
    });

    return res.status(200).json({ success: true, sessionId: saved._id });
  } catch (err: any) {
    console.error('[MongoDB Error] Guardando telemetría VR:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/telemetry/save', optionalAuth, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const targetPatient = data.patientId || 'PAC-8104';
    const activeModule = data.moduleId || data.taskName || 'VR_SESSION';

    const saved = await VrSession.create({
      patientId: targetPatient,
      taskName: activeModule,
      moduleId: activeModule,
      protocol: data.protocol || 'GENERAL',
      category: data.category || 'CLINICAL',
      metrics: {
        totalPackets: data.totalPackets,
        totalHits: data.totalHits,
        commissions: data.commissions,
        omissions: data.omissions,
        avgReactionTime: data.avgReactionTime,
        tranceDepth: data.tranceDepth,
        finalHrv: data.finalHrv,
        finalGsr: data.finalGsr
      },
      rawSessionData: data
    });

    return res.status(200).json({ success: true, sessionId: saved._id });
  } catch (err: any) {
    console.error('[MongoDB Error] Guardando en /api/telemetry/save:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Proxy Shim para llamadas de API Vertex / Microservicios
app.post('/api-proxy', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ error: 'Proxy Request Failed', details: error.message });
  }
});

// ============================================================================
// 7. WEBSOCKET BRIDGE RESILIENTE (CHROMEBOOK <-> PICO 3) CON HEARTBEAT
// ============================================================================
interface ExtWebSocket extends WebSocket {
  isAlive?: boolean;
  patientId?: string;
  role?: string;
}

const wss = new WebSocketServer({ server });
const connectedClients = new Set<ExtWebSocket>();

wss.on('connection', (ws: ExtWebSocket, req) => {
  ws.isAlive = true;

  // Manejador del latido (Pong)
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);

  // Interceptor Proxy para WebSockets externos
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

  connectedClients.add(ws);
  console.log(`🔌 [WS] Nueva terminal conectada (Total activas: ${connectedClients.size})`);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const patientId = data.patientId || ws.patientId || 'PAC-8104';

      if (data.type === 'HANDSHAKE' || data.type === 'JOIN_ROOM') {
        ws.patientId = patientId;
        ws.role = data.role || 'receiver';
        ws.send(JSON.stringify({ 
          type: 'HANDSHAKE_ACK', 
          patientId,
          timestamp: Date.now() 
        }));
      }

      // Archivo asíncrono si el paquete solicita persistencia en MongoDB
      if (data.type === 'PERSIST_SESSION_DATA' && data.payload) {
        VrSession.create({
          patientId: data.payload.patientId || patientId,
          taskName: data.payload.moduleId || 'VR_SESSION',
          moduleId: data.payload.moduleId,
          protocol: data.payload.protocol,
          rawSessionData: data.payload
        }).catch(err => console.error('[WS DB Error]:', err.message));
      }

      // Retransmisión bidireccional instantánea
      connectedClients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          // Si el cliente tiene asignado paciente, solo le entrega paquetes de su paciente
          if (!client.patientId || client.patientId === patientId || patientId === 'PAC-8104') {
            client.send(JSON.stringify(data));
          }
        }
      });

    } catch (e) {
      console.error('[WS Parse Error]:', e);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log(`❌ [WS] Terminal desconectada (Restantes: ${connectedClients.size})`);
  });

  ws.on('error', (err) => {
    console.warn('[WS Warning]:', err.message);
  });
});

// 🟢 INTERVALO HEARTBEAT (30 SEGUNDOS)
// Impide que Render corte la conexión WebSocket por inactividad a los 55 segundos
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws: WebSocket) => {
    const extWs = ws as ExtWebSocket;
    if (extWs.isAlive === false) {
      extWs.terminate();
      return;
    }
    extWs.isAlive = false;
    extWs.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// ============================================================================
// 8. ESCUCHA DEL SERVIDOR
// ============================================================================
const PORT = Number(process.env.PORT) || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ======================================================
   AMIE NEUROLOGICAL ENGINE v3.8 - BACKEND SERVER
  ======================================================
   [*] Servidor activo en puerto: ${PORT}
   [*] Protocolos: HTTP + WebSockets (WSS)
   [*] Heartbeat Render: Activo (30s Ping/Pong)
   [*] Base de Datos: MongoDB Atlas
   [*] Motor IA: AMIE Gemini Engine
  ======================================================
  `);
});
