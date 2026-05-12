# Security Specification - SpendWise

## Data Invariants
- A `Transaction` or `Subscription` must belong to exactly one `User`.
- `Transaction.amount` must be a positive number.
- `User.monthlyLimit` must be a positive number.
- `Subscription.dayOfMonth` must be between 1 and 31.
- `date` fields must be valid ISO strings.
- Only the owner of a `users/{userId}` document can read or write to it and its subcollections.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a transaction for another user.
   - `POST /users/attacker-uid/transactions` with `auth.uid = victim-uid` -> DENIED.
2. **Shadow Field Injection**: Attempt to add `isAdmin: true` to a user profile.
   - `PATCH /users/my-uid` with `{ isAdmin: true }` -> DENIED (strict keys).
3. **Ghost Transaction**: Create a transaction without a vendor.
   - `POST /users/my-uid/transactions` with missing `vendor` -> DENIED.
4. **Negative Spending**: Set transaction amount to -100.
   - `POST /users/my-uid/transactions` with `amount: -100` -> DENIED.
5. **Orphaned Metadata**: Write to a random top-level collection.
   - `POST /audit_logs` -> DENIED (default deny).
6. **Large ID Poisoning**: Create a document with a 2KB ID.
   - `PUT /users/LONG_ID...` -> DENIED (`isValidId`).
7. **Type Mismatch**: Send a string for `amount`.
   - `POST /users/my-uid/transactions` with `amount: "100"` -> DENIED.
8. **Invalid Recurrence**: `dayOfMonth: 45`.
   - `POST /users/my-uid/subscriptions` with `dayOfMonth: 45` -> DENIED.
9. **Email Spoofing**: Update another user's email.
   - `PATCH /users/victim-uid` with `{ email: "attacker@evil.com" }` -> DENIED.
10. **Resource Exhaustion**: Send a transaction with 1MB description.
    - `POST /users/my-uid/transactions` with `description: "A".repeat(1000000)` -> DENIED.
11. **Future Invariant Breach**: Set `createdAt` to a date in 1990.
    - `POST /users/my-uid` with `createdAt: "1990-01-01"` -> DENIED (`request.time`).
12. **Unauthorized List Query**: Authenticated user trying to list all transactions across all users.
    - `GET /users/victim-uid/transactions` -> DENIED.

## Test Strategy
The rules will ensure that all operations are scoped to the `request.auth.uid`.
Validation helpers will enforce schema integrity.
Strict key checks via `affectedKeys().hasOnly()` will prevent shadow fields.
