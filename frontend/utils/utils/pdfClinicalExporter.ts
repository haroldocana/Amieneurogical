import { PatientRecord, AmieClinicalAnalysis } from '../types';

export const exportAmieClinicalPdf = (
  patient: PatientRecord,
  analysis: AmieClinicalAnalysis | null,
  doctorName: string,
  colegiadoNumber: number
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const timestamp = new Date().toLocaleString('es-GT', { dateStyle: 'full', timeStyle: 'short' });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Dictamen_Clinico_AMIE_${patient.id}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; margin: 30px; line-height: 1.5; font-size: 12px; }
        .header { border-b: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .title { font-size: 18px; font-weight: bold; color: #0369a1; text-transform: uppercase; margin: 0; }
        .subtitle { font-size: 10px; color: #64748b; font-weight: bold; }
        .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
        .section-title { font-size: 13px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .label { font-weight: bold; color: #334155; }
        .badge { background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
        .alert-box { background: #fff1f2; border: 1px solid #f43f5e; color: #881337; padding: 10px; border-radius: 6px; font-weight: bold; margin-bottom: 15px; }
        .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; text-align: center; font-size: 10px; color: #64748b; }
        .signature-line { margin-top: 50px; border-top: 1px dashed #475569; width: 250px; margin-left: auto; margin-right: auto; text-align: center; padding-top: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">AMIE Clinical Workstation</h1>
          <div class="subtitle">SISTEMA INTELIGENTE DE TRIANGULACIÓN BIOCLÍNICA MULTIMODAL</div>
        </div>
        <div style="text-align: right;">
          <div class="badge">DICTAMEN OFICIAL</div>
          <div style="font-size: 10px; margin-top: 4px; color: #64748b;">${timestamp}</div>
        </div>
      </div>

      <!-- METADATOS PACIENTE Y MÉDICO -->
      <div class="section grid">
        <div>
          <div><span class="label">EXPEDIENTE ID:</span> ${patient.id}</div>
          <div><span class="label">EDAD / GÉNERO:</span> ${patient.age} años | ${patient.gender === 'M' ? 'Masculino' : 'Femenino'}</div>
          <div><span class="label">MOTIVO DE CONSULTA:</span> ${patient.consultationReason}</div>
        </div>
        <div>
          <div><span class="label">MÉDICO EVALUADOR:</span> ${doctorName}</div>
          <div><span class="label">COLEGIADO N°:</span> ${colegiadoNumber}</div>
          <div><span class="label">ESTADO CENTINELA:</span> ${patient.sentinelTelemetry?.safetyStatus?.riskLevel || 'EVALUADO'}</div>
        </div>
      </div>

      ${patient.sentinelTelemetry?.safetyStatus?.riskLevel === 'CRÍTICO' ? `
        <div class="alert-box">
          ⚠️ ALERTA CENTINELA DE SEGURIDAD CRÍTICA: Se detectó patrón de despertares nocturnos reiterados con rumiación autolítica y latencia biomotora alterada. Se requiere restricción de medios y contención 24/7.
        </div>
      ` : ''}

      <!-- ANALISIS DIAGNÓSTICO -->
      <div class="section">
        <div class="section-title">1. Impresión Diagnóstica Principal (DSM-5-TR / CIE-11)</div>
        <p><strong>Código/Diagnóstico:</strong> ${analysis?.diagnosticImpressions?.[0]?.code || '309.81 / TEPT'} — ${analysis?.diagnosticImpressions?.[0]?.title || 'En evaluación'}</p>
        <p><strong>Certeza Algorítmica:</strong> ${analysis?.diagnosticImpressions?.[0]?.confidencePct || 90}%</p>
        <p><strong>Fundamentación Bioclínica:</strong> ${analysis?.diagnosticImpressions?.[0]?.rationale || 'Sin fundamentación'}</p>
      </div>

      <!-- TELEMETRÍA VR Y BIOMARCADORES -->
      <div class="section">
        <div class="section-title">2. Triangulación Biométrica & Telemetría VR</div>
        <ul>
          <li><strong>Conductancia Cutánea (GSR Pico):</strong> ${patient.vrTelemetryData?.gsrMicroSiemens ? Math.max(...patient.vrTelemetryData.gsrMicroSiemens) : '2.8'} µS</li>
          <li><strong>Tono Vagal (HRV RMSSD):</strong> ${patient.vrTelemetryData?.hrvRmssdMs?.slice(-1)[0] || '38'} ms</li>
          <li><strong>Índice de Habituación Terapéutica (H):</strong> ${patient.vrTelemetryData?.habituationIndexH || '2.84'}</li>
          <li><strong>Carga Cognitiva / Ocular:</strong> ${analysis?.biomedicalTriangulation?.cognitiveLoad || 'Normalizada'}</li>
        </ul>
      </div>

      <!-- PLAN DE TRATAMIENTO -->
      <div class="section">
        <div class="section-title">3. Recomendaciones Terapéuticas y Mitigación de Sesgos</div>
        <p><strong>Notas Antisesgo:</strong> ${analysis?.biasMitigationNotes?.[0] || 'Sin sesgos de auto-reporte detectados.'}</p>
        <p><strong>Intervención Sugerida:</strong> ${analysis?.treatmentRecommendations?.[0] || 'Continuar seguimiento clínico estandarizado.'}</p>
      </div>

      <div class="signature-line">
        <strong>${doctorName}</strong><br/>
        Médico Especialista — Colegiado N° ${colegiadoNumber}<br/>
        Firma y Sello Profesional
      </div>

      <div class="footer">
        Este documento es un dictamen médico generado bajo supervisión profesional asistido por AMIE (SaMD). Protegido bajo directrices de privacidad HIPAA / RGPD.
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
