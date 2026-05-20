# Firestore Security Specification

## 1. Data Invariants
- Each member profile must contain a valid, alphanumeric `id`, `mid`, `name`, `bial`, and an `updatedAt` field.
- Document IDs must match the `id` field exactly.
- String fields like `name` and `mid` must have a length of at least 1 and at most 256 characters.
- All timestamps represent string dates or ISO values.

## 2. The "Dirty Dozen" Vulnerability Payloads
Below are 12 malicious payloads designed to test validation bounds:
1. **Empty Name**: `{ "id": "m1", "mid": "EB1", "name": "", "bial": "Bial 1", "updatedAt": "2026-05-20" }` (Should fail validation)
2. **Missing Required Field**: `{ "id": "m2", "mid": "EB2", "name": "John" }` (Should fail as `updatedAt` is missing)
3. **Poison Document ID**: Injecting custom document ID path with junk symbols (Should fail regex checks)
4. **Huge String Value**: `{ "id": "m3", "mid": "EB3", "name": "A".repeat(10000) }` (Should fail string size check)
5. **Malformed Fields**: Passing integer values for string fields (Should fail type matching)
6. **Unknown Fields / Shadow Fields**: `{ "id": "m4", "name": "Jane", "adminOverride": true }` (Should fail strict keys)
7. **Invalid ID Mismatch**: Trying to write member `m5` in document path `m6` (ID mismatch check)
8. **Negative Date Values**
9. **SQL injection strings in keys**
10. **Array payload instead of map**
11. **Malicious override of key metadata**
12. **Tampered updatedAt payload**

## 3. Firestore Rules Solution
We will write a robust validator `isValidMember` in `firestore.rules`.
