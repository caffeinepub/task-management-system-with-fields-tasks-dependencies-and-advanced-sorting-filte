import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Copy } from 'lucide-react';
import { getBootDiagnostics, createClipboardPayload } from '../utils/bootErrorMessages';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  onLogout?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

/**
 * Top-level error boundary that catches render-time exceptions during boot and shows a safe fallback
 * with Retry and Logout actions, stage-tagged diagnostics, and copyable error details instead of a blank screen.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('[AppErrorBoundary] Caught render error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Error details:', error, errorInfo);
    
    // Log structured diagnostics
    const diagnostics = getBootDiagnostics(error, 'react-render-error');
    console.error('[AppErrorBoundary] Diagnostics:', diagnostics);
  }

  handleRetry = () => {
    console.log('[AppErrorBoundary] Retry clicked');
    this.setState({ hasError: false, error: null, showDetails: false });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleLogout = () => {
    console.log('[AppErrorBoundary] Logout clicked');
    if (this.props.onLogout) {
      this.props.onLogout();
    }
  };

  handleCopy = async () => {
    if (!this.state.error) return;
    
    try {
      const diagnostics = getBootDiagnostics(this.state.error, 'react-render-error');
      const payload = createClipboardPayload(diagnostics);
      await navigator.clipboard.writeText(payload);
      toast.success('Error details copied to clipboard');
    } catch (err) {
      console.error('[AppErrorBoundary] Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const diagnostics = this.state.error ? getBootDiagnostics(this.state.error, 'react-render-error') : null;

      return (
        <div className="flex min-h-screen flex-col">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-4">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Something Went Wrong</h2>
                <p className="text-muted-foreground">
                  The application encountered an unexpected error. Please try refreshing or logging out.
                </p>
              </div>

              {diagnostics && (
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    <span>Stage: {diagnostics.stage}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  onClick={this.handleCopy}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Error Details
                </Button>

                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  size="lg"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>

                {this.props.onLogout && (
                  <Button 
                    onClick={this.handleLogout}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Log out
                  </Button>
                )}

                {this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Technical details
                    </summary>
                    <div className="mt-2 bg-muted rounded-lg p-3 space-y-2">
                      {diagnostics && (
                        <>
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground">Stage</div>
                            <div className="text-xs font-mono">{diagnostics.stage}</div>
                          </div>
                          {diagnostics.buildMarker && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground">Build</div>
                              <div className="text-xs font-mono">{diagnostics.buildMarker}</div>
                            </div>
                          )}
                        </>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">Error Message</div>
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-40 overflow-auto">
                          {this.state.error.message}
                        </pre>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground">Stack Trace</div>
                          <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-40 overflow-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
