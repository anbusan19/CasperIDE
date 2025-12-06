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
casper-contract = "1.4.4"
casper-types = "1.5.0"

[lib]
crate-type = ["cdylib"]`
          },
          {
            id: 'Makefile',
            name: 'Makefile',
            type: 'file',
            language: 'makefile',
            content: `prepare:
	rustup target add wasm32-unknown-unknown

build-contract:
	cargo build --release -p caspier_contract --target wasm32-unknown-unknown

test:
	cargo test`
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

#[cfg(not(target_arch = "wasm32"))]
compile_error!("target arch should be wasm32: compile with '--target wasm32-unknown-unknown'");

extern crate alloc;
use alloc::string::String;
use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{CLType, EntryPoint, EntryPointAccess, EntryPointType, EntryPoints, Parameter, Key};

const KEY_NAME: &str = "my_value";
const RUNTIME_ARG_MESSAGE: &str = "message";

#[no_mangle]
pub extern "C" fn call() {
    let message: String = runtime::get_named_arg(RUNTIME_ARG_MESSAGE);
    
    // Store the message under a named key
    let message_uref = storage::new_uref(message);
    let key = Key::URef(message_uref);
    runtime::put_key(KEY_NAME, key);
    
    runtime::print("Caspier contract executed successfully.");
}`
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