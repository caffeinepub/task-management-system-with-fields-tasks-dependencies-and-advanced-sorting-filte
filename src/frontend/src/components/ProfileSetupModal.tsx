import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useResilientActor } from '../hooks/useResilientActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();
  const { isReady, isLoading: actorLoading } = useResilientActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isActorInitializing = actorLoading || !isReady;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    saveProfile({ name: name.trim() });
  };

  // Determine status message
  let statusMessage: React.ReactElement | null = null;
  if (!isAuthenticated) {
    statusMessage = (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in with Internet Identity to continue.
        </AlertDescription>
      </Alert>
    );
  } else if (isActorInitializing) {
    statusMessage = (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Connecting to the backend...
        </AlertDescription>
      </Alert>
    );
  }

  const canSubmit = isAuthenticated && !isActorInitializing && !isPending && name.trim().length > 0;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome! Let's set up your profile</DialogTitle>
          <DialogDescription>
            Please enter your name to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {statusMessage}
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending || !isAuthenticated || isActorInitializing}
              autoFocus
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!canSubmit}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
