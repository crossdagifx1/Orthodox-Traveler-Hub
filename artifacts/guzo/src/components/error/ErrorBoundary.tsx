import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorId: generateErrorId() };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to error tracking service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Could also send to Sentry, LogRocket, etc.
    this.reportError(error, errorInfo, this.state.errorId);
  }

  private reportError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    // Placeholder for error reporting service
    // Example: Sentry.captureException(error, { extra: { errorInfo, errorId } });
    
    if (import.meta.env.DEV) {
      console.group('🐛 Error Report');
      console.log('Error ID:', errorId);
      console.log('Error:', error);
      console.log('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
    this.props.onReset?.();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">
              We've encountered an unexpected error. Our team has been notified.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 text-left">
                <div className="bg-muted rounded-xl p-4 overflow-auto max-h-48">
                  <p className="text-xs font-mono text-destructive mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: <code className="font-mono">{this.state.errorId}</code>
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="rounded-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="rounded-full"
              >
                Reload Page
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="ghost"
                className="rounded-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
            
            {!import.meta.env.DEV && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  If this problem persists, please contact support with error ID:{' '}
                  <code className="font-mono">{this.state.errorId}</code>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${random}`.toUpperCase();
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  
  if (error) {
    throw error;
  }
  
  return setError;
}
