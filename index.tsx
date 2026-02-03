import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AlertCircle } from 'lucide-react';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#020617', 
          color: 'white', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '2rem'
        }}>
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            padding: '2rem', 
            borderRadius: '1rem',
            maxWidth: '600px'
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
              <AlertCircle size={24} /> System Critical Error
            </h1>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              The application crashed before it could render. This is usually due to a configuration issue or a missing environment variable.
            </p>
            <div style={{ 
              backgroundColor: '#0f172a', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              fontFamily: 'monospace', 
              fontSize: '0.875rem', 
              color: '#e2e8f0', 
              overflowX: 'auto'
            }}>
              {this.state.error?.message || "Unknown Error"}
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reload Nexus
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);