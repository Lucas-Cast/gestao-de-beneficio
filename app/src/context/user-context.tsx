import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { session } from "@/services/api/session";

import type { AuthUser } from "@/types/user";
import { notifications } from "@/services/notifications";

type UserContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: PropsWithChildren) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([session.getToken(), session.getUser()])
      .then(([token, storedUser]) => {
        if (mounted) {
          setUserState(token && storedUser ? storedUser : null);
        }
      })
      .catch(() => {
        if (mounted) {
          setUserState(null);
          notifications.error(
            "Não foi possível restaurar sua sessão. Entre novamente.",
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setUser = useCallback((nextUser: AuthUser | null) => {
    setUserState(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await session.clear();
    } catch (error) {
      notifications.error("Não foi possível sair da conta. Tente novamente.");
      throw error;
    }
    setUser(null);
    notifications.success("Você saiu da conta.");
  }, [setUser]);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      setUser,
      logout,
    }),
    [isLoading, logout, setUser, user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser deve ser usado dentro de UserProvider.");
  }

  return context;
}
