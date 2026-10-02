import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const server = http.createServer(app);

// -----------------------------------------------------------------------
// 1. CONFIGURACIÓN DE MIDDLEWARES & SEGURIDAD CORS
// -----------------------------------------------------------------------
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-app-proxy', 'x-user-id', 'Accept']
}));

// Habilitar preflight automático para todas las rutas
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// -----------------------------------------------------------------------
// 2. CONEXIÓN A BASE DE DATOS MONGODB ATLAS
// -----------------------------------------------------------------------
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:amie2026@cluster0.mongodb.net/amie_clinical_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Base de Datos MongoDB Atlas Conectada Exitosamente'))
  .catch(err => console.error('❌ Error de conexión a MongoDB:', err.message));

// Esquema Mongoose Unificado para Usuario / Médico
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, default: 'Dr. Alejandro Morales Rivera' },
  collegiateNumber: { type: String, default: '749210' },
  hospitalName: { type: String, default: 'Clínica de Neurociencia Avanzada' },
  accountType: { type: String, enum: ['INDIVIDUAL', 'CORPORATE_MEMBER'], default: 'INDIVIDUAL' },
  licenseDaysRemaining: { type: Number, default: 365 },
  licenseValidUntil: { type: Date, default: () => new Date(Date.now() + 365*24*60*60*1000) },
  isLicenseActive: { type: Boolean, default: true },
  aiTokensTotal: { type: Number, default: 100 },
  aiTokensUsed: { type: Number, default: 0 },
  rechargeHistory: [{
    tokensAdded: Number,
    packageType: String,
    date: { type: Date, default: Date.now },
    referenceId: String
  }],
  auditHistory: [{
    grantedAt: { type: Date, default: Date.now },
    grantedBy: String,
    paymentMethod: String,
    bankReference: String,
    notes: String,
    type: String,
    tokensGranted: Number,
    yearsGranted: Number
  }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// -----------------------------------------------------------------------
// 3. RUTAS API: PERFIL SAAS & CONSUMO DE TOKENS IA
// -----------------------------------------------------------------------

app.get('/api/saas/profile', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'harold01';
    let user = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(userId) ? userId : null }, { username: userId }] });

    if (!user) {
      user = await User.create({ username: userId });
    }

    const available = Math.max(0, user.aiTokensTotal - user.aiTokensUsed);
    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        name: user.name,
        collegiateNumber: user.collegiateNumber,
        hospitalName: user.hospitalName,
        licenseDaysRemaining: user.licenseDaysRemaining,
        aiTokensTotal: user.aiTokensTotal,
        aiTokensUsed: user.aiTokensUsed,
        aiTokensAvailable: available,
        rechargeHistory: user.rechargeHistory
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/saas/consume-tokens', async (req, res) => {
  try {
    const { userId, tokens } = req.body;
    const target = userId || 'harold01';
    const tokensToConsume = Number(tokens) || 1;

    const user = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(target) ? target : null }, { username: target }] });

    if (!user) return res.status(404).json({ success: false, error: 'Usuario médico no encontrado.' });

    const available = user.aiTokensTotal - user.aiTokensUsed;
    if (available < tokensToConsume) {
      return res.status(402).json({ 
        success: false, 
        error: 'Bolsón de IA agotado. Por favor adquiera un paquete de créditos.',
        remaining: available 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { aiTokensUsed: tokensToConsume } },
      { new: true }
    );

    const newRemaining = updatedUser.aiTokensTotal - updatedUser.aiTokensUsed;
    return res.status(200).json({ success: true, remaining: newRemaining });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------
// 4. RUTAS API: ADMINISTRACIÓN, TRANSFERENCIAS BANCARIAS & DEMOS
// -----------------------------------------------------------------------
app.post('/api/admin/manual-grant', async (req, res) => {
  try {
    const { 
      targetId, 
      grantType, 
      tokensToAdd, 
      extensionYears, 
      demoDays, 
      paymentMethod, 
      bankReference, 
      adminNotes, 
      adminUserId 
    } = req.body;

    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Se requiere el ID o usuario del destinatario.' });
    }

    let user = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(targetId) ? targetId : null }, { username: targetId }] });

    if (!user) {
      user = await User.create({ username: targetId });
    }

    let addedTokens = 0;
    let addedYears = 0;

    if (grantType === 'RECHARGE_TOKENS' || grantType === 'GRANT_DEMO') {
      addedTokens = Number(tokensToAdd) || 100;
      user.aiTokensTotal += addedTokens;
    }

    if (grantType === 'EXTEND_LICENSE') {
      addedYears = Number(extensionYears) || 1;
      user.licenseDaysRemaining += addedYears * 365;
    }

    if (grantType === 'GRANT_DEMO') {
      user.licenseDaysRemaining += Number(demoDays) || 15;
    }

    user.auditHistory.push({
      grantedAt: new Date(),
      grantedBy: adminUserId || 'ADMIN_OPERACIONES',
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      bankReference: bankReference || 'N/A (Demo/Manual)',
      notes: adminNotes || 'Autorizado desde panel de control',
      type: grantType,
      tokensGranted: addedTokens,
      yearsGranted: addedYears
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Operación manual (${grantType}) aplicada exitosamente.`,
      data: user
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------
// 5. RUTA API: TELEMETRÍA CENTINELA 24/7 (PREVENCIÓN DE BROTES)
// -----------------------------------------------------------------------
app.post('/api/sentinel/telemetry', async (req, res) => {
  try {
    const { 
      patientId, 
      sleepHoursLastNight, 
      nightAwakenings, 
      typingLatencyMs, 
      restingHeartRate, 
      isOutsideSafeZone 
    } = req.body;

    let riskScore = 0;

    // Criterios de Riesgo Prodrómico
    if (sleepHoursLastNight < 3) riskScore += 40;
    else if (sleepHoursLastNight < 5) riskScore += 20;

    if (nightAwakenings >= 4) riskScore += 15;
    if (restingHeartRate > 95) riskScore += 20;
    if (typingLatencyMs > 600 || typingLatencyMs < 150) riskScore += 15;
    if (isOutsideSafeZone) riskScore += 10;

    const isCritical = riskScore >= 80;

    if (isCritical) {
      console.log(`🚨 [ALERTA CRÍTICA JITAI] Riesgo de brote en Paciente ${patientId || 'PAC-8104'}: ${riskScore}%`);
      broadcastToClients({
        type: 'CRITICAL_SENTINEL_ALERT',
        patientId: patientId || 'PAC-8104',
        riskScore,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      patientId: patientId || 'PAC-8104',
      evaluatedRiskScore: riskScore,
      status: isCritical ? 'CRITICAL_ALERT_DISPATCHED' : 'MONITORING_NORMAL'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', engine: 'AMIE Clinical Backend v3.8', uptime: process.uptime() });
});

// -----------------------------------------------------------------------
// 6. WEBSOCKET SERVER (QUEST 3S / PICO NEURO 3 TELEMETRY AT 60 FPS)
// -----------------------------------------------------------------------
const wss = new WebSocketServer({ server, path: '/ws/quest3s' });

const connectedClients = new Set();

wss.on('connection', (ws, req) => {
  connectedClients.add(ws);
  console.log(`🥽 Visor VR / Cliente enlazado por WebSocket. Total activos: ${connectedClients.size}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      broadcastToClients(data, ws);
    } catch (e) {}
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log(`🔌 Cliente WebSocket desconectado. Restantes: ${connectedClients.size}`);
  });
});

function broadcastToClients(data, senderWs = null) {
  const payload = JSON.stringify(data);
  connectedClients.forEach(client => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// -----------------------------------------------------------------------
// 7. INICIALIZACIÓN DEL SERVIDOR HTTP EN RENDER
// -----------------------------------------------------------------------
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor AMIE Backend corriendo en puerto ${PORT}`);
  console.log(`📡 WebSocket endpoint listo en ws://localhost:${PORT}/ws/quest3s`);
});
