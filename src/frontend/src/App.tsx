import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useResilientActor } from './hooks/useResilientActor';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import ProfileSetupModal from './components/ProfileSetupModal';
import LoginPrompt from './components/LoginPrompt';
import RecoverableBootError from './components/RecoverableBootError';
import { useState } from 'react';
import { isUserNotRegisteredError } from './utils/bootErrorMessages';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const { actor, isLoading: actorLoading, error: actorError, refetch: refetchActor } = useResilientActor();
  const { data: userProfile, isLoading: profileLoading, isFetched, error: profileError } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);

  const isAuthenticated = !!identity;
  const isInitializing = loginStatus === 'initializing';

  // Determine boot errors:
  // - Actor errors are always boot failures
  // - Profile errors are boot failures ONLY if authenticated AND fetched AND error is NOT "User is not registered"
  const hasActorBootError = !!actorError;
  const hasProfileBootError = isAuthenticated && 
                               isFetched && 
                               !!profileError && 
                               !isUserNotRegisteredError(profileError);
  const bootError = hasActorBootError ? actorError : (hasProfileBootError ? profileError : null);

  console.log('[App Boot] State:', {
    isAuthenticated,
    isInitializing,
    actorLoading,
    actorError: actorError?.message,
    profileLoading,
    isFetched,
    profileError: profileError?.message,
    isUserNotRegisteredError: profileError ? isUserNotRegisteredError(profileError) : false,
    hasActorBootError,
    hasProfileBootError,
    bootError: bootError?.message,
  });

  // Handle retry action - fully reset boot state
  const handleRetry = async () => {
    console.log('[App Boot] Retry initiated');
    setIsRetrying(true);
    try {
      // Step 1: Invalidate boot-critical queries
      await queryClient.invalidateQueries({ queryKey: ['resilient-actor'] });
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      
      // Step 2: Force refetch actor (this will create a new actor instance)
      console.log('[App Boot] Refetching actor...');
      const actorResult = await refetchActor();
      
      if (actorResult.isError) {
        console.error('[App Boot] Actor refetch failed:', actorResult.error);
        return; // Stay on error screen
      }
      
      console.log('[App Boot] Actor refetch successful');
      
      // Step 3: If authenticated, force refetch profile
      if (isAuthenticated) {
        console.log('[App Boot] Refetching profile...');
        await queryClient.refetchQueries({ queryKey: ['currentUserProfile'] });
      }
      
      console.log('[App Boot] Retry complete');
    } catch (error) {
      console.error('[App Boot] Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Show profile setup modal when:
  // - Authenticated
  // - Profile is fetched
  // - No profile exists (null)
  // - No boot error present
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null && !bootError;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {bootError ? (
            <RecoverableBootError 
              error={bootError} 
              onRetry={handleRetry}
              isRetrying={isRetrying}
            />
          ) : isInitializing || actorLoading ? (
            <div className="container flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Initializing...</p>
              </div>
            </div>
          ) : !isAuthenticated ? (
            <LoginPrompt />
          ) : showProfileSetup ? (
            <ProfileSetupModal />
          ) : (
            <Dashboard />
          )}
        </main>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
