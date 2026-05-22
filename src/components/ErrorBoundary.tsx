import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Database Error: ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops! Something went wrong</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {isFirestoreError 
                ? "We're having trouble connecting to our database. Please check your connection and try again."
                : "We encountered an unexpected error. Our team has been notified."}
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Error Details</p>
              <p className="text-xs font-mono text-slate-600 break-all">
                {errorMessage}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                <RefreshCw size={18} />
                Retry
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                <Home size={18} />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
