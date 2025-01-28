import React, { FormEvent, useEffect } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Abi, Address } from "viem";

interface SubscribeProps {
  canSubscribe: boolean;
  abi: Abi;
  toAddress: Address;
  subscriptionCost: bigint;
  papayaAddress: Address;
  onSuccess: () => void;
}

export const Subscribe: React.FC<SubscribeProps> = ({
  canSubscribe,
  abi,
  toAddress,
  subscriptionCost,
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
        address: papayaAddress,
        functionName: "subscribe",
        args: [toAddress, subscriptionCost, 0],
      });
    } catch (err) {
      console.error("Subscription failed:", err);
    }
  }

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      console.log("Subscription successfully created.");
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);

  useEffect(() => {
    if (isError) {
      console.error("Subscription error:", error?.message || "Unknown error");
    }
  }, [isError, error]);

  return (
    <form onSubmit={submit} style={{ width: "100%" }}>
      <button
        type="submit"
        disabled={!canSubscribe || isPending}
        className={`subscribe-button ${!canSubscribe ? "disabled" : ""}`}
      >
        <p className="button-text">Subscribe</p>
      </button>
    </form>
  );
};
