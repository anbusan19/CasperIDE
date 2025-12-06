import React, { useState, useEffect, useCallback } from 'react';
import { WalletConnection } from '../../types';
import { WalletService } from '../../services/casper/wallet';
import { Button } from '../UI/Button';
import { XIcon, CheckIcon } from '../UI/Icons';

interface WalletConnectionProps {
  wallet: WalletConnection;
  onConnect: (wallet: WalletConnection) => void;
  onDisconnect: () => void;
}

const WalletConnectionComponent: React.FC<WalletConnectionProps> = ({
  wallet,
  onConnect,
  onDisconnect
}) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualPublicKey, setManualPublicKey] = useState('');
  const [walletAvailable, setWalletAvailable] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!wallet.publicKey) return;
    try {
      const bal = await WalletService.getBalance(wallet.publicKey, 'testnet');
      setBalance(bal);
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      loadBalance();
    } else {
      setBalance(null);
    }
  }, [wallet.connected, wallet.publicKey, loadBalance]);

  // Check for wallet availability on mount and periodically
  useEffect(() => {
    const checkWallet = () => {
      const available = WalletService.isCasperWalletAvailable();
      setWalletAvailable(available);
      
      if (available) {
        const availableWallets = WalletService.getAvailableWallets();
        console.log('Available wallets:', availableWallets);
      }
    };

    // Check immediately
    checkWallet();

    // Check periodically in case extension loads after page
    const interval = setInterval(checkWallet, 2000);

    // Also listen for storage events (some extensions use this)
    window.addEventListener('storage', checkWallet);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkWallet);
    };
  }, []);

  const handleConnect = async (type: 'casper-wallet' | 'casper-signer' | 'ledger') => {
    setConnecting(true);
    setError(null);

    try {
      // Check if wallet is available before attempting connection
      if (type === 'casper-wallet' && !WalletService.isCasperWalletAvailable()) {
        const availableWallets = WalletService.getAvailableWallets();
        if (availableWallets.length === 0) {
          setError('Casper Wallet extension not detected. Please install it from the Chrome Web Store or use manual public key entry.');
          setConnecting(false);
          return;
        }
      }

      let connection: WalletConnection;

      switch (type) {
        case 'casper-wallet':
          connection = await WalletService.connectCasperWallet();
          break;
        case 'casper-signer':
          connection = await WalletService.connectCasperSigner();
          break;
        case 'ledger':
          connection = await WalletService.connectLedger();
          break;
        default:
          throw new Error('Unknown wallet type');
      }

      onConnect(connection);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setBalance(null);
    setError(null);
    setShowManualEntry(false);
    setManualPublicKey('');
  };

  const handleManualConnect = () => {
    try {
      const connection = WalletService.connectWithPublicKey(manualPublicKey.trim());
      onConnect(connection);
      setShowManualEntry(false);
      setManualPublicKey('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid public key');
    }
  };

  if (wallet.connected) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-green-900/20 border border-green-700 rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-green-400">Connected</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-caspier-muted hover:text-caspier-text"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs space-y-1">
            <div className="text-caspier-muted">Type: <span className="text-caspier-text">{wallet.type}</span></div>
            <div className="text-caspier-muted">Address:</div>
            <div className="text-caspier-text font-mono text-xs break-all">
              {wallet.publicKey?.substring(0, 20)}...{wallet.publicKey?.substring(wallet.publicKey.length - 10)}
            </div>
            {balance !== null && (
              <div className="text-caspier-muted mt-2">
                Balance: <span className="text-caspier-text font-bold">{(balance / 1000000000).toFixed(2)} CSPR</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {!walletAvailable && (
          <div className="p-2 bg-yellow-900/20 border border-yellow-700 rounded text-xs text-yellow-400">
            ⚠️ Casper Wallet extension not detected. Install it or use manual entry below.
          </div>
        )}
        
        <Button
          onClick={() => handleConnect('casper-wallet')}
          disabled={connecting}
          className="w-full"
          variant="primary"
        >
          {connecting ? 'Connecting...' : 'Connect Casper Wallet'}
        </Button>

        <Button
          onClick={() => handleConnect('casper-signer')}
          disabled={connecting}
          className="w-full"
          variant="secondary"
        >
          {connecting ? 'Connecting...' : 'Connect Casper Signer (Deprecated)'}
        </Button>

        <Button
          onClick={() => handleConnect('ledger')}
          disabled={connecting}
          className="w-full"
          variant="secondary"
        >
          {connecting ? 'Connecting...' : 'Connect Ledger'}
        </Button>

        {!showManualEntry ? (
          <Button
            onClick={() => setShowManualEntry(true)}
            disabled={connecting}
            className="w-full"
            variant="secondary"
          >
            Enter Public Key Manually
          </Button>
        ) : (
          <div className="space-y-2 p-3 bg-caspier-black border border-caspier-border rounded">
            <label className="text-xs text-caspier-muted block mb-1">Public Key (Hex)</label>
            <input
              type="text"
              value={manualPublicKey}
              onChange={(e) => setManualPublicKey(e.target.value)}
              placeholder="Enter your public key..."
              className="w-full bg-caspier-dark border border-caspier-border text-caspier-text px-2 py-1.5 text-sm focus:border-caspier-red outline-none font-mono"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleManualConnect}
                disabled={!manualPublicKey.trim()}
                className="flex-1"
                variant="primary"
                size="sm"
              >
                Connect
              </Button>
              <Button
                onClick={() => {
                  setShowManualEntry(false);
                  setManualPublicKey('');
                  setError(null);
                }}
                className="flex-1"
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-caspier-muted">
        <p>Connect a wallet to deploy and interact with contracts.</p>
        <p className="mt-1">Supported: Casper Wallet (recommended), Casper Signer (deprecated), or enter public key manually</p>
        <p className="mt-1 text-yellow-400">
          Note: Make sure Casper Wallet extension is installed and enabled. 
          <a 
            href="https://chrome.google.com/webstore/detail/casper-wallet/ghlpmldmjjhmdgmnhgimccmkbpcnjfji" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-caspier-red hover:underline ml-1"
          >
            Install from Chrome Web Store
          </a>
        </p>
        {error && error.includes('not found') && (
          <p className="mt-2 text-xs text-caspier-red">
            💡 Tip: If the extension is installed, try refreshing the page or use the manual public key entry option below.
          </p>
        )}
      </div>
    </div>
  );
};

export default WalletConnectionComponent;










