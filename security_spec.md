# Firestore Security Specification

## Data Invariants
1. A Bus must have a valid name, registration number, and capacity.
2. A Route must have a valid origin, destination, and fare.
3. A Schedule must reference a valid Bus and Route.
4. Timestamps (createdAt, updatedAt) must be server-generated.

## The Dirty Dozen Payloads (Attack Vectors)
1. **Unauthenticated Write**: Attempting to create a bus without a session.
2. **Identity Spoofing**: Attempting to create a bus as one user but setting `owner_id` to another.
3. **Large Payload**: Injecting a 1MB string into the `name` field to cause resource exhaustion.
4. **Invalid Type**: Sending a string for `capacity` when an integer is expected.
5. **ID Poisoning**: Using a 2KB string as a document ID.
6. **Orphaned Schedule**: Creating a schedule with a `bus_id` that doesn't exist.
7. **Future/Past Timestamp**: Spoofing `createdAt` to a date in 2030.
8. **Field Injection**: Adding a `role: 'admin'` field to a document where it doesn't belong.
9. **Bulk Read**: Attempting to list all buses without authorization (if restricted).
10. **State Skipping**: Changing a schedule status from 'Scheduled' to 'Completed' without proper authorization.
11. **Negative Fare**: Setting a route fare to a negative value.
12. **Zero Capacity**: Setting a bus capacity to 0.

## Corrective Actions
- Implement `isValidBus`, `isValidRoute`, `isValidSchedule` helpers.
- Use `request.time` for timestamps.
- Use `affectedKeys().hasOnly()` for updates.
- Verify IDs match the pattern `^[a-zA-Z0-9_\\-]+$`.
