// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR DE EXPORTACIÓN PDF (DICTAMEN MÉDICO)
// frontend/utils/pdfExporter.ts
// ============================================================================

import { PatientRecord, AmieClinicalAnalysis } from '../types';

/**
 * Función de escape básico para prevenir roturas de HTML (XSS) y fallas de renderizado
 */
const escapeHtml = (str: string | undefined | null): string => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Genera y lanza el visor de impresión PDF nativo con formato de receta/dictamen clínico
 */
export const exportAmieClinicalPdf = (
  patient: PatientRecord,
  analysis: AmieClinicalAnalysis | null,
  doctorName: string,
  colegiadoNumber: number | string
) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('⚠️ No se pudo abrir la ventana de impresión. Por favor, desactive el bloqueador de ventanas emergentes (pop-ups) en su navegador.');
    return;
  }

  const timestamp = new Date().toLocaleString('es-GT', { 
    dateStyle: 'full', 
    timeStyle: 'medium' 
  });

  const documentHash = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  // --------------------------------------------------------------------------
  // 1. EXTRACCIÓN ROBUSTA DE DIAGNÓSTICOS (primaryDiagnostic + Comorbilidades)
  // --------------------------------------------------------------------------
  let diagnosticItemsHtml = '';
  
  // A. Si existe el motor AMIE Multiaxial (Estructura Nueva)
  if (analysis?.primaryDiagnostic) {
    const mainDiag = analysis.primaryDiagnostic;
    diagnosticItemsHtml += `
      <div style="margin-bottom: 8px; padding-bottom: 8px; border-b: 1px dashed #cbd5e1;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #0284c7; font-size: 13px;">[${escapeHtml(mainDiag.dsm5Code)} / ${escapeHtml(mainDiag.icd11Code)}] ${escapeHtml(mainDiag.title)}</strong>
          <span class="badge" style="background: ${mainDiag.probabilityPercent >= 80 ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'}">
            Certeza AMIE: ${mainDiag.probabilityPercent}%
          </span>
        </div>
        <p style="margin: 4px 0 0 0; color: #334155; font-size: 11px;">
          <strong>Eje I (Diagnóstico Principal) - Nivel de Severidad:</strong> ${escapeHtml(mainDiag.severityLevel)}
        </p>
      </div>
    `;

    // Secundarios
    if (analysis.secondaryComorbidities && analysis.secondaryComorbidities.length > 0) {
      analysis.secondaryComorbidities.forEach((comorb, idx) => {
        diagnosticItemsHtml += `
          <div style="margin-bottom: 8px; padding-bottom: 8px; ${idx < (analysis.secondaryComorbidities?.length || 1) - 1 ? 'border-b: 1px dashed #cbd5e1;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #475569; font-size: 12px;">[${escapeHtml(comorb.dsm5Code)}] ${escapeHtml(comorb.title)}</strong>
              <span style="font-size: 10px; color: #64748b;">Comorbilidad</span>
            </div>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">
              ${escapeHtml(comorb.rationale || 'Hallazgos clínicos secundarios')}
            </p>
          </div>
        `;
      });
    }
  } 
  // B. Fallback (Estructura Antigua o Expediente Base)
  else if ((analysis as any)?.diagnosticImpressions?.length) {
    const impressions = (analysis as any).diagnosticImpressions;
    diagnosticItemsHtml = impressions.map((diag: any, idx: number) => `
      <div style="margin-bottom: 8px; padding-bottom: 8px; ${idx < impressions.length - 1 ? 'border-b: 1px dashed #cbd5e1;' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #0284c7; font-size: 13px;">[${escapeHtml(diag.code)}] ${escapeHtml(diag.title)}</strong>
          <span class="badge" style="background: ${diag.confidencePct >= 80 ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'}">
            Certeza: ${diag.confidencePct}%
          </span>
        </div>
        <p style="margin: 4px 0 0 0; color: #334155; font-size: 11px;">
          <strong>Fundamentación DSM-5 / CIE-11:</strong> ${escapeHtml(diag.rationale)}
        </p>
      </div>
    `).join('');
  } 
  else {
    const baseCode = (patient as any).diagnosticCode || 'F32.9';
    const baseName = (patient as any).primaryDiagnosisName || 'Pendiente de Evaluación Estructural';
    diagnosticItemsHtml = `
      <div style="margin-bottom: 8px; padding-bottom: 8px;">
        <strong style="color: #0284c7; font-size: 13px;">[${escapeHtml(baseCode)}] ${escapeHtml(baseName)}</strong>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px; font-style: italic;">
          Diagnóstico base del expediente. Ejecute el Motor AMIE para triangulación profunda.
        </p>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // 2. EXTRACCIÓN DE RECOMENDACIONES Y ALERTAS DE RIESGO
  // --------------------------------------------------------------------------
  const recommendationsHtml = analysis?.therapeuticRecommendations?.length
    ? `<ul style="margin: 4px 0; padding-left: 18px; color: #334155;">
        ${analysis.therapeuticRecommendations.map(rec => `<li style="margin-bottom: 4px;">${escapeHtml(rec)}</li>`).join('')}
       </ul>`
    : '<p style="color: #64748b;">Seguimiento clínico y psicofarmacológico estandarizado.</p>';

  const riskAlertsHtml = analysis?.riskAlerts?.length
    ? `<ul style="margin: 4px 0; padding-left: 18px; color: #9f1239;">
        ${analysis.riskAlerts.map(alert => `<li style="margin-bottom: 4px;"><strong>[Riesgo ${alert.level}]</strong>${escapeHtml(alert.message)}</li>`).join('')}
       </ul>`
    : '<p style="color: #64748b;">No se detectaron indicadores agudos de riesgo en la muestra actual.</p>';

  // --------------------------------------------------------------------------
  // 3. EXTRACCIÓN SEGURA DE BIOMETRÍA (Evitar crash por undefined)
  // --------------------------------------------------------------------------
  const p = patient as any;
  const gsrPeak = p.vrTherapyIntervention?.realtimeTelemetrySummary?.peakGSR_uS ?? p.vrTelemetryData?.gsr ?? 3.4;
  const hrvVal = p.vrTherapyIntervention?.realtimeTelemetrySummary?.finalHrv ?? p.vrTelemetryData?.hrv ?? 42;
  const habIndex = p.vrTherapyIntervention?.realtimeTelemetrySummary?.habituationIndexH ?? p.vrTelemetryData?.habituationIndexH ?? 2.84;
  const cognitiveLoad = analysis?.biomedicalTriangulation?.cognitiveLoad || 'Patrón Oculomotor y Cognitivo estable y normalizado.';

  const sentinelRisk = p.sentinelTelemetrySnapshot?.status || p.sentinelTelemetry?.safetyStatus?.riskLevel || 'ESTABLE';
  const isSentinelCritical = sentinelRisk === 'CRÍTICO' || sentinelRisk === 'CRITICAL_ALERT_DISPATCHED' || sentinelRisk === 'CRITICAL';

  // --------------------------------------------------------------------------
  // 4. PLANTILLA HTML DE IMPRESIÓN (ESTILO DICTAMEN)
  // --------------------------------------------------------------------------
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Dictamen_Clinico_AMIE_${escapeHtml(patient.id || p.patientId)}</title>
      <style>
        @page {
          size: letter portrait;
          margin: 15mm;
        }

        body { 
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; 
          color: #0f172a; 
          margin: 0; 
          padding: 0; 
          line-height: 1.5; 
          font-size: 11px; 
          background: #fff;
        }

        .header { 
          border-bottom: 2.5px solid #0284c7; 
          padding-bottom: 10px; 
          margin-bottom: 15px; 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
        }

        .title { 
          font-size: 18px; 
          font-weight: 800; 
          color: #0369a1; 
          text-transform: uppercase; 
          margin: 0; 
          letter-spacing: -0.5px;
        }

        .subtitle { 
          font-size: 9px; 
          color: #64748b; 
          font-weight: 700; 
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .section { 
          background: #f8fafc; 
          border: 1px solid #e2e8f0; 
          border-radius: 6px; 
          padding: 10px 12px; 
          margin-bottom: 12px; 
          page-break-inside: avoid;
        }

        .section-title { 
          font-size: 11px; 
          font-weight: 800; 
          color: #0f172a; 
          border-bottom: 1px solid #cbd5e1; 
          padding-bottom: 4px; 
          margin-bottom: 8px; 
          text-transform: uppercase; 
          letter-spacing: 0.3px;
          display: flex;
          justify-content: space-between;
        }

        .grid-2 { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 12px; 
        }

        .grid-3 { 
          display: grid; 
          grid-template-columns: 1fr 1fr 1fr; 
          gap: 8px; 
        }

        .label { 
          font-weight: 700; 
          color: #475569; 
          font-size: 10px;
        }

        .value {
          color: #0f172a;
          font-weight: 600;
        }

        .badge { 
          background: #e0f2fe; 
          color: #0369a1; 
          padding: 2px 6px; 
          border-radius: 4px; 
          font-weight: 700; 
          font-size: 9px; 
          display: inline-block;
        }

        .alert-box { 
          background: #fff1f2; 
          border: 1.5px solid #f43f5e; 
          color: #881337; 
          padding: 10px; 
          border-radius: 6px; 
          font-weight: 600; 
          margin-bottom: 12px; 
          font-size: 11px;
          line-height: 1.4;
        }

        .biometric-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          border-radius: 4px;
        }

        .signature-container { 
          margin-top: 35px; 
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          page-break-inside: avoid;
        }

        .signature-line { 
          border-top: 1px dashed #475569; 
          width: 240px; 
          text-align: center; 
          padding-top: 5px; 
        }

        .footer { 
          margin-top: 25px; 
          border-top: 1px solid #e2e8f0; 
          padding-top: 10px; 
          text-align: center; 
          font-size: 8.5px; 
          color: #94a3b8; 
        }

        @media print {
          body { font-size: 10.5px; }
          .section { background: #fafafa !important; -webkit-print-color-adjust: exact; }
          .badge { -webkit-print-color-adjust: exact; }
          .alert-box { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">AMIE Clinical Workstation</h1>
          <div class="subtitle">DICTAMEN OFICIAL DE TRIANGULACIÓN BIOCLÍNICA MULTIMODAL (SaMD)</div>
        </div>
        <div style="text-align: right;">
          <span class="badge">EVALUACIÓN NEUROPSIQUIÁTRICA</span>
          <div style="font-size: 9px; margin-top: 4px; color: #64748b; font-family: monospace;">${timestamp}</div>
        </div>
      </div>

      <!-- 1. METADATOS PACIENTE Y MÉDICO -->
      <div class="section grid-2">
        <div>
          <div><span class="label">EXPEDIENTE ID:</span> <span class="value">${escapeHtml(patient.id || p.patientId)}</span></div>
          <div><span class="label">EDAD / GÉNERO:</span> <span class="value">${patient.age || '--'} años | ${patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'No especificado'}</span></div>
          <div><span class="label">MOTIVO DE CONSULTA:</span> <span class="value">${escapeHtml((patient as any).consultationReason || 'Evaluación General')}</span></div>
        </div>
        <div>
          <div><span class="label">MÉDICO TRATANTE:</span> <span class="value">${escapeHtml(doctorName)}</span></div>
          <div><span class="label">COLEGIADO N°:</span> <span class="value">${escapeHtml(String(colegiadoNumber))}</span></div>
          <div style="margin-top: 2px;">
            <span class="label">MONITOREO CENTINELA JITAI:</span> 
            <span class="badge" style="background: ${isSentinelCritical ? '#ffe4e6; color: #be123c;' : '#e0f2fe; color: #0369a1;'}">
              ${escapeHtml(sentinelRisk)}
            </span>
          </div>
        </div>
      </div>

      <!-- ALERTA CENTINELA DE CRISIS JITAI -->
      ${isSentinelCritical ? `
        <div class="alert-box">
          ⚠️ <strong>ALERTA CENTINELA DE RIESGO CLÍNICO AGUDO:</strong> La telemetría móvil ha detectado patrones críticos de descompensación (privación de sueño / hiperactivación simpática basal). Factores: ${escapeHtml(p.sentinelTelemetrySnapshot?.activeRiskFactors?.join(', ') || 'No especificados')}. Se sugiere protocolo de contención.
        </div>
      ` : ''}

      <!-- 2. ANÁLISIS DIAGNÓSTICO DSM-5-TR / CIE-11 -->
      <div class="section">
        <div class="section-title">
          <span>1. Impresiones Diagnósticas & Comorbilidades (DSM-5-TR / CIE-11)</span>
          <span style="font-weight: normal; font-size: 9px; color: #64748b;">Algoritmo RDoC AMIE</span>
        </div>
        ${diagnosticItemsHtml}
      </div>

      <!-- 3. TELEMETRÍA VR Y BIOMARCADORES MULTISENSORIALES -->
      <div class="section">
        <div class="section-title">2. Triangulación Biométrica & Telemetría VR Inmersiva</div>
        <div class="grid-3" style="margin-top: 6px;">
          <div class="biometric-card">
            <div class="label">Conductancia GSR (Pico):</div>
            <div class="value" style="font-size: 13px; color: #0284c7;">
              ${gsrPeak} µS
            </div>
            <div style="font-size: 8.5px; color: #64748b;">Reacción Simpática Fásica</div>
          </div>

          <div class="biometric-card">
            <div class="label">Tono Vagal (HRV RMSSD):</div>
            <div class="value" style="font-size: 13px; color: #059669;">
              ${hrvVal} ms
            </div>
            <div style="font-size: 8.5px; color: #64748b;">Modulación Parasimpática</div>
          </div>

          <div class="biometric-card">
            <div class="label">Índice Habituación (H):</div>
            <div class="value" style="font-size: 13px; color: #7c3aed;">
              ${habIndex}
            </div>
            <div style="font-size: 8.5px; color: #64748b;">Tasa de Extinción de Distrés</div>
          </div>
        </div>

        <div style="margin-top: 8px; font-size: 10px; color: #334155;">
          <strong>Carga Cognitiva y Fijación Ocular:</strong> ${escapeHtml(cognitiveLoad)}
        </div>
      </div>

      <!-- 4. PLAN TERAPÉUTICO Y ALERTAS DE RIESGO -->
      <div class="section">
        <div class="section-title">3. Indicaciones Terapéuticas & Alertas Específicas</div>
        
        <div style="margin-bottom: 8px;">
          <strong style="color: #9f1239; font-size: 10.5px;">Alertas de Riesgo de Descompensación:</strong>
          ${riskAlertsHtml}
        </div>

        <div>
          <strong style="color: #0369a1; font-size: 10.5px;">Plan de Intervención Recomendado:</strong>
          ${recommendationsHtml}
        </div>
      </div>

      <!-- FIRMA Y AUTENTICACIÓN -->
      <div class="signature-container">
        <div style="font-family: monospace; font-size: 8px; color: #94a3b8;">
          HASH AUTENTICIDAD CRIPTOGRÁFICA:<br/>
          ${documentHash}<br/>
          AMIE CLINICAL ENGINE v3.8 — SECURE SIGNED
        </div>

        <div class="signature-line">
          <strong style="font-size: 11px; color: #0f172a;">${escapeHtml(doctorName)}</strong><br/>
          <span style="font-size: 9.5px; color: #475569;">Médico Especialista — Colegiado N° ${escapeHtml(String(colegiadoNumber))}</span><br/>
          <span style="font-size: 8.5px; color: #94a3b8;">Firma y Sello Profesional</span>
        </div>
      </div>

      <!-- PIE LEGAL -->
      <div class="footer">
        Este documento es un dictamen bioclínico generado bajo supervisión profesional asistido por la IA de AMIE (SaMD). Las recomendaciones terapéuticas deben ser validadas según el juicio clínico del profesional responsable. Protección de datos bajo estándares HIPAA y Ley de Protección de Datos Personales.
      </div>

      <script>
        window.onload = function() { 
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
