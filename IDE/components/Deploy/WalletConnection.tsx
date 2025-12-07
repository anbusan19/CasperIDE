import React, { useState, useEffect, useCallback } from 'react';
import { WalletConnection } from '../../types';
import { CasperWalletService } from '../../services/casper/casper-wallet-service';
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
  const [debugInfo, setDebugInfo] = useState<any>({});

  const loadBalance = useCallback(async () => {
    if (!wallet.publicKey) return;
    try {
      const bal = await CasperWalletService.getBalance(wallet.publicKey, 'testnet');
      setBalance(bal);
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    const updateDebug = () => {
      setDebugInfo({
        hasWindow: typeof window !== 'undefined',
        hasProvider: typeof window !== 'undefined' && !!(window as any).CasperWalletProvider,
        timestamp: new Date().toISOString()
      });
    };

    updateDebug();
    const interval = setInterval(updateDebug, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      loadBalance();
    } else {
      setBalance(null);
    }
  }, [wallet.connected, wallet.publicKey, loadBalance]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const connection = await CasperWalletService.connect();
      onConnect(connection);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await CasperWalletService.disconnect();
    onDisconnect();
    setBalance(null);
    setError(null);
    setShowManualEntry(false);
    setManualPublicKey('');
  };

  const handleManualConnect = () => {
    try {
      if (!/^[0-9a-fA-F]+$/.test(manualPublicKey.trim())) {
        throw new Error('Invalid public key format. Must be hexadecimal.');
      }

      const connection: WalletConnection = {
        type: 'casper-wallet',
        publicKey: manualPublicKey.trim(),
        address: manualPublicKey.trim(),
        connected: true
      };

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
      {/* DEBUG PANEL */}
      <div className="p-2 bg-gray-900 text-xs font-mono text-gray-400 border border-gray-700 rounded hidden">
        <div>DEBUG:</div>
        <div>window.CasperWalletProvider: {debugInfo.hasProvider ? '✅ FOUND' : '❌ MISSING'}</div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {!debugInfo.hasProvider && (
          <div className="p-2 bg-yellow-900/20 border border-yellow-700 rounded text-xs text-yellow-400">
            ⚠️ Casper Wallet extension not detected on window.CasperWalletProvider
          </div>
        )}

        <Button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full"
          variant="primary"
        >
          {connecting ? 'Connecting...' : 'Connect Casper Wallet'}
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
        <p>Connect your wallet to deploy contracts to Casper network.</p>
        <p className="mt-1 text-yellow-400">
          ⚠️ Extension signing required for deployment. Manual entry is read-only.
        </p>
      </div>
    </div>
  );
};

export default WalletConnectionComponent;
