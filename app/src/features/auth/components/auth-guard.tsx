import { useEffect, type PropsWithChildren } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { useUser } from '@/context/user-context';

export function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useUser();
  const isAuthGroup = segments[0] === '(auth)';
  const shouldRedirect =
    !isLoading &&
    ((isAuthenticated && isAuthGroup) || (!isAuthenticated && !isAuthGroup));

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated && isAuthGroup) {
      router.replace('/');
      return;
    }

    if (!isAuthenticated && !isAuthGroup) {
      router.replace('/login');
    }
  }, [isAuthGroup, isAuthenticated, isLoading, router]);

  if (isLoading || shouldRedirect) {
    return (
      <ThemedView className="flex-1 items-center justify-center gap-3">
        <ThemedText type="subtitle">Carregando...</ThemedText>
        <ThemedText themeColor="textSecondary">Preparando seu acesso.</ThemedText>
      </ThemedView>
    );
  }

  return <>{children}</>;
}
