import { WalletConnection } from '../../types';

/**
 * Wallet Connection Service
 * Handles connections to Casper wallets
 */
export class WalletService {
  /**
   * Check if Casper Wallet extension is available
   */
  static isCasperWalletAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    const casperWallet = (window as any).casperWallet;
    const casperlabsHelper = (window as any).casperlabsHelper;
    const signerHelper = (window as any).signerHelper;
    
    return !!(casperWallet || casperlabsHelper || signerHelper);
  }

  /**
   * Get available wallet types
   */
  static getAvailableWallets(): string[] {
    if (typeof window === 'undefined') return [];
    
    const available: string[] = [];
    const casperWallet = (window as any).casperWallet;
    const casperlabsHelper = (window as any).casperlabsHelper;
    const signerHelper = (window as any).signerHelper;
    
    if (casperWallet) available.push('Casper Wallet');
    if (casperlabsHelper) available.push('Casper Labs Helper (Legacy)');
    if (signerHelper) available.push('Signer Helper');
    
    return available;
  }

  /**
   * Connect to Casper Wallet extension
   */
  static async connectCasperWallet(): Promise<WalletConnection> {
    try {
      // Check if Casper Wallet extension is installed
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      // Try multiple wallet detection methods
      const casperWallet = (window as any).casperWallet;
      const casperlabsHelper = (window as any).casperlabsHelper;
      const signerHelper = (window as any).signerHelper;

      // Debug: Log what's available
      console.log('Wallet detection:', {
        casperWallet: !!casperWallet,
        casperlabsHelper: !!casperlabsHelper,
        signerHelper: !!signerHelper,
        casperWalletMethods: casperWallet ? Object.keys(casperWallet) : [],
        casperlabsHelperMethods: casperlabsHelper ? Object.keys(casperlabsHelper) : [],
        signerHelperMethods: signerHelper ? Object.keys(signerHelper) : []
      });

      let publicKey: string | null = null;

      // Try Casper Wallet (newer API - check for various method names)
      if (casperWallet) {
        try {
          // Try isConnected() first
          if (typeof casperWallet.isConnected === 'function') {
            const isConnected = await casperWallet.isConnected();
            if (isConnected) {
              // Try different method names for getting public key
              if (typeof casperWallet.getActivePublicKey === 'function') {
                publicKey = await casperWallet.getActivePublicKey();
              } else if (typeof casperWallet.getPublicKey === 'function') {
                publicKey = await casperWallet.getPublicKey();
              } else if (typeof casperWallet.getSelectedPublicKey === 'function') {
                publicKey = await casperWallet.getSelectedPublicKey();
              }
            } else {
              // Request connection
              if (typeof casperWallet.requestConnection === 'function') {
                publicKey = await casperWallet.requestConnection();
              } else if (typeof casperWallet.connect === 'function') {
                publicKey = await casperWallet.connect();
              }
            }
          } else {
            // Try direct connection methods
            if (typeof casperWallet.connect === 'function') {
              publicKey = await casperWallet.connect();
            } else if (typeof casperWallet.requestConnection === 'function') {
              publicKey = await casperWallet.requestConnection();
            } else if (typeof casperWallet.getActivePublicKey === 'function') {
              publicKey = await casperWallet.getActivePublicKey();
            }
          }
        } catch (e: any) {
          console.warn('Casper Wallet connection failed:', e);
          // If connection was rejected by user, throw a clearer error
          if (e.message && (e.message.includes('reject') || e.message.includes('denied') || e.message.includes('cancel'))) {
            throw new Error('Connection rejected by user');
          }
        }
      }

      // Try legacy helper (Casper Signer)
      if (!publicKey && casperlabsHelper) {
        try {
          if (typeof casperlabsHelper.requestConnection === 'function') {
            publicKey = await casperlabsHelper.requestConnection();
          } else if (typeof casperlabsHelper.getActivePublicKey === 'function') {
            publicKey = await casperlabsHelper.getActivePublicKey();
          }
        } catch (e: any) {
          console.warn('Legacy helper connection failed:', e);
          if (e.message && (e.message.includes('reject') || e.message.includes('denied'))) {
            throw new Error('Connection rejected by user');
          }
        }
      }

      // Try signer helper
      if (!publicKey && signerHelper) {
        try {
          if (typeof signerHelper.getActivePublicKey === 'function') {
            publicKey = await signerHelper.getActivePublicKey();
          } else if (typeof signerHelper.requestConnection === 'function') {
            publicKey = await signerHelper.requestConnection();
          }
        } catch (e: any) {
          console.warn('Signer helper connection failed:', e);
        }
      }

      if (!publicKey) {
        const availableWallets = this.getAvailableWallets();
        let errorMessage = 'Casper Wallet extension not found. ';
        
        if (availableWallets.length > 0) {
          errorMessage += `Detected: ${availableWallets.join(', ')}. `;
          errorMessage += 'The extension may be installed but not connected. Please check the extension and try again, or use manual public key entry.';
        } else {
          errorMessage += 'Please install Casper Wallet from the Chrome Web Store (https://chrome.google.com/webstore). ';
          errorMessage += 'If you have it installed, try refreshing the page or use the manual public key entry option.';
        }
        
        throw new Error(errorMessage);
      }

      // Validate public key format (should be hex string)
      if (!/^[0-9a-fA-F]+$/.test(publicKey)) {
        throw new Error('Invalid public key format received from wallet');
      }

      return {
        type: 'casper-wallet',
        publicKey,
        address: publicKey, // In Casper, public key is the address
        connected: true
      };
    } catch (error: any) {
      throw new Error(`Failed to connect Casper Wallet: ${error.message}`);
    }
  }

  /**
   * Connect to Casper Signer (deprecated, but kept for compatibility)
   */
  static async connectCasperSigner(): Promise<WalletConnection> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      // Casper Signer API (deprecated)
      const signerHelper = (window as any).signerHelper;
      const casperSigner = (window as any).casperSigner;

      let publicKey: string | null = null;

      if (signerHelper) {
        try {
          if (typeof signerHelper.getActivePublicKey === 'function') {
            publicKey = await signerHelper.getActivePublicKey();
          }
          if (!publicKey && typeof signerHelper.requestConnection === 'function') {
            publicKey = await signerHelper.requestConnection();
          }
        } catch (e: any) {
          console.warn('Signer helper connection failed:', e);
          if (e.message && (e.message.includes('reject') || e.message.includes('denied'))) {
            throw new Error('Connection rejected by user');
          }
        }
      }

      if (!publicKey && casperSigner) {
        try {
          if (typeof casperSigner.connect === 'function') {
            publicKey = await casperSigner.connect();
          } else if (typeof casperSigner.getActivePublicKey === 'function') {
            publicKey = await casperSigner.getActivePublicKey();
          }
        } catch (e: any) {
          console.warn('Casper Signer connection failed:', e);
          if (e.message && (e.message.includes('reject') || e.message.includes('denied'))) {
            throw new Error('Connection rejected by user');
          }
        }
      }

      if (!publicKey) {
        throw new Error('Casper Signer not found. Note: Casper Signer has been deprecated. Please use Casper Wallet instead.');
      }

      // Validate public key format
      if (!/^[0-9a-fA-F]+$/.test(publicKey)) {
        throw new Error('Invalid public key format received from wallet');
      }

      return {
        type: 'casper-signer',
        publicKey,
        address: publicKey,
        connected: true
      };
    } catch (error: any) {
      throw new Error(`Failed to connect Casper Signer: ${error.message}`);
    }
  }

  /**
   * Connect with manual public key entry (fallback)
   */
  static connectWithPublicKey(publicKey: string): WalletConnection {
    // Validate public key format
    if (!publicKey || !/^[0-9a-fA-F]+$/.test(publicKey)) {
      throw new Error('Invalid public key format. Public key must be a hexadecimal string.');
    }

    return {
      type: 'casper-wallet', // Treat as casper-wallet for compatibility
      publicKey,
      address: publicKey,
      connected: true
    };
  }

  /**
   * Connect to Ledger device
   */
  static async connectLedger(): Promise<WalletConnection> {
    try {
      // Ledger connection requires WebUSB API
      if (!navigator.usb) {
        throw new Error('WebUSB API not available. Please use a supported browser.');
      }

      // This would require the Casper Ledger app and proper USB connection
      // Placeholder implementation
      throw new Error('Ledger connection not yet implemented. Please use Casper Wallet or Casper Signer.');
    } catch (error: any) {
      throw new Error(`Failed to connect Ledger: ${error.message}`);
    }
  }

  /**
   * Disconnect wallet
   */
  static disconnect(): WalletConnection {
    return {
      type: 'none',
      connected: false
    };
  }

  /**
   * Sign a deploy (DeployUtil.Deploy object)
   */
  static async signDeploy(deploy: any, wallet: WalletConnection): Promise<any> {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      const { Keys } = await import('casper-js-sdk');
      const publicKeyObj = Keys.PublicKey.fromHex(wallet.publicKey);

      if (wallet.type === 'casper-wallet') {
        const casperWallet = (window as any).casperWallet;
        const casperlabsHelper = (window as any).casperlabsHelper;

        if (casperWallet && casperWallet.signMessage) {
          // New Casper Wallet API
          const deployJson = deploy.toJson();
          const signed = await casperWallet.signMessage(deployJson, wallet.publicKey);
          return signed;
        } else if (casperlabsHelper && casperlabsHelper.sign) {
          // Legacy API
          const deployHash = deploy.hash;
          const signature = await casperlabsHelper.sign(deployHash, wallet.publicKey);
          // Reconstruct deploy with signature
          const { DeployUtil } = await import('casper-js-sdk');
          return DeployUtil.setSignature(deploy, signature, publicKeyObj);
        } else {
          throw new Error('Casper Wallet signing API not available');
        }
      } else if (wallet.type === 'casper-signer') {
        const signerHelper = (window as any).signerHelper;
        const casperSigner = (window as any).casperSigner;

        if (signerHelper && signerHelper.sign) {
          const deployJson = deploy.toJson();
          const signed = await signerHelper.sign(deployJson, wallet.publicKey);
          return signed;
        } else if (casperSigner && casperSigner.sign) {
          const deployHash = deploy.hash;
          const signature = await casperSigner.sign(deployHash, wallet.publicKey);
          const { DeployUtil } = await import('casper-js-sdk');
          return DeployUtil.setSignature(deploy, signature, publicKeyObj);
        } else {
          throw new Error('Casper Signer signing API not available');
        }
      } else {
        throw new Error('Unsupported wallet type for signing');
      }
    } catch (error: any) {
      throw new Error(`Failed to sign deploy: ${error.message}`);
    }
  }

  /**
   * Get account balance
   */
  static async getBalance(publicKey: string, network: string = 'testnet'): Promise<number> {
    try {
      const { CasperClient, Keys } = await import('casper-js-sdk');

      const networks = {
        testnet: 'https://node-clarity-testnet.make.services/rpc',
        mainnet: 'https://node-clarity-mainnet.make.services/rpc',
        nctl: 'http://localhost:11101/rpc',
        local: 'http://localhost:7777/rpc'
      };

      const client = new CasperClient(networks[network as keyof typeof networks] || networks.testnet);
      const publicKeyObj = Keys.PublicKey.fromHex(publicKey);
      const balance = await client.balanceOfByPublicKey(publicKeyObj);

      return balance.toNumber();
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }
}



