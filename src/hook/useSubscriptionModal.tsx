import { useReadContract } from "wagmi";
import { SubscriptionDetails } from "../types";
import { Address, parseUnits } from "viem";
import { networks } from "../constants/networks";
import { USDT } from "../contracts/evm/USDT";
import { USDC } from "../contracts/evm/USDC";
import { PYUSD } from "../contracts/evm/PYUSD";
import { useEffect, useState } from "react";
import { fetchNetworkFee, getAssets } from "../utils";
import { UseAppKitAccountReturn, UseAppKitNetworkReturn } from "@reown/appkit";

export const useTokenDetails = (
  network: UseAppKitNetworkReturn,
  subscriptionDetails: SubscriptionDetails
) => {
  const currentNetwork = networks.find((n) => n.chainId === network.chainId);
  if (!currentNetwork) throw new Error("Unsupported network");

  const tokenDetails = currentNetwork.tokens.find(
    (t) => t.name.toLowerCase() === subscriptionDetails.token.toLowerCase()
  );
  if (!tokenDetails) throw new Error("Unsupported token");

  return { currentNetwork, tokenDetails };
};

export const useContractData = (
  contractAddress: Address,
  abi: any,
  functionName: string,
  args: any[]
) => {
  const { data } = useReadContract({
    address: contractAddress,
    abi,
    functionName,
    args,
    query: {
      enabled: !!contractAddress,
      refetchInterval: 3000,
      refetchIntervalInBackground: false,
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
      throw new Error(`Unsupported token: ${tokenName}`);
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
        chainId,
        "AXGpo1rd2MxpQvJCsUUaX54skWwcYctS"
      );
      setNetworkFee(fee);
      setIsLoading(false);
    };

    fetchFee();
  }, []);

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

  const chainName = nativeTokenIdMap[network.chainId as number];
  if (!chainName) throw new Error(`Chain not found for chain ID: ${chainName}`);

  useEffect(() => {
    const chain = getAssets(chainName, "chain");
    const token = getAssets(subscriptionDetails.token.toLowerCase(), "token");
    setChainIcon(chain);
    setTokenIcon(token);
  }, [subscriptionDetails]);

  return { chainIcon, tokenIcon };
};

export const useSubscriptionInfo = (
  network: any,
  account: any,
  subscriptionDetails: SubscriptionDetails
) => {
  const { tokenDetails } = useTokenDetails(network, subscriptionDetails);
  const abi = getTokenABI(tokenDetails.name);

  const papayaBalance = useContractData(
    tokenDetails.papayaAddress as Address,
    abi,
    "balanceOf",
    [account.address as Address]
  );

  const allowance = useContractData(
    tokenDetails.ercAddress as Address,
    abi,
    "allowance",
    [account.address as Address, tokenDetails.papayaAddress as Address]
  );

  const needsDeposit =
    papayaBalance == null ||
    papayaBalance < parseUnits(subscriptionDetails.cost, 6);
  const depositAmount =
    papayaBalance != null
      ? parseUnits(subscriptionDetails.cost, 6) - papayaBalance
      : parseUnits(subscriptionDetails.cost, 6);

  const needsApproval = allowance == null || allowance < depositAmount;

  return {
    papayaBalance,
    allowance,
    needsDeposit,
    depositAmount,
    needsApproval,
  };
};

export const useSubscriptionModal = (
  network: UseAppKitNetworkReturn,
  account: UseAppKitAccountReturn,
  subscriptionDetails: SubscriptionDetails
) => {
  const { chainIcon, tokenIcon } = useAssets(network, subscriptionDetails);
  const { networkFee, isLoading: isFeeLoading } = useNetworkFee(
    network.chainId as number
  );
  const {
    papayaBalance,
    allowance,
    needsDeposit,
    depositAmount,
    needsApproval,
  } = useSubscriptionInfo(network, account, subscriptionDetails);
  const { tokenDetails } = useTokenDetails(network, subscriptionDetails);
  const abi = getTokenABI(tokenDetails.name);
  const tokenBalance = useContractData(
    tokenDetails.ercAddress as Address,
    abi,
    "balanceOf",
    [account.address as Address]
  );

  const hasSufficientBalance =
    tokenBalance != null && tokenBalance >= depositAmount;

  const canSubscribe =
    !needsDeposit &&
    papayaBalance != null &&
    papayaBalance >= parseUnits(subscriptionDetails.cost, 6);

  useEffect(() => {
    if (!account.address || !network.caipNetwork) {
    }
  }, [account.address, network.caipNetwork]);

  return {
    chainIcon,
    tokenIcon,
    networkFee,
    isFeeLoading,
    papayaBalance,
    allowance,
    needsDeposit,
    depositAmount,
    needsApproval,
    hasSufficientBalance,
    canSubscribe,
    tokenBalance,
  };
};
