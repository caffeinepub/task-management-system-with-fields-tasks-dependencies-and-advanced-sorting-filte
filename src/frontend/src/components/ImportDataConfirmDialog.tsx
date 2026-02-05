import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ImportDataConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  fieldCount: number;
  taskCount: number;
}

export default function ImportDataConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  fieldCount,
  taskCount,
}: ImportDataConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Confirm Data Import</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              This will <strong>overwrite all your existing Fields and Tasks</strong> with the imported data.
            </p>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium text-foreground">Import contains:</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• {fieldCount} field{fieldCount !== 1 ? 's' : ''}</li>
                <li>• {taskCount} task{taskCount !== 1 ? 's' : ''}</li>
              </ul>
            </div>
            <p className="text-destructive">
              <strong>Warning:</strong> This action cannot be undone. All your current data will be permanently replaced.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Importing...' : 'Confirm Import'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
