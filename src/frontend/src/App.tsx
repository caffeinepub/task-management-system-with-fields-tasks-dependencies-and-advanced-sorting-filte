import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPrompt from './components/LoginPrompt';
import ProfileSetupModal from './components/ProfileSetupModal';
import Dashboard from './pages/Dashboard';
import RecoverableBootError from './components/RecoverableBootError';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { useBootWatchdog } from './hooks/useBootWatchdog';
import { markReactRenderStarted } from './bootstrap/bootFallback';

// Mark React render as started synchronously during module evaluation
markReactRenderStarted();

function AppContent() {
  const { identity, clear, isInitializing: authInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    error: profileError,
  } = useGetCallerUserProfile();

  // Boot watchdog for timeout detection
  const { isStuck, stuckReason, resetWatchdog } = useBootWatchdog({
    isAuthenticated,
    actorInitializing: authInitializing,
    profileLoading,
    profileFetched,
  });

  // Log boot flow decisions with stage information
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[App Boot] Stage: authenticated, actor initializing:', authInitializing);
    }
    if (isAuthenticated && !authInitializing) {
      console.log('[App Boot] Stage: actor ready, profile loading:', profileLoading, 'fetched:', profileFetched);
    }
    if (isAuthenticated && !authInitializing && profileFetched) {
      console.log('[App Boot] Stage: profile fetched, profile exists:', !!userProfile);
    }
  }, [isAuthenticated, authInitializing, profileLoading, profileFetched, userProfile]);

  // Update global boot diagnostics stage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__BOOT_DIAGNOSTICS__) {
      if (!isAuthenticated) {
        window.__BOOT_DIAGNOSTICS__.stage = 'unauthenticated';
      } else if (authInitializing) {
        window.__BOOT_DIAGNOSTICS__.stage = 'actor-initializing';
      } else if (profileLoading) {
        window.__BOOT_DIAGNOSTICS__.stage = 'profile-loading';
      } else if (profileFetched && userProfile === null) {
        window.__BOOT_DIAGNOSTICS__.stage = 'profile-setup-required';
      } else if (profileFetched && userProfile) {
        window.__BOOT_DIAGNOSTICS__.stage = 'dashboard-ready';
      }
    }
  }, [isAuthenticated, authInitializing, profileLoading, profileFetched, userProfile]);

  const handleLogout = async () => {
    console.log('[App] Logout initiated, clearing all cached data');
    await clear();
    queryClient.clear();
    resetWatchdog();
  };

  const handleRetry = () => {
    console.log('[App] Retry initiated, resetting watchdog and refetching');
    resetWatchdog();
    queryClient.invalidateQueries();
  };

  // Show recoverable boot error if stuck
  if (isStuck) {
    console.error('[App Boot] Watchdog detected stuck state:', stuckReason);
    return (
      <RecoverableBootError
        error={new Error(stuckReason || 'Boot process timed out')}
        onRetry={handleRetry}
        onLogout={handleLogout}
      />
    );
  }

  // Show recoverable boot error if profile fetch failed
  if (isAuthenticated && !authInitializing && profileError) {
    console.error('[App Boot] Profile fetch error:', profileError);
    return (
      <RecoverableBootError
        error={profileError}
        onRetry={handleRetry}
        onLogout={handleLogout}
      />
    );
  }

  // Unauthenticated: show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <LoginPrompt />
        </main>
        <Footer />
      </div>
    );
  }

  // Authenticated but actor initializing: show loading
  if (authInitializing) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Initializing...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Authenticated, actor ready, profile loading: show loading
  if (profileLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Authenticated, actor ready, profile fetched but null: show profile setup
  const showProfileSetup = isAuthenticated && !authInitializing && profileFetched && userProfile === null;

  if (showProfileSetup) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <ProfileSetupModal />
        </main>
        <Footer />
      </div>
    );
  }

  // Authenticated, actor ready, profile exists: show dashboard
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const queryClient = useQueryClient();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppErrorBoundary
        onRetry={() => {
          console.log('[AppErrorBoundary] Retry triggered, reloading page');
          window.location.reload();
        }}
        onLogout={async () => {
          console.log('[AppErrorBoundary] Logout triggered, clearing auth and reloading');
          queryClient.clear();
          window.location.reload();
        }}
      >
        <AppContent />
        <Toaster />
      </AppErrorBoundary>
    </ThemeProvider>
  );
}
