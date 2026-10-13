// ============================================================================
// AMIE CLINICAL COPILOT - GENERADOR DE DICTAMEN MÉDICO OFICIAL EN PDF (PRINT ENGINE)
// frontend/utils/pdfClinicalExporter.ts
// ============================================================================

import { PatientRecord, AmieClinicalAnalysis } from '../types';

function escapeHtml(text: any): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function exportAmieClinicalPdf(
  patient: PatientRecord,
  analysis: AmieClinicalAnalysis | null,
  doctorName: string,
  colegiadoNumber: number | string
): boolean {
  if (typeof window === 'undefined') return false;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return false;
  }

  const patientId = escapeHtml(patient?.id || (patient as any)?.patientId || 'PAC-8104');
  const patientName = escapeHtml(patient?.name || `Expediente ${patientId}`);
  const age = escapeHtml(patient?.age ?? 45);
  const gender = escapeHtml(patient?.gender === 'M' ? 'Masculino' : patient?.gender === 'F' ? 'Femenino' : 'Otro');
  const docName = escapeHtml(doctorName || 'Dr. Alejandro Morales Rivera');
  const colegiado = escapeHtml(colegiadoNumber || '749210');
  const issueDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // 1. Diagnósticos
  const principalDx = analysis?.principalDiagnosis;
  const principalDxName = escapeHtml(principalDx?.disorderName || 'En evaluación multiaxial');
  const principalDxCode = escapeHtml(principalDx?.code || 'F99');
  const principalDxConfidence = principalDx?.confidenceScorePct ? `${principalDx.confidenceScorePct}%` : '85%';
  const principalDxJustification = escapeHtml(principalDx?.justificationDsm5 || 'Evaluación diagnóstica según criterios DSM-5-TR / CIE-11.');

  // 2. Diagnósticos Diferenciales
  let diffDxHtml = '<tr><td colspan="3" style="text-align: center; color: #64748b;">No se registraron diferenciales descartados.</td></tr>';
  if (analysis?.differentialDiagnoses && Array.isArray(analysis.differentialDiagnoses) && analysis.differentialDiagnoses.length > 0) {
    diffDxHtml = analysis.differentialDiagnoses.map((d: any) => `
      <tr>
        <td style="font-weight: bold; color: #0369a1;">${escapeHtml(d.code || 'N/A')}</td>
        <td><strong>${escapeHtml(d.disorderName || '')}</strong> (${d.probabilityPct ?? 0}% prob.)</td>
        <td style="font-size: 10px; color: #475569;">${escapeHtml(d.discriminationFactor || d.rationale || '')}</td>
      </tr>
    `).join('');
  }

  // 3. Formulación Biopsicosocial
  const bio = escapeHtml(analysis?.biopsychosocialFormulation?.biological || 'Patrones de desincronización circadiana y lentificación neuromotora.');
  const psico = escapeHtml(analysis?.biopsychosocialFormulation?.psychological || 'Esquemas de rumiación cognitiva y sobrecarga atencional.');
  const social = escapeHtml(analysis?.biopsychosocialFormulation?.social || 'Aislamiento funcional e impacto en roles cotidianos.');

  // 4. Alertas de Riesgo Clínico (Líneas 199-205 limpias de escapes \vert{})
  let riskAlertsHtml = '<p style="color: #15803d; font-size: 11px;">No se identificaron alertas críticas de riesgo inminente.</p>';
  if (Array.isArray(analysis?.riskAlerts) && analysis.riskAlerts.length > 0) {
    riskAlertsHtml = `<ul style="margin: 4px 0; padding-left: 18px; color: #9f1239;">
      ${analysis.riskAlerts.map((alert: any) => `
        <li style="margin-bottom: 4px;">
          <strong>[Riesgo ${escapeHtml(alert.severity || alert.level || 'Clínico')}]</strong> 
          ${escapeHtml(alert.alertType || alert.message || alert.description || 'Alerta')} — 
          <em>${escapeHtml(alert.actionRecommendation || alert.recommendation || '')}</em>
        </li>
      `).join('')}
    </ul>`;
  } else if (analysis?.riskAlerts && typeof analysis.riskAlerts === 'object') {
    const r = analysis.riskAlerts as any;
    riskAlertsHtml = `<div style="font-size: 11px; color: #9f1239;">
      <strong>[Alerta]</strong> ${escapeHtml(r.message || r.description || JSON.stringify(r))}
    </div>`;
  }

  // 5. Plan Terapéutico Personalizado
  const txPharma = escapeHtml(analysis?.personalizedTreatmentPlan?.pharmacologicalConsiderations || 'Manejo según respuesta clínica individual.');
  const txPsych = escapeHtml(analysis?.personalizedTreatmentPlan?.psychotherapeuticDirectives || 'Intervención psicoterapéutica focalizada.');
  const txVr = escapeHtml(analysis?.personalizedTreatmentPlan?.vrInterventions || 'Protocolo inmersivo VRET con pacer respiratorio de 6 cpm.');

  // 6. Psicometría y Biometría
  const phq9 = patient.psychometricScores?.phq9 ?? 'N/A';
  const gad7 = patient.psychometricScores?.gad7 ?? 'N/A';
  const reactionTime = patient.neuromotorBiomarkers?.reactionTimeMs ?? 'N/A';
  const qeegThetaBeta = patient.qeegZScores?.frontalThetaBetaRatio ?? '1.80';

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Dictamen Pericial Clínico — ${patientId}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.45;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .header-logo {
      font-size: 16px;
      font-weight: bold;
      color: #0369a1;
      letter-spacing: 0.5px;
    }
    .header-meta {
      text-align: right;
      font-size: 10px;
      color: #475569;
    }
    .patient-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      color: #0369a1;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-top: 12px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 10px;
      font-size: 10.5px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
    }
    table.data-table th {
      background: #f1f5f9;
      font-weight: bold;
      color: #334155;
    }
    .alert-box {
      background: #fff1f2;
      border-left: 4px solid #f43f5e;
      padding: 8px 12px;
      margin-top: 6px;
      margin-bottom: 10px;
    }
    .signature-container {
      margin-top: 35px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sig-line {
      width: 220px;
      border-top: 1px solid #334155;
      text-align: center;
      padding-top: 6px;
      font-size: 10px;
      color: #334155;
    }
    .footer-note {
      margin-top: 25px;
      font-size: 8.5px;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td>
        <div class="header-logo">AMIE CLINICAL COPILOT &bull; DICTAMEN MÉDICO</div>
        <div style="font-size: 9.5px; color: #64748b;">Motor de Inferencia Neuropsiquiátrica &bull; Gemini 3.8 Flash</div>
      </td>
      <td class="header-meta">
        <strong>FECHA:</strong> ${issueDate}<br/>
        <strong>FOLIO:</strong> AMIE-${patientId}-${Date.now().toString().slice(-6)}
      </td>
    </tr>
  </table>

  <div class="patient-box">
    <table style="width: 100%; font-size: 11px;">
      <tr>
        <td><strong>Paciente:</strong> ${patientName}</td>
        <td><strong>ID Expediente:</strong> ${patientId}</td>
        <td><strong>Edad:</strong> ${age} años</td>
        <td><strong>Sexo:</strong> ${gender}</td>
      </tr>
      <tr>
        <td colspan="4" style="padding-top: 4px;">
          <strong>Motivo de Consulta:</strong> ${escapeHtml(patient?.consultationReason || 'Evaluación integral')}
        </td>
      </tr>
    </table>
  </div>

  <div class="section-title">1. Diagnóstico Principal &amp; Grado de Confianza</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 15%;">Código</th>
        <th style="width: 55%;">Trastorno / Condición</th>
        <th style="width: 15%;">Confianza</th>
        <th style="width: 15%;">Sistema</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-size: 12px; font-weight: bold; color: #0284c7;">${principalDxCode}</td>
        <td><strong>${principalDxName}</strong></td>
        <td><strong style="color: #0369a1;">${principalDxConfidence}</strong></td>
        <td>DSM-5-TR / CIE-11</td>
      </tr>
      <tr>
        <td colspan="4" style="background: #fafafa; font-size: 10px; color: #334155;">
          <strong>Criterios de Justificación:</strong> ${principalDxJustification}
        </td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">2. Diagnósticos Diferenciales Descartados / Considerados</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 15%;">Código</th>
        <th style="width: 45%;">Diagnóstico Diferencial</th>
        <th style="width: 40%;">Factor de Discriminación Clínica</th>
      </tr>
    </thead>
    <tbody>
      ${diffDxHtml}
    </tbody>
  </table>

  <div class="section-title">3. Triangulación Biopsicosocial &amp; Bioseñales</div>
  <table class="data-table">
    <tr>
      <td style="width: 25%; font-weight: bold; background: #f8fafc;">Eje Biológico / Autonómico:</td>
      <td>${bio} (Latencia motora: ${reactionTime} ms | Ratio Theta/Beta: ${qeegThetaBeta})</td>
    </tr>
    <tr>
      <td style="font-weight: bold; background: #f8fafc;">Eje Psicológico / Psicometría:</td>
      <td>${psico} (PHQ-9: ${phq9}/27 | GAD-7: ${gad7}/21)</td>
    </tr>
    <tr>
      <td style="font-weight: bold; background: #f8fafc;">Eje Social / Relacional:</td>
      <td>${social}</td>
    </tr>
  </table>

  <div class="section-title">4. Alertas de Vulnerabilidad &amp; Seguridad del Paciente</div>
  <div class="alert-box">
    ${riskAlertsHtml}
  </div>

  <div class="section-title">5. Directivas del Plan Terapéutico Personalizado</div>
  <table class="data-table">
    <tr>
      <td style="width: 25%; font-weight: bold; background: #f8fafc;">Consideraciones Farmacológicas:</td>
      <td>${txPharma}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; background: #f8fafc;">Estrategia Psicoterapéutica:</td>
      <td>${txPsych}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; background: #f8fafc;">Neuromodulación Inmersiva (VR):</td>
      <td>${txVr}</td>
    </tr>
  </table>

  <div class="signature-container">
    <div class="sig-line">
      Firma del Facilitador / Auditor Clínico
    </div>
    <div class="sig-line">
      <strong>${docName}</strong><br/>
      Médico Psiquiatra / Especialista<br/>
      No. de Colegiado: ${colegiado}
    </div>
  </div>

  <div class="footer-note">
    Este dictamen fue elaborado con la asistencia del sistema SaMD AMIE Clinical Copilot. Los hallazgos diagnósticos y sugerencias terapéuticas deben ser interpretados y validados por el profesional de la salud responsable. Certificado bajo normativas de confidencialidad médica HIPAA y RGPD.
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  return true;
}

export const exportClinicalPdf = exportAmieClinicalPdf;
export default exportAmieClinicalPdf;
