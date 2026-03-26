import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-8 text-center">
          <div className="p-6 bg-red-50 text-red-600 rounded-full mb-6">
            <AlertTriangle size={64} />
          </div>
          <h1 className="text-4xl font-serif italic text-neutral-900 mb-4">Something went wrong</h1>
          <p className="text-neutral-500 max-w-md mb-8 leading-relaxed">
            An unexpected error occurred. This might be due to a network issue or a temporary system glitch.
          </p>
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm w-full max-w-lg mb-8 text-left">
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">Error Details</p>
            <p className="text-sm font-mono text-red-600 break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200"
          >
            <RotateCcw size={20} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
