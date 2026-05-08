# Security Specification for SpendWise

## Data Invariants
- A transaction or subscription MUST belong to a valid user document.
- Users can only read and write their own data.
- Budget (monthlyLimit) must be a positive number.
- Transaction amount must be a number (positive or negative, usually positive).

## The "Dirty Dozen" Payloads
1. **The Identity Thief**: Try to create a transaction in another user's path.
2. **The Shadow Field**: Try to add `isAdmin: true` to a User document.
3. **The Budget Bloater**: Try to set `monthlyLimit` to a negative number or a massive string.
4. **The Orphaned Write**: Try to create a transaction for a user ID that doesn't have a registered `/users/{userId}` document.
5. **The Ghost Transaction**: Try to update a transaction to change its `userId` (not possible by path, but could try via fields if we checked them).
6. **The PII Scraper**: Try to 'list' all documents in `/users` to find emails.
7. **The Recursive Cost Attack**: Try to inject long strings into document IDs.
8. **The Type Injection**: Try to set `amount` as a string instead of a number.
9. **The State Skipper**: (N/A for this app simple structure).
10. **The Update Gap**: Try to update a transaction but leave out required fields (if using strict matches).
11. **The Email Spoof**: Access restricted data with an unverified email.
12. **The Date Poisoner**: Try to set a future date or invalid format (checked by rules logic).

## The Test Runner
(See `firestore.rules.test.ts` for implementation)
