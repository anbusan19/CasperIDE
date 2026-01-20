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
    name: 'simple_counter',
    type: 'folder',
    children: [
      {
        id: 'Cargo.toml',
        name: 'Cargo.toml',
        type: 'file',
        language: 'toml',
        content: `[package]
name = "simple_counter"
version = "0.1.0"
edition = "2021"

[dependencies]
casper-contract = "5.0"
casper-types = "6.0"

[profile.release]
lto = true
codegen-units = 1
opt-level = "z"

[lib]
crate-type = ["cdylib"]`
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

use casper_contract::contract_api::{runtime, storage};
use casper_types::Key;

const COUNTER_KEY: &str = "counter";

#[no_mangle]
pub extern "C" fn call() {
    // Initialize counter to 0
    let counter: u64 = 0;
    
    // Store the counter in the account's named keys
    let counter_uref = storage::new_uref(counter);
    let counter_key = Key::URef(counter_uref);
    
    // Save the key under the name "counter"
    runtime::put_key(COUNTER_KEY, counter_key);
}
`
          }
        ]
      },
      {
        id: 'README.md',
        name: 'README.md',
        type: 'file',
        language: 'markdown',
        content: `# Simple Counter Contract

A basic Casper 2.0 smart contract that initializes a counter to 0.

## Features
- No runtime arguments required
- Simple deployment
- Uses casper-contract 5.0 / casper-types 6.0

## Deploy
1. Click "Compile" to build the WASM
2. Connect your wallet
3. Click "Deploy Contract"
4. Default payment is 150 CSPR
`
      }
    ]
  }
];