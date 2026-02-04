import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { normalizeBootError } from '../utils/bootErrorMessages';

interface RecoverableBootErrorProps {
  error: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function RecoverableBootError({ 
  error, 
  onRetry, 
  isRetrying = false 
}: RecoverableBootErrorProps) {
  const errorMessage = normalizeBootError(error);

  return (
    <div className="container flex items-center justify-center py-20">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Application Error Occurred</h2>
          <p className="text-muted-foreground">
            {errorMessage}
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
          
          <p className="text-xs text-muted-foreground">
            If the problem persists, please try logging out and back in.
          </p>
        </div>
      </div>
    </div>
  );
}
