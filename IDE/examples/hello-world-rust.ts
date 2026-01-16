// Simple Counter Contract (Rust) - No Arguments Required
export const helloWorldRustExample = {
    'Cargo.toml': `[package]
name = "simple_counter"
version = "0.1.0"
edition = "2021"

[dependencies]
casper-contract = "3.0.0"
casper-types = "3.0.0"
wee_alloc = "0.4.5"

[lib]
crate-type = ["cdylib"]`,

    'src/main.rs': `#![no_std]
#![no_main]

#[cfg(not(target_arch = "wasm32"))]
compile_error!("target arch should be wasm32: compile with '--target wasm32-unknown-unknown'");

extern crate alloc;

use casper_contract::{
    contract_api::{runtime, storage},
};
use casper_types::Key;

// Use wee_alloc as the global allocator
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Panic handler for no_std
#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

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
}`
};
