import React from 'react';
import { recordDiagnosticError } from '@dashboard/painel-admin/diagnostic/Admin_diagnosticService';

export default class GlobalDiagnosticBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    recordDiagnosticError(error, {
      action: 'Erro de Renderização React (Global Boundary)',
      componentStack: errorInfo?.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-[120px] w-full items-center justify-center p-4 text-center text-xs text-slate-400">
          Ocorreu uma instabilidade neste elemento. A falha foi registrada no diagnóstico administrativo.
        </div>
      );
    }
    return this.props.children;
  }
}
