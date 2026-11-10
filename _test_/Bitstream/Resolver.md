# Resolver Tests & Benchmarks

## Test Cases

This section covers the test results for the main `Resolver` functions, including nested structures, schema iteration, and schema resolution.

### `containNestedArray`

`containNestedArray` works correctly with the following argument:

```ts
[
    { Type: "Array", Types: ["Bool1"] }
]
```

However, this function must be called with the expected input structure.

When used inside `iterateArray`, it receives the inner array directly (i.e. `.Types`) rather than the original array schema. In this context, the function correctly returns `true`.

This distinction is important when testing the function independently, as the expected result depends on the structure passed to it.

---

### `containNestedStruct`

The following nested structure is correctly detected:

```ts
{
    Type: "Struct",
    Fields: {
        Data: {
            Type: "Struct",
            Fields: {...}
        }
    }
}
```

As with `containNestedArray`, the function must receive the expected structure.

Inside `iterateStruct`, it receives the inner struct directly (i.e. `.Struct`), rather than the original schema. In this context, it correctly returns `true`.

**Unsupported struct schema example:**

```ts
{
    Type: "Struct",
    Fields: {
        Data: {
            Type: "Struct",
            Fields: {
                SubData: {
                    Type: "Struct",
                    Fields: {
                        DeepSubData: "Bool1"
                    }
                }
            }
        }
    }
}
```

This example represents a struct nesting configuration that is not supported.

---

### `iterateArray`

The function now works as expected, including the previously problematic cases.

Only the documentation needs to be updated before this part is considered fully resolved.

---

### `iterateStruct`

The function now works correctly.

It still relies on `iterateArray` for array processing, but I found a better solution to the original bug without introducing separate functions for each case.

---

### `resolveArray`

Works as expected, including nested arrays.

The `:<count>` syntax is also fully supported and behaves correctly.

---

### `resolveStruct`

The function now works correctly. Additional testing will still be performed to ensure that all edge cases are covered.

---

### `resolveArraySchema`

Works correctly without any identified issues.

---

### `resolveBytesNeeded`

Tested with all supported types, except `Array` and `Struct`, since these types are not supported by this function.

All tested cases produce the expected results.

---

### `resolveStructSchema`

Works as expected, with no identified issues.

---

### `resolveValueType`

No particular issues have been identified during testing.

---

## Benchmarks

The following benchmarks evaluate the performance of the main `Resolver` operations.

Results are provided for both **100K and 10K iterations** to illustrate execution time under different workloads.

---

### `iterateArray`

#### Nested Array Schema

**Schema used:**

```ts
const arraySchema: ArraySchema = {
    Type: "Array",
    Types: [
        { Type: "Array", Types: ["Bool1:2"] },
        { Type: "Array", Types: ["PrefixedString:3"] },
        "U8",
    ]
}
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~246ms (avg)
+ Operations/sec:   404,914 ops/s
+ Time/Operation:   0.002470ms
```

**Results — 10K iterations:**

```diff
+ Total Time:       ~30ms (avg)
+ Operations/sec:   323,460 ops/s
+ Time/Operation:   0.003092ms
```

#### Simple Array Schema

Now let's test a simpler schema without nested arrays.

**Schema used:**

```ts
const arraySchema: ArraySchema = {
    Type: "Array",
    Types: [
        "U8:3",
    ]
}
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~103ms (avg)
+ Operations/sec:   963,836 ops/s
+ Time/Operation:   0.001038ms
```

**Results — 10K iterations:**

```diff
+ Total Time:       ~13ms (avg)
+ Operations/sec:   804,868 ops/s
+ Time/Operation:   0.001242ms
```

#### Performance Notes

Overall, the results are good.

The `:<count>` pattern introduces a small amount of additional processing overhead. Nevertheless, I still recommend using it to avoid unnecessary schema repetition.

For example, the following is the **recommended approach**:

```ts
const arraySchema: ArraySchema = {
    Type: "Array",
    Types: [
        "U8:3"
    ]
}
```

This is preferable to manually repeating the same type:

```ts
const arraySchema: ArraySchema = {
    Type: "Array",
    Types: [
        "U8", "U8", "U8"
    ]
}
```

The `:<count>` syntax keeps schemas more compact and easier to maintain, while introducing only a small performance overhead.

No bugs or unexpected behavior were detected during these benchmarks.

---

### `iterateStruct`

#### Nested Struct and Array Schema

**Schema used:**

```ts
const structSchema: StructSchema = {
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

**Results — 100K iterations:**

```diff
+ Total Time:       ~237ms (avg)
+ Operations/sec:   421,350 ops/s
+ Time/Operation:   0.002373ms
```

**Results — 10K iterations:**

```diff
+ Total Time:       ~46ms (avg)
+ Operations/sec:   213,240 ops/s
+ Time/Operation:   0.004690ms
```

#### Simple Struct Schema

Now let's test a simpler schema without nested structs or nested arrays, containing only direct types.

**Schema used:**

```ts
const structSchema: StructSchema = {
    Type: "Struct",
    Fields: {
        DataIds: {
            Type: "Array",
            Types: ["PrefixedString:3"]
        },
    }
}
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~140ms (avg)
+ Operations/sec:   713,546 ops/s
+ Time/Operation:   0.001401ms
```

**Results — 10K iterations:**

```diff
+ Total Time:       ~18ms (avg)
+ Operations/sec:   543,419 ops/s
+ Time/Operation:   0.001840ms
```

#### Performance Notes

Overall, the results are also good.

Interestingly, `iterateStruct` performs slightly better than `iterateArray` at 100K iterations, despite processing a more complex schema.

This can be explained by the fact that `iterateStruct` performs fewer checks in its current implementation.

No bugs or unexpected behavior were detected during these benchmarks.

---

### `resolveArray`

#### Nested Array Schema

**Schema used:**

```ts
const arraySchema: ArraySchema = {
    Type: "Array",
    Types: [
        { Type: "Array", Types: ["Bool1"] },
        {
            Type: "RotationCurveKey:2",
            Option: "Quaternion"
        },
        "U8",
    ]
}
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~150ms (avg)
+ Operations/sec:   662,489 ops/s
+ Time/Operation:   0.001509ms
```

**Results — 10K iterations:**

```diff
+ Total Time:       ~16ms (avg)
+ Operations/sec:   590,759 ops/s
+ Time/Operation:   0.001693ms
```

#### Performance Notes

Excellent results for this function, especially considering the nested array and the additional `Quaternion` option.

No bugs or unexpected behavior were detected during testing.

No separate benchmark was performed with a simple schema. However, regardless of whether 100K or 10K iterations are used, execution time rarely exceeds 20ms.

---

### `resolveStruct`

#### Nested Struct and Array Schema

**Schema used:**

```ts
const structSchema: StructSchema = {
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
            Types: ["PrefixedString:3"]
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

**Results — 100K iterations:**

```diff
+ Total Time:       ~353ms (avg)
+ Operations/sec:   282,766 ops/s
+ Time/Operation:   0.003536ms
```

**Results — 10K iterations:**

```diff
+ Total Time:       ~58ms (avg)
+ Operations/sec:   170,969 ops/s
+ Time/Operation:   0.005849ms
```

#### Performance Notes

Overall, the results are moderate when processing larger and more complex schemas.

The additional overhead is expected due to nested structures, array processing, and the increased number of fields that need to be resolved.

---

### `resolveArraySchema`

This benchmark evaluates schemaless array resolution using a mixed collection of values.

**Input array:**

```ts
[
    [true],
    10, 15, 20,
    "Hello World",
    new CFrame(0, 0, 0)
]
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~551ms (avg)
+ Operations/sec:   181,268 ops/s
+ Time/Operation:   0.005517ms
```

**Results — 10K iterations:**

```diff
+ Total Time:       ~121ms (avg)
+ Operations/sec:   82,618 ops/s
+ Time/Operation:   0.012104ms
```

#### Performance Notes

Good results for a schemaless resolution function.

Some types, such as `CFrame`, or other types requiring additional options and processing, can introduce more overhead.

Nevertheless, the overall execution time remains reasonable considering that the function needs to inspect and resolve values dynamically without a predefined schema.

---

### `resolveStructSchema`

This benchmark evaluates schemaless struct resolution using a nested dictionary.

**Input dictionary:**

```ts
{
    DataSecondary: {
        SubData: "Hello World"
    },
    DataIds: [10, 15, 20],
}
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~475ms (avg)
+ Operations/sec:   210,087 ops/s
+ Time/Operation:   0.004760ms
```

**Results — 10K iterations:**

```diff
+ Total Time:       ~96ms (avg)
+ Operations/sec:   103,098 ops/s
+ Time/Operation:   0.009699ms
```

#### Performance Notes

Very good results for a schemaless resolution function, especially considering the nested dictionary and dynamic type resolution.

---

## Other Functions

The following functions will not be benchmarked:

- `resolveValueType`
- `resolveBytesNeeded`
- `containNestedArray`
- `containNestedStruct`

These functions execute quickly enough that benchmarking them would provide limited additional insight.

Their execution time is generally below approximately 15ms, making them less relevant for a performance comparison at this stage.

---

## Summary

The current `Resolver` implementation performs well across both schema-based and schemaless operations.

The benchmarks highlight a few key points:

- Nested arrays and structs introduce additional processing overhead, as expected.
- The `:<count>` syntax introduces a small cost but remains the recommended approach for cleaner and more maintainable schemas.
- `iterateArray` and `iterateStruct` show good performance, even with nested structures.
- `resolveArray` and `resolveStruct` handle complex schemas with reasonable execution times.
- Schemaless resolution introduces additional overhead because values must be inspected and resolved dynamically.

Overall, the tested functions behave as expected, with no remaining benchmark-related issues identified.