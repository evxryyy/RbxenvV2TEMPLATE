# Resolver Test Results

### `containNestedArray`

`containNestedArray` works correctly with the following argument:

```ts
[
    { Type: "Array", Types: ["Bool1"] }
]
```

To be clear, this function is generally unreliable when used directly. In `iterateArray`, the function receives the inner array directly (i.e., `.Types`, not the original array). In this case, the result is `true`, which is correct.

---
 
### `iterateArray` [Patch deployed]

The function now works perfectly. I just need to update the documentation, and everything should be resolved.

---

### `iterateStruct` (Rework needed, when an array is detected.) 

The function works, but a bug has been identified when an array is included in the schema. The iteration incorrectly handles the :<count> pattern because it depended on iterateArray. This will no longer be the case after the fix. The patch may take a little while.

---

### `resolveArray`

Works perfectly, including with `nested arrays`. The `:<count>` pattern also works as expected.

---

### `resolveStruct` [Patch deployed]

The function now works correctly, but further testing will be performed.

---

### `resolveArraySchema`

Works correctly without any issues.

---

### `resolveBytesNeeded`

Tested with all supported types, except `Array` and `Struct`, since these types are not allowed. Everything works as expected.

---

### `resolveStructSchema`

Works perfectly.

---

### `resolveValueType`

No particular issues have been identified with this function.