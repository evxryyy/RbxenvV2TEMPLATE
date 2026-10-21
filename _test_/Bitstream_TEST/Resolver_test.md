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

### `iterateArray` (Fixed the bug, patch will be available soon.)

To be honest, I'm not satisfied with how this function was implemented. It works, but once a `nested array` is detected, the logic becomes a complete mess.

I'm currently reworking the function. The fix should be released tomorrow.

---

### `iterateStruct`

This is a basic function that works, but it is also affected by the `iterateArray` bug. Further testing is required.

---

### `resolveArray`

Works perfectly, including with `nested arrays`. The `:<count>` pattern also works as expected.

---

### `resolveStruct` [Should be fixed, Test tomorrow]

The function itself works, but several bugs were discovered over the weekend during in-depth testing. These will be fixed tomorrow.

**Bug:** When iterating over an array inside a struct, the array must use the `:<count>` pattern. Additionally, the result is not returned correctly.

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