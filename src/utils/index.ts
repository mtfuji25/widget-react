// === Imports ===
// General imports
import React from "react";
import axios from "axios";

// Enums and constants
import { Chains, ChainsNativeToken } from "../constants/enums";

// === Formatting Utilities ===

/**
 * Format token amounts to a fixed decimal place.
 */
export const formatTokenAmount = (amount: number, decimals = 2): string => {
  return amount.toFixed(decimals);
};

/**
 * Format a price in USD.
 */
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

/**
 * Format a network fee with a native token.
 */
export const formatNetworkFee = (fee: number, nativeToken: string): string => {
  return `${fee.toFixed(6)} ${nativeToken}`;
};

// === Asset Management ===

// Chain Icons
import EthereumIcon from "../assets/chains/ethereum.svg";
import BnbIcon from "../assets/chains/bnb.svg";
import PolygonIcon from "../assets/chains/polygon.svg";
import AvalancheIcon from "../assets/chains/avalanche.svg";
import ArbitrumIcon from "../assets/chains/arbitrum.svg";
import BaseIcon from "../assets/chains/base.svg";
import ScrollIcon from "../assets/chains/scroll.svg";
import ZkSyncIcon from "../assets/chains/zksync.svg";
import SeiIcon from "../assets/chains/sei.svg";
import SolanaIcon from "../assets/chains/solana.svg";
import TonIcon from "../assets/chains/ton.svg";

// Token Icons
import UsdtIcon from "../assets/tokens/usdt.svg";
import UsdcIcon from "../assets/tokens/usdc.svg";
import PyusdIcon from "../assets/tokens/pyusd.svg";
import { networks } from "../constants/networks";

/**
 * Preload assets into maps for chains and tokens.
 */
const chains: Record<string, string> = {
  ethereum: EthereumIcon,
  bnb: BnbIcon,
  polygon: PolygonIcon,
  avalanche: AvalancheIcon,
  arbitrum: ArbitrumIcon,
  base: BaseIcon,
  scroll: ScrollIcon,
  zksync: ZkSyncIcon,
  sei: SeiIcon,
  sol: SolanaIcon,
  ton: TonIcon,
};

const tokens: Record<string, string> = {
  usdt: UsdtIcon,
  usdc: UsdcIcon,
  pyusd: PyusdIcon,
};

/**
 * Get asset path for chain or token icons.
 */
export const getAssets = (key: string, type: "chain" | "token"): string => {
  try {
    if (type === "chain") {
      return chains[key.toLowerCase()] || "";
    } else if (type === "token") {
      return tokens[key.toLowerCase()] || "";
    }
    throw new Error("Invalid asset type. Must be 'chain' or 'token'.");
  } catch (error) {
    console.error(`Error fetching asset for key: ${key}, type: ${type}`, error);
    return "";
  }
};

// === Chain Utilities ===

/**
 * Map chain names to their chain IDs.
 */
export const resolveChainId = (chain: Chains): number | null => {
  const chainIdMap: Record<Chains, number> = {
    [Chains.ETHEREUM]: 1,
    [Chains.BNBCHAIN]: 56,
    [Chains.POLYGON]: 137,
    [Chains.AVALANCHE]: 43114,
    [Chains.ARBITRUM]: 42161,
    [Chains.BASE]: 8453,
    [Chains.SCROLL]: 534352,
    [Chains.ZKSYNC]: 324,
    [Chains.SEI]: 1329,
    [Chains.SOLANA]: 101,
    [Chains.TON]: 1234,
  };

  return chainIdMap[chain] ?? null;
};

// === API Utilities ===

/**
 * Fetch the price of a native token from CoinGecko.
 */
export const fetchTokenPrice = async (tokenId: string): Promise<number> => {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`;
    const response = await axios.get(url);

    if (response.data[tokenId] && response.data[tokenId].usd) {
      return response.data[tokenId].usd;
    } else {
      throw new Error(`Failed to fetch price for token: ${tokenId}`);
    }
  } catch (error) {
    console.error(`Error fetching token price for ${tokenId}:`, error);
    return 0; // Return 0 as fallback
  }
};

/**
 * Fetch network fees using Blocknative API.
 */
export const fetchNetworkFee = async (
  chainId: number,
  chain: Chains,
  authToken: string
): Promise<{ fee: string; usdValue: string } | null> => {
  try {
    const url = `https://api.blocknative.com/gasprices/blockprices?chainid=${chainId}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = response.data;

    // Resolve native token and its price
    const nativeToken = ChainsNativeToken[chain];
    const tokenIdMap: Record<Chains, string> = {
      [Chains.ETHEREUM]: "ethereum",
      [Chains.BNBCHAIN]: "binancecoin",
      [Chains.POLYGON]: "matic-network",
      [Chains.AVALANCHE]: "avalanche-2",
      [Chains.ARBITRUM]: "ethereum",
      [Chains.BASE]: "ethereum",
      [Chains.SCROLL]: "ethereum",
      [Chains.ZKSYNC]: "ethereum",
      [Chains.SEI]: "sei-network",
      [Chains.SOLANA]: "solana",
      [Chains.TON]: "toncoin",
    };

    const tokenId = tokenIdMap[chain];
    const nativeTokenPrice = await fetchTokenPrice(tokenId);

    // Extract gas fee components
    const blockPrices = data.blockPrices[0];
    const mediumConfidencePrice = blockPrices?.estimatedPrices.find(
      (price: { confidence: number }) => price.confidence === 90
    );

    if (!mediumConfidencePrice) {
      throw new Error(
        "No gas price data available for medium confidence level."
      );
    }

    const maxFeePerGas = parseFloat(mediumConfidencePrice.maxFeePerGas);
    const gasFeeEther = maxFeePerGas / 1e9; // Convert from Gwei to Ether
    const gasFeeUsd = (gasFeeEther * nativeTokenPrice).toFixed(2);

    return {
      fee: `${gasFeeEther.toFixed(6)} ${nativeToken}`,
      usdValue: `(~$${gasFeeUsd})`,
    };
  } catch (error) {
    console.error(`Error fetching network fee for chain ${chain}:`, error);
    return null;
  }
};

/**
 * Returns the Papaya contract address for a specific chain.
 * @param chainId - The chain ID of the connected blockchain network.
 * @returns Papaya contract address as a string or null if not found.
 */
export const getPapayaAddress = (chainId: number): string | null => {
  // Find the network object corresponding to the provided chain ID
  const network = networks.find((n) => n.chainId === chainId);

  if (!network) {
    console.error(`Unsupported chain ID: ${chainId}`);
    return null;
  }

  // Find the first Papaya contract address from the tokens in the network
  const papayaAddress = network.tokens?.[0]?.papayaAddress;

  if (!papayaAddress) {
    console.error(`No Papaya contract address found for chain ID: ${chainId}`);
    return null;
  }

  return papayaAddress;
};
