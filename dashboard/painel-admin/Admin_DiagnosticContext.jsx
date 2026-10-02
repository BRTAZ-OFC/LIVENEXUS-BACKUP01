import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  subscribeDiagnostic,
  startDiagnosticCapture,
  stopDiagnosticCapture,
  clearDiagnosticEvents,
  recordDiagnosticEvent,
  recordDiagnosticError,
  generateTechnicalReport,
} from '@dashboard/painel-admin/diagnostic/Admin_diagnosticService';

const DiagnosticContext = createContext(null);

export function DiagnosticProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [isCapturing, setIsCapturing] = useState(true);

  useEffect(() => {
    const unsub = subscribeDiagnostic((evts, capturing) => {
      setEvents(evts);
      setIsCapturing(capturing);
    });
    return unsub;
  }, []);

  const addEvent = useCallback((eventData) => {
    return recordDiagnosticEvent(eventData);
  }, []);

  const addError = useCallback((error, context = {}) => {
    return recordDiagnosticError(error, context);
  }, []);

  const copyReport = useCallback(async (eventItem) => {
    const report = generateTechnicalReport(eventItem, events);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
        return { success: true, report };
      }
    } catch {
      // Fallback
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = report;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return { success: true, report };
    } catch (e) {
      console.error('[Diagnostic] Falha ao copiar relatório:', e);
      return { success: false, report };
    }
  }, [events]);

  const value = {
    events,
    isCapturing,
    startCapture: startDiagnosticCapture,
    stopCapture: stopDiagnosticCapture,
    clearEvents: clearDiagnosticEvents,
    addEvent,
    addError,
    copyReport,
  };

  return (
    <DiagnosticContext.Provider value={value}>
      {children}
    </DiagnosticContext.Provider>
  );
}

export function useDiagnostic() {
  const context = useContext(DiagnosticContext);
  if (!context) {
    throw new Error('useDiagnostic must be used within a DiagnosticProvider');
  }
  return context;
}
