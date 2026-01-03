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

use casper_contract::contract_api::{runtime, storage};
use casper_types::{Key, URef};

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[no_mangle]
pub extern "C" fn call() {
    let counter_key = "counter";
    
    // Get or create the URef for the counter
    let counter_uref: URef = match runtime::get_key(counter_key) {
        Some(Key::URef(uref)) => uref,
        _ => {
            let new_uref = storage::new_uref(0u64);
            runtime::put_key(counter_key, Key::URef(new_uref));
            new_uref
        }
    };

    // Read current value, increment, and write back
    let current: u64 = storage::read(counter_uref)
        .unwrap_or(None)
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