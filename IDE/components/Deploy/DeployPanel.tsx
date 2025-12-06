import React, { useState, useEffect } from 'react';
import { FileNode, DeployConfig, WalletConnection, DeployedContract, CompilationResult } from '../../types';
import { CasperDeploymentService } from '../../services/casper/deployment';
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
}

const DeployPanel: React.FC<DeployPanelProps> = ({
  files,
  wallet,
  onWalletConnect,
  onWalletDisconnect,
  compilationResult,
  onDeploySuccess
}) => {
  const [deployConfig, setDeployConfig] = useState<DeployConfig>({
    paymentAmount: 5000000000,
    gasPrice: 1,
    ttl: 1800000,
    chainName: 'casper-test',
    runtimeArgs: {}
  });
  const [network, setNetwork] = useState<'testnet' | 'mainnet' | 'nctl' | 'local'>('testnet');
  const [deploying, setDeploying] = useState(false);
  const [deployedContracts, setDeployedContracts] = useState<DeployedContract[]>([]);
  const [runtimeArgs, setRuntimeArgs] = useState<Record<string, any>>({});

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
      alert('Please compile the contract first');
      return;
    }

    if (!wallet.connected) {
      alert('Please connect a wallet first');
      return;
    }

    setDeploying(true);

    try {
      const config: DeployConfig = {
        ...deployConfig,
        chainName: network === 'testnet' ? 'casper-test' : network === 'mainnet' ? 'casper' : 'casper-test',
        runtimeArgs
      };

      const result = await CasperDeploymentService.deploy(
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

      alert(`Deploy successful! Hash: ${result.deployHash}`);
    } catch (error: any) {
      alert(`Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const updateRuntimeArg = (key: string, value: any) => {
    setRuntimeArgs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-caspier-border flex items-center gap-2 bg-caspier-black">
        <RocketIcon className="w-4 h-4 text-caspier-muted" />
        <span className="text-xs font-bold text-caspier-text tracking-wider">DEPLOY & RUN TRANSACTIONS</span>
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
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-bold text-caspier-muted mb-2 block uppercase">Payment Amount</label>
            <input
              type="number"
              value={deployConfig.paymentAmount}
              onChange={(e) => setDeployConfig(prev => ({ ...prev, paymentAmount: parseInt(e.target.value) || 0 }))}
              className="w-full bg-caspier-black border border-caspier-border text-caspier-text px-2 py-1.5 text-sm focus:border-caspier-red outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-caspier-muted mb-2 block uppercase">Gas Price</label>
            <div className="flex">
              <input
                type="number"
                value={deployConfig.gasPrice}
                onChange={(e) => setDeployConfig(prev => ({ ...prev, gasPrice: parseInt(e.target.value) || 1 }))}
                className="w-full bg-caspier-black border border-caspier-border text-caspier-text px-2 py-1.5 text-sm focus:border-caspier-red outline-none border-r-0"
              />
              <span className="bg-caspier-dark border border-caspier-border text-caspier-muted text-xs flex items-center px-2">motes</span>
            </div>
          </div>
        </div>

        {/* Runtime Arguments */}
        {compilationResult?.metadata?.entryPoints && compilationResult.metadata.entryPoints.length > 0 && (
          <div>
            <label className="text-xs font-bold text-caspier-muted mb-2 block uppercase">Runtime Arguments</label>
            <div className="space-y-2">
              {compilationResult.metadata.entryPoints[0].args.map((arg, idx) => (
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
          disabled={deploying || !compilationResult?.wasm || !wallet.connected}
          className="w-full"
        >
          {deploying ? 'Deploying...' : 'Deploy Contract'}
        </Button>

        {/* Deployed Contracts */}
        <div className="pt-4 border-t border-caspier-border mt-4">
          <div className="text-xs font-bold text-caspier-muted mb-2 uppercase">Deployed Contracts</div>
          {deployedContracts.length === 0 ? (
            <div className="text-caspier-muted text-xs italic">No contracts deployed yet.</div>
          ) : (
            <div className="space-y-2">
              {deployedContracts.map(contract => (
                <div key={contract.id} className="p-2 bg-caspier-black border border-caspier-border rounded text-xs">
                  <div className="text-caspier-text font-bold mb-1">{contract.name}</div>
                  <div className="text-caspier-muted space-y-1">
                    <div>Network: <span className="text-caspier-text">{contract.network}</span></div>
                    <div className="flex items-start gap-1">
                      <span>Deploy Hash:</span>
                      <span className="font-mono text-xs break-all">{contract.deployHash}</span>
                    </div>
                    {contract.contractHash && contract.contractHash !== 'pending' && (
                      <div className="flex items-start gap-1">
                        <span>Contract Hash:</span>
                        <span className="font-mono text-xs break-all">{contract.contractHash}</span>
                      </div>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeployPanel;










