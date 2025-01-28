import React, { FormEvent, useEffect } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import GreenTickIcon from "../../assets/others/green-tick.svg";
import { Abi, Address } from "viem";

interface ApproveProps {
  needsApproval: boolean;
  approvalAmount: bigint;
  abi: Abi;
  tokenContractAddress: Address;
  papayaAddress: Address;
  onSuccess: () => void;
}

export const Approve: React.FC<ApproveProps> = ({
  needsApproval,
  approvalAmount,
  abi,
  tokenContractAddress,
  papayaAddress,
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

    try {
      writeContract({
        abi,
        address: tokenContractAddress,
        functionName: "approve",
        args: [papayaAddress, approvalAmount],
      });
    } catch (err) {
      console.error("Approval failed:", err);
    }
  }

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      console.log("Tokens successfully approved.");
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);

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
        className={`approve-button ${!needsApproval ? "disabled" : ""}`}
      >
        <p className="button-text">Approve</p>
        {isConfirmed && (
          <img
            src={GreenTickIcon}
            alt="Approve Successful"
            className="image-green-tick"
          />
        )}
      </button>
    </form>
  );
};
