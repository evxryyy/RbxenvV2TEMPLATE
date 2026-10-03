import { EncodingService, HttpService, ReplicatedStorage } from "@rbxts/services";

import * as Types from "./packages/typeHelper"
import { Utilities } from "./packages/utilities"
import * as Enumeration from "./packages/enumeration"
import { Constants } from "./packages/constants"
import { Signal } from "./packages/zignal"
import * as Extensions from "./packages/extensions"
import * as Debugger from "./packages/debugger"
import * as Resolver from "./packages/resolver"
import { Bitflag } from "./packages/bitflag"

type WriterIndexCallback = (this : Component,value : defined | unknown) => Component
type ReaderIndexCallback<R> = (this : Component,value : defined) => R

// Version control (only once)
let versionIsVerified = false
if(versionIsVerified === false) {
    task.spawn(Debugger.verifiyVersion)
    versionIsVerified = true
}

// ## Luau imports ##

// buffer api
const create = buffer.create; const fromstring = buffer.fromstring; const bufftostring = buffer.tostring
const bufflen = buffer.len; const readbits = buffer.readbits; const readi8 = buffer.readi8
const readi16 = buffer.readi16; const readi32 = buffer.readi32; const readu8 = buffer.readu8
const readu16 = buffer.readu16; const readu32 = buffer.readu32; const readf32 = buffer.readf32
const readf64 = buffer.readf64; const writebits = buffer.writebits; const writei8 = buffer.writei8
const writei16 = buffer.writei16; const writei32 = buffer.writei32; const writeu8 = buffer.writeu8
const writeu16 = buffer.writeu16; const writeu32 = buffer.writeu32; const writef32 = buffer.writef32
const writef64 = buffer.writef64; const readstring = buffer.readstring; const writestring = buffer.writestring
const copy = buffer.copy; const fill = buffer.fill

// math api
const huge = math.huge; const modf = math.modf; const floor = math.floor
const clamp = math.clamp; const ceil = math.ceil; const log = math.log
const round = math.round; const abs = math.abs

// string api
const strgmatch = string.gmatch; const strchar = string.char; const strbyte = string.byte
const strsub = string.sub; const strmatch = string.match

// table api
const tblinsert = table.insert; const tblclone = table.clone; const tblclear = table.clear

// Fixed (Unsigned) numbers (used for big-endian manual packing etc..)
const fbit8 = 0x100 // 256
const fbit16 = 0x10000 // 65_536
const fbit24 = 0x1000000 // 16_777_216
const fbit32 = 0x100000000 // 4_294_967_296
const fbit40 = 0x10000000000 // 109_951_162_777_6
const fbit48 = 0x1000000000000 // 281_474_976_710_656
const fbit54 = 0x40000000000000 // 18_014_398_509_481_984 (slightly upper than the IEEE754 double max)
		
// Signed
const fsbit8 = 0x80 // 128
const fsbits40 = 0x8000000000 // 549_755_813_888
const fsbits48 = 0x800000000000 // 140_737_488_355_328
const fsbits54 = 0x20000000000000 // 9_007_199_254_740_992

/// Manual packing constants
const bm6 = 0x3F // 63 (Mask used to keep only the lowest 6 bits of a value.)

// CFrame Quantization constants
const POSITION_SCALE = 1000 // ~0.05°, Range: ±π radians
const ROTATION_SCALE = 10430.38 // 1mm, Range: ±32km

// Buffer constants
const BUFFER_MAX_SIZE = 1_073_741_824 // 1GB

/*
* Write n float24 numbers to the buffer.
*
* @Parameters :
* - b : buffer -- The buffer to write to.
* - fps : number[] -- The numbers to write.
* - offset : number -- The offset to write at.
* 
* @Returns: void
*/
function writeNfp24(b : buffer,fps : number[],offset : number) : void {
    for(let i = 0; i < fps.size(); i++){
        let fp = fps[i]
        let encode = Extensions.encodeF24(fp)
        writeu8(b,offset,bit32.extract(encode,16,8))
        writeu8(b,offset + 1,bit32.extract(encode,8,8))
        writeu8(b,offset + 2,bit32.extract(encode,0,8))
        offset += 3
    }
}

/*
* Read n float24 numbers to the buffer.
*
* @Parameters :
* - b : buffer -- The buffer to write to.
* - count : number -- The number of floats to read.
* - offset : number -- The offset to read at.
* 
* @Returns: number[] -- The numbers read.
*/
function readNfp24(b : buffer,count : number,offset : number) : number[] {
    let fps : number[] = []
    for(let i = 0; i < count; i++) {
        let encoded = (readu8(b, offset + 0) << 16) |
            (readu8(b, offset + 1) << 8) |
            readu8(b, offset + 2);
        fps[i] = Extensions.decodeF24(encoded)
        offset += 3
    }
    return fps
}

export abstract class Constructor {

    /**
     * Return a new Bitstream-Component.
     */
    static init(parameters : Types.ConstructorConfiguration) : Component {
        return new Component(parameters)
    }

}

class Component {
    // Properties //
    public buffer: buffer;
    public offset: number;
    public useAutoAllocation: boolean;
    public minimumAutoAllocationSize: number;
    public instanceBuffer : Instance[];
    public instanceOffset : number;

    public readonly offsetChanged = new Signal<[number]>();
    public readonly capacityChangedSignal = new Signal<[number]>();
    public readonly instanceOffsetChanged = new Signal<[number]>();

    // Privates methods //

    /*
    * Ensure the buffer has enough space to write at the current offset.
    * Will throw an error if there is not enough space.
    * Otherwise auto-allocate more space if `self.__useAutoAllocation` is true.
    */
    private ensureWritable(size : number) : boolean {
        let needed = this.offset + size
        if(needed <= bufflen(this.buffer)) return true;
        if(this.useAutoAllocation) {
            if(size <= this.minimumAutoAllocationSize) needed = this.offset + this.minimumAutoAllocationSize;
            this.allocate(size)
            return true
        }
        error(
            Debugger.catchError("Doesn't have enough space")?.format(`${Debugger.getFunctionName()[0]}`)
        )
    }

    /*
    * Ensure the buffer has enough space to read at the current offset.
    * Will throw an error if the offset is out of bounds or if their not enough spaces.
    */
    private ensureReadable(offset : number,bytes : number) : boolean {
        offset = typeOf(offset) === "number" ? offset : this.offset
        if(offset < 0 || offset + bytes > bufflen(this.buffer)) {
            error(
                Debugger.catchError("Out of bounds")?.format(`${offset}`,`${bytes}`,`${bufflen(this.buffer)}`)
            )
        }
        return true
    }

    /*
    * Execute a function on the buffer at the current offset.
    * Will throw an error if there is not enough space or out of bounds.
    * 
    * @Generics A<extends unknown[]> : Array of parameters for the function.
    * @Generics R : Return type of the function.
    * 
    * @Parameters:
    * - func : (...args : A) -> R
    * - ...args : A
    * 
    * @Returns: R
    */
    private executeRead<A extends unknown[],R>(readFunc : (...args : A) => R,...args : A) : R {
        if(readFunc === undefined) return undefined as R;
        let readArguments = table.pack(...args as defined[])
        let argsLen = readArguments.n

        let offset : number = typeOf(readArguments[0] === "number") ? readArguments[0] as number : readArguments[1] as number
        let useBitoffset = false

        let functionName = Debugger.getFunctionName(3)[0] as string
        let functionType = strsub(functionName,5,functionName.size())

        if(functionType === "U1" || functionType === "Bool1" || functionType === "Bool8") useBitoffset = true;

        // Ensure there is enough space to read
        let bytes = (readArguments[argsLen] === offset && argsLen <= 2) ? undefined : readArguments[argsLen] as number
        if(bytes === undefined && Constants.REQUIRED_BYTES[functionType as keyof unknown]) {
            bytes = (typeOf(Constants.REQUIRED_BYTES[functionType as keyof unknown]) === "number") ?
                Constants.REQUIRED_BYTES[functionType as keyof unknown] : 0
        }

        // Check if the bytes is 0 
        if(bytes === 0) error("No bytes specified for function " + functionType + "");

        this.ensureReadable((useBitoffset === true) ? offset / 8 : offset,bytes as number)

        // Execute the function and return the result
        return readFunc(...args) as R
    }
 
    /*
    * Makes it easier to read implemented types like 24bit-integer etc while using the same function.
    */
    private executeReadImplementation<A extends unknown[],R>(readFunc : () => R,...args : A) : R {
        if(readFunc === undefined) return undefined as R;
        return this.executeRead(readFunc as (...args : A) => R,...args)
    }

    //

    /**
     * Construct a new Bitstream-Component with the actual configuration.
     * 
     * @Parameters: parameters : ConstructorConfiguration
     * The configuration table used to initialize the Bitstream object.
     * 
     * @Returns: Component
     * A newly created Bitstream component object.
     */
    constructor(parameters : Types.ConstructorConfiguration) {
        this.buffer = parameters.SourceBuffer || create(parameters.Size || 0)
        this.offset = parameters.SourceBuffer ? bufflen(parameters.SourceBuffer) : 0;
        this.useAutoAllocation = parameters.UseAutoAllocation
        this.minimumAutoAllocationSize = 1
        this.instanceBuffer = []
        this.instanceOffset = 0
        return this
    }

    // Methods //

    /*
    * Decompresses a buffer using the provided compression algorithm.
    *
    * @Parameters:
    * - b : buffer,
    * - algorithm : Enum.CompressionAlgorithm
    * 
    * @lastest modification : v4.0
    * @since v2.6
    */
    decompress(algorithm : Enum.CompressionAlgorithm) : buffer {
        return EncodingService.DecompressBuffer(this.buffer,algorithm)
    }

    /*
    * Allocates new space to the buffer.
    *
    * @Parameters: size : number
    * The size to allocate in bytes.
    * 
    * @Returns: Component (this)
    */
    allocate(size : number) : Component {
        if(size <= 0) return this;
        let newBuffer = create(bufflen(this.buffer) + size)
        copy(newBuffer,0,this.buffer,0,bufflen(this.buffer))
        this.buffer = newBuffer
        this.capacityChangedSignal.Fire(bufflen(this.buffer))
        return this
    }

    //#region "[Writer]"

    //#region "[Writer] Primary Types"

    //#region "[Writer] Signed Integer"

    /*
    * Write a signed 8-bit integer (-128 to 127).
    *
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeI8(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.I8)
        writei8(this.buffer,this.offset,value);
        this.offset += 1
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a signed 16-bit integer (-32_768 to 32_767).
    *
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeI16(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.I16)
        writei16(this.buffer,this.offset,value)
        this.offset += 2
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a signed 24-bit integer (-8,388,608 to 8,388,607).
    * - Clamped and truncated.
    * - 3 bytes, big-endian manual packing.
    *
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeI24(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.I24)
        value = clamp(modf(value)[0],Constants.MIN_INT24,Constants.MAX_INT24)
        writeu8(this.buffer,this.offset,bit32.extract(value,16,8))
        writeu8(this.buffer,this.offset + 1,bit32.extract(value,8,8))
        writeu8(this.buffer,this.offset + 2,bit32.extract(value,0,8))
        this.offset += 3
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a signed 32-bit integer (-2,147,483,648 to 2,147,483,647).
    *
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */    
    writeI32(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.I32)
        writei32(this.buffer,this.offset,value)
        this.offset += 4
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a signed 40-bit integer (-549,755,813,888 to 549,755,813,887).
    * - Clamped and truncated.
    * - If negative, add 2^40 to represent as unsigned (two's complement style) before writing.
    * - 5 bytes, big-endian manual packing.
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */ 
    writeI40(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.I40)
        value = clamp(modf(value)[0],Constants.MIN_INT40,Constants.MAX_INT40)
        // Convert negative to unsigned representation over 40 bits (two's complement range)
        if(value < 0) value += fbit40;
        writeu8(this.buffer,this.offset,floor(value / fbit32) % fbit8)
        writeu8(this.buffer,this.offset + 1,bit32.extract(value % fbit32,24,8))
        writeu8(this.buffer,this.offset + 2,bit32.extract(value % fbit32,16,8))
        writeu8(this.buffer,this.offset + 3,bit32.extract(value % fbit32,8,8))
        writeu8(this.buffer,this.offset + 4,bit32.extract(value % fbit32,0,8))
        this.offset += 5
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a signed 48-bit integer (-140,737,488,355,328 to 140,737,488,355,327).
    * - Clamped and truncated.
    * - If negative, add 2^48 to represent as unsigned before writing.
    * - 6 bytes, big-endian manual packing.
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeI48(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.I48)
        value = clamp(modf(value)[0],Constants.MIN_INT48,Constants.MAX_INT48)
        // Represent as 48-bit unsigned for storage
        if(value < 0) value += fbit48;
        // Big-endian packing: 6 bytes MSB -> LSB
        writeu8(this.buffer,this.offset,floor(value / fbit40) % fbit8)
        writeu8(this.buffer,this.offset + 1,floor(value / fbit32) % fbit8)
        writeu8(this.buffer,this.offset + 2,bit32.extract(value % fbit32,24,8))
        writeu8(this.buffer,this.offset + 3,bit32.extract(value % fbit32,16,8))
        writeu8(this.buffer,this.offset + 4,bit32.extract(value % fbit32,8,8))
        writeu8(this.buffer,this.offset + 5,bit32.extract(value % fbit32,0,8))
        this.offset += 6
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a signed 54-bit integer (-9,007,199,254,740,992 to 9,007,199,254,740,991).
    * - Clamped and truncated.
    * - If negative, add 2^54 to represent as unsigned before writing.
    * - 7 bytes, big-endian manual packing.
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeI54(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.I54)
        value = clamp(modf(value)[0],Constants.MIN_INT54,Constants.MAX_INT54)
        // Represent as 54-bit unsigned for storage
        if(value < 0) value += fbit54
        // Big-endian packing: 7 bytes MSB -> LSB
        writeu8(this.buffer,this.offset,floor(value / fbit48) % fbit8)
        writeu8(this.buffer,this.offset + 1,floor(value / fbit40) % fbit8)
        writeu8(this.buffer,this.offset + 2,floor(value / fbit32) % fbit8)
        writeu8(this.buffer,this.offset + 3,bit32.extract(value % fbit32,24,8))
        writeu8(this.buffer,this.offset + 4,bit32.extract(value % fbit32,16,8))
        writeu8(this.buffer,this.offset + 5,bit32.extract(value % fbit32,8,8))
        writeu8(this.buffer,this.offset + 6,bit32.extract(value % fbit32,0,8))
        this.offset += 7
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write an signed `I-bit` integer.
    * - Clamped and truncated.
    * - min[I8] - max[I54] 
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    writeInt(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        const bytesData = Utilities.getEquivalentBytesInfoFromNumber(value)
        value = clamp(
            modf(value)[0],
            Constants["MIN_INT" + bytesData.bytes * 8 as keyof unknown],
            Constants["MAX_INT" + bytesData.bytes * 8 as keyof unknown]
        );
        return (this[`writeI${bytesData.bytes * 8}` as keyof unknown] as WriterIndexCallback)(value)
    }

    //#endregion

    //#region "[Writer] Unsigned Integer"

    /*
    * Write a single unsigned bit (0 or 1).
    * - Reserves 1 byte (by design)
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.3
    */
    writeU1(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.U1)
        writebits(this.buffer,this.offset * 8,1,(value > 1) ? 1 : 0)
        this.offset += 1
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write an unsigned 8-bit integer (0 to 255).
    *
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeU8(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.U8)
        writeu8(this.buffer,this.offset,value)
        this.offset += 1
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write an unsigned 16-bit integer (0 to 65,535).
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeU16(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.U16)
        writeu16(this.buffer,this.offset,value)
        this.offset += 2
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write an unsigned 24-bit integer (0 to 16,777,215).
    * - Clamped and truncated.
    * - 3 bytes, big-endian manual packing.
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeU24(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.U24)
        value = clamp(modf(value)[0],Constants.MIN_UINT,Constants.MAX_UINT24)
        // Big-endian manual packing
        writeu8(this.buffer,this.offset,bit32.extract(value,16,8))
        writeu8(this.buffer,this.offset + 1,bit32.extract(value,8,8))
        writeu8(this.buffer,this.offset + 2,bit32.extract(value,0,8))
        this.offset += 3
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write an unsigned 32-bit integer (0 to 4,294,967,295).
    *
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    */
    writeU32(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.U32)
        writeu32(this.buffer,this.offset,value)
        this.offset += 4
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write an unsigned 40-bit integer (0 to 1,099,511,627,775).
    *
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeU40(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.U40)
        value = clamp(modf(value)[0],Constants.MIN_UINT,Constants.MAX_UINT40)
        // Big-endian manual packing
        let remainder = value % fbit32
        writeu8(this.buffer,this.offset,floor(value / fbit32) % fbit8)
        writeu8(this.buffer,this.offset + 1,bit32.extract(remainder,24,8))
        writeu8(this.buffer,this.offset + 2,bit32.extract(remainder,16,8))
        writeu8(this.buffer,this.offset + 3,bit32.extract(remainder,8,8))
        writeu8(this.buffer,this.offset + 4,bit32.extract(remainder,0,8))
        this.offset += 5
        this.offsetChanged.Fire(this.offset)
        return this
    }

    writeU48(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.U48)
        value = clamp(modf(value)[0],Constants.MIN_UINT,Constants.MAX_UINT48)
        // Big-endian packing: 6 bytes MSB -> LSB
        writeu8(this.buffer,this.offset,floor(value / fbit40) % fbit8)
        writeu8(this.buffer,this.offset + 1,floor(value / fbit32) % fbit8)
        writeu8(this.buffer,this.offset + 2,bit32.extract(value % fbit32,24,8))
        writeu8(this.buffer,this.offset + 3,bit32.extract(value % fbit32,16,8))
        writeu8(this.buffer,this.offset + 4,bit32.extract(value % fbit32,8,8))
        writeu8(this.buffer,this.offset + 5,bit32.extract(value % fbit32,0,8))
        this.offset += 6
        this.offsetChanged.Fire(this.offset)
        return this
    }
    
    /*
    * Write an unsigned 54-bit integer (0 to 18,014,398,509,481,980).
    * - Clamped and truncated.
    * - 7 bytes, big-endian manual packing.
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeU54(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.U54)
        value = clamp(modf(value)[0],Constants.MIN_UINT,Constants.MAX_UINT54)
        // Big-endian packing: 7 bytes MSB -> LSB
        writeu8(this.buffer,this.offset,floor(value / fbit48) % fbit8)
        writeu8(this.buffer,this.offset + 1,floor(value / fbit40) % fbit8)
        writeu8(this.buffer,this.offset + 2,floor(value / fbit32) % fbit8)
        writeu8(this.buffer,this.offset + 3,bit32.extract(value % fbit32,24,8))
        writeu8(this.buffer,this.offset + 4,bit32.extract(value % fbit32,16,8))
        writeu8(this.buffer,this.offset + 5,bit32.extract(value % fbit32,8,8))
        writeu8(this.buffer,this.offset + 6,bit32.extract(value % fbit32,0,8))
        this.offset += 7
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write an unsigned `N-bit` integer.
    * - Clamped and truncated.
    * - min[U1] - max[U54] 
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    writeUInt(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        const bytesData = Utilities.getEquivalentBytesInfoFromNumber(value)
        value = clamp(
            modf(value)[0],
            Constants.MIN_UINT,
            Constants["MAX_UINT" + bytesData.bytes * 8 as keyof unknown]
        );
        return (this[`writeU${bytesData.bytes * 8}` as keyof unknown] as WriterIndexCallback)(value)
    }

    //#endregion

    //#region "[Writer] Float Integer"

    /*
    * Write a floating-point value using the 8-bit E4M3 format.
    * - 1 byte, 1 sign bit, 4 exponent bits, 3 mantissa bits.
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    writeF8(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.F8)
        writeu8(this.buffer,this.offset,Extensions.encodeF8(value))
        this.offset += 1
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a 16-bit float (half-precision) to the buffer.
    * - Lower precision than F32/F64; expect rounding.
    * - NaN/Inf are handled; finite values are encoded with sign/exponent/mantissa.
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeF16(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.F16)
        let [uint16] = Extensions.toFloat16(value)
        writeu16(this.buffer,this.offset,uint16)
        this.offset += 2
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a 24-bit float (3 bytes) to the buffer.
    * - 3 bytes, big-endian.
    * - 18-bit mantissa, 5-bit exponent, 1-bit sign.
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    writeF24(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.F24)
        let fp24 = Extensions.encodeF24(value)
        writeu8(this.buffer,this.offset,bit32.extract(fp24,16,8))
        writeu8(this.buffer,this.offset + 1,bit32.extract(fp24,8,8))
        writeu8(this.buffer,this.offset + 2,bit32.extract(fp24,0,8))
        this.offset += 3
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a 32-bit float to the buffer.
    * - 4 bytes, big-endian.
    * - The default float format.
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeF32(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.F32)
        writef32(this.buffer,this.offset,value)
        this.offset += 4
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a 64-bit float to the buffer.
    * - 8 bytes, big-endian.
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    writeF64(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        this.ensureWritable(Constants.REQUIRED_BYTES.F64)
        writef64(this.buffer,this.offset,value)
        this.offset += 8
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write an float `F-bit`.
    * - min[F8] - max[F64] 
    * 
    * @Parameter(s): number
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    writeFloat(value : number) : Component {
        assert(typeOf(value) === "number","Type-missmatch first arguments is expected to be a number")
        const bytesData = Utilities.getEquivalentBytesInfoFromNumber(value)
        if(bytesData.bytes > 4 && bytesData.bytes <= 7) return this.writeF32(value);
        return (this[`writeF${bytesData.bytes * 8}` as keyof unknown] as WriterIndexCallback)(value)
    }

    //#endregion

    //#region "[Writer] String"

    /*
    * Write a string without caring about length limits.
    * - Writes exactly #value bytes.
    * - Reader must know or infer the length (no prefix is written).
    * 
    * @Parameter(s): string
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeString(value : string){
        assert(typeOf(value) === "string","First arguments is expected to be a string")
        let length = value.size()
        this.ensureWritable(length)
        writestring(this.buffer,this.offset,value,length)
        this.offset += length
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a string without caring about length limits.
    * - Writes exactly byte-code + len + #value bytes. (1 + n[(1-7)bytes] + #value)
    * 
    * @Parameter(s): string
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writePrefixedString(value : string){
        assert(typeOf(value) === "string","First arguments is expected to be a string")
        this.ensureWritable(Constants.REQUIRED_BYTES.PrefixedString(value))
        let length = value.size()
        let bytesData = Utilities.getEquivalentBytesInfoFromNumber(length)
        this.writeU8(Enumeration.BistreamEnumeration[`U${bytesData.bytes * 8}` as keyof unknown])
        this.writeUInt(length)
        this.writeString(value)
        return this
    }

    //#endregion

    //#region "[Writer] Booleans"

    /*
    * Write a single boolean using 1 bit.
    * - nil/false -> 0, anything else -> 1
    * 
    * @Parameter(s): defined
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeBool1(value : defined) {
        this.ensureWritable(Constants.REQUIRED_BYTES.Bool1)
        writebits(this.buffer,this.offset * 8,1,(value) ? 1 : 0)
        this.offset += 1
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write 8 booleans packed into 1 byte.
    * - Accepts an array-like table of up to 8 values.
    * - Each truthy value sets the corresponding bit to 1.
    * 
    * @Parameter(s): [define] (Array that only contains defined values)
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeBool8(value : [defined]) {
        assert(typeOf(value) === "table","First arguments is expected to be a table")
        this.ensureWritable(Constants.REQUIRED_BYTES.Bool8)
        value.forEach((element,index) => {
            writebits(this.buffer,this.offset * 8 + index + 1,1,(element) ? 1 : 0)
        })
        this.offset += 1
        this.offsetChanged.Fire(this.offset)
        return this
    }

    //#endregion
 
    //#endregion

    //#region "[Writer] Roblox Types"

    //#region "[Writer-RobloxTypes] Vector2"

    /*
    * Write a Vector2 as two f24 (x, y).
    * - 6 bytes total.
    * 
    * @Parameter(s): Vector2
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeVector2float24(value : Vector2) {
        assert(typeOf(value) === "Vector2","First arguments is expected to be a Vector2")
        this.ensureWritable(Constants.REQUIRED_BYTES.Vector2float24)
        writeNfp24(this.buffer,[value.X,value.Y],this.offset)
        this.offset += 6
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Vector2 as two f32 (x, y).
    * - 8 bytes total.
    * 
    * @Parameter(s): Vector2
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeVector2float32(value : Vector2) {
        assert(typeOf(value) === "Vector2","First arguments is expected to be a Vector2")
        this.ensureWritable(Constants.REQUIRED_BYTES.Vector2float32)
        writef32(this.buffer,this.offset,value.X)
        writef32(this.buffer,this.offset + 4,value.Y)
        this.offset += 8
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Vector2int16 as two i16 (x, y).
    * - 4 bytes total.
    *
    * @Parameter(s): Vector2int16
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeVector2int16(value : Vector2int16) {
        assert(typeOf(value) === "Vector2int16","First arguments is expected to be a Vector2int16")
        this.ensureWritable(Constants.REQUIRED_BYTES.Vector2int16)
        writei16(this.buffer,this.offset,value.X)
        writei16(this.buffer,this.offset + 2,value.Y)
        this.offset += 4
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Vector2uint16 as two u16 (x, y).
    * - 4 bytes total.
    * 
    * @Parameter(s): Vector2
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeVector2uint16(value : Vector2) {
        assert(typeOf(value) === "Vector2","First arguments is expected to be a Vector2")
        this.ensureWritable(Constants.REQUIRED_BYTES.Vector2uint16)
        let [x,y] = [
            clamp(modf(value.X)[0],Constants.MIN_UINT,Constants.MAX_UINT16),
            clamp(modf(value.Y)[0],Constants.MIN_UINT,Constants.MAX_UINT16)
        ]
        writeu16(this.buffer,this.offset,x)
        writeu16(this.buffer,this.offset + 2,y)
        this.offset += 4
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Vector2 as two f64 (x, y).
    * - 16 bytes total.
    * 
    * @Parameter(s): Vector2
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeVector2(value : Vector2) {
        assert(typeOf(value) === "Vector2","First arguments is expected to be a Vector2")
        this.ensureWritable(Constants.REQUIRED_BYTES.Vector2)
        writef64(this.buffer,this.offset,value.X)
        writef64(this.buffer,this.offset + 8,value.Y)
        this.offset += 16
        this.offsetChanged.Fire(this.offset)
        return this
    }

    //#endregion

    //#region "[Writer-RobloxTypes] Vector3"

    /*
    * Write a Vector3 as three f24 (x, y, z).
    * - 9 bytes total.
    * 
    * @Parameter(s): Vector3
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeVector3float24(value : Vector3) {
        assert(typeOf(value) === "Vector3","First arguments is expected to be a Vector3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Vector3float24)
        writeNfp24(this.buffer,[value.X,value.Y,value.Z],this.offset)
        this.offset += 9
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Vector3 as three f32 (x, y, z).
    * - 12 bytes total.
    * 
    * @Parameter(s): Vector3
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeVector3float32(value : Vector3) {
        assert(typeOf(value) === "Vector3","First arguments is expected to be a Vector3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Vector3float32)
        let [x,y,z] = [value.X,value.Y,value.Z]
        writef32(this.buffer,this.offset,x)
        writef32(this.buffer,this.offset + 4,y)
        writef32(this.buffer,this.offset + 8,z)
        this.offset += 12
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Vector3int16 as three i16 (x, y, z).
    * - 6 bytes total.
    * 
    * @Parameter(s): Vector3int16
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeVector3int16(value : Vector3int16) {
        assert(typeOf(value) === "Vector3int16","First arguments is expected to be a Vector3int16")
        this.ensureWritable(Constants.REQUIRED_BYTES.Vector3int16)
        let [x,y,z] = [value.X,value.Y,value.Z]
        writei16(this.buffer,this.offset,x)
        writei16(this.buffer,this.offset + 2,y)
        writei16(this.buffer,this.offset + 4,z)
        this.offset += 6
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Vector3uint16 as three u16 (x, y, z).
    * - 6 bytes total.
    * 
    * @Parameter(s): Vector3
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeVector3uint16(value : Vector3) {
        assert(typeOf(value) === "Vector3","First arguments is expected to be a Vector3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Vector3uint16)
        let [x,y,z] = [
            clamp(modf(value.X)[0],Constants.MIN_UINT,Constants.MAX_INT16),
            clamp(modf(value.Y)[0],Constants.MIN_UINT,Constants.MAX_INT16),
            clamp(modf(value.Z)[0],Constants.MIN_UINT,Constants.MAX_INT16),
        ]
        writeu16(this.buffer,this.offset,x)
        writeu16(this.buffer,this.offset + 2,y)
        writeu16(this.buffer,this.offset + 4,z)
        this.offset += 6
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Vector3 as three f64 (x, y, z).
    * - 24 bytes total.
    * 
    * @Parameter(s): Vector3
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeVector3(value : Vector3) {
        assert(typeOf(value) === "Vector3","First arguments is expected to be a Vector3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Vector3)
        writef64(this.buffer,this.offset,value.X)
        writef64(this.buffer,this.offset + 8,value.Y)
        writef64(this.buffer,this.offset + 16,value.Z)
        this.offset += 24
        this.offsetChanged.Fire(this.offset)
        return this
    }

    //#endregion

    //#region "[Writer-RobloxTypes] CFrame"

    /*
    * Write a CFrame converted into a quaternion.
    * - 28 bytes total.
    * - Write position first and then turn the axis angle to a quaternion and write it to the buffer.
    * 
    * @Parameter(s): CFrame
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeCFrameQuaternion(value : CFrame) {
        assert(typeOf(value) === "CFrame","First arguments is expected to be a CFrame")
        this.ensureWritable(Constants.REQUIRED_BYTES.CFrameQuaternion)
        let pos = value.Position
        let [axis,angle] = value.ToAxisAngle()
        // Position
        writef32(this.buffer,this.offset,pos.X)
        writef32(this.buffer,this.offset + 4,pos.Y)
        writef32(this.buffer,this.offset + 8,pos.Z)
        // Quaternion
        let quaternion = Extensions.axisAngleToQuaternion(axis,angle)
        writef32(this.buffer,this.offset + 12,quaternion.x)
        writef32(this.buffer,this.offset + 16,quaternion.y)
        writef32(this.buffer,this.offset + 20,quaternion.z)
        writef32(this.buffer,this.offset + 24,quaternion.w)
        this.offset += 28
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a CFrame to the buffer using float24
    * - 18 bytes total.
    * - Convert the CFrame to Euler angles and write them to the buffer. 
    * 
    * @Parameter(s): CFrame
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeCFrameF24(value : CFrame){
        assert(typeOf(value) === "CFrame","First arguments is expected to be a CFrame")
        this.ensureWritable(Constants.REQUIRED_BYTES.CFrameF24)
        let pos = value.Position
        let [rx,ry,rz] = value.ToEulerAnglesXYZ()
        writeNfp24(this.buffer,[
            pos.X,pos.Y,pos.Z,
            rx,ry,rz
        ],this.offset)
        this.offset += 18
        this.offsetChanged.Fire(this.offset)
        return this
    }    

    /*
    * Write a CFrame to the buffer using float32.
    * - 24 bytes total.
    * - Convert the CFrame to Euler angles and write them to the buffer.
    * 
    * @Parameter(s): CFrame
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeCFrameF32(value : CFrame) {
        assert(typeOf(value) === "CFrame","First arguments is expected to be a CFrame")
        this.ensureWritable(Constants.REQUIRED_BYTES.CFrameF32)
        let pos = value.Position
        let [rx,ry,rz] = value.ToEulerAnglesXYZ()
        writef32(this.buffer,this.offset,pos.X)
        writef32(this.buffer,this.offset + 4,pos.Y)
        writef32(this.buffer,this.offset + 8,pos.Z)
        writef32(this.buffer,this.offset + 12,rx)
        writef32(this.buffer,this.offset + 16,ry)
        writef32(this.buffer,this.offset + 20,rz)
        this.offset += 24
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Writes a quantized CFrame to the buffer using 12 bytes (16-bit integers)
    *
    * Memory layout (12 bytes total):
    * - Position X, Y, Z: 3 × i16 (6 bytes) - Precision: 1mm, Range: ±32km
    * - Rotation X, Y, Z: 3 × i16 (6 bytes) - Precision: ~0.05°, Range: ±π radians
    * 
    * Quantization scales:
    * - POSITION_SCALE = 1000 (converts meters to millimeters)
    * - ROTATION_SCALE = 10430.38 (32767/π for optimal angle precision)
    * 
    * @Parameter(s): CFrame
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeCFrameQuantized(value : CFrame) {
        assert(typeOf(value) === "CFrame","First arguments is expected to be a CFrame")
        this.ensureWritable(Constants.REQUIRED_BYTES.CFrameQuantized)
        let pos = value.Position
        let [rx,ry,rz] = value.ToEulerAnglesXYZ()
        writei16(this.buffer,this.offset,clamp(round(pos.X * POSITION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 2,clamp(round(pos.Y * POSITION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 4,clamp(round(pos.Z * POSITION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 6,clamp(round(rx * ROTATION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 8,clamp(round(ry * ROTATION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 10,clamp(round(rz * ROTATION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        this.offset += 12
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a CFrame to the buffer using float64.
    * - 48 bytes total.
    * - Convert the CFrame to Euler angles and write them to the buffer.
    * 
    * @Parameter(s): CFrame
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeCFrameF64(value : CFrame) {
        assert(typeOf(value) === "CFrame","First arguments is expected to be a CFrame")
        this.ensureWritable(Constants.REQUIRED_BYTES.CFrameF64)
        let pos = value.Position
        let [rx,ry,rz] = value.ToEulerAnglesXYZ()
        writef64(this.buffer,this.offset,pos.X)
        writef64(this.buffer,this.offset + 8,pos.Y)
        writef64(this.buffer,this.offset + 16,pos.Z)
        writef64(this.buffer,this.offset + 24,rx)
        writef64(this.buffer,this.offset + 32,ry)
        writef64(this.buffer,this.offset + 40,rz)
        this.offset += 48
        this.offsetChanged.Fire(this.offset)
        return this
    }



    //#endregion

    //#region "[Writer-RobloxTypes] UDim"

    /*
    * Write a UDim to the buffer.
    * - 8 bytes total.
    * - Scale use f32, Offset use i32.
    * 
    * @Parameter(s): UDim
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeUDim(value : UDim){
        assert(typeOf(value) === "UDim","First arguments is expected to be a UDim")
        this.ensureWritable(Constants.REQUIRED_BYTES.UDim)
        writef32(this.buffer,this.offset,value.Scale)
        writei32(this.buffer,this.offset + 4,value.Offset)
        this.offset += 8
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a UDim2 to the buffer.
    * - 16 bytes total.
    * - Scales use f32, Offsets use i32.
    * 
    * @Parameter(s): UDim2
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeUDim2(value : UDim2) {
        assert(typeOf(value) === "UDim2","First arguments is expected to be a UDim2")
        this.ensureWritable(Constants.REQUIRED_BYTES.UDim2)
        writef32(this.buffer,this.offset,value.X.Scale)
        writei32(this.buffer,this.offset + 4,value.X.Offset)
        writef32(this.buffer,this.offset + 8,value.Y.Scale)
        writei32(this.buffer,this.offset + 12,value.Y.Offset)
        this.offset += 16
        this.offsetChanged.Fire(this.offset)
        return this
    }



    //#endregion

    //#region "[Writer-RobloxTypes] Color3"

    /*
    * Write a Color3 to the buffer.
    * - 3 bytes total.
    * - Each component is stored as an unsigned 8-bit integer.
    * 
    * @Parameter(s): Color3
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeColor3(value : Color3) {
        assert(typeOf(value) === "Color3","First arguments is expected to be a Color3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Color3)
        writeu8(this.buffer,this.offset,round(value.R * 255))
        writeu8(this.buffer,this.offset + 1,round(value.G * 255))
        writeu8(this.buffer,this.offset + 2,round(value.B * 255))
        this.offset += 3
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Color3 to the buffer.
    * - 9 bytes total
    * - Each component is stored as an 24-bit float.
    * 
    * @Parameter(s): Color3
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeColor3F24(value : Color3) {
        assert(typeOf(value) === "Color3","First arguments is expected to be a Color3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Color3F24)
        writeNfp24(this.buffer,[value.R,value.G,value.B],this.offset)
        this.offset += 3
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Color3 to the buffer.
    * - 12 bytes total.
    * - Each component is stored as an 32-bit float.
    * 
    * @Parameter(s): Color3
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeColor3F32(value : Color3) {
        assert(typeOf(value) === "Color3","First arguments is expected to be a Color3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Color3F32)
        writef32(this.buffer,this.offset,value.R)
        writef32(this.buffer,this.offset + 4,value.G)
        writef32(this.buffer,this.offset + 8,value.B)
        this.offset += 12
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Color3 to the buffer.
    * - 24 bytes total.
    * - Each component is stored as an 64-bit float.
    * 
    * @Parameter(s): Color3
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeColor3F64(value : Color3) {
        assert(typeOf(value) === "Color3","First arguments is expected to be a Color3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Color3F64)
        writef64(this.buffer,this.offset,value.R)
        writef64(this.buffer,this.offset + 8,value.G)
        writef64(this.buffer,this.offset + 16,value.B)
        this.offset += 24
        this.offsetChanged.Fire(this.offset)
        return this
    }

    //#endregion

    //#region "[Writer-RobloxTypes] Rect"

    /*
    * Write a Rect(Float24) to the buffer.
    * - 12 bytes total.
    * 
    * @Parameter(s): Rect
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeRectFloat24(value : Rect) {
        assert(typeOf(value) === "Rect","First arguments is expected to be a Rect")
        this.ensureWritable(Constants.REQUIRED_BYTES.RectFloat24)
        writeNfp24(this.buffer,[
            value.Min.X,value.Min.Y,
            value.Max.X,value.Max.Y,
        ],this.offset)
        this.offset += 12
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Rect(Float32) to the buffer.
    * - 16 bytes total.
    * 
    * @Parameter(s): Rect
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeRectFloat32(value : Rect) {
        assert(typeOf(value) === "Rect","First arguments is expected to be a Rect")
        this.ensureWritable(Constants.REQUIRED_BYTES.RectFloat32)
        writef32(this.buffer,this.offset,value.Min.X)
        writef32(this.buffer,this.offset + 4,value.Min.Y)
        writef32(this.buffer,this.offset + 8,value.Max.X)
        writef32(this.buffer,this.offset + 12,value.Max.Y)
        this.offset += 16
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Rect to the buffer. (Use f64)
    * - 32 bytes total.
    * 
    * @Parameter(s): Rect
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeRect(value : Rect) {
        assert(typeOf(value) === "Rect","First arguments is expected to be a Rect")
        this.ensureWritable(Constants.REQUIRED_BYTES.Rect)
        writef64(this.buffer,this.offset,value.Min.X)
        writef64(this.buffer,this.offset + 8,value.Min.Y)
        writef64(this.buffer,this.offset + 16,value.Max.X)
        writef64(this.buffer,this.offset + 24,value.Max.Y)
        this.offset += 32
        this.offsetChanged.Fire(this.offset)
        return this
    }



    //#endregion

    //#region "[Writer-RobloxTypes] Region3"

    /*
    * Write a Region3 to the buffer. (Use f64 for CFrame and Size)
    * - 72 bytes total.
    * 
    * @Parameter(s): Region3
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeRegion3(value : Region3){
        assert(typeOf(value) === "Region3","First arguments is expected to be a Region3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Region3)
        let [size,cf] = [value.Size,value.CFrame]
        let pos = cf.Position
        let [rx,ry,rz] = cf.ToEulerAnglesXYZ()
        // CFrame First
        writef64(this.buffer,this.offset,pos.X)
        writef64(this.buffer,this.offset + 8,pos.Y)
        writef64(this.buffer,this.offset + 16,pos.Z)
        writef64(this.buffer,this.offset + 24,rx)
        writef64(this.buffer,this.offset + 32,ry)
        writef64(this.buffer,this.offset + 40,rz)
        // Size
        writef64(this.buffer,this.offset + 48,size.X)
        writef64(this.buffer,this.offset + 56,size.Y)
        writef64(this.buffer,this.offset + 64,size.Z)
        this.offset += 72
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Region3 to the buffer.
    * - 52 bytes total.
    * - CFrame is converted to quaternion.
    * 
    * @Parameter(s): Region3
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeRegion3Quaternion(value : Region3) {
        assert(typeOf(value) === "Region3","First arguments is expected to be a Region3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Region3Quaternion)
        let [size,cf] = [value.Size,value.CFrame]
        let pos = cf.Position
        let [axis,angle] = cf.ToAxisAngle()
        // CFrame 
        writef32(this.buffer,this.offset,pos.X)
        writef32(this.buffer,this.offset + 4,pos.Y)
        writef32(this.buffer,this.offset + 8,pos.Z)
        let quaternion = Extensions.axisAngleToQuaternion(axis,angle)
        writef32(this.buffer,this.offset + 12,quaternion.x)
        writef32(this.buffer,this.offset + 16,quaternion.y)
        writef32(this.buffer,this.offset + 20,quaternion.z)
        writef32(this.buffer,this.offset + 24,quaternion.w)
        // Size
        writef64(this.buffer,this.offset + 28,size.X)
        writef64(this.buffer,this.offset + 36,size.Y)
        writef64(this.buffer,this.offset + 44,size.Z)
        this.offset += 52
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Region3 to the buffer.
    * - 42 bytes total.
    * - CFrame is written as 24-bit floating points.
    * 
    * @Parameter(s): Region3
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeRegion3CFrameF24(value : Region3) {
        assert(typeOf(value) === "Region3","First arguments is expected to be a Region3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Region3CFrameF24)
        let [size,cf] = [value.Size,value.CFrame]
        let pos = cf.Position
        let [rx,ry,rz] = cf.ToEulerAnglesXYZ()
        // CFrame First
        writeNfp24(this.buffer,[
            pos.X,pos.Y,pos.Z,
            rx,ry,rz
        ],this.offset)
        // Size
        writef64(this.buffer,this.offset + 18,size.X)
        writef64(this.buffer,this.offset + 26,size.Y)
        writef64(this.buffer,this.offset + 34,size.Z)
        this.offset += 42
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Region3 to the buffer. (Use f32 for CFrame but use f64 for the Size)
    * - 48 bytes total.
    * 
    * @Parameter(s): Region3
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeRegion3CFrameF32(value : Region3) {
        assert(typeOf(value) === "Region3","First arguments is expected to be a Region3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Region3CFrameF32)
        let [size,cf] = [value.Size,value.CFrame]
        let pos = cf.Position
        let [rx,ry,rz] = cf.ToEulerAnglesXYZ()
        // CFrame
        writef32(this.buffer,this.offset,pos.X)
        writef32(this.buffer,this.offset + 4,pos.Y)
        writef32(this.buffer,this.offset + 8,pos.Z)
        writef32(this.buffer,this.offset + 12,rx)
        writef32(this.buffer,this.offset + 16,ry)
        writef32(this.buffer,this.offset + 20,rz)
        // Size
        writef64(this.buffer,this.offset + 24,size.X)
        writef64(this.buffer,this.offset + 32,size.Y)
        writef64(this.buffer,this.offset + 40,size.Z)
        this.offset += 48
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Region3int16 to the buffer.
    *
    * @Parameter(s): Region3int16
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeRegion3int16(value : Region3int16) {
        assert(typeOf(value) === "Region3int16","First arguments is expected to be a Region3int16")
        this.ensureWritable(Constants.REQUIRED_BYTES.Region3int16)
        let [min,max] = [value.Min,value.Max]
        // Min
        writei16(this.buffer,this.offset,min.X)
        writei16(this.buffer,this.offset + 2,min.Y)
        writei16(this.buffer,this.offset + 4,min.Z)
        // Max
        writei16(this.buffer,this.offset + 6,max.X)
        writei16(this.buffer,this.offset + 8,max.Y)
        writei16(this.buffer,this.offset + 10,max.Z)
        this.offset += 12
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a Region3 to the buffer.
    * - 36 bytes total.
    * - CFrame will be quantized to this format : 
    * 	Position : 16-bit signed integers, quantized (1/1000)
    * 	Rotation : 16-bit signed integers, quantized (~0.0055°)
    * - Size still use (f64)
    * 
    * @Parameter(s): Region3
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeRegion3Quantized(value : Region3) {
        assert(typeOf(value) === "Region3","First arguments is expected to be a Region3")
        this.ensureWritable(Constants.REQUIRED_BYTES.Region3Quantized)
        let [size,cf] = [value.Size,value.CFrame]
        let pos = cf.Position
        let [rx,ry,rz] = cf.ToEulerAnglesXYZ()
        // Quantized-CFrame
        writei16(this.buffer,this.offset,clamp(round(pos.X * POSITION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 2,clamp(round(pos.Y * POSITION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 4,clamp(round(pos.Z * POSITION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 6,clamp(round(rx * ROTATION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 8,clamp(round(ry * ROTATION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 10,clamp(round(rz * ROTATION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        // Size
        writef64(this.buffer,this.offset + 12,size.X)
        writef64(this.buffer,this.offset + 20,size.Y)
        writef64(this.buffer,this.offset + 28,size.Z)
        this.offset += 36
        this.offsetChanged.Fire(this.offset)
        return this
    }

    //#endregion

    //#region "[Writer-RobloxTypes] Enum"

    /*
    * Write a Enum to the buffer.
    * - 2 bytes total.
    * 
    * @Parameter(s): EnumItem
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeEnum(value : EnumItem) {
        assert(typeOf(value) === "EnumItem","First arguments is expected to be a EnumItem")
        this.ensureWritable(Constants.REQUIRED_BYTES.Enum)
        let id = Constants.EnumItemIndex[value as keyof unknown] as number
        writeu16(this.buffer,this.offset,id)
        this.offset += 2
        this.offsetChanged.Fire(this.offset)
        return this
    }

    //#endregion

    //#region "[Writer-RobloxTypes] RotationCurveKey"

    /*
    * Write a RotationCurveKey to the buffer.
    * - 54 bytes or 62 bytes total.
    * 	- 54 bytes for Non-Cubic interpolation-mode.
    * 	- 62 bytes for Cubic interpolation-mode.
    * 
    * @Parameter(s): RotationCurveKey
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeRotationCurveKey(value : RotationCurveKey) {
        assert(typeOf(value) === "RotationCurveKey","First arguments is expected to be a RotationCurveKey")
        let bytes = Constants.REQUIRED_BYTES.RotationCurveKey(value,"Normal")
        this.ensureWritable(bytes)
        let id = Constants.EnumItemIndex[value.Interpolation as keyof unknown] as number
        let pos = value.Value.Position
        let [rx,ry,rz] = value.Value.ToEulerAnglesXYZ()
        // Time
        writef32(this.buffer,this.offset,value.Time)
        // CFrame
        writef64(this.buffer,this.offset + 4,pos.X)
        writef64(this.buffer,this.offset + 12,pos.Y)
        writef64(this.buffer,this.offset + 20,pos.Z)
        writef64(this.buffer,this.offset + 28,rx)
        writef64(this.buffer,this.offset + 36,ry)
        writef64(this.buffer,this.offset + 44,rz)
        // Enum Id
        writeu16(this.buffer,this.offset + 52,id)
        // Tangents included if is cubic
        if(value.Interpolation === Enum.KeyInterpolationMode.Cubic) {
            if(!value.LeftTangent) value.LeftTangent = 0;
            if(!value.RightTangent) value.RightTangent = 0;
            writef32(this.buffer,this.offset + 54,value.LeftTangent)
            writef32(this.buffer,this.offset + 58,value.RightTangent)
        }
        this.offset += bytes
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a RotationCurveKey to the buffer.
    * - 42 bytes or 34 bytes total.
    * 	- 34 bytes for Non-Cubic interpolation-mode.
    * 	- 42 bytes for Cubic interpolation-mode.
    * - CFrame is converted to a quaternion.
    * 
    * @Parameter(s): RotationCurveKey
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeRotationCurveKeyQuaternion(value : RotationCurveKey) {
        assert(typeOf(value) === "RotationCurveKey","First arguments is expected to be a RotationCurveKey")
        let bytes = Constants.REQUIRED_BYTES.RotationCurveKey(value,"Quaternion")
        this.ensureWritable(bytes)
        let id = Constants.EnumItemIndex[value.Interpolation as keyof unknown] as number
        let pos = value.Value.Position
        let [axis,angle] = value.Value.ToAxisAngle()
        // Time
        writef32(this.buffer,this.offset,value.Time)
        // CFrame
        writef32(this.buffer,this.offset + 4,pos.X)
        writef32(this.buffer,this.offset + 8,pos.Y)
        writef32(this.buffer,this.offset + 12,pos.Z)
        let quaternion = Extensions.axisAngleToQuaternion(axis,angle)
        writef32(this.buffer,this.offset + 16,quaternion.x)
        writef32(this.buffer,this.offset + 20,quaternion.y)
        writef32(this.buffer,this.offset + 24,quaternion.z)
        writef32(this.buffer,this.offset + 28,quaternion.w)
        // Enum Id
        writeu16(this.buffer,this.offset + 32,id)
        // Tangents included if is cubic
        if(value.Interpolation === Enum.KeyInterpolationMode.Cubic){
            if(!value.LeftTangent) value.LeftTangent = 0;
            if(!value.RightTangent) value.RightTangent = 0;
            writef32(this.buffer,this.offset + 34,value.LeftTangent)
            writef32(this.buffer,this.offset + 38,value.RightTangent)            
        }
        this.offset += bytes
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a RotationCurveKey to the buffer.
    * - 24 bytes or 32 bytes total.
    * 	- 24 bytes for Non-Cubic interpolation-mode.
    * 	- 32 bytes for Cubic interpolation-mode.
    * - CFrame is written using f24.
    * 
    * @Parameter(s): RotationCurveKey
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeRotationCurveKeyCFrameF24(value : RotationCurveKey) {
        assert(typeOf(value) === "RotationCurveKey","First arguments is expected to be a RotationCurveKey")
        let bytes = Constants.REQUIRED_BYTES.RotationCurveKey(value,"CFrameF24")
        this.ensureWritable(bytes)
        let id = Constants.EnumItemIndex[value.Interpolation as keyof unknown] as number
        let pos = value.Value.Position
        let [rx,ry,rz] = value.Value.ToEulerAnglesXYZ()
        // Time
        writef32(this.buffer,this.offset,value.Time)
        // CFrame
        writeNfp24(this.buffer,[
            pos.X,pos.Y,pos.Z,
            rx,ry,rz
        ],this.offset + 4)
        // Enum Id
        writeu16(this.buffer,this.offset + 22,id)
        // Tangents included if is cubic
        if(value.Interpolation === Enum.KeyInterpolationMode.Cubic){
            if(!value.LeftTangent) value.LeftTangent = 0;
            if(!value.RightTangent) value.RightTangent = 0;
            writef32(this.buffer,this.offset + 24,value.LeftTangent)
            writef32(this.buffer,this.offset + 28,value.RightTangent)            
        }
        this.offset += bytes
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a RotationCurveKey to the buffer.
    * - 30 bytes or 38 bytes total.
    * 	- 30 bytes for Non-Cubic interpolation-mode. 
    * 	- 38 bytes for Cubic interpolation-mode.
    * - Everything is written using f32 (but always u16 for the enumItem).
    * 
    * @Parameter(s): RotationCurveKey
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeRotationCurveKeyCFrameF32(value : RotationCurveKey) {
        assert(typeOf(value) === "RotationCurveKey","First arguments is expected to be a RotationCurveKey")
        let bytes = Constants.REQUIRED_BYTES.RotationCurveKey(value,"CFrameF32")
        this.ensureWritable(bytes)
        let id = Constants.EnumItemIndex[value.Interpolation as keyof unknown] as number
        let pos = value.Value.Position
        let [rx,ry,rz] = value.Value.ToEulerAnglesXYZ()
        // Time
        writef32(this.buffer,this.offset,value.Time)
        // CFrame
        writef32(this.buffer,this.offset + 4,pos.X)
        writef32(this.buffer,this.offset + 8,pos.Y)
        writef32(this.buffer,this.offset + 12,pos.Z)
        writef32(this.buffer,this.offset + 16,rx)
        writef32(this.buffer,this.offset + 20,ry)
        writef32(this.buffer,this.offset + 24,rz)
        // Enum Id
        writeu16(this.buffer,this.offset + 28,id)
        // Tangents included if is cubic
        if(value.Interpolation === Enum.KeyInterpolationMode.Cubic){
            if(!value.LeftTangent) value.LeftTangent = 0;
            if(!value.RightTangent) value.RightTangent = 0;
            writef32(this.buffer,this.offset + 30,value.LeftTangent)
            writef32(this.buffer,this.offset + 34,value.RightTangent)            
        }
        this.offset += bytes
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a RotationCurveKey to the buffer.
    * - 18 bytes or 26 bytes total.
    * 	- 18 bytes for Non-Cubic interpolation-mode.
    * 	- 26 bytes for Cubic interpolation-mode.
    * - CFrame will be quantized to this format : 
    * 	Position : 16-bit signed integers, quantized (1/1000)
    * 	Rotation : 16-bit signed integers, quantized (~0.0055°) 
    * 
    * @Parameter(s): RotationCurveKey
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeRotationCurveKeyQuantized(value : RotationCurveKey) {
        assert(typeOf(value) === "RotationCurveKey","First arguments is expected to be a RotationCurveKey")
        let bytes = Constants.REQUIRED_BYTES.RotationCurveKey(value,"Quantized")
        this.ensureWritable(bytes)
        let id = Constants.EnumItemIndex[value.Interpolation as keyof unknown] as number
        let pos = value.Value.Position
        let [rx,ry,rz] = value.Value.ToEulerAnglesXYZ()
        // Time
        writef32(this.buffer,this.offset,value.Time)
        // CFrame (Quantized)
        writei16(this.buffer,this.offset + 4,clamp(round(pos.X * POSITION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 6,clamp(round(pos.Y * POSITION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 8,clamp(round(pos.Z * POSITION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 10,clamp(round(rx * ROTATION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 12,clamp(round(ry * ROTATION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        writei16(this.buffer,this.offset + 14,clamp(round(rz * ROTATION_SCALE),Constants.MIN_INT16,Constants.MAX_INT16))
        // Enum Id
        writeu16(this.buffer,this.offset + 16,id)
        // Tangents included if is cubic
        if(value.Interpolation === Enum.KeyInterpolationMode.Cubic){
            if(!value.LeftTangent) value.LeftTangent = 0;
            if(!value.RightTangent) value.RightTangent = 0;
            writef32(this.buffer,this.offset + 18,value.LeftTangent)
            writef32(this.buffer,this.offset + 22,value.RightTangent)            
        }
        this.offset += bytes
        this.offsetChanged.Fire(this.offset)
        return this
    }

    //#endregion

    //#region "[Writer-RobloxTypes] FloatCurveKey"

    /*
    * Write a FloatCurveKey to the buffer.
    * - 16 bytes or 24 bytes total.
    * 	- 16 bytes for Linear/Constant interpolation
    * 	- 24 bytes for Cubic interpolation (includes tangent data)
    * 
    * @Parameter(s): FloatCurveKey
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeFloatCurveKey(value : EditableFloatCurveKey) {
        assert(typeOf(value) === "FloatCurveKey","First arguments is expected to be a FloatCurveKey")
        let bytes = Constants.REQUIRED_BYTES.FloatCurveKey(value,"Normal")
        this.ensureWritable(bytes)
        let id = Constants.EnumItemIndex[value.Interpolation as keyof defined] as number
        writef32(this.buffer,this.offset,value.Time)
        writef64(this.buffer,this.offset + 4,value.Value)
        writeu16(this.buffer,this.offset + 12,id)
        if(value.Interpolation === Enum.KeyInterpolationMode.Cubic) {
            if(!value.LeftTangent) value.LeftTangent = 0;
            if(!value.RightTangent) value.RightTangent = 0;
            writef32(this.buffer,this.offset + 14,value.LeftTangent)
            writef32(this.buffer,this.offset + 18,value.RightTangent)
        }
        this.offset += bytes
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a FloatCurveKey to the buffer.
    * - 18 bytes or 24 bytes total.
    * 	- 18 bytes for Linear/Constant interpolation
    * 	- 24 bytes for Cubic interpolation (includes tangent data) 
    * 
    * Write the property `.Value` as a f24 instead of a f64.
    * 
    * @Parameter(s): FloatCurveKey
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeFloatCurveKeyF24(value : EditableFloatCurveKey) {
        assert(typeOf(value) === "FloatCurveKey","First arguments is expected to be a FloatCurveKey")
        let bytes = Constants.REQUIRED_BYTES.FloatCurveKey(value,"F24")
        this.ensureWritable(bytes)
        let id = Constants.EnumItemIndex[value.Interpolation as keyof defined] as number
        writef32(this.buffer,this.offset,value.Time)
        writeNfp24(this.buffer,[value.Value],this.offset + 4)
        writeu16(this.buffer,this.offset + 7,id)
        if(value.Interpolation === Enum.KeyInterpolationMode.Cubic) {
            if(!value.LeftTangent) value.LeftTangent = 0;
            if(!value.RightTangent) value.RightTangent = 0;
            writef32(this.buffer,this.offset + 9,value.LeftTangent)
            writef32(this.buffer,this.offset + 13,value.RightTangent)
        }
        this.offset += bytes
        this.offsetChanged.Fire(this.offset)
        return this        
    }

    /*
    * Write a FloatCurveKey to the buffer.
    * - 18 bytes or 10 bytes total.
    * 	- 10 bytes for Linear/Constant interpolation
    * 	- 18 bytes for Cubic interpolation (includes tangent data)
    * 
    * Write the property `.Value` as a f32 instead of a f64.
    * 
    * @Parameter(s): FloatCurveKey
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeFloatCurveKeyF32(value : EditableFloatCurveKey) {
        assert(typeOf(value) === "FloatCurveKey","First arguments is expected to be a FloatCurveKey")
        let bytes = Constants.REQUIRED_BYTES.FloatCurveKey(value,"F32")
        this.ensureWritable(bytes)
        let id = Constants.EnumItemIndex[value.Interpolation as keyof defined] as number
        writef32(this.buffer,this.offset,value.Time)
        writef32(this.buffer,this.offset + 4,value.Value)
        writeu16(this.buffer,this.offset + 8,id)
        if(value.Interpolation === Enum.KeyInterpolationMode.Cubic) {
            if(!value.LeftTangent) value.LeftTangent = 0;
            if(!value.RightTangent) value.RightTangent = 0;
            writef32(this.buffer,this.offset + 10,value.LeftTangent)
            writef32(this.buffer,this.offset + 14,value.RightTangent)
        }
        this.offset += bytes
        this.offsetChanged.Fire(this.offset)
        return this           
    }

    /*
    * Write a FloatCurveKey to the buffer.
    * - 16 bytes or 8 bytes total.
    * 	- 8 bytes for Linear/Constant interpolation
    * 	- 16 bytes for Cubic interpolation (includes tangent data)
    * 
    * Write the property `.Value` as a f16 instead of a f64.
    * 
    * @Parameter(s): FloatCurveKey
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeFloatCurveKeyF16(value : EditableFloatCurveKey) {
        assert(typeOf(value) === "FloatCurveKey","First arguments is expected to be a FloatCurveKey")
        let bytes = Constants.REQUIRED_BYTES.FloatCurveKey(value,"F16")
        this.ensureWritable(bytes)
        let id = Constants.EnumItemIndex[value.Interpolation as keyof defined] as number
        writef32(this.buffer,this.offset,value.Time)
        let [uint16] = Extensions.toFloat16(value.Value)
        writeu16(this.buffer,this.offset + 4,uint16)
        writei16(this.buffer,this.offset + 6,id)
        if(value.Interpolation === Enum.KeyInterpolationMode.Cubic) {
            if(!value.LeftTangent) value.LeftTangent = 0;
            if(!value.RightTangent) value.RightTangent = 0;
            writef32(this.buffer,this.offset + 8,value.LeftTangent)
            writef32(this.buffer,this.offset + 12,value.RightTangent)
        }
        this.offset += bytes
        this.offsetChanged.Fire(this.offset)
        return this           
    }

    //#endregion
    
    //#region "[Writer-RobloxTypes] ColorSequence"

    /*
    * Writes a ColorSequence to the buffer with all its keypoints.
    * Limited to 255 keypoints.
    * 
    * Size : 1 + (7 * numbersOfKeypoints)
    * 
    * @Parameter(s): ColorSequence
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeColorSequence(value : ColorSequence) {
        assert(typeOf(value) === "ColorSequence","First arguments is expected to be a ColorSequence")
        if(value.Keypoints.size() <= 0) { warn("Skipped ColorSequence, empty table was given"); return }
        let bytes = Constants.REQUIRED_BYTES.ColorSequence(value,"Normal")
        this.ensureWritable(bytes)
        writeu8(this.buffer,this.offset,value.Keypoints.size())
        this.offset += 1
        for(let i = 0; i <= value.Keypoints.size(); i++) {
            let keypoint = value.Keypoints[i]
            writef32(this.buffer,this.offset,keypoint.Time)
            writeu8(this.buffer,this.offset + 4,round(keypoint.Value.R * 255))
            writeu8(this.buffer,this.offset + 5,round(keypoint.Value.G * 255))
            writeu8(this.buffer,this.offset + 6,round(keypoint.Value.B * 255))
            this.offset += 7
        }
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Writes a ColorSequence to the buffer with all its keypoints.
    * Limited to 255 keypoints.
    * 
    * NOTE: This method uses 24-bit floating point numbers to store the RGB values, 
    * 
    * Size : 1 + (13 * numbersOfKeypoints)
    * 
    * @Parameter(s): ColorSequence
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeColorSequenceF24(value : ColorSequence) {
        assert(typeOf(value) === "ColorSequence","First arguments is expected to be a ColorSequence")
        if(value.Keypoints.size() <= 0) { warn("Skipped ColorSequence, empty table was given"); return }
        let bytes = Constants.REQUIRED_BYTES.ColorSequence(value,"F24")
        this.ensureWritable(bytes)
        writeu8(this.buffer,this.offset,value.Keypoints.size())
        this.offset += 1
        for(let i = 0; i <= value.Keypoints.size(); i++) {
            let keypoint = value.Keypoints[i]
            writef32(this.buffer,this.offset,keypoint.Time)
            writeNfp24(this.buffer,[keypoint.Value.R,keypoint.Value.G,keypoint.Value.B],this.offset + 4)
            this.offset += 13
        }
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Writes a ColorSequence to the buffer with all its keypoints.
    * Limited to 255 keypoints.
    * 
    * NOTE: This method uses 32-bit floating point numbers to store the RGB values
    * 
    * Size : 1 + (16 * numbersOfKeypoints)
    * 
    * @Parameter(s): ColorSequence
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeColorSequenceF32(value : ColorSequence) {
        assert(typeOf(value) === "ColorSequence","First arguments is expected to be a ColorSequence")
        if(value.Keypoints.size() <= 0) { warn("Skipped ColorSequence, empty table was given"); return }
        let bytes = Constants.REQUIRED_BYTES.ColorSequence(value,"F32")
        this.ensureWritable(bytes)
        writeu8(this.buffer,this.offset,value.Keypoints.size())
        this.offset += 1
        for(let i = 0; i <= value.Keypoints.size(); i++) {
            let keypoint = value.Keypoints[i]
            writef32(this.buffer,this.offset,keypoint.Time)        
            writef32(this.buffer,this.offset + 4,keypoint.Value.R)
            writef32(this.buffer,this.offset + 8,keypoint.Value.G)
            writef32(this.buffer,this.offset + 12,keypoint.Value.B)
            this.offset += 16
        }
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Writes a ColorSequence to the buffer with all its keypoints.
    * Limited to 255 keypoints.
    * 
    * NOTE: This method uses 64-bit floating point numbers to store the RGB values
    * 
    * Size : 1 + (28 * numbersOfKeypoints)
    * 
    * @Parameter(s): ColorSequence
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeColorSequenceF64(value : ColorSequence) {
        assert(typeOf(value) === "ColorSequence","First arguments is expected to be a ColorSequence")
        if(value.Keypoints.size() <= 0) { warn("Skipped ColorSequence, empty table was given"); return }
        let bytes = Constants.REQUIRED_BYTES.ColorSequence(value,"F64")
        this.ensureWritable(bytes)
        writeu8(this.buffer,this.offset,value.Keypoints.size())
        this.offset += 1
        for(let i = 0; i <= value.Keypoints.size(); i++) {
            let keypoint = value.Keypoints[i]
            writef32(this.buffer,this.offset,keypoint.Time)
            writef64(this.buffer,this.offset + 4,keypoint.Value.R)
            writef64(this.buffer,this.offset + 12,keypoint.Value.G)
            writef64(this.buffer,this.offset + 20,keypoint.Value.B)
            this.offset += 28
        }
        this.offsetChanged.Fire(this.offset)
        return this
    }

    //#endregion

    //#region "[Writer-RobloxTypes] NumberRange"

    /*
    * Write a NumberRange to the buffer
    * - 8 bytes total
    * 	- 4 bytes for Min (F32)
    * 	- 4 bytes for Max (F32)
    * 
    * @Parameter(s): NumberRange
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeNumberRange(value : NumberRange) {
        assert(typeOf(value) === "NumberRange","First arguments is expected to be a NumberRange")
        this.ensureWritable(Constants.REQUIRED_BYTES.NumberRange)
        writef32(this.buffer,this.offset,value.Min)
        writef32(this.buffer,this.offset + 4,value.Max)
        this.offset += 8
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a NumberRange to the buffer
    * - 4 bytes total
    * 	- 2 bytes for Min (F16)
    * 	- 2 bytes for Max (F16)
    * 
    * @Parameter(s): NumberRange
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeNumberRangeF16(value : NumberRange) {
        assert(typeOf(value) === "NumberRange","First arguments is expected to be a NumberRange")
        this.ensureWritable(Constants.REQUIRED_BYTES.NumberRangeF16)
        let min = Extensions.toFloat16(value.Min)[0]
        let max = Extensions.toFloat16(value.Max)[0]
        writeu16(this.buffer,this.offset,min)
        writeu16(this.buffer,this.offset + 2,max)
        this.offset += 4
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a NumberRange to the buffer
    * - 6 bytes total
    * 	- 3 bytes for Min (F24)
    * 	- 3 bytes for Max (F24)
    * 
    * @Parameter(s): NumberRange
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeNumberRangeF24(value : NumberRange) {
        assert(typeOf(value) === "NumberRange","First arguments is expected to be a NumberRange")
        this.ensureWritable(Constants.REQUIRED_BYTES.NumberRangeF24)
        writeNfp24(this.buffer,[value.Min,value.Max],this.offset)
        this.offset += 6
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a NumberRange to the buffer
    * - 16 bytes total
    * 	- 8 bytes for Min (F64)
    * 	- 8 bytes for Max (F64)
    * 
    * @Parameter(s): NumberRange
    * 
    * @lastest modification : v4.0
    * @lastest modification : v4.0
    */
    public writeNumberRangeF64(value : NumberRange) {
        assert(typeOf(value) === "NumberRange","First arguments is expected to be a NumberRange")
        this.ensureWritable(Constants.REQUIRED_BYTES.NumberRangeF64)
        writef64(this.buffer,this.offset,value.Min)
        writef64(this.buffer,this.offset + 8,value.Max)
        this.offset += 16
        this.offsetChanged.Fire(this.offset)
        return this
    }

    //#endregion

    //#region "[Writer-RobloxTypes] NumberSequence"

    /*
    * Write a NumberSequence to the buffer
    * Limited to 255 keypoints.
    * 
    * Size : 1 + (12 * numbersOfKeypoints)
    * 
    * @Parameter(s): NumberSequence
    * 
    * @lastest modification : v4.0
    * @since v1.0
    */
    public writeNumberSequence(value : NumberSequence) {
        assert(typeOf(value) === "NumberSequence","First arguments is expected to be a NumberSequence")
        if(value.Keypoints.size() <= 0) { warn("Skipped NumberSequence, empty table was given"); return }
        let bytes = Constants.REQUIRED_BYTES.NumberSequence(value,"Normal")
        this.ensureWritable(bytes)
        writeu8(this.buffer,this.offset,value.Keypoints.size())
        this.offset += 1
        for(let i = 0; i <= value.Keypoints.size(); i++) {
            let keypoint = value.Keypoints[i]
            writef32(this.buffer,this.offset,keypoint.Time)
            writef32(this.buffer,this.offset + 4,keypoint.Value)
            writef32(this.buffer,this.offset,keypoint.Envelope)
            this.offset += 12
        }
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a NumberSequence to the buffer
    * Limited to 255 keypoints.
    * 
    * NOTE : This function use F16 to write the number
    * 
    * Size : 1 + (10 * numbersOfKeypoints)
    * 
    * @Parameter(s): NumberSequence
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeNumberSequenceF16(value : NumberSequence) {
        assert(typeOf(value) === "NumberSequence","First arguments is expected to be a NumberSequence")
        if(value.Keypoints.size() <= 0) { warn("Skipped NumberSequence, empty table was given"); return }
        let bytes = Constants.REQUIRED_BYTES.NumberSequence(value,"F16")
        this.ensureWritable(bytes)
        writeu8(this.buffer,this.offset,value.Keypoints.size())
        this.offset += 1
        for(let i = 0; i <= value.Keypoints.size(); i++) {
            let keypoint = value.Keypoints[i]
            writef32(this.buffer,this.offset,keypoint.Time)
            let [uint16] = Extensions.toFloat16(keypoint.Value)
            writeu16(this.buffer,this.offset + 4,uint16)
            writef32(this.buffer,this.offset + 6,keypoint.Envelope)
            this.offset += 10
        }
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a NumberSequence to the buffer
    * Limited to 255 keypoints.
    * 
    * NOTE : This function use F24 to write the number
    * 
    * Size : 1 + (11 * numbersOfKeypoints)
    * 
    * @Parameter(s): NumberSequence
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeNumberSequenceF24(value : NumberSequence) {
        assert(typeOf(value) === "NumberSequence","First arguments is expected to be a NumberSequence")
        if(value.Keypoints.size() <= 0) { warn("Skipped NumberSequence, empty table was given"); return }
        let bytes = Constants.REQUIRED_BYTES.NumberSequence(value,"F24")
        this.ensureWritable(bytes)
        writeu8(this.buffer,this.offset,value.Keypoints.size())
        this.offset += 1
        for(let i = 0; i <= value.Keypoints.size(); i++) {
            let keypoint = value.Keypoints[i]
            writef32(this.buffer,this.offset,keypoint.Time)
            writeNfp24(this.buffer,[keypoint.Value],this.offset + 4)
            writef32(this.buffer,this.offset + 7,keypoint.Envelope)
            this.offset += 11
        }
        this.offsetChanged.Fire(this.offset)
        return this
    }

    /*
    * Write a NumberSequence to the buffer
    * Limited to 255 keypoints.
    * 
    * NOTE : This function use F64 to write the number
    * 
    * Size : 1 + (16 * #numbersOfKeypoints)
    * 
    * @Parameter(s): NumberSequence
    * 
    * @lastest modification : v4.0
    * @since v4.0
    */
    public writeNumberSequenceF64(value : NumberSequence){
        assert(typeOf(value) === "NumberSequence","First arguments is expected to be a NumberSequence")
        if(value.Keypoints.size() <= 0) { warn("Skipped NumberSequence, empty table was given"); return }
        let bytes = Constants.REQUIRED_BYTES.NumberSequence(value,"F64")
        this.ensureWritable(bytes)
        writeu8(this.buffer,this.offset,value.Keypoints.size())
        this.offset += 1
        for(let i = 0; i <= value.Keypoints.size(); i++) {
            let keypoint = value.Keypoints[i]
            writef32(this.buffer,this.offset,keypoint.Time)
            writef64(this.buffer,this.offset + 4,keypoint.Value)
            writef32(this.buffer,this.offset + 12,keypoint.Envelope)
            this.offset += 16
        }
        this.offsetChanged.Fire(this.offset)
        return this        
    }

    //#endregion

    //#region "[Writer-RobloxTypes] Instance"

    /*
    * Store an Instance inside `instanceBuffer`.
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public writeInstance(inst : Instance) {
        assert(typeOf(inst) === "Instance","First argument is expected to be a Instance")
        tblinsert(this.instanceBuffer,inst)
        this.instanceOffset += 1
        this.instanceOffsetChanged.Fire(this.instanceOffset)
    }

    //#endregion

    //#region "[Writer] Custom types"

    /*
    * Writes a value to the buffer using the specified Bitstream type.
    *
    * Supports primitive types, arrays, and structs. Complex types are
    * recursively expanded and written to the buffer.
    * 
    * @Parameters:
    * 	- writeType : Enumeration.BitstreamTypes
    * 	- value : unknown
    * 
    * @lastest modification : v4.0
    * @since v2.8
    */
    public writeAs(writeType : Enumeration.BitstreamTypes,value : unknown) {
        assert(typeOf(writeType) !== "nil","A specific type is required.")
        assert(typeOf(value) !== "nil","A value is required.")
        if(typeOf(writeType) === "table") {
            // Formatted `writeType` to an actual TableType
            let formatted = (writeType as Enumeration.BitstreamTableType)
            let typeName = formatted.Type
            if(typeName === "Array") {
                Resolver.iterateArray(formatted.Types,(value as [defined]),(t,v) => {
                    this.writeAs(t as Enumeration.BitstreamTypes,v as defined)
                })
            }
            else if(typeName === "Struct") {
                Resolver.iterateStruct(formatted.Fields,(value as Record<string,unknown>),(t,v) => {
                    this.writeAs(t as Enumeration.BitstreamTypes,v as defined)
                })
            }
            else {
                let extra = formatted.Length || formatted.Option
                if(typeOf(extra) !== "number") {
                    (formatted.Type as string) = formatted.Type + extra
                }
                (this[`write${formatted.Type as string}` as keyof unknown] as WriterIndexCallback)(value)
            }
            return this
        }
        // Fallback to literal string types (i.e. "I8" etc...)
        let rbxType = Extensions.bitstreamTypesToLiteralTypes(writeType as Enumeration.BitstreamTypesName)
        assert(typeOf(value) === rbxType,`Type-missmatch: expected to be a ${typeOf(rbxType)} but got : ${typeOf(value)}`);
        return (this[`write${writeType as Enumeration.BitstreamTypesName}` as keyof unknown] as WriterIndexCallback)(value)
    }

    /*
    * Writes an array of typed values to the buffer.
    *
    * @Parameter(s): 
    * 	Types = [Enumeration.BitstreamTypes]
    * 	Values = [T]
    * 
    * Note : Its preferable to directly use the target type function instead of `writeArray`.
    * It directly call `writeAs` for each value in the array.
    * 
    * @lastest modification : v4.0
    * @since v2.8
    */
    public writeArray<T>(types : [Enumeration.BitstreamTypes],values : [T]) {
        assert(typeOf(types) === "table","First argument is expected to be a table containing types")
        assert(typeOf(values) === "table","Second argument is expected to be a array of values")
        Resolver.iterateArray(types,values,(t,v) => {
            this.writeAs(t as Enumeration.BitstreamTypes,v)
        })
        return this
    }

    /*
    * Writes any supported value into the buffer by dynamically selecting
    * the appropriate serialization method based on its runtime type.
    * 
    * @Parameter(s): any
    * 
    * @latest modification : v4.0
    * @since v3.1
    */
    public writeAny(value : unknown) {
        assert(typeOf(value) !== "nil","A value is required.")
        let valueType = Resolver.resolveValueType(value)
        switch(valueType) {
            case "Array":
                let array = Resolver.resolveArraySchema(value as [unknown])
                this.writeAs(array,value)
                return $tuple(this,array);
            case "Struct":
                let struct = Resolver.resolveStructSchema(value as Record<string,defined>)
                this.writeAs(struct,value)
                return $tuple(this,struct)
            case "String":
                this.writeString(value as string)
                return $tuple(this,{Type : "String",Length : (value as string).size()})
            default: break;
        }
        if(this[`write${valueType as string}` as keyof unknown]) {
            (this[`write${valueType as string}` as keyof unknown] as WriterIndexCallback)(value)
        }
        else {
            this.writeAs(valueType as Enumeration.BitstreamTypes,value)
        }
        return $tuple(this,valueType)
    }

    /*
    * Writes a structured table (dictionary) into the buffer.
    *
    * @latest modification : v4.0
    * @since v3.2
    */
    public writeStruct(schema : Enumeration.StructSchema,struct : Record<string,defined>) {
        assert(typeOf(schema) === "table","First argument is expected to be a table corresponding to a StructSchema")
        assert(typeOf(struct) === "table","Second argument is expected to be a dictionary")
        Resolver.iterateStruct(schema.Fields,struct,(t,v) => {
            this.writeAs(t as Enumeration.BitstreamTypes,v)
        })
        return this
    }

    //#endregion

    //#endregion

    //#endregion

    //#region "[Reader] Signed Integer"

    /*
    * Read a Signed 8-bit integer from the buffer
    *
    * @Returns number in [-128, 127] 
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readI8(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeRead(readi8,this.buffer,offset)
    }

    /*
    * Read a Signed 24-bit integer from the buffer
    *
    * @Returns number in [-8_388_608, 8_388_607]
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readI16(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeRead(readi8,this.buffer,offset)
    }

    /*
    * Read a Signed 24-bit integer from the buffer
    * 
    * @Returns number in [-8_388_608, 8_388_607] 
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readI24(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            const bytes = [
                readu8(this.buffer,offset),
                readu8(this.buffer,offset + 1),
                readu8(this.buffer,offset + 2),
            ]
            let value = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2]
            // sign bit set (2^7 in the MSB)
            if(bytes[0] >= fsbit8) value -= fbit24 // subtract 2^24
            return value
        },offset)
    }

    /*
    * Read a Signed 32-bit integer from the buffer
    *
    * @Returns number in [-2_147_483_648, 2_147_483_647] 
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readI32(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeRead(readi32,this.buffer,offset)
    }

    /*
    * Read a Signed 40-bit integer from the buffer
    *
    * @Returns number in [-549_755_813_888, 549_755_813_887] 
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readI40(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            const bytes = [
                readu8(this.buffer,offset),
                readu8(this.buffer,offset + 1),
                readu8(this.buffer,offset + 2),
                readu8(this.buffer,offset + 3),
                readu8(this.buffer,offset + 4),
            ]
            let value = bytes[0] * fbit32 + bytes[1] * fbit24 + bytes[2] * fbit16 + bytes[3] * fbit8 + bytes[4]
            if(value >= fsbits40) value -= fbit40
            return value
        },offset)
    }

    /*
    * Read a Signed 48-bit integer from the buffer
    *
    * @Returns number in [-140_737_488_355_328, 140_737_488_355_327]
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readI48(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            const bytes = [
                readu8(this.buffer,offset),
                readu8(this.buffer,offset + 1),
                readu8(this.buffer,offset + 2),
                readu8(this.buffer,offset + 3),
                readu8(this.buffer,offset + 4),
                readu8(this.buffer,offset + 5)                
            ]
            let value = bytes[0] * fbit40 + bytes[1] * fbit32 + bytes[2] * fbit24 + bytes[3] * fbit16 + bytes[4] * fbit8 + bytes[5]
            if(value >= fsbits48) value -= fbit48
            return value
        },offset)
    }

    /*
    * Read a Signed 54-bit integer from the buffer
    *
    * @Returns number in [-9_007_199_254_740_992, 9_007_199_254_740_991] 
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readI54(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            const bytes = [
                readu8(this.buffer,offset),
                readu8(this.buffer,offset + 1),
                readu8(this.buffer,offset + 2),
                readu8(this.buffer,offset + 3),
                readu8(this.buffer,offset + 4),
                readu8(this.buffer,offset + 5),
                readu8(this.buffer,offset + 6)           
            ]
            const msb54 = bytes[0] & bm6
            let value = msb54 * fbit48 + bytes[1] * fbit40 + bytes[2] * fbit32 + bytes[3] * fbit24 + bytes[4] * fbit16 + bytes[5] * fbit8 + bytes[6]
            if(value >= fsbits54) value -= fbit54
            return value
        },offset)       
    }

    //#endregion

    //#region "[Reader] Unsigned Integer"

    /*
    * Read 1 unsigned bit from the buffer.
    *
    * @Returns number in [0, 1]
    * 
    * @latest modification : v4.0
    * @since v1.3
    */
    public readU1(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number * 8) <= this.offset * 8 ? offset : this.offset) as number * 8
        return this.executeRead(readbits,this.buffer,offset,1)
    }

    /*
    * Read an Unsigned 8-bit integer from the buffer.
    *
    * @Returns number in [0, 255]
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readU8(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeRead(readu8,this.buffer,offset)
    }

    /*
    * Read an Unsigned 16-bit integer from the buffer.
    *
    * @Returns number in [0, 65_535]
    * 
    * @latest modification : v4.0
    * @since v1.0
    */    
    public readU16(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeRead(readu16,this.buffer,offset)
    }

    /*
    * Read an Unsigned 24-bit integer from the buffer.
    *
    * @Returns number in [0, 16_777_215]
    * 
    * @latest modification : v4.0
    * @since v1.0
    */      
    public readU24(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            const bytes = [
                readu8(this.buffer,offset),
                readu8(this.buffer,offset + 1),
                readu8(this.buffer,offset + 2)
            ]
            return (bytes[0] << 16 | bytes[1] << 8) | bytes[2]
        })
    }

    /*
    * Read an Unsigned 32-bit integer from the buffer.
    *
    * @Returns number in [0, 4_294_967_295]
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readU32(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeRead(readu32,this.buffer,offset)
    }

    /*
    * Read an Unsigned 40-bit integer from the buffer.
    *
    * @Returns number in [0, 109_951_162_777_5]
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readU40(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            const bytes = [
                readu8(this.buffer,offset),
                readu8(this.buffer,offset + 1),
                readu8(this.buffer,offset + 2),
                readu8(this.buffer,offset + 3),
                readu8(this.buffer,offset + 4),
            ]
            let value = bytes[0] * fbit32 + bytes[1] * fbit24 + bytes[2] * fbit16 + bytes[3] * fbit8 + bytes[4]
            return value
        })
    }

    /*
    * Read an Unsigned 48-bit integer from the buffer.
    *
    * @Returns number in [0, 281_474_976_710_655]
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readU48(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => { 
            const bytes = [
                readu8(this.buffer,offset),
                readu8(this.buffer,offset + 1),
                readu8(this.buffer,offset + 2),
                readu8(this.buffer,offset + 3),
                readu8(this.buffer,offset + 4),
                readu8(this.buffer,offset + 5),
            ]
            let value = bytes[0] * fbit40 + bytes[1] * fbit32 + bytes[2] * fbit24 + bytes[3] * fbit16 + bytes[4] * fbit8 + bytes[5]
            return value
        })
    }    

    /*
    * Read an Unsigned 54-bit integer from the buffer.
    *
    * @Returns number in [0, 18_014_398_509_481_980]
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readU54(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            const bytes = [
                readu8(this.buffer,offset),
                readu8(this.buffer,offset + 1),
                readu8(this.buffer,offset + 2),
                readu8(this.buffer,offset + 3),
                readu8(this.buffer,offset + 4),
                readu8(this.buffer,offset + 5),
                readu8(this.buffer,offset + 6)
            ]
            let value = bytes[0] * fbit48 + bytes[1] * fbit40 + bytes[2] * fbit32 + bytes[3] * fbit24 + bytes[4] * fbit16 + bytes[5] * fbit8 + bytes[6]
            return value
        })
    }

    //#endregion

    //#region "[Reader] String"

    /*
    * Read a String from the buffer.
    *
    * @Returns exepected string 
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readString(length : number,offset? : number) {
        assert(typeOf(length) === "number","First argument must be the length of the string you want to read.")
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeRead(readstring,this.buffer,this.offset,length)
    }

    /*
    * Read a String from the buffer with a prefix.
    *
    * Read Order :
    * 	1. Read the unsigned bit to know the length of the string
    * 	2. Read the length from the unsigned bit
    * 	3. Read the string with all required information
    * 
    * @Returns exepected string 
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readPrefixedString(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        let enumValue = this.readU8(offset)
        let enumName = Enumeration.fromValue(enumValue)
        const length = (this[`read${enumName}` as keyof unknown] as ReaderIndexCallback<number>)(offset + 1)
        this.ensureReadable(offset + 1 + Constants.REQUIRED_BYTES[enumName as keyof unknown],length)
        return readstring(this.buffer,offset + 2,length)
    }

    //#endregion

    //#region "[Reader] Booleans"

    /*
    * Read a 1-bit boolean from the buffer at a given bit offset.
    *
    * @Returns boolean 
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readBool1(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number * 8) <= this.offset * 8 ? offset : this.offset) as number * 8
        return (this.executeRead(readbits,this.buffer,offset,1) === 1 ? true : false)
    }

    /*
    * Read 8 booleans (1 bit each) starting at a given bit offset.
    *
    * @Returns Table(
    *   value : {boolean} -- 8 booleans
    * 	majority : () -> boolean -- returns the majority of the 8 booleans
    * )
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readBool8(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number * 8) <= this.offset * 8 ? offset : this.offset) as number * 8
        return this.executeReadImplementation(() => {
            let booleans : boolean[] = []
            for(let i = 0; i <= 7; i++) {
                booleans[i] = (readbits(this.buffer,offset,1) === 1 ? true : false)
            }
            return {
                value : booleans,
                majority : () => {
                    let [trueFlag,falseFlag] = [0,0]
                    booleans.forEach((v) => {
                        if(v) trueFlag++
                        else falseFlag++;
                    })
                    return (trueFlag >= falseFlag) ? true : false
                }
            }
        })
    }

    //#endregion

    //#region "[Reader] Float"

    /*
    * Reads an 8-bit floating-point value encoded with the E4M3 format from the buffer.
    * 
    * @Returns number
    * 
    * @latest modification : v4.0
    * @since v4.0
    */
    public readF8(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            return Extensions.decodeF8(readu8(this.buffer,offset))
        })
    }

    /*
    * Read a 16-bit half-precision float (IEEE 754 binary16) from the buffer.
    *
    * @Returns number
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readF16(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeRead(Extensions.decodeF16,this.buffer,offset)
    }

    /*
    * Read a 24-bit custom floating-point format (FP24) float from the buffer.
    *
    * @Returns number
    * 
    * @latest modification : v4.0
    * @since v4.0
    */
    public readF24(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let value = readu8(this.buffer,offset) << 16 | readu8(this.buffer,offset + 1) << 8 | readu8(this.buffer,offset + 2)
            return Extensions.decodeF24(value)
        })
    }

    /*
    * Read a 32-bit single-precision float from the buffer.
    *
    * @Returns number
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readF32(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeRead(readf32,this.buffer,offset)
    }

    /*
    * Read a 64-bit single-precision float from the buffer.
    *
    * @Returns number
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readF64(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeRead(readf64,this.buffer,offset)        
    }

    //#endregion

    //#region "[Reader-RobloxTypes]"

    //#region "[Reader] Vector2"

    /*
    * Read a Vector2 (float24-bit) from the buffer
    *
    * @Returns Vector2
    * 
    * @latest modification : v4.0
    * @since v4.0
    */
    public readVector2float24(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let [x,y] = readNfp24(this.buffer,2,offset)
            return new Vector2(x,y)
        })
    }

    /*
    * Read a Vector2 (single-precision) from the buffer
    *
    * @Returns Vector2
    * 
    * @latest modification : v4.0
    * @since v4.0
    */
    public readVector2float32(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let [x,y] = [readf32(this.buffer,offset),readf32(this.buffer,offset + 4)]
            return new Vector2(x,y)
        })
    }

    /*
    * Read a Vector2int16 from the buffer
    *
    * @Returns Vector2int16
    * 
    * @latest modification : v4.0
    * @since v4.0
    */
    public readVector2int16(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let [x,y] = [readi16(this.buffer,offset),readi16(this.buffer,offset + 2)]
            return new Vector2int16(x,y)
        })
    }

    /*
    * Read a Vector2uint16 from the buffer
    *
    * @Returns Vector2 (unsigned 16-int)
    * 
    * @latest modification : v4.0
    * @since v4.0
    */
    public readVector2uint16(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let [x,y] = [readu16(this.buffer,offset),readu16(this.buffer,offset + 2)]
            return new Vector2(x,y)
        })
    }

    /*
    * Read a Vector2 (double-precision) from the buffer
    *
    * @Returns Vector2
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readVector2(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let [x,y] = [readf64(this.buffer,offset),readf64(this.buffer,offset + 8)]
            return new Vector2(x,y)
        })
    }

    //#endregion

    //#region "[Reader] Vector3"

    /*
    * Read a Vector3 (float24-bit) from the buffer
    *
    * @Returns Vector3
    * 
    * @latest modification : v4.0
    * @since v4.0
    */
    public readVector3float24(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let [x,y,z] = readNfp24(this.buffer,3,offset)
            return new Vector3(x,y,z)
        })
    }

    /*
    * Read a Vector3 (single-precision) from the buffer
    *
    * @Returns Vector3
    * 
    * @latest modification : v4.0
    * @since v4.0
    */
    public readVector3float32(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let [x,y,z] = [
                readf32(this.buffer,offset),
                readf32(this.buffer,offset + 4),
                readf32(this.buffer,offset + 8)
            ]
            return new Vector3(x,y,z)
        })
    }

    /*
    * Read a Vector3int16 from the buffer
    *
    * @Returns Vector3int16
    * 
    * @latest modification : v4.0
    * @since v1.0
    */
    public readVector3int16(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let [x,y,z] = [
                readi16(this.buffer,offset),
                readi16(this.buffer,offset + 2),
                readi16(this.buffer,offset + 4)
            ]
            return new Vector3int16(x,y,z)
        })
    }

    /*
    * Read a Vector3uint16 from the buffer
    *
    * @Returns Vector3 (unsigned 16-int)
    * 
    * @latest modification : v4.0
    * @since v4.0
    */
    public readVector3uint16(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let [x,y,z] = [
                readu16(this.buffer,offset),
                readu16(this.buffer,offset + 2),
                readu16(this.buffer,offset + 4)
            ]
            return new Vector3(x,y,z)
        })
    }

    /*
    * Read a Vector3 (double-precision) from the buffer
    *
    * @Returns Vector3
    * 
    * @latest modification : v4.0
    * @since v4.0
    */
    public readVector3(offset? : number) {
        offset = (typeOf(offset) === "number" && (offset as number) <= this.offset ? offset : this.offset) as number
        return this.executeReadImplementation(() => {
            let [x,y,z] = [
                readf64(this.buffer,offset),
                readf64(this.buffer,offset + 8),
                readf64(this.buffer,offset + 16)
            ]
            return new Vector3(x,y,z)            
        })
    }

    //#endregion

    //#region "[Reader] CFrame"


    
    //#endregion

    //#endregion

}