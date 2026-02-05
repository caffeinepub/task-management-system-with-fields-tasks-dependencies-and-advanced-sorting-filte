import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, LogOut, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { getBootDiagnostics } from '../utils/bootErrorMessages';
import { useState } from 'react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface RecoverableBootErrorProps {
  error: unknown;
  onRetry: () => void;
  onLogout: () => void;
  isRetrying?: boolean;
}

export default function RecoverableBootError({ 
  error, 
  onRetry,
  onLogout,
  isRetrying = false 
}: RecoverableBootErrorProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const diagnostics = getBootDiagnostics(error);

  const handleCopyDetails = async () => {
    const detailsText = `Boot Error Details
Stage: ${diagnostics.stage}
Message: ${diagnostics.userMessage}
Raw Error: ${diagnostics.rawError}`;

    try {
      await navigator.clipboard.writeText(detailsText);
      toast.success('Error details copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="container flex items-center justify-center py-20">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Application Error Occurred</h2>
          <p className="text-muted-foreground">
            {diagnostics.userMessage}
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={onRetry} 
            disabled={isRetrying}
            className="w-full"
            size="lg"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </>
            )}
          </Button>

          <Button 
            onClick={onLogout}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
          
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full text-xs"
                size="sm"
              >
                {isDetailsOpen ? (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-3 w-3" />
                    Show Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="rounded-lg border bg-muted/50 p-4 text-left space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Stage</p>
                  <p className="text-sm font-mono">{diagnostics.stage}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Raw Error</p>
                  <p className="text-xs font-mono break-all text-muted-foreground">
                    {diagnostics.rawError}
                  </p>
                </div>
                <Button
                  onClick={handleCopyDetails}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <Copy className="mr-2 h-3 w-3" />
                  Copy error details
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <p className="text-xs text-muted-foreground pt-2">
            If the problem persists, please try logging out and back in.
          </p>
        </div>
      </div>
    </div>
  );
}
