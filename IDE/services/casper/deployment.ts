import { CasperClient, DeployUtil, CLValueBuilder, CLPublicKey, RuntimeArgs } from 'casper-js-sdk';
import { DeployConfig, WalletConnection } from '../../types';

/**
 * Casper Deployment Service
 * Handles contract deployment to Casper network
 */
export class CasperDeploymentService {
  private static readonly NETWORKS = {
    testnet: 'https://node-clarity-testnet.make.services/rpc',
    mainnet: 'https://node-clarity-mainnet.make.services/rpc',
    nctl: 'http://localhost:11101/rpc',
    local: 'http://localhost:7777/rpc'
  };

  /**
   * Deploy a contract to Casper network
   */
  static async deploy(
    wasmBytes: Uint8Array,
    wallet: WalletConnection,
    config: DeployConfig
  ): Promise<{ deployHash: string; contractHash?: string }> {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Use local proxy server to bypass network/CORS issues
      const testnetNodes = [
        'http://localhost:3001/rpc'  // Local proxy server
      ];

      const mainnetNodes = [
        'http://localhost:3001/rpc'  // Can handle mainnet too
      ];

      const targetNetwork = config.chainName === 'casper' ? 'mainnet' : 'testnet';
      const nodes = targetNetwork === 'mainnet' ? mainnetNodes : testnetNodes;

      // Construct deploy params using the primary node for now (DeployParams doesn't depend on live node)
      // But for putDeploy we need a working client.

      // Build runtime args
      const runtimeArgs = await this.buildRuntimeArgs(config.runtimeArgs || {});

      // Create deploy
      const deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(
          CLPublicKey.fromHex(wallet.publicKey),
          config.chainName || 'casper-test',
          config.gasPrice || 1,
          config.ttl || 1800000
        ),
        DeployUtil.ExecutableDeployItem.newModuleBytes(
          wasmBytes,
          runtimeArgs
        ),
        DeployUtil.standardPayment(config.paymentAmount || 300000000000)
      );

      // Sign deploy with wallet
      const { CasperWalletService } = await import('./casper-wallet-service');
      const signedDeploy = await CasperWalletService.signDeploy(deploy, wallet);

      // Send deploy to network with fallback
      const deployHash = signedDeploy.hash;
      let deployResult;
      let lastError;

      for (const nodeUrl of nodes) {
        try {
          console.log(`Attempting to send deploy to ${nodeUrl}...`);
          const client = new CasperClient(nodeUrl);
          deployResult = await client.putDeploy(signedDeploy);
          if (deployResult) {
            console.log(`Successfully sent to ${nodeUrl}`);
            break;
          }
        } catch (err: any) {
          console.warn(`Failed to send to ${nodeUrl}:`, err.message);
          lastError = err;
        }
      }

      if (!deployResult) {
        throw new Error(`Failed to send deploy to network. Last error: ${lastError?.message || 'Unknown error'}`);
      }

      return {
        deployHash,
        contractHash: undefined
      };
    } catch (error: any) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  /**
   * Upgrade an existing contract
   */
  static async upgradeContract(
    wasmBytes: Uint8Array,
    contractPackageHash: string,
    wallet: WalletConnection,
    config: DeployConfig
  ): Promise<{ deployHash: string; version?: number }> {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      if (!contractPackageHash) {
        throw new Error('Contract package hash is required for upgrades');
      }

      // Use local proxy server
      const nodes = ['http://localhost:3001/rpc'];

      // Build runtime args - upgrades typically don't need special args
      const runtimeArgs = await this.buildRuntimeArgs(config.runtimeArgs || {});

      // Create upgrade deploy using standard module bytes
      // The contract's call() function should use add_contract_version internally
      const deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(
          CLPublicKey.fromHex(wallet.publicKey),
          config.chainName || 'casper-test',
          config.gasPrice || 1,
          config.ttl || 1800000
        ),
        DeployUtil.ExecutableDeployItem.newModuleBytes(
          wasmBytes,
          runtimeArgs
        ),
        DeployUtil.standardPayment(config.paymentAmount || 300000000000)
      );

      // Sign deploy with wallet
      const { CasperWalletService } = await import('./casper-wallet-service');
      const signedDeploy = await CasperWalletService.signDeploy(deploy, wallet);

      // Send deploy to network
      const deployHash = signedDeploy.hash;
      let deployResult;
      let lastError;

      for (const nodeUrl of nodes) {
        try {
          console.log(`Sending upgrade to ${nodeUrl}...`);
          const client = new CasperClient(nodeUrl);
          deployResult = await client.putDeploy(signedDeploy);
          if (deployResult) {
            console.log(`Upgrade sent successfully to ${nodeUrl}`);
            break;
          }
        } catch (err: any) {
          console.warn(`Failed to send upgrade to ${nodeUrl}:`, err.message);
          lastError = err;
        }
      }

      if (!deployResult) {
        throw new Error(`Failed to send upgrade to network. Last error: ${lastError?.message || 'Unknown error'}`);
      }

      // Note: Version tracking would require querying the contract state
      // For now, we return undefined and let the UI handle it
      return {
        deployHash,
        version: undefined
      };
    } catch (error: any) {
      throw new Error(`Contract upgrade failed: ${error.message}`);
    }
  }

  /**
   * Build runtime arguments from object
   */
  private static async buildRuntimeArgs(args: Record<string, any>): Promise<any> {
    const runtimeArgsMap: Record<string, any> = {};

    for (const [key, value] of Object.entries(args)) {
      if (value === undefined || value === null || value === '') {
        continue; // Skip empty values
      }

      // Determine CLValue type from value
      if (typeof value === 'string') {
        // Try to detect if it's a number string
        if (/^-?\d+$/.test(value)) {
          runtimeArgsMap[key] = CLValueBuilder.u64(BigInt(value));
        } else if (/^-?\d+\.\d+$/.test(value)) {
          runtimeArgsMap[key] = CLValueBuilder.u512(BigInt(Math.floor(parseFloat(value))));
        } else {
          runtimeArgsMap[key] = CLValueBuilder.string(value);
        }
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          runtimeArgsMap[key] = CLValueBuilder.u64(BigInt(value));
        } else {
          runtimeArgsMap[key] = CLValueBuilder.u512(BigInt(Math.floor(value)));
        }
      } else if (typeof value === 'boolean') {
        runtimeArgsMap[key] = CLValueBuilder.bool(value);
      } else if (typeof value === 'bigint') {
        runtimeArgsMap[key] = CLValueBuilder.u64(value);
      } else {
        runtimeArgsMap[key] = CLValueBuilder.string(String(value));
      }
    }

    return RuntimeArgs.fromMap(runtimeArgsMap);
  }

  /**
   * Get deploy status
   */
  static async getDeployStatus(
    deployHash: string,
    network: string = 'testnet'
  ): Promise<any> {
    try {
      const client = new CasperClient(this.NETWORKS[network as keyof typeof this.NETWORKS] || this.NETWORKS.testnet);

      const deploy = await client.getDeploy(deployHash);
      return deploy;
    } catch (error: any) {
      throw new Error(`Failed to get deploy status: ${error.message}`);
    }
  }
}
