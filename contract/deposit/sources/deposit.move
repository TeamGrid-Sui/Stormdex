module deposit::deposit {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::vec_set::{Self, VecSet};

    // Error codes
    const EIncorrectAmount: u64 = 1;

    // Constant for deposit amount (0.01 SUI = 10,000,000 MIST)
    const DEPOSIT_AMOUNT: u64 = 10_000_000;

    // Struct to store the owner's address and list of depositors
    public struct DepositRegistry has key {
        id: UID,
        owner_address: address,
        depositors: VecSet<address>,
    }

    // Initialize the registry when the module is published
    fun init(ctx: &mut TxContext) {
        let registry = DepositRegistry {
            id: object::new(ctx),
            owner_address: tx_context::sender(ctx), // Set to the publisher's address
            depositors: vec_set::empty(),
        };
        transfer::share_object(registry);
    }

    // Function to deposit exactly 0.01 SUI
    public entry fun deposit(coin: Coin<SUI>, registry: &mut DepositRegistry, ctx: &mut TxContext) {
        // Verify the coin value is exactly 0.01 SUI (10,000,000 MIST)
        assert!(coin::value(&coin) == DEPOSIT_AMOUNT, EIncorrectAmount);

        let sender = tx_context::sender(ctx);
        // Only insert if not already present
        if (!vec_set::contains(&registry.depositors, &sender)) {
            vec_set::insert(&mut registry.depositors, sender);
        };

        // Transfer the coin to the owner's address
        transfer::public_transfer(coin, registry.owner_address);
    }

    // Function to view the list of depositors (optional, for transparency)
    public fun get_depositors(registry: &DepositRegistry): &VecSet<address> {
        &registry.depositors
    }
}