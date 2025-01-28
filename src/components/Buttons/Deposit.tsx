import React, { FormEvent, useEffect } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Abi, Address } from "viem";

interface DepositProps {
  needsDeposit: boolean;
  depositAmount: bigint;
  abi: Abi;
  tokenContractAddress: Address;
  papayaAddress: Address;
  hasSufficientBalance: boolean;
  onSuccess: () => void;
}

export const Deposit: React.FC<DepositProps> = ({
  needsDeposit,
  depositAmount,
  abi,
  tokenContractAddress,
  papayaAddress,
  hasSufficientBalance,
  onSuccess,
}) => {
  const {
    data: hash,
    isError,
    error,
    isPending,
    writeContract,
  } = useWriteContract();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!hasSufficientBalance) {
      console.error("Insufficient token balance.");
      return;
    }

    try {
      writeContract({
        abi,
        address: tokenContractAddress,
        functionName: "transfer",
        args: [papayaAddress, depositAmount],
      });
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  }

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      console.log("Tokens successfully deposited.");
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);

  useEffect(() => {
    if (isError) {
      console.error("Deposit error:", error?.message || "Unknown error");
    }
  }, [isError, error]);

  return (
    <form onSubmit={submit} style={{ width: "100%" }}>
      <button
        type="submit"
        disabled={!needsDeposit || !hasSufficientBalance || isPending}
        className={`deposit-button ${
          !needsDeposit || !hasSufficientBalance ? "disabled" : ""
        }`}
      >
        <p className="button-text">
          {hasSufficientBalance ? "Deposit" : "Insufficient Balance"}
        </p>
      </button>
    </form>
  );
};
