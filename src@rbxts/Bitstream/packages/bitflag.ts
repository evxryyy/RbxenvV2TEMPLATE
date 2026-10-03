import * as Enumeration from "./enumeration"
import { Utilities } from "./utilities"
import * as Resolver from "./resolver"

const create = buffer.create; const fromstring = buffer.fromstring; const bufftostring = buffer.tostring
const bufflen = buffer.len; const readbits = buffer.readbits; const readi8 = buffer.readi8
const readi16 = buffer.readi16; const readi32 = buffer.readi32; const readu8 = buffer.readu8
const readu16 = buffer.readu16; const readu32 = buffer.readu32; const readf32 = buffer.readf32
const readf64 = buffer.readf64; const writebits = buffer.writebits; const writei8 = buffer.writei8
const writei16 = buffer.writei16; const writei32 = buffer.writei32; const writeu8 = buffer.writeu8
const writeu16 = buffer.writeu16; const writeu32 = buffer.writeu32; const writef32 = buffer.writef32
const writef64 = buffer.writef64; const readstring = buffer.readstring; const writestring = buffer.writestring
const copy = buffer.copy; const fill = buffer.fill

// math lib
const abs = math.abs; const floor = math.floor; const log = math.log
const ceil = math.ceil; const modf = math.modf; const clamp = math.clamp

// string lib
const str_char = string.char; const str_format = string.format; const str_sub = string.sub
const str_byte = string.byte; const str_find = string.find; const str_match = string.match
const str_gsub = string.gsub; const str_upper = string.upper; const str_lower = string.lower
const str_rep = string.rep; const str_split = string.split; const str_pack = string.pack
const str_packsize = string.packsize; const str_unpack = string.unpack

type BitstreamTableType = Enumeration.BitstreamTableType

const TYPE_IDS = {
    I8 : 0x00,
    I16 : 0x01,
    I24 : 0x02,
    I32 : 0x03,
    I40 : 0x04,
    I48 : 0x05,
    I54 : 0x06,

    U1 : 0x07,
    U8 : 0x08,
    U16 : 0x09,
    U24 : 0x0A,
    U32 : 0x0B,
    U40 : 0x0C,
    U48 : 0x0D,
    U54 : 0x0E,

    F8 : 0x0F,
    F16 : 0x10,
    F24 : 0x11,
    F32 : 0x12,
    F64 : 0x13,

    String : 0x14,
    PrefixedString : 0x15,

    Bool1 : 0x16,
    Bool8 : 0x17,

    Vector2float24 : 0x18,
    Vector2float32 : 0x19,
    Vector2int16 : 0x1A,
    Vector2uint16 : 0x1B,
    Vector2 : 0x1C,

    Vector3float24 : 0x1D,
    Vector3float32 : 0x1E,
    Vector3int16 : 0x1F,
    Vector3uint16 : 0x20,
    Vector3 : 0x21,

    CFrameQuaternion : 0x22,
    CFrameF24 : 0x23,
    CFrameF32 : 0x24,
    CFrameF64 : 0x25,
    CFrameQuantized : 0x26,
    
    Color3 : 0x27,
    Color3F24 : 0x28,
    Color3F32 : 0x29,
    Color3F64 : 0x2A,

    UDim : 0x2B,
    UDim2 : 0x2C,

    RectFloat24 : 0x2D,
    RectFloat32 : 0x2E,
    Rect : 0x2F,

    Enum : 0x30,

    Region3 : 0x31,
    Region3Quaternion : 0x32,
    Region3CFrameF24 : 0x33,
    Region3CFrameF32 : 0x34,
    Region3CFrameQuantized : 0x35,

    RotationCurveKey : 0x36,
    RotationCurveKeyQuaternion : 0x37,
    RotationCurveKeyCFrameF24 : 0x38,
    RotationCurveKeyCFrameF32 : 0x39,
    RotationCurveKeyQuantized : 0x3A,

    FloatCurveKey : 0x3B,
    FloatCurveKeyF16 : 0x3C,
    FloatCurveKeyF24 : 0x3D,
    FloatCurveKeyF32 : 0x3E,

    ColorSequence : 0x3F,
    ColorSequenceF24 : 0x40,
    ColorSequenceF32 : 0x41,
    ColorSequenceF64 : 0x42,

    NumberRange : 0x43,
    NumberRangeF16 : 0x44,
    NumberRangeF24 : 0x45,
    NumberRangeF64 : 0x46,

    NumberSequence : 0x47,
    NumberSequenceF16 : 0x48,
    NumberSequenceF24 : 0x49,
    NumberSequenceF64 : 0x4A,

    Array : 0x4B,
    Struct : 0x4C,

    Instance : 0x4D,
} as Readonly<Record<string,number>>

const IDS_TYPES = {} as Record<number,string>
for(const [i,v] of pairs(TYPE_IDS)) IDS_TYPES[v] = i

const DEFAULT_SIZE = 256;

const MARKER_VALUE = {
    STRUCT_START : 0xFA,
    STRUCT_END : 0xFB,
    SUB_STRUCT_START : 0xFC,
    SUB_STRUCT_END : 0xFD,
} as Readonly<Record<string,number>>

const VALUE_MARKER = {} as Record<number,string>
for(const [i,v] of pairs(MARKER_VALUE)) VALUE_MARKER[v] = i


type BitflagBuffer = {
    buffer : buffer,
    size : number,
    offset : number,
}

type Array = Enumeration.BitstreamTypes[]

type Struct = Record<string,Enumeration.BitstreamTypes>

type WriteStructParameters = {
    markerBuffer : BitflagBuffer,
    fieldsBuffer : BitflagBuffer,
    fields : Record<string,defined>,
}

type ReadStructParameters = {
    compiledBuffer : BitflagBuffer,
    markerStartOffset? : number,
    fieldsStartOffset? : number,
}

// Luau, Line 234, bug : bytesNeeded is typed as `buffer` instead of `number`.

function ensureCapacity(data : BitflagBuffer,bytesNeeded : number) : buffer {
    let required = floor(data.offset) + bytesNeeded
    if(data.size <= required) {
        let newBuffer = create(required)
        copy(newBuffer,0,data.buffer,0,data.size)
        data.buffer = newBuffer,
        data.size = required
    }
    return data.buffer
}

function ensureReadable(data : BitflagBuffer,offset : number,bytes : number) : boolean {
    offset = (typeOf(offset) === "number") ? offset : data.offset
    if(offset < 0 || offset + bytes > bufflen(data.buffer)) return false;
    return true;
}

function containNestedArray(valueTypes : Enumeration.BitstreamTypes[]) : boolean {
    for(let i = 1; i < valueTypes.size(); i++){
        let elementType = valueTypes[i]
        if(typeOf(elementType) === "table") {
            let result = ((elementType as BitstreamTableType).Type) === "Array" ||
                 ((elementType as BitstreamTableType).Type) === "Struct" ? true : false
            if(result) return true
        }
    }
    return false
}

function containNestedStruct(structFields : Record<string,Enumeration.BitstreamTypes>) : boolean {
    for(const [_,field] of pairs(structFields)) {
        if(typeOf(field) === "table") {
            let result = ((field as BitstreamTableType).Type) === "Struct" ? true : false
            if(result) return true
        }
    }
    return false
}


function writestringbits(data : BitflagBuffer,offset : number,str : string) {
    writebits(data.buffer,offset,8,str.size())
    offset += 8
    for(let i = 1; i < str.size(); i++) {
        let char = str_sub(str,i,i).byte()[0]
        if(char > 127) error("String contains non-ascii characters");
        writebits(data.buffer,offset,7,char)
        offset += 7
    }
}

function readstringbits(data : BitflagBuffer,offset : number) {
    let str = ""
    let len = readbits(data.buffer,offset,8); offset += 8;
    ensureReadable(data,offset,len)
    for(let i = 1; i < len; i++) {
        let char = str_char(readbits(data.buffer,offset,7))
        str = str + char
        offset += 7
    }
    return str
}

export abstract class Bitflag {

    static createBuffer(size : number) : BitflagBuffer {
        size = size | DEFAULT_SIZE
        return {
            buffer : create(size),
            size : size,
            offset : 0,
        }
    }

    static write(
        data : BitflagBuffer, 
        flag : Enumeration.BitstreamTypesName,
        ...args : unknown[]
    ) : void {
        if(flag === "String") {
            ensureCapacity(data,3)
            writeu8(data.buffer,floor(data.offset),TYPE_IDS[flag])
            writeu16(data.buffer,floor(data.offset + 1),args[0] as number)
            data.offset += 3
        }
        else {
            ensureCapacity(data,1)
            writeu8(data.buffer,floor(data.offset),TYPE_IDS[flag])
            data.offset += 1
        }
    }

    static writeMarker(
        data : BitflagBuffer,
        markerValue : number
    ) : void {
        ensureCapacity(data,1)
        writeu8(data.buffer,data.offset,abs(markerValue))
        data.offset += 1;
    }

    static writeString(
        data : BitflagBuffer,
        str : string
    ) : void {
        ensureCapacity(data,1)
        writestringbits(data,data.offset,str)
        data.offset += 8 + str.size() * 7
    }

    static writeStruct(parameters : WriteStructParameters) : BitflagBuffer {
        let markerBuffer = parameters.markerBuffer
        let fieldsBuffer = parameters.fieldsBuffer
        this.writeMarker(markerBuffer,MARKER_VALUE.STRUCT_START)
        for(const [key,value] of pairs(parameters.fields)) {
            let tag = Resolver.resolveValueType(value)
            if(tag === "Struct") {
                if(containNestedStruct(value)) error("Error : Nested struct is not supported");
                Bitflag.writeMarker(markerBuffer,MARKER_VALUE.SUB_STRUCT_START)
                Bitflag.writeString(fieldsBuffer,key)
                for(const [sk,sv] of pairs(value)) {
                    let stag = Resolver.resolveValueType(sv)
                    Bitflag.writeString(fieldsBuffer,sk as string)
                    Bitflag.write(markerBuffer,stag,(stag === "String") ? (sv as string).size() : undefined)
                }
                Bitflag.writeMarker(markerBuffer,MARKER_VALUE.SUB_STRUCT_END)
            }
            else {
                Bitflag.write(markerBuffer,tag,(tag === "String") ? (value as string).size() : undefined)
                Bitflag.writeString(fieldsBuffer,key)
            }
        }
        Bitflag.writeMarker(markerBuffer,MARKER_VALUE.STRUCT_END)
        let markedBytes = markerBuffer.offset
        let fieldsBytes = ceil(fieldsBuffer.offset / 8)
        let merged = create(markedBytes + fieldsBytes)
        copy(merged,0,markerBuffer.buffer,0,markedBytes)
        copy(merged,markedBytes,fieldsBuffer.buffer,0,fieldsBytes)
        return {
            buffer : merged,
            size : markedBytes + fieldsBytes,
            offset : markedBytes + fieldsBytes,
        }
    }


    static read(data : BitflagBuffer,offset : number) : number {
        ensureReadable(data,offset,1)
        return readu8(data.buffer,offset)
    }

    static readString(data : BitflagBuffer,offset : number) : string {
        ensureReadable(data,offset,1)
        return readstringbits(data,offset)
    }

    static readMarker(data : BitflagBuffer,offset : number) : string {
        ensureReadable(data,offset,1)
        return VALUE_MARKER[readu8(data.buffer,offset)]
    }

    static readStruct(parameters : ReadStructParameters) : LuaTuple<[Record<string,defined>,number]> {
        const compiledBuffer = parameters.compiledBuffer
        let offset = parameters.markerStartOffset || 0
        let schema : string[] = [] 
        Bitflag.readMarker(compiledBuffer,offset)
        offset += 1;
        while(true) {
            let id = readu8(compiledBuffer.buffer,offset)
            if(id === MARKER_VALUE.STRUCT_END) {
                offset += 1
                break
            }
            let target = IDS_TYPES[id] || VALUE_MARKER[id]
            if(id === TYPE_IDS.String) {
                let len = readu16(compiledBuffer.buffer,offset + 1)
                offset += 2
                target = target + ":" + len
            }
            schema[schema.size()] = target
            offset += 1
        }
        let fieldOffset = offset * 8
        let formatted : Record<string,defined> = {}
        let index = 1
        while(index <= schema.size()) {
            let valueType = schema[index]
            if(valueType === "SUB_STRUCT_START") {
                let structName = Bitflag.readString(compiledBuffer,fieldOffset)
                fieldOffset += 8 + structName.size() * 7
                let struct : Record<string,defined> = {}
                index += 1
                while(index <= schema.size() && (schema[index] !== "SUB_STRUCT_END")) {
                    let field = Bitflag.readString(compiledBuffer,fieldOffset)
                    fieldOffset += 8 + structName.size() * 7
                    struct[field] = schema[index]
                    index += 1
                }
                formatted[structName] = struct
                index += 1
            }
            else {
                let field = Bitflag.readString(compiledBuffer,fieldOffset)
                fieldOffset += 8 + field.size() * 7
                formatted[field] = schema[index]
                index += 1 
            }
        }
        return $tuple(formatted,compiledBuffer.size)
    }

    static act<A,R>(actFunc : (...args : A[]) => R,...args : A[]) : R {
        if(typeOf(actFunc) !== "function") return undefined as R;
        return actFunc(...args) as R
    }

}