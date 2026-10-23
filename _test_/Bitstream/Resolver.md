# Resolver Test & Benchmark

## Test-case

###  `containNestedArray`

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
 
### `iterateArray`

The function now works perfectly. I just need to update the documentation, and everything should be resolved.

---

### `iterateStruct`

The function works correctly. I'm still using `iterateArray`, but i've found a better solution to the bug instead of creating separate functions.

---

### `resolveArray`

Works perfectly, including with `nested arrays`. The `:<count>` pattern also works as expected.

---

### `resolveStruct`

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

## Benchmark

## Results for `iterateArray`

Schema used:

```ts
let arraySchema: ArraySchema = {
    Type: "Array",
    Types: [
        { Type: "Array", Types: ["Bool1:2"] },
        { Type: "Array", Types: ["PrefixedString:3"] },
        "U8",
    ]
}
```

Results for `100K` iterations:

```diff
+ Total Time: avg ~ 246ms
+ Operations per sec: 404914 ops/s
+ Time/Operation: avg ~ 0.002470ms
```

Results for `10K` iterations:

```diff
+ Total Time: avg ~ 30ms
+ Operations per sec: 323460 ops/s
+ Time/Operation: avg ~ 0.003092ms
```

Now, let's test a simple schema without nested arrays.

Schema used:

```ts
let arraySchema: ArraySchema = {
    Type: "Array",
    Types: [
        "U8:3",
    ]
}
```

Results for `100K` iterations:

```diff
+ Total Time: avg ~ 103ms
+ Operations/sec: 963836 ops/s
+ Time/Operation: 0.001038ms
```

Results for `10K` iterations:

```diff
+ Total Time: avg ~ 13ms
+ Operations/sec: 804868 ops/s
+ Time/Operation: 0.001242ms
```

Overall, the results are good. Unfortunately, the `:<count>` pattern introduces a slight amount of latency. Nevertheless, I still recommend using it to avoid unnecessary repetition.

For example, the following is the **recommended approach**:

```ts
let arraySchema: ArraySchema = {
    Type: "Array",
    Types: [
        "U8:3"
    ]
}
```

This is much better than the following approach:

```ts
let arraySchema: ArraySchema = {
    Type: "Array",
    Types: [
        "U8", "U8", "U8"
    ]
}
```

No bugs or issues were detected during the `iterateArray` benchmarks.

---

## Results for `iterateStruct`

Schema used:

```ts
let structSchema: StructSchema = {
    Type: "Struct",
    Fields: {
        DataSecondary: {
            Type: "Struct",
            Fields: {
                SubData: "PrefixedString"
            }
        },
        DataIds: {
            Type: "Array",
            Types: ["I8:2"]
        },
        NestedDataIds: {
            Type: "Array",
            Types: [
                {
                    Type: "Array",
                    Types: [
                        "F32:5"
                    ]
                }
            ]
        }
    }
}
```

Results for `100K` iterations:

```diff
+ Total Time: avg ~ 237ms
+ Operations/sec: 421350 ops/s
+ Time/Operation: 0.002373ms
```

Results for `10K` iterations:

```diff
+ Total Time: avg ~ 46ms
+ Operations/sec: 213240 ops/s
+ Time/Operation: 0.004690ms
```

Now, let's test a schema without nested structs or nested arrays, containing only direct types.

Schema used:

```ts
let structSchema: StructSchema = {
    Type: "Struct",
    Fields: {
        DataIds: {
            Type: "Array",
            Types: ["PrefixedString:3"]
        },
    }
}
```

Results for `100K` iterations:

```diff
+ Total Time: avg ~ 140ms
+ Operations/sec: 713546 ops/s
+ Time/Operation: 0.001401ms
```

Results for `10K` iterations:

```diff
+ Total Time: avg ~ 18ms
+ Operations/sec: 543419 ops/s
+ Time/Operation: 0.001840ms
```

Overall, the results are also good. Although it may seem surprising, `iterateStruct` performs better than `iterateArray` at `100K` iterations because `iterateStruct` performs fewer checks.

No bugs or issues were detected during the `iterateStruct` benchmarks.

---

**TODO**