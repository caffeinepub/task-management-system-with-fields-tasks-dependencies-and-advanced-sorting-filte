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
import { useState, useCallback } from 'react';
import { isUserNotRegisteredError } from './utils/bootErrorMessages';
import { markReactRenderStarted } from './bootstrap/bootFallback';

// Mark React render as started immediately during module evaluation
// This prevents the boot fallback from showing once React begins rendering
markReactRenderStarted();

export default function App() {
  const { identity, loginStatus, isInitializing, clear } = useInternetIdentity();
  const { actor, isLoading: actorLoading, error: actorError, refetch: refetchActor } = useResilientActor();
  const { data: userProfile, isLoading: profileLoading, isFetched, error: profileError } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // Determine boot errors:
  // - For logged-out users: NO boot errors (they should see LoginPrompt)
  // - For authenticated users:
  //   * Actor errors are boot failures
  //   * Profile errors are boot failures ONLY if error is NOT "User is not registered"
  const hasActorBootError = isAuthenticated && !!actorError;
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

  // Handle logout from boot error screen
  const handleLogout = useCallback(async () => {
    console.log('[App Boot] Logout initiated from error screen');
    try {
      // Clear Internet Identity session
      await clear();
      
      // Clear all React Query caches to prevent stale errors
      queryClient.clear();
      
      console.log('[App Boot] Logout complete, caches cleared');
    } catch (error) {
      console.error('[App Boot] Logout failed:', error);
    }
  }, [clear, queryClient]);

  // Handle retry action - fully reset boot state and force fresh actor + profile fetch
  const handleRetry = useCallback(async () => {
    console.log('[App Boot] Retry initiated');
    setIsRetrying(true);
    try {
      // Get principal key for scoped invalidation
      const principalKey = identity && !identity.getPrincipal().isAnonymous() 
        ? identity.getPrincipal().toString() 
        : '';

      // Step 1: Cancel any in-flight queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['resilient-actor'] });
      if (principalKey) {
        await queryClient.cancelQueries({ queryKey: ['currentUserProfile', principalKey] });
      }

      // Step 2: Remove boot-critical queries to force clean refetch
      // This ensures we don't reuse a poisoned actor instance
      queryClient.removeQueries({ queryKey: ['resilient-actor'] });
      if (principalKey) {
        queryClient.removeQueries({ queryKey: ['currentUserProfile', principalKey] });
      }
      
      // Small delay to ensure cache removal is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 3: Force refetch actor (this will create a new actor instance)
      console.log('[App Boot] Refetching actor...');
      const actorResult = await refetchActor();
      
      if (actorResult.isError) {
        console.error('[App Boot] Actor refetch failed:', actorResult.error);
        // Stay on error screen - isRetrying will be reset in finally block
        return;
      }
      
      console.log('[App Boot] Actor refetch successful');
      
      // Step 4: If authenticated, force refetch profile
      if (isAuthenticated && principalKey) {
        console.log('[App Boot] Refetching profile...');
        await queryClient.refetchQueries({ 
          queryKey: ['currentUserProfile', principalKey],
          exact: true,
        });
      }
      
      console.log('[App Boot] Retry complete');
    } catch (error) {
      console.error('[App Boot] Retry failed:', error);
      // Stay on error screen - isRetrying will be reset in finally block
    } finally {
      setIsRetrying(false);
    }
  }, [identity, queryClient, refetchActor, isAuthenticated]);

  // Show profile setup modal when:
  // - Authenticated
  // - Profile query has settled (isFetched)
  // - No profile exists (null)
  // - No boot error present
  const showProfileSetup = isAuthenticated && isFetched && userProfile === null && !bootError;

  // Show dashboard when:
  // - Authenticated
  // - Profile query has settled (isFetched) 
  // - Profile exists OR we're showing the profile setup modal
  // This prevents the "You don't have a draft yet" message from flashing
  const showDashboard = isAuthenticated && isFetched && (userProfile !== null || showProfileSetup) && !bootError;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {bootError ? (
            <RecoverableBootError 
              error={bootError} 
              onRetry={handleRetry}
              onLogout={handleLogout}
              isRetrying={isRetrying}
            />
          ) : isInitializing || (isAuthenticated && (actorLoading || !isFetched)) ? (
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
          ) : showDashboard ? (
            <Dashboard />
          ) : (
            <div className="container flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          )}
        </main>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
