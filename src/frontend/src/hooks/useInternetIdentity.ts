// Stub: ICP Internet Identity removed. Using simple admin auth instead.
import React, { createContext, useContext } from "react";

interface InternetIdentityContext {
  identity: null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const IIContext = createContext<InternetIdentityContext>({
  identity: null,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export function InternetIdentityProvider({
  children,
}: { children: React.ReactNode }) {
  return React.createElement(IIContext.Provider, {
    value: {
      identity: null,
      isAuthenticated: false,
      login: async () => {},
      logout: async () => {},
    },
    children,
  });
}

export const useInternetIdentity = () => useContext(IIContext);
