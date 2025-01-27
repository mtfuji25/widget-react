import axios from "axios";
import { ChainsNativeToken, Chains } from "../contexts/SubscriptionProvider";

// Method to fetch the price of the native token
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
    return 0; // Return 0 as a fallback in case of an error
  }
};

// Main method to fetch network fees
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

    // Fetch the native token for the given chain
    const nativeToken = ChainsNativeToken[chain];
    if (!nativeToken) {
      throw new Error(`No native token defined for chain: ${chain}`);
    }

    // Fetch the price of the native token
    const tokenIdMap: { [key in Chains]: string } = {
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
    if (!tokenId) {
      throw new Error(`No token ID mapping defined for chain: ${chain}`);
    }

    const nativeTokenPrice = await fetchTokenPrice(tokenId);

    // Extract block prices data
    const blockPrices = data.blockPrices[0]; // Get the first block prediction

    if (!blockPrices) {
      throw new Error("No block price data available.");
    }

    // Extract gas fee components (medium confidence level by default)
    const baseFeePerGas = parseFloat(blockPrices.baseFeePerGas);
    const mediumConfidencePrice = blockPrices.estimatedPrices.find(
      (price: { confidence: number; }) => price.confidence === 90 // Default to 90% confidence level
    );

    if (!mediumConfidencePrice) {
      throw new Error(
        "No gas price data available for the selected confidence level."
      );
    }

    const maxPriorityFeePerGas = parseFloat(
      mediumConfidencePrice.maxPriorityFeePerGas
    );
    const maxFeePerGas = parseFloat(mediumConfidencePrice.maxFeePerGas);

    // Convert from Gwei to Ether
    const gasFeeEther = maxFeePerGas / 1e9; // Max fee per gas in Ether

    // Calculate USD value of the gas fee
    const gasFeeUsd = (gasFeeEther * nativeTokenPrice).toFixed(2); // Multiply by the token price

    return {
      fee: `${gasFeeEther.toFixed(8)} ${nativeToken}`,
      usdValue: `(~$${gasFeeUsd})`,
    };
  } catch (error) {
    console.error(`Error fetching network fee for chain ${chain}:`, error);
    return null;
  }
};
