# Constructor & Component Tests and Benchmarks

This page provides an overview of the tests and performance benchmarks for the `Bitstream` constructor and component operations.

> [!NOTE]
> This page does not include every individual test result. Instead, results are grouped by category.
>
> For example, `writeUnsignedInteger` and `readUnsignedInteger` may support multiple integer sizes. Only the most demanding case is presented to provide a representative performance overview.

---

## Constructor (`.init`)

Initializing a component is straightforward.

```ts
Bitstream.Constructor.init({
    Size: 0,
    UseAutoAllocation: false
})
```

Both parameters are required when initializing a component with a manually allocated buffer.

A component can also be initialized directly from an existing buffer:

```ts
Bitstream.Constructor.init({
    SourceBuffer: BUFFER,
    UseAutoAllocation: false
})
```

In this case, specifying `Size` is unnecessary, as the component automatically uses the size of the provided buffer.

### Benchmark

**Results:**

```diff
+ Iterations:       100,000
+ Bytes Per Op:     256
+ Total Time:       ~115.476ms (avg)
+ Time Per Op:      0.001155ms
+ Operations/sec:   865,984 ops/s
+ Throughput:       211.42 MB/s
```

**Benchmark setup:**

```ts
const component = Bitstream.Constructor.init({
    Size: 256,
    UseAutoAllocation: false
})
```

Performance varies depending on the allocated buffer size.

---

## Component Operations

Component benchmarks are organized by operation category and data type.

Some results may vary depending on the specific implementation and data type being tested.

### Write Operations

Each write operation provides two benchmark scenarios:

- **Component Reuse:** Initializes the component once and reuses it for every write operation.
- **Component Initialization + Write:** Creates a new component for every iteration before performing the write operation.

The second scenario naturally has a higher execution time due to the additional initialization overhead.

> [!IMPORTANT]
> Write operations perform additional processing compared to native buffer operations:
> - Bounds checking to ensure sufficient buffer capacity.
> - Optional automatic allocation when enabled.
> - Big-endian bit packing.
> - Value clamping to the supported range.
>
> Therefore, these benchmarks should not be directly compared against native buffer API performance. `Bitstream` performs additional validation and data processing by design.

---

#### Signed Integer

**Component Reuse + Write**

```diff
+ Iterations:       100,000
+ Bytes Per Op:     7
+ Total Time:       ~25.884ms (avg)
+ Time Per Op:      0.000259ms
+ Operations/sec:   3,863,405 ops/s
+ Throughput:       25.68 MB/s
```

**Benchmark setup:**

```ts
const BYTES_REQUIRED = 7 * 100_000

const component = Bitstream.Constructor.init({
    Size: BYTES_REQUIRED,
    UseAutoAllocation: false
})

const result = Benchmark.executeFunction({
    func: (i: number) => {
        component.writeI54(2_000_000)
    },
    iterations: 100_000,
    bytesPerOp: 7,
})
```

**Component Initialization + Write**

```diff
+ Iterations:       100,000
+ Bytes Per Op:     7
+ Total Time:       ~126.910ms (avg)
+ Time Per Op:      0.001269ms
+ Operations/sec:   787,959 ops/s
+ Throughput:       5.26 MB/s
```

**Benchmark setup:**

```ts
const BYTES_REQUIRED = 7

const result = Benchmark.executeFunction({
    func: (i: number) => {
        const component = Bitstream.Constructor.init({
            Size: BYTES_REQUIRED,
            UseAutoAllocation: false
        })

        component.writeI54(2_000_000)
    },
    iterations: 100_000,
    bytesPerOp: BYTES_REQUIRED,
})
```

---

#### Unsigned Integer

*Benchmark results and implementation pending.*

**Component Reuse + Write**

```diff
```

**Benchmark setup:**

```ts
```

**Component Initialization + Write**

```diff
```

**Benchmark setup:**

```ts
```

---

*Additional operation categories and data types follow the same benchmark structure.*