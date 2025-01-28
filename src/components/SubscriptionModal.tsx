import React, { useEffect, useState } from "react";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { Address, parseUnits } from "viem";
import Skeleton from "react-loading-skeleton";
import LogoIcon from "../assets/logo.svg";
import SuccessIcon from "../assets/others/success.svg";
import FailIcon from "../assets/others/fail.svg";
import { Approve } from "./Buttons/Approve";
import { Deposit } from "./Buttons/Deposit";
import { Subscribe } from "./Buttons/Subscribe";
import { SubscriptionDetails } from "../types";
import {
  getTokenABI,
  useSubscriptionModal,
} from "../hook/useSubscriptionModal";
import "react-loading-skeleton/dist/skeleton.css";
import "../styles/styles.css";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  subscriptionDetails: SubscriptionDetails;
}

export const SubscriptionModal: React.FC<ModalProps> = ({
  open,
  onClose,
  subscriptionDetails,
}) => {
  const [isSubscriptionSuccessful, setIsSubscriptionSuccessful] =
    useState(false);
  const [showError, setShowError] = useState(false);

  const account = useAppKitAccount();
  const network = useAppKitNetwork();

  const {
    chainIcon,
    tokenIcon,
    networkFee,
    isFeeLoading,
    needsDeposit,
    depositAmount,
    needsApproval,
    hasSufficientBalance,
    canSubscribe,
    isUnsupportedNetwork,
    isUnsupportedToken,
    tokenDetails,
  } = useSubscriptionModal(network, account, subscriptionDetails);

  useEffect(() => {
    if (isUnsupportedNetwork || isUnsupportedToken) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [isUnsupportedNetwork, isUnsupportedToken]);

  useEffect(() => {
    if (!open) {
      setIsSubscriptionSuccessful(false);
      setShowError(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-container">
            <div className="wallet-section">
              {React.createElement("appkit-button")}
            </div>
            <div className="close-button" onClick={onClose}>
              <svg
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.4032 11.9942L17.6976 7.7095C18.0892 7.31787 18.0892 6.68289 17.6976 6.29126C17.306 5.89962 16.671 5.89962 16.2794 6.29126L11.995 10.5859L7.71063 6.29126C7.31902 5.89962 6.68409 5.89962 6.29248 6.29126C5.90087 6.68289 5.90087 7.31787 6.29248 7.7095L10.5869 11.9942L6.29248 16.2789C6.10342 16.4664 5.99707 16.7217 5.99707 16.988C5.99707 17.2543 6.10342 17.5096 6.29248 17.6972C6.48 17.8862 6.73527 17.9926 7.00155 17.9926C7.26784 17.9926 7.52311 17.8862 7.71063 17.6972L11.995 13.4025L16.2794 17.6972C16.4669 17.8862 16.7222 17.9926 16.9885 17.9926C17.2548 17.9926 17.51 17.8862 17.6976 17.6972C17.8866 17.5096 17.993 17.2543 17.993 16.988C17.993 16.7217 17.8866 16.4664 17.6976 16.2789L13.4032 11.9942Z"
                  fill="#212B36"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="modal-body">
          {!showError && !isSubscriptionSuccessful && (
            <div className="modal-body-container body-main">
              <div className="summary-section">
                <p className="summary-title">Summary</p>
                <div className="summary-detail">
                  <p className="detail-label">Subscription Cost:</p>
                  <div className="detail-icons">
                    <img
                      src={chainIcon}
                      alt="Chain Icon"
                      className="chain-icon"
                    />
                    <img
                      src={tokenIcon}
                      alt="Token Icon"
                      className="token-icon"
                    />
                  </div>
                  <p className="detail-value">
                    {isFeeLoading ? (
                      <Skeleton width={80} />
                    ) : (
                      subscriptionDetails.cost
                    )}
                  </p>
                  <p className="detail-usd-value">
                    {isFeeLoading ? (
                      <Skeleton width={60} />
                    ) : (
                      `(~$${subscriptionDetails.cost})`
                    )}
                  </p>
                  <p className="detail-pay-cycle">
                    {subscriptionDetails.payCycle}
                  </p>
                </div>
                <div className="summary-detail">
                  <p className="detail-label">Network Fee:</p>
                  <p className="detail-value">
                    {isFeeLoading ? <Skeleton width={80} /> : networkFee?.fee}
                  </p>
                  <p className="detail-usd-value">
                    {isFeeLoading ? (
                      <Skeleton width={60} />
                    ) : (
                      networkFee?.usdValue
                    )}
                  </p>
                </div>
              </div>
              {needsDeposit ? (
                needsApproval ? (
                  <>
                    <Approve
                      needsApproval={needsApproval}
                      approvalAmount={parseUnits(subscriptionDetails.cost, 6)}
                      abi={getTokenABI(tokenDetails.name)}
                      tokenContractAddress={tokenDetails.ercAddress as Address}
                      papayaAddress={tokenDetails.papayaAddress as Address}
                      onSuccess={() => console.log("Approval successful!")}
                    />
                    <Subscribe
                      canSubscribe={canSubscribe}
                      abi={getTokenABI(tokenDetails.name)}
                      toAddress={subscriptionDetails.toAddress as Address}
                      subscriptionCost={parseUnits(subscriptionDetails.cost, 6)}
                      papayaAddress={tokenDetails.papayaAddress as Address}
                      onSuccess={() => setIsSubscriptionSuccessful(true)}
                    />
                  </>
                ) : (
                  <Deposit
                    needsDeposit={needsDeposit}
                    depositAmount={depositAmount}
                    abi={getTokenABI(tokenDetails.name)}
                    tokenContractAddress={tokenDetails.ercAddress as Address}
                    papayaAddress={tokenDetails.papayaAddress as Address}
                    hasSufficientBalance={hasSufficientBalance}
                    onSuccess={() => console.log("Deposit successful!")}
                  />
                )
              ) : (
                <>
                  <Approve
                    needsApproval={needsApproval}
                    approvalAmount={parseUnits(subscriptionDetails.cost, 6)}
                    abi={getTokenABI(tokenDetails.name)}
                    tokenContractAddress={tokenDetails.ercAddress as Address}
                    papayaAddress={tokenDetails.papayaAddress as Address}
                    onSuccess={() => console.log("Approval successful!")}
                  />
                  <Subscribe
                    canSubscribe={canSubscribe}
                    abi={getTokenABI(tokenDetails.name)}
                    toAddress={subscriptionDetails.toAddress as Address}
                    subscriptionCost={parseUnits(subscriptionDetails.cost, 6)}
                    papayaAddress={tokenDetails.papayaAddress as Address}
                    onSuccess={() => console.log("Subscription successful!")}
                  />
                </>
              )}
            </div>
          )}
          {showError && isSubscriptionSuccessful && (
            <div className="modal-body-container body-error">
              <div className="error-section">
                <img
                  src={FailIcon}
                  alt="Subscription Failed"
                  className="fail-icon"
                />
                <p className="error-title">
                  {isUnsupportedNetwork || isUnsupportedToken
                    ? "Unsupported Chain or Token"
                    : "Subscription Failed"}
                </p>
                {isUnsupportedNetwork ? (
                  <p className="error-text">
                    The selected network is not supported. Please switch to a
                    supported network.
                  </p>
                ) : null}
                {isUnsupportedToken ? (
                  <p className="error-text">
                    The selected token is not supported on this network. Please
                    select a different token.
                  </p>
                ) : null}
              </div>
            </div>
          )}
          {!showError && isSubscriptionSuccessful && (
            <div className="modal-body-container body-successful">
              <div className="successful-section">
                <img
                  src={SuccessIcon}
                  alt="Subscription Successful"
                  className="success-icon"
                />
                <p className="thank-you-title">
                  Thank you for your subscription!
                </p>
                <p className="thank-you-text">
                  Now you can manage your subscription from a convenient
                  dashboard!
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <p className="footer-text">Powered by</p>
          <a
            href="https://app.papaya.finance"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={LogoIcon} alt="Papaya Logo" className="footer-logo" />
          </a>
        </div>
      </div>
    </div>
  );
};
