import { useEstimateGas, useReadContract } from "wagmi";
import { SubscriptionDetails } from "../types";
import { Abi, Address, createPublicClient, http, parseUnits } from "viem";
import { networks } from "../constants/networks";
import { USDT } from "../contracts/evm/USDT";
import { USDC } from "../contracts/evm/USDC";
import { PYUSD } from "../contracts/evm/PYUSD";
import { useEffect, useRef, useState } from "react";
import {
  calculateSubscriptionRate,
  fetchGasCost,
  fetchNetworkFee,
  getAssets,
} from "../utils";
import {
  CaipNetwork,
  UseAppKitAccountReturn,
  UseAppKitNetworkReturn,
} from "@reown/appkit";
import { mainnet } from "viem/chains";
import { Papaya } from "../contracts/evm/Papaya";
import { estimateContractGas } from "viem/actions";
import * as chains from "viem/chains";

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
  refetchInterval: number = 1000
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

export const useNetworkFee = (
  chainId: number,
  authToken: string,
  functionDetails: {
    abi: Abi;
    address: Address;
    functionName: string;
    args: any[];
  }
) => {
  const [networkFee, setNetworkFee] = useState<{
    fee: string;
    usdValue: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchFee = async () => {
      try {
        if (hasFetched.current) return;
        hasFetched.current = true;

        setIsLoading(true);

        function getChain(chainId: number) {
          const chain = Object.values(chains).find((c) => c.id === chainId);
          if (!chain) {
            console.warn(
              `Chain with id ${chainId} not found, defaulting to Ethereum`
            );
            return chains.mainnet;
          }
          return chain;
        }

        const chain = getChain(chainId);

        const publicClient = createPublicClient({
          chain,
          transport: http(),
        });

        const estimatedGas = await publicClient.estimateContractGas({
          address: functionDetails.address,
          abi: functionDetails.abi,
          functionName: functionDetails.functionName,
          args: functionDetails.args,
        });

        if (!estimatedGas) {
          console.warn("Failed to estimate gas");
          setNetworkFee({
            fee: "0.000000000000 ETH",
            usdValue: "($0.00)",
          });
          return;
        }

        const gasPriceData = await fetchNetworkFee(chainId, authToken);
        if (!gasPriceData) {
          console.warn("Failed to fetch gas price");
          setNetworkFee({
            fee: "0.000000000000 ETH",
            usdValue: "($0.00)",
          });
          return;
        }

        const gasCost = await fetchGasCost(chainId, estimatedGas, authToken);

        setNetworkFee(gasCost);
      } catch (error) {
        console.error("Error fetching network fee:", error);
        setNetworkFee({
          fee: "0.000000000000 ETH",
          usdValue: "($0.00)",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFee();
  }, [chainId, authToken, functionDetails]);

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
    Papaya,
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

  const functionName = subscriptionInfo.needsApproval
    ? "approve"
    : subscriptionInfo.needsDeposit
    ? "deposit"
    : "subscribe";

  const abi =
    functionName == "approve" ? getTokenABI(tokenDetails.name) : Papaya;
  const address =
    functionName == "approve"
      ? tokenDetails.ercAddress
      : tokenDetails.papayaAddress;
  const args = subscriptionInfo.needsApproval
    ? [
        tokenDetails.papayaAddress as Address,
        parseUnits(subscriptionDetails.cost, 6),
      ]
    : subscriptionInfo.needsDeposit
    ? [subscriptionInfo.depositAmount, false]
    : [
        subscriptionDetails.toAddress as Address,
        calculateSubscriptionRate(
          parseUnits(subscriptionDetails.cost, 18),
          subscriptionDetails.payCycle
        ),
        0,
      ];

  const { networkFee, isLoading: isFeeLoading } = useNetworkFee(
    activeNetwork.chainId as number,
    "AXGpo1rd2MxpQvJCsUUaX54skWwcYctS",
    {
      abi,
      address: address as Address,
      functionName,
      args,
    }
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
