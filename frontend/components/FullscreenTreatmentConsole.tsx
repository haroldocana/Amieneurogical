// ============================================================================
// ADAPTADOR DE COMPATIBILIDAD • REDIRECCIÓN AL ORQUESTADOR MAESTRO
// frontend/components/FullscreenTreatmentConsole.tsx
// ============================================================================

import React from 'react';
import { FullscreenDiagnosticRunner } from './FullscreenDiagnosticRunner';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export const FullscreenTreatmentConsole: React.FC<Props> = (props) => {
  return <FullscreenDiagnosticRunner {...props} initialMode="TREATMENT" />;
};

export default FullscreenTreatmentConsole;
