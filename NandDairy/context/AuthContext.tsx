import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
  userRole: string | null;
  userName: string | null;
}

type AuthAction =
  | { type: 'RESTORE_TOKEN'; token: string | null; role: string | null; name: string | null }
  | { type: 'SIGN_IN'; token: string; role: string; name: string }
  | { type: 'SIGN_OUT' };

const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  userRole: null,
  userName: null,
};

const AuthContext = createContext<any>(null);

function authReducer(prevState: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...prevState,
        userToken: action.token,
        userRole: action.role,
        userName: action.name,
        isLoading: false,
      };
    case 'SIGN_IN':
      return {
        ...prevState,
        isSignout: false,
        userToken: action.token,
        userRole: action.role,
        userName: action.name,
      };
    case 'SIGN_OUT':
      return {
        ...prevState,
        isSignout: true,
        userToken: null,
        userRole: null,
        userName: null,
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
      let userName;
      try {
        userToken = await SecureStore.getItemAsync('userToken');
        userRole = await SecureStore.getItemAsync('userRole');
        userName = await SecureStore.getItemAsync('userName');
      } catch (e) {
        console.error('Restoring token failed', e);
      }
      dispatch({ type: 'RESTORE_TOKEN', token: userToken || null, role: userRole || null, name: userName || null });
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    signIn: async (token: string, role: string, name: string) => {
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userRole', role);
      await SecureStore.setItemAsync('userName', name);
      dispatch({ type: 'SIGN_IN', token, role, name });
    },
    signOut: async () => {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userRole');
      await SecureStore.deleteItemAsync('userName');
      dispatch({ type: 'SIGN_OUT' });
    },
    user: state.userName ? { name: state.userName } : null,
    ...state,
  };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
