import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, LogOut, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { getBootDiagnostics, createClipboardPayload } from '../utils/bootErrorMessages';
import { useState } from 'react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface RecoverableBootErrorProps {
  error: unknown;
  onRetry: () => void;
  onLogout: () => void;
  isRetrying?: boolean;
}

/**
 * Recoverable boot error component with expandable details section showing stage and raw error,
 * copy-to-clipboard functionality, and dedicated logout button for clearing auth and returning to login screen.
 */
export default function RecoverableBootError({ 
  error, 
  onRetry,
  onLogout,
  isRetrying = false 
}: RecoverableBootErrorProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const diagnostics = getBootDiagnostics(error);

  const handleCopy = async () => {
    try {
      const payload = createClipboardPayload(diagnostics);
      await navigator.clipboard.writeText(payload);
      toast.success('Error details copied to clipboard');
    } catch (err) {
      console.error('[RecoverableBootError] Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

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
            <h2 className="text-2xl font-bold">Unable to Start Application</h2>
            <p className="text-muted-foreground">
              {diagnostics.message}
            </p>
          </div>

          {/* Stage badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
              <span>Stage: {diagnostics.stage}</span>
            </div>
          </div>

          {/* Expandable details */}
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                {isDetailsOpen ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="bg-muted rounded-lg p-4 text-left space-y-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Stage</div>
                  <div className="text-sm font-mono">{diagnostics.stage}</div>
                </div>
                {diagnostics.buildMarker && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Build</div>
                    <div className="text-sm font-mono">{diagnostics.buildMarker}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Raw Error</div>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                    {diagnostics.rawError}
                  </pre>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleCopy}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Error Details
            </Button>

            <Button 
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full"
              size="lg"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>

            <Button 
              onClick={onLogout}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            If the problem persists, try logging out and back in, or contact support with the error details above.
          </p>
        </div>
      </div>
    </div>
  );
}
