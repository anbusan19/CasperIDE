import { FileNode, ProjectSettings } from './types';

export const DEFAULT_SETTINGS: ProjectSettings = {
  fontSize: 14,
  wordWrap: 'on',
  minimap: false,
  tabSize: 4,
  autoCompile: false,
  enableOptimization: true,
  network: 'testnet',
  wasmOptimization: true
};

export const INITIAL_FILES: FileNode[] = [
  {
    id: 'root',
    name: 'default_workspace',
    type: 'folder',
    children: [
      {
        id: 'contract',
        name: 'contract',
        type: 'folder',
        children: [
          {
            id: 'Cargo.toml',
            name: 'Cargo.toml',
            type: 'file',
            language: 'toml',
            content: `[package]
name = "caspier_contract"
version = "0.1.0"
edition = "2021"

[dependencies]
casper-contract = "4.0.0"
casper-types = "4.0.1"

[lib]
crate-type = ["cdylib"]`
          },
          {
            id: 'Makefile',
            name: 'Makefile',
            type: 'file',
            language: 'makefile',
            content: `prepare:
\trustup target add wasm32-unknown-unknown

build-contract:
\tcargo build --release -p caspier_contract --target wasm32-unknown-unknown

test:
\tcargo test`
          },
          {
            id: 'src',
            name: 'src',
            type: 'folder',
            children: [
              {
                id: 'main.rs',
                name: 'main.rs',
                type: 'file',
                language: 'rust',
                content: `#![no_std]
#![no_main]

extern crate alloc;

use alloc::string::String;
use casper_contract::contract_api::{runtime, storage};
use casper_contract::unwrap_or_revert::UnwrapOrRevert;
use casper_types::{contracts::NamedKeys, EntryPoints, Key, URef};

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

const CONTRACT_PACKAGE_NAME: &str = "counter_package";
const COUNTER_KEY: &str = "counter";

/// Install or upgrade the contract
#[no_mangle]
pub extern "C" fn call() {
    // Create initial counter storage
    let counter_uref = storage::new_uref(0u64);

    // Create named keys for the contract
    let mut named_keys = NamedKeys::new();
    named_keys.insert(String::from(COUNTER_KEY), Key::URef(counter_uref));

    // Create empty entry points
    let entry_points = EntryPoints::new();

    // Create a new contract package (for upgradeable contracts)
    let (contract_package_hash, _access_uref) = storage::create_contract_package_at_hash();

    // Add the contract version to the package
    let (_contract_hash, _contract_version) =
        storage::add_contract_version(
            contract_package_hash,
            entry_points,
            named_keys
        );

    // Store the contract package hash for future upgrades
    runtime::put_key(CONTRACT_PACKAGE_NAME, contract_package_hash.into());
    
    // Automatically increment the counter on each call
    let current: u64 = storage::read(counter_uref)
        .unwrap_or_revert()
        .unwrap_or(0u64);
    
    storage::write(counter_uref, current + 1);
}

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}
`
              }
            ]
          }
        ]
      },
      {
        id: 'client',
        name: 'client',
        type: 'folder',
        children: [
          {
            id: 'install.ts',
            name: 'install.ts',
            type: 'file',
            language: 'typescript',
            content: `import { CasperClient, Contracts, RuntimeArgs, CLValueBuilder } from "casper-js-sdk";

const client = new CasperClient("http://localhost:11101/rpc");

async function installContract() {
  const contract = new Contracts.Contract(client);
  
  // Example logic for deployment would go here
  console.log("Preparing deployment...");
}

installContract().catch(console.error);`
          }
        ]
      },
      {
        id: 'tests',
        name: 'tests',
        type: 'folder',
        children: []
      },
      {
        id: 'README.txt',
        name: 'README.txt',
        type: 'file',
        language: 'plaintext',
        content: `Welcome to Caspier IDE.
        
A custom environment for the Casper Network.
Write Rust contracts, deploy via NCTL, and test with the Casper JS SDK.

Structure:
- contract/: Rust smart contract source
- client/: TypeScript client scripts
- tests/: Integration tests`
      }
    ]
  }
];