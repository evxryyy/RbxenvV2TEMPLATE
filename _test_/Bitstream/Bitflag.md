# Bitflag Tests & Benchmarks

## Test Cases

`Bitflag` is now fully implemented and functional. All test cases have been executed successfully, with the expected results.

---

## Benchmarks

This section provides an overview of the performance of the main `Bitflag` operations, including buffer initialization, flag manipulation, and schemaless serialization.

All benchmarks use **100,000 iterations** to evaluate execution time and throughput under repeated workloads.

### `initBufferFlag`

The first benchmark evaluates the initialization cost of `initBufferFlag` with different buffer sizes.

**Empty Buffer (0 bytes)**

**Benchmark setup:**

```ts
const result = Benchmark.executeFunction({
    func: (i: number) => {
        const _ = Bitflag.initBufferFlag(0)
    },
    iterations: 100_000,
    bytesPerOp: 0
})
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~14ms (avg)
+ Operations/sec:   6,799,206 ops/s
+ Time/Operation:   0.000147ms
```

**Larger Buffer (256 bytes)**

To evaluate how initialization scales with buffer size, let's increase the allocation to 256 bytes.

**Benchmark setup:**

```ts
const result = Benchmark.executeFunction({
    func: (i: number) => {
        const _ = Bitflag.initBufferFlag(256)
    },
    iterations: 100_000,
    bytesPerOp: 256
})
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~32ms (avg)
+ Operations/sec:   3,041,159 ops/s
+ Time/Operation:   0.000329ms
+ Throughput:       742.47 MB/s
```

These results are expected for an initialization function that creates and returns a dictionary containing the required buffer metadata. The additional allocation cost is reflected in the larger-buffer benchmark.

---

### `writeFlag`

This benchmark measures the cost of writing a flag into an initialized buffer.

**Benchmark setup:**

```ts
const result = Benchmark.executeFunction({
    func: (i: number) => {
        const _ = Bitflag.initBufferFlag(1)
        Bitflag.writeFlag(_, "U8")
    },
    iterations: 100_000,
    bytesPerOp: 1
})
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~37ms (avg)
+ Operations/sec:   2,667,108 ops/s
+ Time/Operation:   0.000375ms
+ Throughput:       2.54 MB/s
```

The benchmark includes both `initBufferFlag` and `writeFlag`. Considering that two operations are executed on every iteration, the results provide a good indication of the low overhead involved in flag initialization and writing.

#### `writeMarker`

`writeMarker` achieves approximately the same performance as `writeFlag`, with similar execution times and throughput.

---

### `writeStruct`

Unlike the previous operations, `writeStruct` is designed specifically for **schemaless serialization**.

The following benchmarks evaluate its performance with different payload sizes and structures.

> [!NOTE]
> Running `writeStruct` 100,000 times is not representative of a typical application workload. These iterations are used strictly for benchmarking purposes, allowing us to evaluate serialization performance under repeated execution without relying on a dedicated warm-up phase.

#### Larger Payload

**Benchmark setup:**

```ts
const result = Benchmark.executeFunction({
    func: (i: number) => {
        const compiled = Bitflag.writeStruct({
            structFields: {
                DataArray: [10, 11, 12, 13, 14, 15],
                DataName: "DataTestName",
                DataStruct: {
                    DataSubArray: [0.10, 0.11, 0.12, 0.13, 0.14, 0.15],
                    DataSubName: "DataSubTestName"
                }
            }
        })
    },
    iterations: 100_000,
    bytesPerOp: 79
})
```

Before looking at the results, there is an important detail regarding the payload size.

The benchmark uses **79 bytes per operation**, which accounts for the complete serialized representation, not just the raw values.

Since `writeStruct` performs schemaless serialization, the resulting buffer also contains additional metadata, including:
- Markers and flags.
- Array boundaries.
- Nested structure boundaries.
- Dictionary keys (entry names).
- Serialized values.

For the current payload, the generated schema looks approximately like this:

```ts
{
    "String:12",
    "SUB_STRUCT_START",
    "ARRAY_START",
    "F8",
    "F8",
    "F8",
    "F8",
    "F8",
    "F8",
    "ARRAY_END",
    "String:15",
    "SUB_STRUCT_END",
    "ARRAY_START",
    "U8",
    "U8",
    "U8",
    "U8",
    "U8",
    "U8",
    "ARRAY_END"
}
```

The entries are not necessarily serialized in this exact order. Their ordering does not matter as long as the resulting data can be correctly reconstructed during deserialization.

**Results — 100K iterations:**

```diff
- Total Time:       ~1,414ms (avg)
- Operations/sec:   70,698 ops/s
+ Time/Operation:   0.014145ms
+ Throughput:       5.33 MB/s
```

#### Smaller Payload

Now let's evaluate the same operation with a simpler structure containing fewer fields.

**Benchmark setup:**

```ts
const bytesTotal = 31

const result = Benchmark.executeFunction({
    func: (i: number) => {
        const compiled = Bitflag.writeStruct({
            structFields: {
                DataArray: [10, 11, 12, 13, 14, 15],
                DataName: "DataTestName",
            }
        })
    },
    iterations: 100_000,
    bytesPerOp: bytesTotal
})
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~712ms (avg)
+ Operations/sec:   140,283 ops/s
+ Time/Operation:   0.007128ms
+ Throughput:       4.15 MB/s
```

As expected, the smaller payload requires less processing time per operation. The difference also highlights the additional overhead introduced by nested structures and their associated metadata.

---

### `readFlag`

This benchmark measures flag deserialization using `readFlag`.

However, it is important to account for the additional operations executed during each iteration.

The benchmark also calls:
- `initBufferFlag`
- `writeFlag`
- `readFlag`

Based on the previous results, initialization and writing already account for approximately 37ms of execution time. Reading adds further overhead on top of that.

**Benchmark setup:**

```ts
const bytesTotal = 1

const result = Benchmark.executeFunction({
    func: (i: number) => {
        const _ = Bitflag.initBufferFlag(1)
        Bitflag.writeFlag(_, "U8")
        Bitflag.readFlag(_, 0)
    },
    iterations: 100_000,
    bytesPerOp: bytesTotal
})
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~46ms (avg)
+ Operations/sec:   2,168,539 ops/s
+ Time/Operation:   0.000461ms
+ Throughput:       2.07 MB/s
```

The total execution time remains relatively low, even though three operations are executed sequentially on every iteration.

---

### `readStruct`

Like `writeStruct`, `readStruct` is designed specifically for schemaless serialization.

Refer to the [`writeStruct`](#writestruct) section for more details about the serialization format, generated metadata, and payload size calculations.

The following benchmarks evaluate deserialization with two different payload sizes.

#### Smaller Payload

**Benchmark setup:**

```ts
const bytesTotal = 31

const result = Benchmark.executeFunction({
    func: (i: number) => {
        const _ = Bitflag.readStruct({
            sourceBuffer: Bitflag.writeStruct({
                structFields: {
                    DataArray: [10, 11, 12, 13, 14, 15],
                    DataName: "DataTestName",
                }
            }),
            sourceOffset: 0,
        })
    },
    iterations: 100_000,
    bytesPerOp: bytesTotal
})
```

**Results — 100K iterations:**

```diff
+ Total Time:       ~977ms (avg)
+ Operations/sec:   96,328 ops/s
+ Time/Operation:   0.010381ms
+ Throughput:       2.85 MB/s
```

#### Larger Payload

Let's now evaluate `readStruct` using the same payload as the larger `writeStruct` benchmark.

**Benchmark setup:**

```ts
const bytesTotal = 79

const result = Benchmark.executeFunction({
    func: (i: number) => {
        const _ = Bitflag.readStruct({
            sourceBuffer: Bitflag.writeStruct({
                structFields: {
                    DataArray: [10, 11, 12, 13, 14, 15],
                    DataName: "DataTestName",
                    DataStruct: {
                        DataSubArray: [0.10, 0.11, 0.12, 0.13, 0.14, 0.15],
                        DataSubName: "DataSubTestName"
                    }
                }
            }),
            sourceOffset: 0,
        })
    },
    iterations: 100_000,
    bytesPerOp: bytesTotal
})
```

**Results — 100K iterations:**

```diff
- Total Time:       ~2,027.576ms (avg)
- Operations/sec:   49,320 ops/s
+ Time/Operation:   0.020276ms
+ Throughput:       3.72 MB/s
```

The execution time is significantly higher than in the smaller-payload benchmark. However, this is expected given the additional complexity of the data structure.

One important detail is that this benchmark does not measure `readStruct` in isolation. Every iteration performs both serialization and deserialization because `writeStruct` is called directly inside `readStruct`'s benchmark function.

Consequently, the measured execution time includes:
- Buffer creation and initialization.
- Schemaless serialization through `writeStruct`.
- Metadata and marker processing.
- Deserialization through `readStruct`.
- Reconstruction of nested arrays and structures.

The results should therefore be interpreted as the combined cost of a complete serialization/deserialization cycle, rather than the isolated performance of `readStruct`.

For a more accurate evaluation of deserialization performance alone, the source buffer should be generated once outside the benchmark loop and reused across all iterations.