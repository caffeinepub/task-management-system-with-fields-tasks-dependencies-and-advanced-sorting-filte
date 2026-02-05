import { useState } from 'react';
import { useCreateField } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useResilientActor } from '../hooks/useResilientActor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { FIELD_CARD_BACKGROUNDS, DEFAULT_BACKGROUND_ID, type BackgroundColorId, getBackgroundCssVar } from '../utils/fieldCardBackgrounds';

interface CreateFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateFieldDialog({ open, onOpenChange }: CreateFieldDialogProps) {
  const [name, setName] = useState('');
  const [selectedBackground, setSelectedBackground] = useState<BackgroundColorId>(DEFAULT_BACKGROUND_ID);
  const createField = useCreateField();
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { isReady, isLoading: actorLoading } = useResilientActor();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isActorInitializing = isAuthenticated && (actorLoading || !isReady);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Block submission if not authenticated or actor not ready
    if (!isAuthenticated || isActorInitializing) {
      return;
    }
    
    if (name.trim()) {
      createField.mutate({ name: name.trim(), backgroundColor: selectedBackground }, {
        onSuccess: () => {
          setName('');
          setSelectedBackground(DEFAULT_BACKGROUND_ID);
          onOpenChange(false);
        },
      });
    }
  };

  const handleLogin = () => {
    login();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Field</DialogTitle>
          <DialogDescription>
            Fields help you organize related tasks together.
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>You must log in to create Fields.</span>
              <Button
                size="sm"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="ml-2"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isLoggingIn ? 'Logging in...' : 'Log In'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated && isActorInitializing && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Connecting to the backend... Please wait a moment before creating a Field.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">Field Name</Label>
              <Input
                id="field-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work Projects, Personal Goals"
                autoFocus
                disabled={!isAuthenticated || isActorInitializing || createField.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {FIELD_CARD_BACKGROUNDS.map((bg) => {
                  const isSelected = selectedBackground === bg.id;
                  const bgColor = getBackgroundCssVar(bg.id);
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setSelectedBackground(bg.id)}
                      disabled={!isAuthenticated || isActorInitializing || createField.isPending}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-lg border-2
                        transition-all hover:border-primary/50
                        ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      title={bg.label}
                    >
                      <div 
                        className="w-full h-12 rounded-md border border-border"
                        style={{ backgroundColor: bgColor }}
                      />
                      <span className="text-xs text-center">{bg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isAuthenticated || isActorInitializing || !name.trim() || createField.isPending}
            >
              {createField.isPending ? 'Creating...' : 'Create Field'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
