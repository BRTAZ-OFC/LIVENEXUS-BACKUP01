import React from 'react';
import { recordDiagnosticError } from '@dashboard/painel-admin/diagnostic/Admin_diagnosticService';

export default class GlobalDiagnosticBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    recordDiagnosticError(error, {
      action: 'Erro de Renderização React (Global Boundary)',
      componentStack: errorInfo?.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage =
        this.state.error?.message ||
        String(this.state.error || 'Erro desconhecido');

      const componentStack =
        this.state.errorInfo?.componentStack ||
        'Component Stack não disponível';

      return (
        <div
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            boxSizing: 'border-box',
            background: '#450a0a',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '14px',
            overflow: 'auto'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            ERRO REAL DO BROWSER SOURCE
          </div>

          <div style={{ marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
            {errorMessage}
          </div>

          <div
            style={{
              fontSize: '11px',
              opacity: 0.8,
              whiteSpace: 'pre-wrap'
            }}
          >
            {componentStack}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}