import React from 'react';

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Dashboard Error Captured:', error, errorInfo);
  }

  handleWindowError = (event) => {
    const error = event.error || new Error(event.message || 'Unknown execution error');
    this.setState({
      hasError: true,
      error
    });
  };

  handleUnhandledRejection = (event) => {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(reason ? String(reason) : 'Unhandled Promise Rejection');
    this.setState({
      hasError: true,
      error
    });
  };

  componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  copyToClipboard = () => {
    const { error, errorInfo } = this.state;
    const text = `Error: ${error?.message}\n\nStack:\n${error?.stack}\n\nComponent Stack:\n${errorInfo?.componentStack || 'Não disponível'}`;
    navigator.clipboard.writeText(text)
      .then(() => {
        this.setState({ copied: true });
        setTimeout(() => {
          this.setState({ copied: false });
        }, 3000);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080b12] text-slate-200 p-8 font-mono text-xs overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-red-500/30 pb-4">
              <h1 className="text-xl font-bold text-red-400">Dashboard Runtime Error</h1>
              <button
                onClick={this.copyToClipboard}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-sans text-sm transition font-medium"
              >
                {this.state.copied ? 'Copiado!' : 'Copiar erro'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-amber-400 font-bold mb-1">Mensagem:</h2>
                <div className="bg-black/40 p-4 rounded border border-white/5 whitespace-pre-wrap">
                  {this.state.error?.message || 'Nenhuma mensagem de erro disponível'}
                </div>
              </div>

              {this.state.error?.stack && (
                <div>
                  <h2 className="text-amber-400 font-bold mb-1">Stack:</h2>
                  <div className="bg-black/40 p-4 rounded border border-white/5 whitespace-pre-wrap text-[10px] leading-relaxed opacity-80">
                    {this.state.error.stack}
                  </div>
                </div>
              )}

              {this.state.errorInfo?.componentStack && (
                <div>
                  <h2 className="text-amber-400 font-bold mb-1">Component Stack:</h2>
                  <div className="bg-black/40 p-4 rounded border border-white/5 whitespace-pre-wrap text-[10px] leading-relaxed opacity-80">
                    {this.state.errorInfo.componentStack}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-white/5 text-slate-500 font-sans">
              <p>Este capturador é temporário e visa diagnosticar por que o Dashboard não está renderizando.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
