// Hello World Contract Example (Rust)
export const helloWorldRustExample = {
  'Cargo.toml': `[package]
name = "hello_world"
version = "0.1.0"
edition = "2021"

[dependencies]
casper-contract = "1.4.4"
casper-types = "1.5.0"

[lib]
crate-type = ["cdylib"]`,
  
  'src/main.rs': `#![no_std]
#![no_main]

#[cfg(not(target_arch = "wasm32"))]
compile_error!("target arch should be wasm32: compile with '--target wasm32-unknown-unknown'");

extern crate alloc;
use alloc::string::String;
use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{Key, URef};

const MESSAGE_KEY: &str = "message";

#[no_mangle]
pub extern "C" fn call() {
    let message: String = runtime::get_named_arg("message");
    
    // Store the message
    let message_uref: URef = storage::new_uref(message);
    runtime::put_key(MESSAGE_KEY, Key::URef(message_uref));
    
    runtime::print("Hello World contract executed successfully!");
}

#[no_mangle]
pub extern "C" fn get_message() {
    let message_key: Key = runtime::get_key(MESSAGE_KEY)
        .unwrap_or_revert();
    let message_uref: URef = message_key.into_uref().unwrap_or_revert();
    let message: String = storage::read(message_uref)
        .unwrap_or_revert()
        .unwrap_or_revert();
    
    runtime::ret(casper_types::CLValue::from_t(message).unwrap_or_revert());
}`
};

