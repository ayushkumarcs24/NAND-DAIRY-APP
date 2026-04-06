import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
  userRole: string | null;
}

type AuthAction =
  | { type: 'RESTORE_TOKEN'; token: string | null; role: string | null }
  | { type: 'SIGN_IN'; token: string; role: string }
  | { type: 'SIGN_OUT' };

const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  userRole: null,
};

const AuthContext = createContext<any>(null);

function authReducer(prevState: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...prevState,
        userToken: action.token,
        userRole: action.role,
        isLoading: false,
      };
    case 'SIGN_IN':
      return {
        ...prevState,
        isSignout: false,
        userToken: action.token,
        userRole: action.role,
      };
    case 'SIGN_OUT':
      return {
        ...prevState,
        isSignout: true,
        userToken: null,
        userRole: null,
      };
    default:
      return prevState;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      let userRole;
      try {
        userToken = await SecureStore.getItemAsync('userToken');
        userRole = await SecureStore.getItemAsync('userRole');
      } catch (e) {
        console.error('Restoring token failed', e);
      }
      dispatch({ type: 'RESTORE_TOKEN', token: userToken || null, role: userRole || null });
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    signIn: async (token: string, role: string) => {
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userRole', role);
      dispatch({ type: 'SIGN_IN', token, role });
    },
    signOut: async () => {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userRole');
      dispatch({ type: 'SIGN_OUT' });
    },
    ...state,
  };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
