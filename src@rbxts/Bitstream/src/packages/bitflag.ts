import {
    Enumeration,
    BitstreamTypesName,
} from "./enumeration"

import { Utilities } from "./utilities"
import { Resolver } from "./resolver"

// Type containing the list of valid marker names when writing a struct.
type ValidMarkerName =
    "ARRAY_START" |
    "ARRAY_END" | 
    "STRUCT_START" |
    "STRUCT_END" |
    "SUB_STRUCT_START" |
    "SUB_STRUCT_END"

// Basic type returned when calling `Bitflag.initBufferFlag`.
type BitflagType = {
    buffer : buffer,
    size : number,
    offset : number,
}

// Required argument when writing a struct
type WriteStructParameters = {
    structFields : Record<string,defined>
}

// Required argument when reading a struct
type ReadStructParameters = {
    sourceBuffer : BitflagType,
    sourceOffset? : number
}

type WriteStructFieldParameters = {
    markerBuffer : BitflagType,
    fieldBuffer : BitflagType,
}

type IterateSubStruct = {
    index : number,
    offset : number,
    readonly sourceBuffer : BitflagType,
    readonly schema : ValidMarkerName[] | BitstreamTypesName[],
    readonly struct : Record<string,defined>
}

// Function that swaps the order of the BitstreamEnumeration record, replacing BitstreamTypesName with numeric indices.
function ReverseEnumerationIndex() : Record<number,BitstreamTypesName> {
    let t : Record<number,BitstreamTypesName> = {}
    for(const [name,order] of pairs(Enumeration.BitstreamEnumeration)) {
        t[order] = name
    }    
    return t
} 

// Function that swaps the order of the markers, replacing ValidMarkerName with numeric indices.
function ReverseMarkerIndex() : Record<number,ValidMarkerName> {
    let t : Record<number,ValidMarkerName> = {}
    for(const [name,order] of pairs(Bitflag.MARKER_VALUE)) {
        t[order] = name
    }
    return t
}

const floor = math.floor;

const create = buffer.create; const writeu8 = buffer.writeu8;
const writestring = buffer.writestring; const copy = buffer.copy;

const readu8 = buffer.readu8; const readstring = buffer.readstring;

/*
* @Class Bitflag
*
* A very important and useful class for schemaless serialization, as well as for converting and writing structs.
* NOTE: THIS NEW LIBRARY MUST BE TESTED. PLEASE AVOID EXPERIMENTING WITH IT TOO MUCH FOR THE TIME BEING.
*/
export abstract class Bitflag {

    //#region Public

    // Contains all possible markers when writing a struct.
    public static readonly MARKER_VALUE : Record<ValidMarkerName,number> = {
        ARRAY_START: 0xF6,
        ARRAY_END: 0xF7,
        STRUCT_START: 0xFA,
        STRUCT_END: 0xFB,
        SUB_STRUCT_START: 0xFC,
        SUB_STRUCT_END: 0xFD,
    }

    /* 
    * Returns a BitflagType. It is not a class, just an object with the following properties:
    * ```ts
    * {
    *   buffer: buffer;
    *   size: number;
    *   offset: number;
    * }
    * ```
    */
    public static initBufferFlag(size : number) : BitflagType {
        return {
            buffer : create(size),
            size : size,
            offset : 0
        }
    }

    /*
    * Writes the type of the given element. 
    * If the element is a string, an additional argument must be provided specifying the string length.
    */
    public static writeFlag<A extends unknown & Array<unknown>>(
        source : BitflagType,
        flag : BitstreamTypesName,
        ...args : A
    ) {
        switch(flag) {
            case "String":
                source.buffer = Utilities.ensureCapacity(source.buffer,source.offset,3,true)
                writeu8(source.buffer,floor(source.offset),Enumeration.BitstreamEnumeration[flag])
                writeu8(source.buffer,floor(source.offset + 1),args[0] as number)
                source.offset += 2
                break;
            default: 
                source.buffer = Utilities.ensureCapacity(source.buffer,source.offset,1,true)
                writeu8(source.buffer,floor(source.offset),Enumeration.BitstreamEnumeration[flag])
                source.offset++  
                break;
        }
    }

    // Writes the marker value, e.g., 250 → STRUCT_START on read.
    public static writeMarker(source : BitflagType,markerValue : number) {
        source.buffer = Utilities.ensureCapacity(source.buffer,source.offset,1,true)
        writeu8(source.buffer,source.offset,markerValue)
        source.offset++
    }

    // Traverses the struct from start to finish, writing its keys, types, and markers whenever a nested struct is detected.
    public static writeStruct(param : WriteStructParameters) : BitflagType {
        const markerBuffer = this.initBufferFlag(0)
        const fieldBuffer = this.initBufferFlag(0)
        this.writeMarker(markerBuffer,this.MARKER_VALUE.STRUCT_START)
        for(const [key,value] of pairs(param.structFields)) {
            this.writeStructField({
                markerBuffer: markerBuffer,
                fieldBuffer: fieldBuffer
            },key,value)
        }
        this.writeMarker(markerBuffer,this.MARKER_VALUE.STRUCT_END)
        // Merge both buffer data inside a single one and return it as a BitflagType
        const merged = create(markerBuffer.offset + fieldBuffer.offset)
        copy(merged,0,markerBuffer.buffer,0,markerBuffer.offset)
        copy(merged,markerBuffer.offset,fieldBuffer.buffer,0,fieldBuffer.offset)
        return {
            buffer : merged,
            size : buffer.len(merged),
            offset : buffer.len(merged),
        };
    }

    /*
    * Starting from the given offset, returns the type index as a number. 
    * For example, 0 → I8 when indexed using Enumeration.BitstreamEnumeration.
    */
    public static readFlag(source : BitflagType,offset : number) : number {
        Utilities.ensureReadable(source.buffer,offset,1)
        return readu8(source.buffer,offset)
    }

    // Reads a string from the given offset, retrieving its length first.
    public static readString(source : BitflagType,offset : number) : string {
        Utilities.ensureReadable(source.buffer,offset,1)
        const len = readu8(source.buffer,offset)
        return readstring(source.buffer,offset + 1,len)
    }

    // Reads a marker. For example, if 250 was written using writeMarker, this function returns STRUCT_START.
    public static readMarker(source : BitflagType,offset : number) : ValidMarkerName {
        Utilities.ensureReadable(source.buffer,offset,1)
        return this.VALUE_MARKER[readu8(source.buffer,offset)]
    }

    /*
    * Traverses the entire buffer starting from the given offset. 
    * In other words, it first reads all markers and types, 
    * then reads the keys and correctly assigns the types to their corresponding keys in the proper order.
    */
    public static readStruct(
        param : ReadStructParameters 
    ) : LuaTuple<[Record<string,defined>,number?]> {
        let offset = param.sourceOffset || 0
        let [schema,updatedOffset] = this.readMarkersInStruct(param)
        offset = updatedOffset
        let formatted : Record<string,defined> = {}
        let index = 0
        while(index < schema.size()) {
            const valueType = schema[index]
            switch(valueType) {
                case "SUB_STRUCT_START":
                    const structName = this.readString(param.sourceBuffer,offset)
                    offset += structName.size() + 1
                    index++;
                    const result = this.readSubStruct({
                        index: index,
                        offset: offset,
                        sourceBuffer: param.sourceBuffer,
                        schema: schema,
                        struct: {}
                    })
                    index = result.index
                    offset = result.offset
                    formatted[structName] = result.struct
                    index++;
                    break;
                case "ARRAY_START":
                    const arrayName = this.readString(param.sourceBuffer,offset)
                    offset += arrayName.size() + 1
                    const array : ValidMarkerName[] | BitstreamTypesName[] = []
                    index++;
                    while(index <= schema.size() && schema[index] !== "ARRAY_END") {
                        const element = schema[index]
                        array[array.size()] = element
                        index++;
                    }
                    formatted[arrayName] = array
                    index++;
                    break;
                default:
                    const field = this.readString(param.sourceBuffer,offset)
                    offset += field.size() + 1
                    formatted[field] = schema[index]
                    index++;
                    break;
            }
        }
        return $tuple(formatted,buffer.len(param.sourceBuffer.buffer))
    }

    //#endregion

    //#region Private

    private static readonly IDS_TYPES = ReverseEnumerationIndex()
    private static readonly DEFAULT_SIZE = 256
    private static readonly VALUE_MARKER = ReverseMarkerIndex()

    /*
    * Writes the struct element (key) and its flag (type) to the buffer. 
    * If a nested struct is detected, it writes a SUB_STRUCT_START&END marker.
    */
    private static writeStructField(param : WriteStructFieldParameters,key : string,value : unknown) {
        let fieldType = Resolver.resolveValueType(value)
        switch(fieldType) {
            case "Struct":
                if(Resolver.containNestedStruct(value as Record<string,unknown>)) {
                    error("Writing : [ Outer = [ Inner = [ Value = 10 ] ] ], is not supported.")
                }
                this.writeMarker(param.markerBuffer,this.MARKER_VALUE.SUB_STRUCT_START)
                this.writeString(param.fieldBuffer,key)
                for(const [k,v] of pairs(value as Record<string,unknown>)) {
                    this.writeStructField(param,k,v)
                }
                this.writeMarker(param.markerBuffer,this.MARKER_VALUE.SUB_STRUCT_END)
                break;
            case "Array":
                this.writeMarker(param.markerBuffer,this.MARKER_VALUE.ARRAY_START)
                this.writeString(param.fieldBuffer,key)
                for(const [k,v] of pairs(value as object)) {
                    let elementType = Resolver.resolveValueType(v)
                    this.writeFlag(
                        param.markerBuffer,
                        elementType,
                        (elementType === "String") ? (v as string).size() : undefined
                    )
                }
                this.writeMarker(param.markerBuffer,this.MARKER_VALUE.ARRAY_END)
                break;
            default:
                this.writeFlag(
                    param.markerBuffer,
                    fieldType,
                    (fieldType === "String") ? (value as string).size() : undefined
                )
                this.writeString(param.fieldBuffer,key)
                break;
        }
    }
    
    // Writes a string to the buffer along with its length as a u8 (max. 255 characters).
    private static writeString(source : BitflagType,str : string) {
        source.buffer = Utilities.ensureCapacity(source.buffer,source.offset,str.size() + 1,true)
        writeu8(source.buffer,source.offset,str.size())
        writestring(source.buffer,source.offset + 1,str,str.size())
        source.offset += str.size() + 1
    } 

    // Reads all possible markers in the struct, including types, then returns the schema and the updated offset.
    private static readMarkersInStruct(
        param : ReadStructParameters
    ) : LuaTuple<[ValidMarkerName[] | BitstreamTypesName[],number]> {
        let schema : ValidMarkerName[] | BitstreamTypesName[] = []
        let offset = param.sourceOffset || 0
        this.readMarker(param.sourceBuffer,offset)
        offset++;
        while(true) {
            const id = readu8(param.sourceBuffer.buffer,offset)
            if(id === this.MARKER_VALUE.STRUCT_END) {
                offset++;
                break;
            }
            let target : ValidMarkerName | BitstreamTypesName = this.IDS_TYPES[id] || this.VALUE_MARKER[id]
            if(id === Enumeration.BitstreamEnumeration.String) {
                const len = readu8(param.sourceBuffer.buffer,offset + 1)
                offset++;
                target = target + ":" + len
            }
            schema[schema.size()] = target
            offset++;
        }
        return $tuple(schema,offset)
    }

    /*
    * This function streamlines the reading of subStruct. 
    * It reads the rest of the schema in order and assigns the types correctly. 
    * It then returns the updated argument passed into the function, including the final offset, the final index, and the updated struct.
    */
    private static readSubStruct(param : IterateSubStruct) : IterateSubStruct {
        while (param.index <= param.schema.size() && param.schema[param.index] !== "SUB_STRUCT_END") {
            const field = this.readString(param.sourceBuffer, param.offset);
            param.offset += field.size() + 1;
            if (param.schema[param.index] === "ARRAY_START") {
                const array: ValidMarkerName[] | BitstreamTypesName[] = [];
                param.index++;
                while (param.index <= param.schema.size() && param.schema[param.index] !== "ARRAY_END") {
                    const element = param.schema[param.index];
                    array[array.size()] = element;
                    param.index++;
                }
                param.struct[field] = array;
                param.index++;
            } else {
                param.struct[field] = param.schema[param.index];
                param.index++;
            }
        }
        return param
    }

    //#endregion

}