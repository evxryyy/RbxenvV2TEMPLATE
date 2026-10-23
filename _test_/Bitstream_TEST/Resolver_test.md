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

### `containNestedStruct`

```ts
{
    Type : "Struct",
    Fields : {
        Data : {
            Type : "Struct",
            Fields : {...}
        }
    }
}
```

Same as `containNestedArray` is not generally unreliable when used directly. In `iterateStruct` the function receives the inner struct directly (i.e.,`.Struct`, not the original array), In this case the result is also `true`, which is correct.

Not allowed struct schema example :

```ts
{
    Type : "Struct",
    Fields : {
        Data : {
            Type : "Struct",
            Fields : {
                SubData : Type : "Struct",
                Fields : {
                    DeepSubData : "Bool1"
                }
            }
        }
    }
}
```


---
 
### `iterateArray` [Patch deployed]

The function now works perfectly. I just need to update the documentation, and everything should be resolved.

---

### `iterateStruct` [Path deployed]

The function works correctly. I'm still using `iterateArray`, but i've found a better solution to the bug instead of creating separate functions.

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