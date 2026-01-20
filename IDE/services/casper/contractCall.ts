import { DeployUtil, CLValueBuilder, CLPublicKey, RuntimeArgs } from 'casper-js-sdk';
import { DeployConfig, WalletConnection } from '../../types';

/**
 * Casper Contract Call Service
 * Handles calling deployed contracts via entry points
 */
export class CasperContractCallService {
    private static readonly RPC_PROXY = '/api/rpc';

    /**
     * Call a deployed contract by its hash
     */
    static async callContractByHash(
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

            // Build runtime args
            const runtimeArgs = await this.buildRuntimeArgs(args);

            // Clean contract hash (remove "hash-" prefix if present)
            const cleanHash = contractHash.replace(/^hash-/, '');

            // Create deploy using StoredContractByHash
            const deploy = DeployUtil.makeDeploy(
                new DeployUtil.DeployParams(
                    CLPublicKey.fromHex(wallet.publicKey),
                    config.chainName || 'casper-test',
                    config.gasPrice || 1,
                    config.ttl || 1800000
                ),
                DeployUtil.ExecutableDeployItem.newStoredContractByHash(
                    Uint8Array.from(Buffer.from(cleanHash, 'hex')),
                    entryPoint,
                    runtimeArgs
                ),
                DeployUtil.standardPayment(config.paymentAmount || 2500000000) // 2.5 CSPR default
            );

            // Sign deploy with wallet
            const { CasperWalletService } = await import('./casper-wallet-service');
            const signedDeploy = await CasperWalletService.signDeploy(deploy, wallet);

            // Send deploy to network
            const response = await fetch(this.RPC_PROXY, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'account_put_deploy',
                    params: [signedDeploy]
                })
            });

            if (!response.ok) {
                throw new Error(`RPC returned ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || 'RPC error');
            }

            return {
                deployHash: signedDeploy.hash
            };
        } catch (error: any) {
            throw new Error(`Contract call failed: ${error.message}`);
        }
    }

    /**
     * Call a contract using package hash (versioned)
     */
    static async callVersionedContract(
        packageHash: string,
        entryPoint: string,
        args: Record<string, any>,
        wallet: WalletConnection,
        config: DeployConfig,
        version?: number
    ): Promise<{ deployHash: string }> {
        try {
            if (!wallet.connected || !wallet.publicKey) {
                throw new Error('Wallet not connected');
            }

            const runtimeArgs = await this.buildRuntimeArgs(args);
            const cleanHash = packageHash.replace(/^contract-package-wasm/, '');

            const deploy = DeployUtil.makeDeploy(
                new DeployUtil.DeployParams(
                    CLPublicKey.fromHex(wallet.publicKey),
                    config.chainName || 'casper-test',
                    config.gasPrice || 1,
                    config.ttl || 1800000
                ),
                DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
                    Uint8Array.from(Buffer.from(cleanHash, 'hex')),
                    version || null, // null = latest version
                    entryPoint,
                    runtimeArgs
                ),
                DeployUtil.standardPayment(config.paymentAmount || 2500000000)
            );

            const { CasperWalletService } = await import('./casper-wallet-service');
            const signedDeploy = await CasperWalletService.signDeploy(deploy, wallet);

            const response = await fetch(this.RPC_PROXY, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'account_put_deploy',
                    params: [signedDeploy]
                })
            });

            if (!response.ok) {
                throw new Error(`RPC returned ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || 'RPC error');
            }

            return {
                deployHash: signedDeploy.hash
            };
        } catch (error: any) {
            throw new Error(`Versioned contract call failed: ${error.message}`);
        }
    }

    /**
     * Build runtime arguments from object
     */
    private static async buildRuntimeArgs(args: Record<string, any>): Promise<RuntimeArgs> {
        const runtimeArgsMap: Record<string, any> = {};

        for (const [key, value] of Object.entries(args)) {
            if (value === undefined || value === null || value === '') {
                continue;
            }

            // Auto-detect type and convert
            if (typeof value === 'string') {
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
}
