// Upgradeable Counter V1 - Casper 2.0 (casper-contract 5.0 + casper-types 6.0)
export const upgradeableCounterV1 = {
    'Cargo.toml': `[package]
name = "upgradeable_counter"
version = "1.0.0"
edition = "2021"

[dependencies]
casper-contract = "5.0"
casper-types = "6.0"

[profile.release]
lto = true
codegen-units = 1
opt-level = "z"

[lib]
crate-type = ["cdylib"]`,

    'src/main.rs': `#![no_std]
#![no_main]

extern crate alloc;

use alloc::string::String;
use alloc::vec;
use casper_contract::contract_api::{runtime, storage};
use casper_contract::unwrap_or_revert::UnwrapOrRevert;
use casper_types::{
    contracts::{EntryPoint, EntryPoints, NamedKeys},
    EntryPointAccess, EntryPointType, CLType, Key, URef,
};

const COUNTER_KEY: &str = "counter";

fn get_entry_points() -> EntryPoints {
    let mut entry_points = EntryPoints::new();

    entry_points.add_entry_point(EntryPoint::new(
        String::from("increment"),
        vec![],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        String::from("get_count"),
        vec![],
        CLType::U64,
        EntryPointAccess::Public,
        EntryPointType::Called,
    ));

    entry_points
}

#[no_mangle]
pub extern "C" fn increment() {
    let counter_uref: URef = runtime::get_key(COUNTER_KEY)
        .and_then(|key| key.into_uref())
        .unwrap_or_revert();
    let current: u64 = storage::read(counter_uref)
        .unwrap_or_revert()
        .unwrap_or(0u64);
    storage::write(counter_uref, current + 1);
}

#[no_mangle]
pub extern "C" fn get_count() {
    let counter_uref: URef = runtime::get_key(COUNTER_KEY)
        .and_then(|key| key.into_uref())
        .unwrap_or_revert();
    let count: u64 = storage::read(counter_uref)
        .unwrap_or_revert()
        .unwrap_or(0u64);
    runtime::ret(casper_types::CLValue::from_t(count).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn call() {
    let counter_uref = storage::new_uref(0u64);
    let counter_key = Key::URef(counter_uref);
    
    let mut named_keys = NamedKeys::new();
    named_keys.insert(String::from(COUNTER_KEY), counter_key);
    
    let entry_points = get_entry_points();
    
    let (stored_contract_hash, _) = storage::new_contract(
        entry_points.into(),
        Some(named_keys.into()),
        Some(String::from("counter_package")),
        Some(String::from("counter_access_uref")),
        None,
    );
    
    runtime::put_key("counter_contract", stored_contract_hash.into());
}`,

    'README.md': `# Upgradeable Counter V1 - Casper 2.0
`
};
