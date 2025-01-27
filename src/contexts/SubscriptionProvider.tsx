import React, { createContext, useContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { SubscriptionProviderProps, SubscriptionContextType } from "../types";
import { Chains, Tokens, SubscriptionPayCycle } from "../constants/enums";

export const SubscriptionContext =
  createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
  metadata,
  themeMode = "light",
  projectId,
  networks,
}) => {
  if (!projectId) {
    throw new Error("Project ID is required for SubscriptionProvider.");
  }

  const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks,
  });

  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    defaultNetwork: networks[0],
    metadata,
    features: {
      analytics: true,
    },
    themeMode,
    themeVariables: {
      "--w3m-font-family": "Public Sans",
      "--w3m-accent": "#212b35",
      "--w3m-font-size-master": "8.75px",
      "--w3m-border-radius-master": "2.285714286px",
    },
  });

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SubscriptionContext.Provider
        value={{
          subscriptionDetails: {
            toAddress: "0x9CAF1B9144A5eC3aE180539F4dcf404B2D91974b",
            cost: 9.99,
            chain: Chains.POLYGON,
            token: Tokens.USDT,
            payCycle: SubscriptionPayCycle.Monthly,
          },
        }}
      >
        {children}
      </SubscriptionContext.Provider>
    </QueryClientProvider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};
