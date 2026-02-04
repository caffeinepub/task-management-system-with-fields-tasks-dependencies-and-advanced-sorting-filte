import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, CheckCircle2 } from 'lucide-react';

export default function LoginPrompt() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  const features = [
    'Organize tasks into custom fields',
    'Track urgency, value, interest, influence, and duration',
    'Set task dependencies',
    'Sort, filter, and search your tasks',
    'Automatic field metrics calculation',
  ];

  return (
    <div className="container flex items-center justify-center py-20">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Welcome to Task Manager</CardTitle>
          <CardDescription className="text-base">
            A powerful system to organize and prioritize your work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full"
          >
            {isLoggingIn ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Login with Internet Identity
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
