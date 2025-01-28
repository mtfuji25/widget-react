import { useReadContract } from "wagmi";
import { SubscriptionDetails } from "../types";
import { Address, parseUnits } from "viem";
import { networks } from "../constants/networks";
import { USDT } from "../contracts/evm/USDT";
import { USDC } from "../contracts/evm/USDC";
import { PYUSD } from "../contracts/evm/PYUSD";
import { useEffect, useState } from "react";
import { fetchNetworkFee, getAssets } from "../utils";
import {
  CaipNetwork,
  UseAppKitAccountReturn,
  UseAppKitNetworkReturn,
} from "@reown/appkit";
import { mainnet } from "viem/chains";

export const useTokenDetails = (
  network: UseAppKitNetworkReturn,
  subscriptionDetails: SubscriptionDetails
) => {
  const defaultNetwork = networks.find((n) => n.chainId === 1);
  if (!defaultNetwork) {
    throw new Error(
      "Default network (Ethereum) is missing in the configuration."
    );
  }

  const defaultToken = defaultNetwork.tokens.find(
    (t) => t.name.toLowerCase() === "usdc"
  );
  if (!defaultToken) {
    throw new Error("Default token (USDC) is missing in the configuration.");
  }

  const currentNetwork =
    networks.find((n) => n.chainId === network.chainId) ?? defaultNetwork;

  const tokenDetails =
    currentNetwork.tokens.find(
      (t) => t.name.toLowerCase() === subscriptionDetails.token.toLowerCase()
    ) ?? defaultToken;

  // Detect unsupported network or token
  const isUnsupportedNetwork = !currentNetwork; // No matching network found
  const isUnsupportedToken = !tokenDetails; // No matching token found

  return {
    currentNetwork,
    tokenDetails,
    isUnsupportedNetwork,
    isUnsupportedToken,
  };
};

export const useContractData = (
  contractAddress: Address,
  abi: any,
  functionName: string,
  args: any[],
  refetchInterval: number = 3000
) => {
  const { data } = useReadContract({
    address: contractAddress,
    abi,
    functionName,
    args,
    query: {
      enabled: !!contractAddress,
      refetchInterval,
      refetchIntervalInBackground: true,
    },
  });
  return data ? BigInt(data.toString()) : null;
};

export const getTokenABI = (tokenName: string) => {
  switch (tokenName.toUpperCase()) {
    case "USDT":
      return USDT;
    case "USDC":
      return USDC;
    case "PYUSD":
      return PYUSD;
    default:
      return USDC;
  }
};

export const useNetworkFee = (chainId: number, gas: number = 0) => {
  const [networkFee, setNetworkFee] = useState<{
    fee: string;
    usdValue: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFee = async () => {
      setIsLoading(true);
      const fee = await fetchNetworkFee(
        chainId || 1, // Default to Ethereum Mainnet chainId
        "AXGpo1rd2MxpQvJCsUUaX54skWwcYctS"
      );
      setNetworkFee(fee);
      setIsLoading(false);
    };

    fetchFee();
  }, [chainId]); // Refetch when chainId changes

  return { networkFee, isLoading };
};

export const useAssets = (
  network: UseAppKitNetworkReturn,
  subscriptionDetails: SubscriptionDetails
) => {
  const [chainIcon, setChainIcon] = useState<string>("");
  const [tokenIcon, setTokenIcon] = useState<string>("");

  const nativeTokenIdMap: Record<number, string> = {
    137: "polygon",
    56: "bnb",
    43114: "avalanche",
    8453: "base",
    42161: "arbitrum",
    1: "ethereum",
  };

  const chainName = nativeTokenIdMap[network.chainId as number] || "ethereum";

  useEffect(() => {
    const chain = getAssets(chainName, "chain");
    const token = getAssets(subscriptionDetails.token.toLowerCase(), "token");
    setChainIcon(chain || getAssets("ethereum", "chain")); // Default to Ethereum chain icon
    setTokenIcon(token || getAssets("usdc", "token")); // Default to USDC token icon
  }, [chainName, subscriptionDetails.token]);

  return { chainIcon, tokenIcon };
};

export const useSubscriptionInfo = (
  network: UseAppKitNetworkReturn,
  account: UseAppKitAccountReturn,
  subscriptionDetails: SubscriptionDetails
) => {
  const { tokenDetails } = useTokenDetails(network, subscriptionDetails);

  // Ensure ABI and addresses are available even for unsupported states
  const abi = getTokenABI(tokenDetails?.name || "USDC"); // Default to USDC ABI
  const papayaAddress = tokenDetails?.papayaAddress || "0x0";
  const tokenAddress = tokenDetails?.ercAddress || "0x0";

  const papayaBalance = useContractData(
    papayaAddress as Address,
    papayaAddress,
    "balanceOf",
    [account.address as Address]
  );

  const allowance = useContractData(tokenAddress as Address, abi, "allowance", [
    account.address as Address,
    papayaAddress as Address,
  ]);

  const tokenBalance = useContractData(
    tokenAddress as Address,
    abi,
    "balanceOf",
    [account.address as Address]
  );

  const needsDeposit =
    papayaBalance == null ||
    papayaBalance < parseUnits(subscriptionDetails.cost, 6);

  const depositAmount =
    papayaBalance != null
      ? parseUnits(subscriptionDetails.cost, 6) - papayaBalance
      : parseUnits(subscriptionDetails.cost, 6);

  const needsApproval = allowance == null || allowance < depositAmount;

  const hasSufficientBalance =
    tokenBalance != null && tokenBalance >= depositAmount;

  const canSubscribe =
    !needsDeposit &&
    papayaBalance != null &&
    papayaBalance >= parseUnits(subscriptionDetails.cost, 6);

  return {
    papayaBalance,
    allowance,
    tokenBalance,
    needsDeposit,
    depositAmount,
    needsApproval,
    hasSufficientBalance,
    canSubscribe,
  };
};

export const useSubscriptionModal = (
  network: UseAppKitNetworkReturn | null,
  account: UseAppKitAccountReturn,
  subscriptionDetails: SubscriptionDetails
) => {
  const defaultCaipNetwork: CaipNetwork = {
    id: 1,
    chainNamespace: "eip155",
    caipNetworkId: "eip155:1",
    name: "Ethereum",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: mainnet.rpcUrls,
  };

  const defaultNetwork: UseAppKitNetworkReturn = {
    caipNetwork: defaultCaipNetwork,
    chainId: 1,
    caipNetworkId: "eip155:1",
    switchNetwork: () => {},
  };

  const activeNetwork = network ?? defaultNetwork;

  const { chainIcon, tokenIcon } = useAssets(
    activeNetwork,
    subscriptionDetails
  );
  const { networkFee, isLoading: isFeeLoading } = useNetworkFee(
    activeNetwork.chainId as number
  );

  const { tokenDetails, isUnsupportedNetwork, isUnsupportedToken } =
    useTokenDetails(activeNetwork, subscriptionDetails);

  const fallbackValues = {
    papayaBalance: null,
    allowance: null,
    tokenBalance: null,
    needsDeposit: false,
    depositAmount: BigInt(0),
    needsApproval: false,
    hasSufficientBalance: false,
    canSubscribe: false,
  };

  const subscriptionInfo = useSubscriptionInfo(
    activeNetwork,
    account,
    subscriptionDetails
  );

  if (isUnsupportedNetwork || isUnsupportedToken) {
    return {
      chainIcon: chainIcon || "",
      tokenIcon: tokenIcon || "",
      networkFee,
      isFeeLoading,
      ...fallbackValues,
      isUnsupportedNetwork,
      isUnsupportedToken,
      tokenDetails,
    };
  }

  return {
    chainIcon,
    tokenIcon,
    networkFee,
    isFeeLoading,
    ...subscriptionInfo,
    isUnsupportedNetwork,
    isUnsupportedToken,
    tokenDetails,
  };
};
