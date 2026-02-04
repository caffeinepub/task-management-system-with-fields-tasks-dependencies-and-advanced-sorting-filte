import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useResilientActor } from '../hooks/useResilientActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();
  const { isReady, isLoading: actorLoading } = useResilientActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const canSubmit = name.trim() && isAuthenticated && isReady && !actorLoading && !saveProfile.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      saveProfile.mutate({ name: name.trim() });
    }
  };

  // Determine what message to show
  let statusMessage: React.ReactElement | null = null;
  if (!isAuthenticated) {
    statusMessage = (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in with Internet Identity to save your profile.
        </AlertDescription>
      </Alert>
    );
  } else if (!isReady || actorLoading) {
    statusMessage = (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Connection is still initializing. Please wait a moment...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome!</DialogTitle>
          <DialogDescription>Please enter your name to get started.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {statusMessage}
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              required
              disabled={!isAuthenticated || !isReady || actorLoading}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!canSubmit}
          >
            {saveProfile.isPending ? (
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
