# Bitflag Test & Benchmark

## Test-case

`Bitflag` is now fully functional. I've tested everything, and it all works as expected.

## Benchmark

## Results for `initBufferFlag`

Code used for testing:

```ts
let result = Benchmark.executeFunction({
    func: (i: number) => {
        let _ = Bitflag.initBufferFlag(0)
    },
    iterations: 100_000,
    bytesPerOp: 0
})
```

Results for `100K` iterations:

```diff
+ Total Time: avg ~ 14ms
+ Operations/sec: 6799206 ops/s
+ Time/Operation: 0.000147ms
```

Now, let's increase the buffer size significantly.

Code used:

```ts
let result = Benchmark.executeFunction({
    func: (i: number) => {
        let _ = Bitflag.initBufferFlag(256)
    },
    iterations: 100_000,
    bytesPerOp: 256
})
```

Results for `100K` iterations:

```diff
+ Total Time: avg ~ 32ms
+ Operations/sec: 3041159 ops/s
+ Time/Operation: 0.000329ms
+ Throughput: 742.47MB/s
```

These are normal results for a function that simply returns a dictionary containing the required values.

---

## Results for `writeFlag`

Code used:

```ts
let result = Benchmark.executeFunction({
    func: (i: number) => {
        let _ = Bitflag.initBufferFlag(1)
        Bitflag.writeFlag(_, "U8")
    },
    iterations: 100_000,
    bytesPerOp: 1
})
```

Results for `100K` iterations:

```diff
+ Total Time: avg ~ 37ms (initBufferFlag + writeFlag)
+ Operations/sec: 2667108 ops/s
+ Time/Operation: 0.000375ms
+ Throughput: 2.54MB/s
```

Excellent results considering that two functions are being executed.

### `writeMarker`

`writeMarker` achieves roughly the same performance metrics.

---

## Results for `writeStruct`

Code used:

```ts
let result = Benchmark.executeFunction({
    func: (i: number) => {
        let compiled = Bitflag.writeStruct({
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

I want to provide some additional context here. This function is designed specifically for **schemaless serialization**, and you would never realistically use it with `100K` iterations in a typical application. These iterations are purely for benchmarking purposes, allowing us to evaluate the performance impact even without a warm-up phase.

The benchmark uses `79` bytes per operation, which is accurate. However, the reason is that the buffer stores more than just the values themselves. It also contains markers, flags, and keys (the names of the entries in the dictionary).

For example, the schema generated for the current result looks like this:

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

The entries are not necessarily in the same order, but that does not matter as long as the result is correct.

Results for `100K` iterations with a larger payload:

```diff
- Total Time: avg ~ 1414ms
- Operations/sec: 70698 ops/s
+ Time/Operation: 0.014145ms
+ Throughput: 5.33MB/s
```

Now, let's look at the results with a smaller payload.

Code used:

```ts
let bytesTotal = 31
let result = Benchmark.executeFunction({
    func: (i: number) => {
        let compiled = Bitflag.writeStruct({
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

Results for `100K` iterations:

```diff
+ Total Time: avg ~ 712ms
+ Operations/sec: 140283 ops/s
+ Time/Operation: 0.007128ms
+ Throughput: 4.15MB/s
```

---

## Results for `readFlag`

Keep in mind that this benchmark also executes `initBufferFlag` and `writeFlag`. Therefore, at least 30ms of execution time is expected before accounting for `readFlag` itself, which adds approximately another 10–15ms.

Code used:

```ts
let bytesTotal = 1
let result = Benchmark.executeFunction({
    func: (i: number) => {
        let _ = Bitflag.initBufferFlag(1)
        Bitflag.writeFlag(_, "U8")
        Bitflag.readFlag(_, 0)
    },
    iterations: 100_000,
    bytesPerOp: bytesTotal
})
```

Results for `100K` iterations:

```diff
+ Total Time: avg ~ 46ms
+ Operations/sec: 2168539 ops/s
+ Time/Operation: 0.000461ms
+ Throughput: 2.07MB/s
```

Excellent results, even when executing three functions in sequence.

---

## Results for `readStruct`

As with `writeStruct`, this function is designed specifically for schemaless serialization. Refer to the `writeStruct` section for more details about how the data is encoded and why the payload size includes more than the actual values.

Code used:

```ts
let bytesTotal = 31
let result = Benchmark.executeFunction({
    func: (i: number) => {
        let _ = Bitflag.readStruct({
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

Results for `100K` iterations:

```diff
+ Total Time: avg ~ 977ms
+ Operations/sec: 96328 ops/s
+ Time/Operation: 0.010381ms
+ Throughput: 2.85MB/s
```

Now, let's look at the results with a larger payload, using the same data as in the `writeStruct` benchmark.

Code used:

```ts
let bytesTotal = 79
let result = Benchmark.executeFunction({
    func: (i: number) => {
        let _ = Bitflag.readStruct({
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

Results for `100K` iterations:

```diff
- Total Time: avg ~ 2027.576ms
- Operations/sec: 49320 ops/s
+ Time/Operation: 0.020276ms
+ Throughput: 3.72MB/s
```

The execution time is significantly higher, but this is entirely expected given the complexity of the function. The benchmark performs both serialization and deserialization on every iteration, since `writeStruct` is called inside `readStruct`.

To properly understand these results, it is important to consider the context provided in the `writeStruct` benchmark section.