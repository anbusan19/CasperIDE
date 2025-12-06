import { DeployConfig, WalletConnection, DeployedContract } from '../../types';

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

      // Dynamic import to avoid SSR issues
      const { CasperClient, DeployUtil, CLValueBuilder, Keys } = await import('casper-js-sdk');

      const client = new CasperClient(this.NETWORKS[config.chainName as keyof typeof this.NETWORKS] || this.NETWORKS.testnet);

      // Build runtime args
      const runtimeArgs = await this.buildRuntimeArgs(config.runtimeArgs || {});

      // Create deploy
      const deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(
          Keys.PublicKey.fromHex(wallet.publicKey),
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

      // Wait for deploy to be processed (optional, can be done async)
      // For now, return the deploy hash immediately
      // Contract hash will be available after deploy is processed

      return {
        deployHash,
        contractHash: undefined // Will be available after deploy processing
      };
    } catch (error: any) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  /**
   * Execute a contract entry point
   */
  static async executeEntryPoint(
    contractHash: string,
    entryPoint: string,
    args: Record<string, any>,
    wallet: WalletConnection,
    config: DeployConfig
  ): Promise<{ deployHash: string }> {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      const { CasperClient, DeployUtil, CLValueBuilder, Keys, CLValue } = await import('casper-js-sdk');

      const client = new CasperClient(this.NETWORKS[config.chainName as keyof typeof this.NETWORKS] || this.NETWORKS.testnet);

      // Build runtime args
      const runtimeArgs = await this.buildRuntimeArgs(args);

      // Parse contract hash (remove 'contract-' prefix if present, handle hex)
      let contractHashBytes: Uint8Array;
      try {
        const hashStr = contractHash.replace(/^contract-/, '').replace(/^hash-/, '');
        contractHashBytes = Uint8Array.from(Buffer.from(hashStr, 'hex'));
      } catch (e) {
        throw new Error(`Invalid contract hash format: ${contractHash}`);
      }

      // Create deploy for contract call
      const deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(
          Keys.PublicKey.fromHex(wallet.publicKey),
          config.chainName || 'casper-test',
          config.gasPrice || 1,
          config.ttl || 1800000
        ),
        DeployUtil.ExecutableDeployItem.newStoredContractByHash(
          contractHashBytes,
          entryPoint,
          runtimeArgs
        ),
        DeployUtil.standardPayment(config.paymentAmount || 1000000000)
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

      return { deployHash };
    } catch (error: any) {
      throw new Error(`Execution failed: ${error.message}`);
    }
  }

  /**
   * Build runtime arguments from object
   */
  private static async buildRuntimeArgs(args: Record<string, any>): Promise<any[]> {
    const { RuntimeArgs, CLValueBuilder } = await import('casper-js-sdk');
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
   * Query contract state
   */
  static async queryContract(
    contractHash: string,
    path: string[],
    network: string = 'testnet'
  ): Promise<any> {
    try {
      const { CasperClient, Keys } = await import('casper-js-sdk');
      const client = new CasperClient(this.NETWORKS[network as keyof typeof this.NETWORKS] || this.NETWORKS.testnet);

      // Get state root hash
      const stateRootHash = await client.nodeClient.getStateRootHash();
      
      // Parse contract hash
      const hashStr = contractHash.replace(/^contract-/, '').replace(/^hash-/, '');
      const contractHashBytes = Uint8Array.from(Buffer.from(hashStr, 'hex'));
      const contractHashKey = Keys.ContractHash.fromBytes(contractHashBytes);

      // Query contract state
      const state = await client.nodeClient.getBlockState(
        stateRootHash,
        contractHashKey.toHexString(),
        path
      );

      return state;
    } catch (error: any) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  /**
   * Query contract by key
   */
  static async queryContractByKey(
    key: string,
    path: string[],
    network: string = 'testnet'
  ): Promise<any> {
    try {
      const { CasperClient, Keys } = await import('casper-js-sdk');
      const client = new CasperClient(this.NETWORKS[network as keyof typeof this.NETWORKS] || this.NETWORKS.testnet);

      const stateRootHash = await client.nodeClient.getStateRootHash();
      const keyObj = Keys.Key.fromString(key);

      const state = await client.nodeClient.getBlockState(
        stateRootHash,
        keyObj.toHexString(),
        path
      );

      return state;
    } catch (error: any) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  /**
   * Get deploy status
   */
  static async getDeployStatus(
    deployHash: string,
    network: string = 'testnet'
  ): Promise<any> {
    try {
      const { CasperClient } = await import('casper-js-sdk');
      const client = new CasperClient(this.NETWORKS[network as keyof typeof this.NETWORKS] || this.NETWORKS.testnet);

      const deploy = await client.nodeClient.getDeploy(deployHash);
      return deploy;
    } catch (error: any) {
      throw new Error(`Failed to get deploy status: ${error.message}`);
    }
  }
}

