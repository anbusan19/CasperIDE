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

      const client = new CasperClient(this.NETWORKS[config.chainName as keyof typeof this.NETWORKS] || this.NETWORKS.testnet);

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
        DeployUtil.standardPayment(config.paymentAmount || 5000000000)
      );

      // Sign deploy with wallet
      const { WalletService } = await import('./wallet');
      const signedDeploy = await WalletService.signDeploy(deploy, wallet);

      // Send deploy to network
      const deployHash = signedDeploy.hash;
      const deployResult = await client.putDeploy(signedDeploy);

      if (!deployResult) {
        throw new Error('Failed to send deploy to network');
      }

      return {
        deployHash,
        contractHash: undefined // Will be available after deploy processing
      };
    } catch (error: any) {
      throw new Error(`Deployment failed: ${error.message}`);
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
