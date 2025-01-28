// === Imports ===

import { networks } from "../constants/networks";
import axios from "axios";
// Chain Icons
import EthereumIcon from "../assets/chains/ethereum.svg";
import BnbIcon from "../assets/chains/bnb.svg";
import PolygonIcon from "../assets/chains/polygon.svg";
import AvalancheIcon from "../assets/chains/avalanche.svg";
import ArbitrumIcon from "../assets/chains/arbitrum.svg";
import BaseIcon from "../assets/chains/base.svg";
// Not used for now
// import ScrollIcon from "../assets/chains/scroll.svg";
// import ZkSyncIcon from "../assets/chains/zksync.svg";
// import SeiIcon from "../assets/chains/sei.svg";
// import SolanaIcon from "../assets/chains/solana.svg";
// import TonIcon from "../assets/chains/ton.svg";
// Token Icons
import UsdtIcon from "../assets/tokens/usdt.svg";
import UsdcIcon from "../assets/tokens/usdc.svg";
import PyusdIcon from "../assets/tokens/pyusd.svg";

// === Chain Icons Map ===
const chainIcons: Record<string, string> = {
  polygon: PolygonIcon,
  bnb: BnbIcon,
  avalanche: AvalancheIcon,
  base: BaseIcon,
  arbitrum: ArbitrumIcon,
  ethereum: EthereumIcon,
};

// === Token Icons Map ===
const tokenIcons: Record<string, string> = {
  usdt: UsdtIcon,
  usdc: UsdcIcon,
  pyusd: PyusdIcon,
};

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

/**
 * Get the icon for a chain or token.
 * @param key - The chain or token name.
 * @param type - Type of asset: "chain" or "token".
 * @returns Icon path or empty string if not found.
 */
export const getAssets = (key: string, type: "chain" | "token"): string => {
  const lowerKey = key.toLowerCase();
  if (type === "chain") {
    return chainIcons[lowerKey] || "";
  } else if (type === "token") {
    return tokenIcons[lowerKey] || "";
  }
  console.error(`Invalid asset type: ${type}`);
  return "";
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
 * Fetch network fees using Blocknative API and resolve token price.
 * @param chainId - The chain ID of the network.
 * @param authToken - Authorization token for the API.
 * @returns Fee details or null if unavailable.
 */
export const fetchNetworkFee = async (
  chainId: number,
  authToken: string
): Promise<{ fee: string; usdValue: string } | null> => {
  try {
    const network = networks.find((n) => n.chainId === chainId);
    if (!network) throw new Error(`Unsupported chain ID: ${chainId}`);

    const nativeTokenIdMap: Record<number, string> = {
      137: "matic-network",
      56: "binancecoin",
      43114: "avalanche-2",
      8453: "ethereum",
      42161: "ethereum",
      1: "ethereum",
    };

    const tokenId = nativeTokenIdMap[chainId];
    if (!tokenId)
      throw new Error(`Token ID not found for chain ID: ${chainId}`);

    const url = `https://api.blocknative.com/gasprices/blockprices?chainid=${chainId}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const nativeTokenPrice = await fetchTokenPrice(tokenId);
    const blockPrices = response.data.blockPrices[0];
    const mediumConfidencePrice = blockPrices?.estimatedPrices.find(
      (price: { confidence: number }) => price.confidence === 90
    );

    if (!mediumConfidencePrice)
      throw new Error("No medium confidence gas price available");

    const maxFeePerGas = parseFloat(mediumConfidencePrice.maxFeePerGas);
    const gasFeeEther = maxFeePerGas / 1e9; // Convert Gwei to Ether
    const gasFeeUsd = (gasFeeEther * nativeTokenPrice).toFixed(2);

    return {
      fee: `${gasFeeEther.toFixed(12)} ${network.nativeToken}`, // Native token name
      usdValue: `(~$${gasFeeUsd})`,
    };
  } catch (error) {
    console.error("Error fetching network fee:", error);
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
