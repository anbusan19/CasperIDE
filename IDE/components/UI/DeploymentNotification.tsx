import React, { useEffect } from 'react';

interface DeploymentNotificationProps {
  deployHash: string | Uint8Array;
  network: string;
  onClose: () => void;
}

export const DeploymentNotification: React.FC<DeploymentNotificationProps> = ({
  deployHash,
  network,
  onClose
}) => {
  // Auto-dismiss after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Convert deployHash to hex string if needed
  const deployHashHex = typeof deployHash === 'string'
    ? deployHash
    : Array.from(deployHash as any).map((b: number) => b.toString(16).padStart(2, '0')).join('');

  // Construct the explorer URL
  const explorerUrl = network === 'testnet'
    ? `https://testnet.cspr.live/deploy/${deployHashHex}`
    : `https://cspr.live/deploy/${deployHashHex}`;

  const handleClick = () => {
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <>
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .notification-enter {
          animation: slideInUp 0.3s ease-out;
        }
      `}</style>
      <div
        className="fixed bottom-4 right-4 z-50 bg-caspier-dark border border-caspier-border rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px] cursor-pointer transition-all duration-300 notification-enter"
        onClick={handleClick}
      >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <img 
            src="/csprlive.svg" 
            alt="CSPR.live" 
            className="w-24"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-caspier-text mb-1">
            Contract Deployed Successfully
          </div>
          <div className="text-xs text-caspier-muted truncate">
            View on CSPR.live
          </div>
          <div className="text-xs text-caspier-muted font-mono mt-1 truncate">
            {deployHashHex.substring(0, 16)}...
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex-shrink-0 text-caspier-muted hover:text-caspier-text transition-colors"
          aria-label="Close notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
    </>
  );
};
