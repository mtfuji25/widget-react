import React, { FormEvent, useEffect, useState } from "react";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { UseAppKitAccountReturn, UseAppKitNetworkReturn } from "@reown/appkit";
import GreenTickIcon from "../../assets/others/green-tick.svg";
import { networks } from "../../constants/networks";
import { USDT } from "../../contracts/evm/USDT";
import { USDC } from "../../contracts/evm/USDC";
import { PYUSD } from "../../contracts/evm/PYUSD";
import { Address } from "viem";
import { getPapayaAddress } from "../../utils";

interface ApproveProps {
  token: string;
  account: UseAppKitAccountReturn;
  network: UseAppKitNetworkReturn;
  approvalAmount: bigint;
}

export const Approve: React.FC<ApproveProps> = ({
  token,
  account,
  network,
  approvalAmount,
}) => {
  const [allowance, setAllowance] = useState<bigint | null>(null);

  const {
    data: hash,
    isError,
    error,
    isPending,
    writeContract,
  } = useWriteContract();

  const getTokenABI = (tokenName: string) => {
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

  const getNetworkDetails = () => {
    const connectedChain = networks.find(
      (n: { chainId: any }) => n.chainId === network?.chainId
    );

    if (!connectedChain) {
      throw new Error(`Unsupported chain ID: ${network?.chainId}`);
    }

    const tokenDetails = connectedChain.tokens.find(
      (t: { name: string }) => t.name.toUpperCase() === token.toUpperCase()
    );

    if (!tokenDetails) {
      throw new Error(`Unsupported token: ${token}`);
    }

    return { tokenDetails, connectedChain };
  };

  // Fetch Allowance
  const { data: allowanceData } = useReadContract({
    address: getNetworkDetails().tokenDetails.ercAddress as Address,
    abi: getTokenABI(token),
    functionName: "allowance",
    args: [
      account.address as Address,
      getNetworkDetails().tokenDetails.papayaAddress as Address,
    ],
    query: {
      enabled: true,
      refetchInterval: 500,
      refetchIntervalInBackground: true,
    },
  });

  useEffect(() => {
    if (allowanceData) {
      setAllowance(BigInt(allowanceData.toString()));
    }
  }, [allowanceData]);

  // Fetch Papaya Deposit Balance
  const { data: papayaBalanceData } = useReadContract({
    address: getPapayaAddress(network?.chainId as number),
    abi: PAPAYA_ABI,
    functionName: "balanceOf",
    args: [account?.address as Address],
    query: {
      enabled: true,
      refetchInterval: 500,
      refetchIntervalInBackground: true,
    },
  });

  useEffect(() => {
    if (papayaBalanceData) {
      setPapayaUsdtBalance(papayaBalanceData);
    }
  }, [papayaBalanceData]);

  // Check if approval is needed
  const needsApproval = allowance == null || allowance < approvalAmount;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!account || isPending) {
      return;
    }

    try {
      const { tokenDetails } = getNetworkDetails();
      const abi = getTokenABI(tokenDetails.name);

      writeContract({
        abi,
        address: tokenDetails.ercAddress as Address,
        functionName: "approve",
        args: [tokenDetails.papayaAddress as Address, approvalAmount],
      });
    } catch (err) {
      console.error("Error during approval:", err);
    }
  }

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      console.log("Successfully approved tokens.");
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (isError) {
      console.error("Approval error:", error?.message || "Unknown error");
    }
  }, [isError, error]);

  return (
    <form onSubmit={submit} style={{ width: "100%" }}>
      <button
        type="submit"
        disabled={!needsApproval || isPending}
        className={`approve-button ${
          !needsApproval || isPending ? "disabled" : ""
        }`}
      >
        <p className="button-text">Approve</p>
        <img
          src={GreenTickIcon}
          alt="Approve Successful"
          className={`image-green-tick ${isConfirmed ? "success" : "hidden"}`}
        />
      </button>
    </form>
  );
};
