import { Chains, Tokens, SubscriptionPayCycle } from "../constants/enums";
import { ThemeMode } from "@reown/appkit/react";
import { AppKitNetwork } from "@reown/appkit/networks";

export interface Metadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface SubscriptionDetails {
  toAddress: string;
  cost: number;
  chain: Chains;
  token: Tokens;
  payCycle: SubscriptionPayCycle;
}

export interface SubscriptionContextType {
  subscriptionDetails: SubscriptionDetails;
}

export interface SubscriptionProviderProps {
  children: React.ReactNode;
  metadata: Metadata;
  themeMode: ThemeMode;
  projectId: string;
  networks: [AppKitNetwork, ...AppKitNetwork[]];
}
