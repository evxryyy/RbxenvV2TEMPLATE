# Bitstream Test & Benchmark

## Constructor

### Tests

The constructor supports two initialization methods:

- **New Buffer:** Initializes a component with a newly allocated buffer using `Size` and `UseAutoAllocation`.
- **Existing Buffer:** Initializes a component using an existing buffer through `SourceBuffer` and `UseAutoAllocation`.

### Benchmark

**Configuration**

| Property | Value |
|---|---:|
| Iterations | 100,000 |
| Bytes per operation | 256 |

**Results**

| Metric | Result |
|---|---:|
| Total Time | 115.476 ms |
| Time / Operation | 0.001155 ms |
| Operations / sec | 865,984 ops/s |
| Throughput | 211.42 MB/s |

---

## Component Write

The component write benchmarks measure the performance of writing different data types using the Bitstream component.

Each data type is tested using two scenarios:

- **Component Reuse + Write:** Reuses an already initialized component throughout all iterations.
- **Component Init + Write:** Initializes a new component before every write operation.

All benchmarks currently use 100,000 iterations.


> [!IMPORTANT]
>
> The following types cannot be benchmarked because Roblox has not yet implemented `writevectorf32x2` and `writevectorf32x3`.
>
> List of types that cannot be benchmarked:
> ___
> CFrameQuaternion
> ___
> Region3Quaternion
> ___
> RotationCurveKeyQuaternion

### Signed Integer (I54)

**Input:** `-2,000,000`

#### Component Reuse + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 27.619 ms |
| Operations / sec | 3,620,761 ops/s |
| Time / Operation | 0.000276 ms |
| Throughput | 24.17 MB/s |

#### Component Init + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 134.982 ms |
| Operations / sec | 740,839 ops/s |
| Time / Operation | 0.001350 ms |
| Throughput | 4.95 MB/s |

### Unsigned Integer (U54)

**Input:** `2,000,000`

#### Component Reuse + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 26.613 ms |
| Operations / sec | 3,757,576 ops/s |
| Time / Operation | 0.000266 ms |
| Throughput | 25.08 MB/s |

#### Component Init + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 130.855 ms |
| Operations / sec | 764,207 ops/s |
| Time / Operation | 0.001309 ms |
| Throughput | 5.10 MB/s |

### Float (F24)

**Input:** `12.25`

#### Component Reuse + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 44.395 ms |
| Operations / sec | 2,252,521 ops/s |
| Time / Operation | 0.000444 ms |
| Throughput | 6.44 MB/s |

#### Component Init + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 165.864 ms |
| Operations / sec | 602,902 ops/s |
| Time / Operation | 0.001659 ms |
| Throughput | 1.72 MB/s |

### Float (F64)

**Input:** `100.987`

#### Component Reuse + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 23.422 ms |
| Operations / sec | 4,269,454 ops/s |
| Time / Operation | 0.000234 ms |
| Throughput | 32.57 MB/s |

#### Component Init + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 129.984 ms |
| Operations / sec | 769,326 ops/s |
| Time / Operation | 0.001300 ms |
| Throughput | 5.87 MB/s |

### String

**Input:** `"Hello World"`

#### Component Reuse + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 26.577 ms |
| Operations / sec | 3,762,652 ops/s |
| Time / Operation | 0.000266 ms |
| Throughput | 39.47 MB/s |

#### Component Init + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 132.351 ms |
| Operations / sec | 755,564 ops/s |
| Time / Operation | 0.001324 ms |
| Throughput | 7.93 MB/s |

### Prefixed String

**Input:** `"abcdefgh"`

#### Component Reuse + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 153.239 ms |
| Operations / sec | 652,574 ops/s |
| Time / Operation | 0.001532 ms |
| Throughput | 6.22 MB/s |

#### Component Init + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 272.522 ms |
| Operations / sec | 366,942 ops/s |
| Time / Operation | 0.002725 ms |
| Throughput | 3.50 MB/s |

#### Implementation Details

Unlike a regular `String`, `PrefixedString` performs an additional calculation to determine which unsigned integer type is required to encode the string length.

Writing a prefixed string involves three write operations:

1. **EnumId:** Writes the identifier of the selected unsigned integer type.
2. **LengthU:** Writes the string length using the selected unsigned integer type.
3. **String Data:** Writes the actual string content.

> [!NOTE]
> The additional type selection and three write operations introduce extra processing overhead compared to a regular `String`.

### Boolean (Bool1)

**Input:** `true`

#### Component Reuse + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 27.262 ms |
| Operations / sec | 3,668,056 ops/s |
| Time / Operation | 0.000273 ms |
| Throughput | 3.50 MB/s |

#### Component Init + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 136.509 ms |
| Operations / sec | 732,554 ops/s |
| Time / Operation | 0.001365 ms |
| Throughput | 0.70 MB/s |

### Boolean (Bool8)

**Input:** `[true, true, true, true, false, false, false, false]`

#### Component Reuse + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 60.602 ms |
| Operations / sec | 1,650,113 ops/s |
| Time / Operation | 0.000606 ms |
| Throughput | 1.57 MB/s |

#### Component Init + Write

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 167.808 ms |
| Operations / sec | 595,918 ops/s |
| Time / Operation | 0.001678 ms |
| Throughput | 0.57 MB/s |

### Vector2 (Vector2float24)

**Input:** `new Vector2(10.75,3.91)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 73.905 ms |
| Operations / sec | 1,353,096 ops/s |
| Time / Operation | 0.000739 ms |
| Throughput | 7.74 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 195.340 ms |
| Operations / sec | 511,927 ops/s |
| Time / Operation | 0.001953 ms |
| Throughput | 2.93 MB/s |

### Vector3 (Vector2float24)

**Input:** `new Vector2(10.75,3.91,-3.22)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 98.469 ms |
| Operations / sec | 1,015,544 ops/s |
| Time / Operation | 0.000985 ms |
| Throughput | 8.72 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 215.322 ms |
| Operations / sec | 464,421 ops/s |
| Time / Operation | 0.002153 ms |
| Throughput | 3.99 MB/s |

### CFrame (CFrameF24)

**Input:** `new CFrame(0.25,1.25,3.75)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 100.518 ms |
| Operations / sec | 994,845 ops/s |
| Time / Operation | 0.001005 ms |
| Throughput | 17.08 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 211.631 ms |
| Operations / sec | 472,520 ops/s |
| Time / Operation | 0.002116 ms |
| Throughput | 8.11 MB/s |

### CFrame (CFrame-Quantized)

**Input:** `new CFrame(-88,100,-65)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 41.509 ms |
| Operations / sec | 2,409,093 ops/s |
| Time / Operation | 0.000415 ms |
| Throughput | 27.57 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 148.710 ms |
| Operations / sec | 672,451 ops/s |
| Time / Operation | 0.001487 ms |
| Throughput | 7.70 MB/s |

### Color3 (Color3F24)

**Input:** `new Color3(0.99,0.99,0.99)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 87.979 ms |
| Operations / sec | 1,136,630 ops/s |
| Time / Operation | 0.000880 ms |
| Throughput | 9.76 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 209.178 ms |
| Operations / sec | 478,063 ops/s |
| Time / Operation | 0.002092 ms |
| Throughput | 4.10 MB/s |

### Color (Color3)

**Input:** `Color3.fromRGB(140,250,140)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 27.192 ms |
| Operations / sec | 3,677,566 ops/s |
| Time / Operation | 0.000272 ms |
| Throughput | 10.52 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 134.894 ms |
| Operations / sec | 741,324 ops/s |
| Time / Operation | 0.00134 ms |
| Throughput | 2.12 MB/s |

### UDim

**Input:** `new UDim(2.25,100)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 26.708 ms |
| Operations / sec | 3,744,196 ops/s |
| Time / Operation | 0.000267 ms |
| Throughput | 28.57 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 132.283 ms |
| Operations / sec | 755,955 ops/s |
| Time / Operation | 0.001323 ms |
| Throughput | 5.77 MB/s |

### UDim2

**Input:** `new UDim2(2.25,100,-2.25,-100)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 46.134 ms |
| Operations / sec | 2,167,613 ops/s |
| Time / Operation | 0.000461 ms |
| Throughput | 33.08 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 152.069 ms |
| Operations / sec | 657,597 ops/s |
| Time / Operation | 0.001521 ms |
| Throughput | 10.03 MB/s |

### Rect (RectFloat24)

**Input:** `new Rect(0.25,100.05,100.05,0.25)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 127.639 ms |
| Operations / sec | 783,460 ops/s |
| Time / Operation | 0.001276 ms |
| Throughput | 8.97 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 234.705 ms |
| Operations / sec | 426,066 ops/s |
| Time / Operation | 0.002347 ms |
| Throughput | 4.88 MB/s |

### Enum

**Input:** `Enum.KeyCode.A`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 26.198 ms |
| Operations / sec | 3,817,085 ops/s |
| Time / Operation | 0.000262 ms |
| Throughput | 7.28 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 134.942 ms |
| Operations / sec | 741,059 ops/s |
| Time / Operation | 0.001349 ms |
| Throughput | 1.41 MB/s |

### Region3 (Region3CFrameF24)

**Input:** `new Region3(new Vector3(100.24,20.48,45.123),new Vector3(200.254,40.200,90.14))`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 115.679 ms |
| Operations / sec | 864,460 ops/s |
| Time / Operation | 0.001157 ms |
| Throughput | 34.63 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 229.059 ms |
| Operations / sec | 436,569 ops/s |
| Time / Operation | 0.002291 ms |
| Throughput | 17.49 MB/s |

### Region3 (Region3Quantized)

**Input:** `new Region3(new Vector3(100,20,45),new Vector3(200,40,90))`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 55.615 ms |
| Operations / sec | 1,798,063 ops/s |
| Time / Operation | 0.000556 ms |
| Throughput | 61.73 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 164.240 ms |
| Operations / sec | 608,865 ops/s |
| Time / Operation | 0.001642 ms |
| Throughput | 20.90 MB/s |

### Region3int16

**Input:** `new Region3int16(new Vector3int16(100,20,45),new Vector3int16(200,40,90))`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 40.857 ms |
| Operations / sec | 2,447,543 ops/s |
| Time / Operation | 0.000409 ms |
| Throughput | 28.01 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 148.447 ms |
| Operations / sec | 673,642 ops/s |
| Time / Operation | 0.001484 ms |
| Throughput | 7.71 MB/s |

### RotationCurveKey (RotationCurveKeyCFrameF24)

**Input:** `new RotationCurveKey(0,new CFrame(100.145,20.197,214.241),Enum.KeyInterpolationMode.Cubic)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 118.018 ms |
| Operations / sec | 847,328 ops/s |
| Time / Operation | 0.001180 ms |
| Throughput | 25.86 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 230.713 ms |
| Operations / sec | 433,439 ops/s |
| Time / Operation | 0.002307 ms |
| Throughput | 13.23 MB/s |

### RotationCurveKey (RotationCurveKeyQuantized)

**Input:** `new RotationCurveKey(0,new CFrame(100,20,214),Enum.KeyInterpolationMode.Cubic)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 107.430 ms |
| Operations / sec | 930,830 ops/s |
| Time / Operation | 0.001074 ms |
| Throughput | 23.08 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 230.322 ms |
| Operations / sec | 434,174 ops/s |
| Time / Operation | 0.002303 ms |
| Throughput | 10.77 MB/s |

### FloatCurveKey (FloatCurveKeyF24)

**Input:** `new FloatCurveKey(0,41.748,Enum.KeyInterpolationMode.Cubic)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 108.064 ms |
| Operations / sec | 925,380 ops/s |
| Time / Operation | 0.001081 ms |
| Throughput | 15.00 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 218.479 ms |
| Operations / sec | 457,709 ops/s |
| Time / Operation | 0.002185 ms |
| Throughput | 7.42 MB/s |

### ColorSequence (ColorSequenceF24)

**Input:** 
```ts
new ColorSequence([
    new ColorSequenceKeypoint(0,Color3.fromRGB(255,255,255)),
    new ColorSequenceKeypoint(1,Color3.fromRGB(255,255,255)),
])
```

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 275.925 ms |
| Operations / sec | 362,417 ops/s |
| Time / Operation | 0.002759 ms |
| Throughput | 9.33 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 387.943 ms |
| Operations / sec | 257,770 ops/s |
| Time / Operation | 0.003879 ms |
| Throughput | 6.64 MB/s |

### NumberRange (NumberRangeF24)

**Input:** `new NumberRange(0,11.987)`

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 54.402 ms |
| Operations / sec | 1,838,168 ops/s |
| Time / Operation | 0.00544 ms |
| Throughput | 10.52 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 169.723 ms |
| Operations / sec | 589,197 ops/s |
| Time / Operation | 0.001697 ms |
| Throughput | 3.37 MB/s |

### NumberSequence (NumberSequenceF24)

**Input:** 
```ts
new NumberSequence([
    new NumberSequenceKeypoint(0,1.98),
    new NumberSequenceKeypoint(1,10.125)
])
```

#### Component Reuse + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 176.516 ms |
| Operations / sec | 566,521 ops/s |
| Time / Operation | 0.001765 ms |
| Throughput | 12.43 MB/s |

#### Component Init + Write 

| Metric | Result |
|---|---:|
| Iterations | 100,000 |
| Total Time | 284.092 ms |
| Operations / sec | 351,999 ops/s |
| Time / Operation | 0.002841 ms |
| Throughput | 7.72 MB/s |

---

## Benchmark System

The Bitstream benchmark system dynamically generates benchmark cases from predefined configuration lists.

Instead of manually implementing each benchmark, the system resolves the corresponding component methods, retrieves their required byte sizes, and automatically executes both benchmark scenarios.

### Configuration

| Configuration | Description |
|---|---|
| `FUNCTION_NAME_LIST` | Defines the data types to benchmark. |
| `FUNCTION_PREFIX` | Defines the method prefix used to resolve component methods. |
| `WRITTEN_DATA_LIST` | Contains the input values passed to each function. |
| `OPTION_DATA_LIST` | Contains additional options required by specific data types. |

> [!IMPORTANT]
> `WRITTEN_DATA_LIST` must follow the same order as `FUNCTION_NAME_LIST`.
>
> `OPTION_DATA_LIST` must follow the order of the corresponding types requiring additional options.

### Automatic Byte Calculation

The required byte size is retrieved from `Constants.REQUIRED_BYTES`.

The system supports two cases:

- **Fixed requirements:** The byte size is retrieved directly from the constant.
- **Dynamic requirements:** The byte size is calculated using the corresponding input value and additional options.

This eliminates the need to manually specify `BytesPerOp` for each benchmark.

### Component Reuse + Write

A single component is reused throughout all iterations.

Before execution, its buffer is recreated with enough capacity for the entire benchmark, and its offset is reset to zero.

This scenario measures write performance without including component initialization in every iteration.

### Component Init + Write

A new component is initialized for every iteration using the calculated `BytesPerOp` value.

The corresponding write method is then executed.

This scenario measures the combined cost of component initialization and writing.

### Benchmark Execution

For every entry in `FUNCTION_NAME_LIST`, the system:

1. Builds the complete function name using `FUNCTION_PREFIX`.
2. Resolves the corresponding component method.
3. Retrieves the required byte size from `Constants.REQUIRED_BYTES`.
4. Generates the benchmark configuration.
5. Executes both benchmark scenarios using `task.spawn`.
6. Displays the results through `Benchmark.showBenchmark`.

The current configuration uses **100,000 iterations per benchmark**.

### Benchmark Implementation

```ts
import * as Bitstream from "@rbxts/bitstream/out"
import {Constants} from "@rbxts/bitstream/out/packages/constants";
import {Benchmark} from "../shared/benchmark";
import BenchmarkResult = Benchmark.BenchmarkResult;
import * as TypeHelper from "@rbxts/bitstream/out/packages/typeHelper"
import {BitstreamTypesName} from "@rbxts/bitstream/out/packages/enumeration";

interface IBenchmark<A extends unknown & Array<unknown>,R extends unknown> {
    Title : string,
    Description : string,
    Iteration : number,
    BytesPerOp? : number,
    Callback? : (...args : A) => R,
    WrittenData? : defined, 
}

const Benchmarks : Record<string,Required<IBenchmark<unknown[],unknown>>> = {}
const BenchmarksResults : Record<string,BenchmarkResult> = {}

// Add a type name in the list to catch the function to bench ex : "U54" -> "writeU54" since the prefix is added on each test
const FUNCTION_NAME_LIST : BitstreamTypesName[] = [
    "I54",
    "U54",
    "F24",
    "F64",
    "String",
    "PrefixedString",
    "Bool1",
    "Bool8",
]

const FUNCTION_PREFIX = "write"

// List containing data must be in order. first one reference to U54 DataType
const WRITTEN_DATA_LIST = [
    -2_000_000,
    2_000_000,
    12.25,
    100.987,
    "Hello World",
    "abcdefgh",
    true,
    [true,true,true,true,false,false,false,false]
]

// List containing options for types like FloatCurveKey, RotationCurveKey etc..
const OPTION_DATA_LIST = ["F24","Quaternion"]

const VALID_PREFIX_PART_REGEX = ["RotationCurveKey","ColorSequence","FloatCurveKey","NumberSequence"]

function runTest<A extends unknown & Array<unknown>,R extends unknown>(
    action : ((...args : A) => R) | (() => R),
    params : IBenchmark<A,R>,
    ...args : A
) : BenchmarkResult {
    return Benchmark.executeFunction({
        func : (i) => {
            action(...args)
        },
        iterations : params.Iteration,
        bytesPerOp : params.BytesPerOp
    })
}

function initTest<A extends unknown & Array<unknown>,R extends unknown>(action : ((...args : A) => R) | (() => R),params : IBenchmark<A,R>): Required<IBenchmark<A,R>> {
    return {
        Title : params.Title,
        Description : params.Description,
        Iteration : params.Iteration,
        BytesPerOp : params.BytesPerOp || 0,
        Callback : action,
        WrittenData : params.WrittenData || false
    }
}

function componentReuseTest<A extends unknown & Array<unknown>>(
    callback : Required<IBenchmark<A,unknown>>["Callback"],
    benchmarkData : Required<IBenchmark<A, unknown>>,
    ...args : A
) : BenchmarkResult {
    //Soft reset, need to implement a `resetBuffer` method.
    component.buffer = buffer.create(benchmarkData.BytesPerOp * benchmarkData.Iteration)
    component.offset = 0
    return runTest(callback,benchmarkData,...args)
}

function componentInitWriteTest<A extends unknown & Array<unknown>>(
    funcName : string,
    benchmarkData : Required<IBenchmark<A,unknown>>,
    ...args : A
) : BenchmarkResult {
    return runTest(() => {
        const tempComponent = Bitstream.Constructor.init({Size : benchmarkData.BytesPerOp,UseAutoAllocation : false})
        const func = tempComponent[funcName as keyof typeof tempComponent] as (...args : unknown[]) => unknown
        func(tempComponent,...args)
    },benchmarkData,...args)
}

function getPrefixPartRegex(name : BitstreamTypesName) : string | undefined {
    let result : string | undefined;
    for(const prefix of VALID_PREFIX_PART_REGEX) {
        result = string.match(name,`^(${prefix})`)[0] as string
        if(result) break;
    }
    return result
}

let component = Bitstream.Constructor.init({Size : 7 * 100_000, UseAutoAllocation : false})
let index = 0
let optionIndex = 0

for(const name of FUNCTION_NAME_LIST) {
    const fullName = FUNCTION_PREFIX + name
    const func = component[fullName as keyof typeof component] as (...args : unknown[]) => unknown
    let getBytesNeededKey = Constants.REQUIRED_BYTES[name as keyof unknown] as number | ((...args : unknown[]) => number)
    const hasPrefixPart = getPrefixPartRegex(name as BitstreamTypesName)
    if(typeOf(getBytesNeededKey) === "nil" && typeIs(hasPrefixPart,"string")) {
        getBytesNeededKey = Constants.REQUIRED_BYTES[hasPrefixPart as keyof unknown] as number | ((...args : unknown[]) => number)
    }
    let bytesNeeded = 0
    if(typeIs(getBytesNeededKey,"function")) {
        bytesNeeded = getBytesNeededKey(WRITTEN_DATA_LIST[index],OPTION_DATA_LIST[optionIndex])
        optionIndex++;
    }
    else if(typeIs(getBytesNeededKey,"number")) { bytesNeeded = getBytesNeededKey }
    Benchmarks[fullName] = initTest(func,{
        Title : fullName,
        Description : `Benchmark result for ${fullName}`,
        Iteration : 100_000,
        WrittenData : WRITTEN_DATA_LIST[index],
        BytesPerOp : bytesNeeded
    })
    index++;
}

for(const [funcName,benchmarkData] of pairs(Benchmarks)) {
    task.spawn(() => {
        const ReuseResult =  componentReuseTest(benchmarkData.Callback,benchmarkData,component,benchmarkData.WrittenData)
        print(`/// [Component Reuse + Write] BENCHMARK RESULT FOR : ${funcName} ///`)
        Benchmark.showBenchmark(ReuseResult)
        print("//////////////////////////////")
    })
    task.spawn(() => {
        const InitResult = componentInitWriteTest(funcName,benchmarkData,benchmarkData.WrittenData)
        print(`/// [Component Init + Write] BENCHMARK RESULT FOR : ${funcName} ///`)
        Benchmark.showBenchmark(InitResult)
        print("//////////////////////////////") 
    })
}
```

---

## Benchmark Notes

- All component write benchmarks use 100,000 iterations.
- Both scenarios use the same input value for each data type.
- `BytesPerOp` is retrieved automatically through `Constants.REQUIRED_BYTES`.
- Component reuse currently relies on a soft reset by recreating the buffer and resetting the offset.
- A dedicated `resetBuffer` method is planned.
- The initialization scenario includes both component creation and the write operation.
- `PrefixedString` performs additional type selection and three write operations to encode its length and content.
- Results can vary depending on runtime conditions and execution order.

> [!WARNING]
> Both reuse benchmarks and initialization benchmarks are launched using `task.spawn`. The reuse scenarios currently share the same `component` instance. This can cause interference when multiple benchmarks run concurrently.
>
> For reliable measurements, each reuse benchmark should use its own component instance, or the benchmarks should be executed sequentially.