import React, { useState, useEffect } from 'react';
import { FileNode, DeployConfig, WalletConnection, DeployedContract, CompilationResult, DeployMode, ContractUpgrade } from '../../types';
import { CasperDeploymentService } from '../../services/casper/deployment';
import { CasperContractCallService } from '../../services/casper/contractCall';
import WalletConnectionComponent from './WalletConnection';
import { Button } from '../UI/Button';
import { RocketIcon } from '../UI/Icons';

interface DeployPanelProps {
  files: FileNode[];
  wallet: WalletConnection;
  onWalletConnect: (wallet: WalletConnection) => void;
  onWalletDisconnect: () => void;
  compilationResult?: CompilationResult;
  onDeploySuccess?: (contract: DeployedContract) => void;
  width?: number;
}

const DeployPanel: React.FC<DeployPanelProps> = ({
  files,
  wallet,
  onWalletConnect,
  onWalletDisconnect,
  compilationResult,
  onDeploySuccess,
  width = 320
}) => {
  const [deployConfig, setDeployConfig] = useState<DeployConfig>({
    paymentAmount: 150000000000, // 150 CSPR - default payment amount
    gasPrice: 1,
    ttl: 1800000,
    chainName: 'casper-test',
    runtimeArgs: {}
  });
  const [network, setNetwork] = useState<'testnet' | 'mainnet' | 'nctl' | 'local'>('testnet');
  const [deploying, setDeploying] = useState(false);
  const [deployedContracts, setDeployedContracts] = useState<DeployedContract[]>([]);
  const [runtimeArgs, setRuntimeArgs] = useState<Record<string, any>>({});
  const [deployMode, setDeployMode] = useState<DeployMode>('fresh');
  const [contractPackageHash, setContractPackageHash] = useState('');
  const [upgradeHistory, setUpgradeHistory] = useState<ContractUpgrade[]>([]);
  const [fetchingContractHash, setFetchingContractHash] = useState<string | null>(null);

  // Contract calling state
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [entryPoint, setEntryPoint] = useState<string>('');
  const [callArgs, setCallArgs] = useState<string>('{}');
  const [calling, setCalling] = useState(false);

  // Query state (free reads)
  const [queryKeyName, setQueryKeyName] = useState<string>('count');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [querying, setQuerying] = useState(false);

  // Function to refresh contract hash from account named keys
  const refreshContractHash = async (contractId: string) => {
    if (!wallet.connected || !wallet.publicKey) {
      console.error('ERROR: Please connect your wallet first');
      return;
    }

    setFetchingContractHash(contractId);
    try {
      const namedKeys = await CasperDeploymentService.getAccountNamedKeys(wallet.publicKey, network);

      // Look for common contract hash key names
      const possibleKeys = ['counter_contract', 'contract_hash', 'contract'];
      let contractHash = null;
      let foundKey = null;

      for (const key of possibleKeys) {
        if (namedKeys[key]) {
          contractHash = namedKeys[key];
          foundKey = key;
          break;
        }
      }

      if (contractHash) {
        // Update the contract in state
        const updated = deployedContracts.map(c =>
          c.id === contractId ? { ...c, contractHash } : c
        );
        setDeployedContracts(updated);
        localStorage.setItem('caspier-deployed-contracts', JSON.stringify(updated));

        console.log('='.repeat(50));
        console.log('CONTRACT HASH FOUND!');
        console.log('='.repeat(50));
        console.log(`Key Name: ${foundKey}`);
        console.log(`Contract Hash: ${contractHash}`);
        console.log('='.repeat(50));

        // Alert removed - check console for output
      } else {
        const keys = Object.keys(namedKeys);
        console.log('Available Named Keys:', keys);
        console.warn('Contract hash not found. Deploy may still be processing. Try again in 1-2 minutes.');
      }
    } catch (error: any) {
      console.error('Failed to fetch contract hash:', error);
      // Error already logged to console
    } finally {
      setFetchingContractHash(null);
    }
  };

  // Function to call a contract entry point
  const handleCallContract = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      console.error('ERROR: Please connect your wallet first');
      return;
    }

    if (!selectedContract) {
      console.error('ERROR: Please select or enter a contract hash');
      return;
    }

    if (!entryPoint.trim()) {
      console.error('ERROR: Please enter an entry point name');
      return;
    }

    setCalling(true);
    try {
      // Parse args JSON
      let args = {};
      try {
        args = JSON.parse(callArgs);
      } catch (e) {
        throw new Error('Invalid JSON for arguments');
      }

      const config: DeployConfig = {
        ...deployConfig,
        chainName: network === 'testnet' ? 'casper-test' : 'casper',
        paymentAmount: 2500000000, // 2.5 CSPR for contract calls
      };

      console.log('='.repeat(50));
      console.log('CALLING CONTRACT');
      console.log('='.repeat(50));
      console.log('Contract Hash:', selectedContract);
      console.log('Entry Point:', entryPoint);
      console.log('Arguments:', JSON.stringify(args, null, 2));
      console.log('Gas Payment:', '2.5 CSPR');
      console.log('='.repeat(50));

      const result = await CasperContractCallService.callContractByHash(
        selectedContract,
        entryPoint,
        args,
        wallet,
        config
      );

      const deployHashHex = result.deployHash;

      const explorerUrl = network === 'testnet'
        ? `https://testnet.cspr.live/deploy/${deployHashHex}`
        : `https://cspr.live/deploy/${deployHashHex}`;

      console.log('='.repeat(50));
      console.log('CONTRACT CALL SUCCESSFUL');
      console.log('='.repeat(50));
      console.log('Deploy Hash:', deployHashHex);
      console.log('Explorer URL:', explorerUrl);
      console.log('='.repeat(50));
    } catch (error: any) {
      console.error('='.repeat(50));
      console.error('CONTRACT CALL FAILED');
      console.error('='.repeat(50));
      console.error('Error:', error.message);
      console.error('='.repeat(50));
    } finally {
      setCalling(false);
    }
  };

  // Function to query contract state (free read, no gas)
  const handleQueryState = async () => {
    if (!selectedContract) {
      console.error('ERROR: Please select or enter a contract hash');
      return;
    }

    if (!queryKeyName.trim()) {
      console.error('ERROR: Please enter a key name to query');
      return;
    }

    setQuerying(true);
    setQueryResult(null);
    try {
      const result = await CasperContractCallService.queryContractState(
        selectedContract,
        queryKeyName.trim()
      );

      setQueryResult(result);

      console.log('='.repeat(50));
      console.log('QUERY RESULT');
      console.log('='.repeat(50));
      console.log(`${queryKeyName} =`, result.value);
      console.log('='.repeat(50));
    } catch (error: any) {
      console.error('Query failed:', error.message);
      setQueryResult({ error: error.message });
    } finally {
      setQuerying(false);
    }
  };

  useEffect(() => {
    // Load deployed contracts from localStorage
    const saved = localStorage.getItem('caspier-deployed-contracts');
    if (saved) {
      try {
        setDeployedContracts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load deployed contracts:', e);
      }
    }
  }, []);

  const findRustFiles = (nodes: FileNode[]): FileNode[] => {
    const rustFiles: FileNode[] = [];
    const traverse = (nodeList: FileNode[]) => {
      nodeList.forEach(node => {
        if (node.type === 'file' && (node.name.endsWith('.rs') || node.language === 'rust')) {
          rustFiles.push(node);
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return rustFiles;
  };

  const handleDeploy = async () => {
    if (!compilationResult?.wasm) {
      console.error('ERROR: No compiled WASM available. Please compile first.');
      return;
    }

    if (!wallet.connected) {
      console.error('ERROR: Please connect a wallet first');
      return;
    }

    if (deployMode === 'upgrade' && !contractPackageHash.trim()) {
      console.error('ERROR: Please enter a contract package hash for upgrade.');
      return;
    }

    setDeploying(true);

    try {
      const config: DeployConfig = {
        ...deployConfig,
        chainName: network === 'testnet' ? 'casper-test' : network === 'mainnet' ? 'casper' : 'casper-test',
        runtimeArgs
      };

      let result;

      if (deployMode === 'upgrade') {
        // Upgrade existing contract
        result = await CasperDeploymentService.upgradeContract(
          compilationResult.wasm,
          contractPackageHash,
          wallet,
          config
        );

        // Track upgrade in history
        const upgrade: ContractUpgrade = {
          id: Date.now().toString(),
          contractPackageHash,
          version: result.version || 2,
          deployHash: result.deployHash,
          timestamp: Date.now(),
          network,
          changes: 'Contract upgraded via IDE'
        };

        const updatedHistory = [upgrade, ...upgradeHistory];
        setUpgradeHistory(updatedHistory);
        localStorage.setItem('caspier-upgrade-history', JSON.stringify(updatedHistory));

        // Convert deploy hash to hex string if it's a Uint8Array
        const deployHashHex = result.deployHash instanceof Uint8Array
          ? Array.from(result.deployHash).map(b => b.toString(16).padStart(2, '0')).join('')
          : result.deployHash;

        const explorerUrl = network === 'testnet'
          ? `https://testnet.cspr.live/deploy/${deployHashHex}`
          : `https://cspr.live/deploy/${deployHashHex}`;

        // Log upgrade details to console
        console.log('='.repeat(50));
        console.log('CONTRACT UPGRADE SUCCESSFUL');
        console.log('='.repeat(50));
        console.log('Deploy Hash:', deployHashHex);
        console.log('New Version:', result.version || 'pending');
        console.log('Package Hash:', contractPackageHash);
        console.log('Explorer URL:', explorerUrl);
        console.log('='.repeat(50));

        // Success output already in console
      } else {
        // Fresh deployment
        result = await CasperDeploymentService.deploy(
          compilationResult.wasm,
          wallet,
          config
        );

        const newContract: DeployedContract = {
          id: Date.now().toString(),
          name: compilationResult.metadata?.contractPackage || 'Contract',
          contractHash: result.contractHash || 'pending',
          deployHash: result.deployHash,
          network,
          timestamp: Date.now(),
          entryPoints: compilationResult.metadata?.entryPoints
        };

        const updated = [newContract, ...deployedContracts];
        setDeployedContracts(updated);
        localStorage.setItem('caspier-deployed-contracts', JSON.stringify(updated));

        if (onDeploySuccess) {
          onDeploySuccess(newContract);
        }

        // Convert deploy hash to hex string if it's a Uint8Array
        const deployHashHex = result.deployHash instanceof Uint8Array
          ? Array.from(result.deployHash).map(b => b.toString(16).padStart(2, '0')).join('')
          : result.deployHash;

        const explorerUrl = network === 'testnet'
          ? `https://testnet.cspr.live/deploy/${deployHashHex}`
          : `https://cspr.live/deploy/${deployHashHex}`;

        // Log deployment details to console
        console.log('='.repeat(50));
        console.log('CONTRACT DEPLOYMENT SUCCESSFUL');
        console.log('='.repeat(50));
        console.log('Deploy Hash:', deployHashHex);
        console.log('Explorer URL:', explorerUrl);
        console.log('');
        console.log('HOW TO FIND YOUR CONTRACT HASH:');
        console.log('1. Wait 1-2 minutes for deploy to be processed');
        console.log('2. Go to the explorer URL above');
        console.log('3. Click your account address');
        console.log('4. Look in "Named Keys" for "counter_contract"');
        console.log('5. That hash is your Contract Hash!');
        console.log('='.repeat(50));

        // Success output already in console
        console.log('Explorer URL:', explorerUrl);
      }
    } catch (error: any) {
      console.error('Deployment error:', error);
      // Error already logged to console
    } finally {
      setDeploying(false);
    }
  };

  const updateRuntimeArg = (key: string, value: any) => {
    setRuntimeArgs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-caspier-border flex items-center gap-2 bg-caspier-black min-w-0">
        <RocketIcon className="w-4 h-4 text-caspier-muted flex-shrink-0" />
        {width >= 280 && (
          <span className="text-xs font-bold text-caspier-text tracking-wider whitespace-nowrap">
            DEPLOY & RUN TRANSACTIONS
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Wallet Connection */}
        <div>
          <div className="text-xs font-bold text-caspier-muted mb-2 uppercase">Wallet</div>
          <WalletConnectionComponent
            wallet={wallet}
            onConnect={onWalletConnect}
            onDisconnect={onWalletDisconnect}
          />
        </div>

        {/* Deploy Mode Selection */}
        <div>
          <label className="text-xs font-bold text-caspier-muted mb-2 block uppercase">Deploy Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setDeployMode('fresh')}
              className={`flex-1 px-3 py-2 text-sm border ${deployMode === 'fresh'
                ? 'bg-caspier-red border-caspier-red text-white'
                : 'bg-caspier-black border-caspier-border text-caspier-muted hover:border-caspier-red'
                } transition-colors`}
            >
              Fresh Deploy
            </button>
            <button
              onClick={() => setDeployMode('upgrade')}
              className={`flex-1 px-3 py-2 text-sm border ${deployMode === 'upgrade'
                ? 'bg-caspier-red border-caspier-red text-white'
                : 'bg-caspier-black border-caspier-border text-caspier-muted hover:border-caspier-red'
                } transition-colors`}
            >
              Upgrade Contract
            </button>
          </div>
        </div>

        {/* Contract Package Hash Input (for upgrades) */}
        {deployMode === 'upgrade' && (
          <div>
            <label className="text-xs font-bold text-caspier-muted mb-2 block uppercase">
              Contract Package Hash *
            </label>
            <input
              type="text"
              value={contractPackageHash}
              onChange={(e) => setContractPackageHash(e.target.value)}
              placeholder="hash-abc123..."
              className="w-full bg-caspier-black border border-caspier-border text-caspier-text px-2 py-1.5 text-sm font-mono focus:border-caspier-red outline-none"
            />
            {contractPackageHash && (
              <div className="text-xs text-caspier-muted mt-1">
                Upgrading existing contract package
              </div>
            )}
          </div>
        )}

        {/* Network Selection */}
        <div>
          <label className="text-xs font-bold text-caspier-muted mb-2 block uppercase">Environment</label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as any)}
            className="w-full bg-caspier-black border border-caspier-border text-caspier-text px-2 py-1.5 text-sm focus:border-caspier-red outline-none"
          >
            <option value="testnet">Casper Testnet (CSPR)</option>
            <option value="mainnet">Casper Mainnet</option>
            <option value="nctl">NCTL (Local Network)</option>
            <option value="local">Local (localhost:7777)</option>
          </select>
        </div>

        {/* Payment & Gas */}
        <div className={`${width < 320 ? 'flex-col' : 'flex'} gap-2`}>
          <div className="flex-1 min-w-0">
            <label className="text-xs font-bold text-caspier-muted mb-2 block uppercase">Payment Amount</label>
            <input
              type="number"
              value={deployConfig.paymentAmount}
              onChange={(e) => setDeployConfig(prev => ({ ...prev, paymentAmount: parseInt(e.target.value) || 0 }))}
              className="w-full bg-caspier-black border border-caspier-border text-caspier-text px-2 py-1.5 text-sm focus:border-caspier-red outline-none min-w-0"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs font-bold text-caspier-muted mb-2 block uppercase">Gas Price</label>
            <div className="flex min-w-0">
              <input
                type="number"
                value={deployConfig.gasPrice}
                onChange={(e) => setDeployConfig(prev => ({ ...prev, gasPrice: parseInt(e.target.value) || 1 }))}
                className="flex-1 bg-caspier-black border border-caspier-border text-caspier-text px-2 py-1.5 text-sm focus:border-caspier-red outline-none border-r-0 min-w-0"
              />
              <span className="bg-caspier-dark border border-caspier-border text-caspier-muted text-xs flex items-center px-2 flex-shrink-0 whitespace-nowrap">motes</span>
            </div>
          </div>
        </div>

        {/* Runtime Arguments */}
        {compilationResult?.metadata?.entryPoints &&
          compilationResult.metadata.entryPoints.length > 0 &&
          compilationResult.metadata.entryPoints[0]?.args &&
          Array.isArray(compilationResult.metadata.entryPoints[0].args) && (
            <div>
              <label className="text-xs font-bold text-caspier-muted mb-2 block uppercase">Runtime Arguments</label>
              <div className="space-y-2">
                {compilationResult.metadata.entryPoints[0].args
                  .filter(arg => arg && typeof arg.name === 'string' && typeof arg.type === 'string')
                  .map((arg, idx) => (
                    <div key={idx}>
                      <label className="text-xs text-caspier-muted block mb-1">{arg.name} ({arg.type})</label>
                      <input
                        type="text"
                        value={runtimeArgs[arg.name] || ''}
                        onChange={(e) => updateRuntimeArg(arg.name, e.target.value)}
                        placeholder={`Enter ${arg.name}`}
                        className="w-full bg-caspier-black border border-caspier-border text-caspier-text px-2 py-1.5 text-sm focus:border-caspier-red outline-none"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Deploy Button */}
        <Button
          onClick={handleDeploy}
          disabled={
            deploying ||
            !compilationResult?.wasm ||
            !wallet.connected ||
            (deployMode === 'upgrade' && !contractPackageHash.trim())
          }
          className="w-full"
        >
          {deploying
            ? (deployMode === 'upgrade' ? 'Upgrading...' : 'Deploying...')
            : (deployMode === 'upgrade' ? 'Upgrade Contract' : 'Deploy Contract')}
        </Button>

        {/* Contract Interaction */}
        <div className="pt-4 border-t border-caspier-border mt-4">
          <div className="text-xs font-bold text-caspier-muted mb-2 uppercase">Interact with Contract</div>

          {/* Contract Selector */}
          <div className="mb-3">
            <label className="text-xs text-caspier-muted mb-1 block">Contract Hash</label>
            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              className="w-full bg-caspier-dark border border-caspier-border rounded px-2 py-1.5 text-xs text-caspier-text focus:outline-none focus:border-caspier-red"
            >
              <option value="">Select deployed contract...</option>
              {deployedContracts
                .filter(c => c.contractHash && c.contractHash !== 'pending')
                .map(contract => (
                  <option key={contract.id} value={contract.contractHash}>
                    {contract.name} - {contract.contractHash?.substring(0, 20)}...
                  </option>
                ))}
            </select>
            <input
              type="text"
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              placeholder="Or paste contract hash here..."
              className="w-full mt-2 bg-caspier-dark border border-caspier-border rounded px-2 py-1.5 text-xs text-caspier-text focus:outline-none focus:border-caspier-red font-mono"
            />
          </div>

          {/* Entry Point */}
          <div className="mb-3">
            <label className="text-xs text-caspier-muted mb-1 block">Entry Point</label>
            <input
              type="text"
              value={entryPoint}
              onChange={(e) => setEntryPoint(e.target.value)}
              placeholder="e.g., increment, get_count"
              className="w-full bg-caspier-dark border border-caspier-border rounded px-2 py-1.5 text-xs text-caspier-text focus:outline-none focus:border-caspier-red"
            />
          </div>

          {/* Runtime Args */}
          <div className="mb-3">
            <label className="text-xs text-caspier-muted mb-1 block">Arguments (JSON)</label>
            <textarea
              value={callArgs}
              onChange={(e) => setCallArgs(e.target.value)}
              placeholder='{"key": "value"}'
              rows={3}
              className="w-full bg-caspier-dark border border-caspier-border rounded px-2 py-1.5 text-xs text-caspier-text focus:outline-none focus:border-caspier-red font-mono resize-none"
            />
          </div>

          {/* Call Button */}
          <Button
            onClick={handleCallContract}
            disabled={calling || !wallet.connected || !selectedContract || !entryPoint}
            className="w-full"
          >
            {calling ? 'Calling...' : 'Call Contract'}
          </Button>

          <div className="text-xs text-caspier-muted mt-2 italic">
            Results will appear in the terminal below
          </div>
        </div>

        {/* Query Contract State (Free Read) */}
        <div className="pt-4 border-t border-caspier-border mt-4">
          <div className="text-xs font-bold text-caspier-muted mb-2 uppercase">Query State (Free Read)</div>

          <div className="mb-3">
            <label className="text-xs text-caspier-muted mb-1 block">Key Name</label>
            <input
              type="text"
              value={queryKeyName}
              onChange={(e) => setQueryKeyName(e.target.value)}
              placeholder="e.g., count"
              className="w-full bg-caspier-dark border border-caspier-border rounded px-2 py-1.5 text-xs text-caspier-text focus:outline-none focus:border-caspier-red"
            />
          </div>

          <Button
            onClick={handleQueryState}
            disabled={querying || !selectedContract || !queryKeyName.trim()}
            className="w-full"
          >
            {querying ? 'Querying...' : 'Query State'}
          </Button>

          {queryResult && (
            <div className="mt-3 p-2 bg-caspier-black border border-caspier-border rounded">
              {queryResult.error ? (
                <div className="text-red-400 text-xs">
                  {queryResult.error}
                </div>
              ) : (
                <div className="text-xs">
                  <div className="text-caspier-muted mb-1">{queryKeyName} =</div>
                  <div className="text-green-400 font-mono text-lg font-bold">
                    {JSON.stringify(queryResult.value)}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-caspier-muted mt-2 italic">
            No gas required - reads state directly from chain
          </div>
        </div>

        {/* Deployed Contracts */}
        <div className="pt-4 border-t border-caspier-border mt-4">
          <div className="text-xs font-bold text-caspier-muted mb-2 uppercase">Deployed Contracts</div>
          {deployedContracts.length === 0 ? (
            <div className="text-caspier-muted text-xs italic">No contracts deployed yet.</div>
          ) : (
            <div className="space-y-2">
              {deployedContracts.map(contract => {
                // Convert deployHash to hex string if it's a Uint8Array
                const deployHashStr = typeof contract.deployHash === 'string'
                  ? contract.deployHash
                  : Array.from(contract.deployHash).map(b => b.toString(16).padStart(2, '0')).join('');

                return (
                  <div key={contract.id} className="p-2 bg-caspier-black border border-caspier-border rounded text-xs">
                    <div className="text-caspier-text font-bold mb-1">{contract.name}</div>
                    <div className="text-caspier-muted space-y-1">
                      <div>Network: <span className="text-caspier-text">{contract.network}</span></div>
                      <div className="flex items-start gap-1">
                        <span>Deploy Hash:</span>
                        <a
                          href={contract.network === 'testnet'
                            ? `https://testnet.cspr.live/transaction/${deployHashStr}`
                            : `https://cspr.live/transaction/${deployHashStr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs break-all text-caspier-red hover:underline"
                        >
                          {deployHashStr}
                        </a>
                      </div>
                      {contract.contractHash && contract.contractHash !== 'pending' ? (
                        <div className="flex items-start gap-1">
                          <span>Contract Hash:</span>
                          <span className="font-mono text-xs break-all text-green-400">{contract.contractHash}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => refreshContractHash(contract.id)}
                          disabled={fetchingContractHash === contract.id}
                          className="mt-1 px-2 py-1 bg-caspier-red text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          {fetchingContractHash === contract.id ? 'Fetching...' : 'Get Contract Hash'}
                        </button>
                      )}
                      <div className="text-caspier-muted text-xs mt-1">
                        {new Date(contract.timestamp).toLocaleString()}
                      </div>
                      {contract.entryPoints && contract.entryPoints.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-caspier-border">
                          <div className="text-caspier-muted mb-1">Entry Points:</div>
                          <div className="flex flex-wrap gap-1">
                            {contract.entryPoints.map((ep, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-caspier-dark border border-caspier-border rounded text-xs">
                                {ep.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Best Practices Tips */}
        <div className="pt-4 border-t border-caspier-border mt-4">
          <details className="group">
            <summary className="text-xs font-bold text-caspier-muted mb-2 uppercase cursor-pointer flex items-center gap-2 hover:text-caspier-text">
              <span className="group-open:rotate-90 transition-transform">▶</span>
              Best Practices Tips
            </summary>
            <div className="mt-2 space-y-2 text-xs">
              <div className="p-2 bg-caspier-black border border-caspier-border rounded">
                <div className="font-semibold text-caspier-red mb-1">Gas Optimization</div>
                <ul className="text-caspier-muted space-y-1 list-disc list-inside">
                  <li>Keep WASM under 500KB for optimal gas costs</li>
                  <li>Use <code className="bg-caspier-dark px-1 rounded">#![no_std]</code> to reduce size</li>
                  <li>Enable LTO and set <code className="bg-caspier-dark px-1 rounded">codegen-units=1</code></li>
                </ul>
              </div>

              <div className="p-2 bg-caspier-black border border-caspier-border rounded">
                <div className="font-semibold text-caspier-red mb-1">Purse Management</div>
                <ul className="text-caspier-muted space-y-1 list-disc list-inside">
                  <li>Creating a new purse costs 2.5 CSPR</li>
                  <li>Reuse purses when possible to save gas</li>
                  <li>Ensure proper access control on purses</li>
                </ul>
              </div>

              <div className="p-2 bg-caspier-black border border-caspier-border rounded">
                <div className="font-semibold text-caspier-red mb-1">Testing</div>
                <ul className="text-caspier-muted space-y-1 list-disc list-inside">
                  <li>Always test on Testnet before Mainnet</li>
                  <li>Use unit tests with casper-engine-test-support</li>
                  <li>Test all entry points and edge cases</li>
                </ul>
              </div>

              <div className="p-2 bg-caspier-black border border-caspier-border rounded">
                <div className="font-semibold text-caspier-red mb-1">Contract Design</div>
                <ul className="text-caspier-muted space-y-1 list-disc list-inside">
                  <li>Add <code className="bg-caspier-dark px-1 rounded">init()</code> entry point for self-initialization</li>
                  <li>Max transaction size: 1 MB</li>
                  <li>Inline functions to reduce Wasm overhead</li>
                </ul>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default DeployPanel;










