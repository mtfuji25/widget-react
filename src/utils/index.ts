export const formatTokenAmount = (amount: number, decimals = 2): string => {
  return amount.toFixed(decimals);
};

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

export const formatNetworkFee = (fee: number): string => {
  return `${fee.toFixed(6)} MATIC`;
};

// Import all chain icons
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

// Import all token icons
import UsdtIcon from "../assets/tokens/usdt.svg";
import UsdcIcon from "../assets/tokens/usdc.svg";
import PyusdIcon from "../assets/tokens/pyusd.svg";

// Preload all assets into maps
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

// Updated getAssets function
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

export const apiApprove = async (walletAddress: string, details: any) => {
  console.log(`Sending approval request for wallet: ${walletAddress}`);
  console.log("Approval details:", details);
  // Simulate API request
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

export const apiSubscribe = async (walletAddress: string, details: any) => {
  console.log(`Sending subscription request for wallet: ${walletAddress}`);
  console.log("Subscription details:", details);
  // Simulate API request
  return new Promise((resolve) => setTimeout(resolve, 1000));
};
