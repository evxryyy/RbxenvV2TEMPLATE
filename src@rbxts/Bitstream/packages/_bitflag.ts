import {
    Enumeration,
    BitstreamTableType,
    BitstreamTypesName,
    BitstreamTypes,
    ArraySchema,
    StructSchema
} from "./enumeration"

import { Utilities } from "./utilities"
import { Resolver } from "./resolver"

type ValidMarkerName = 
    "STRUCT_START" |
    "STRUCT_END" |
    "SUB_STRUCT_START" |
    "SUB_STRUCT_END"

type BitflagType = {
    buffer : buffer,
    size : number,
    offset : number,
}

type WriteStructParameters = {
    sourceBuffer : BitflagType,
    structFields : Record<string,defined>
}

function ReverseEnumerationIndex() : Record<number,BitstreamTypesName> {
    let t : Record<number,BitstreamTypesName> = {}
    for(const [name,order] of pairs(Enumeration.BitstreamEnumeration)) {
        t[order] = name
    }    
    return t
} 

function ReverseMarkerIndex() : Record<number,ValidMarkerName> {
    let t : Record<number,ValidMarkerName> = {}
    for(const [name,order] of pairs(Bitflag.MARKER_VALUE)) {
        t[order] = name
    }
    return t
}

const floor = math.floor;

const create = buffer.create; const writeu8 = buffer.writeu8; const writeu16 = buffer.writeu16;

export abstract class Bitflag {

    //#region Private

    private static readonly IDS_TYPES = ReverseEnumerationIndex()
    private static readonly DEFAULT_SIZE = 256
    private static readonly VALUE_MARKER = ReverseMarkerIndex()
    
    //#endregion

    //#region Public

    public static readonly MARKER_VALUE : Record<ValidMarkerName,number> = {
        STRUCT_START: 0xFA,
        STRUCT_END: 0xFB,
        SUB_STRUCT_START: 0xFC,
        SUB_STRUCT_END: 0xFD,
    }

    public static initBufferFlag(size : number) : BitflagType {
        return {
            buffer : create(size),
            size : size,
            offset : 0
        }
    }

    public static writeFlag<A extends unknown & Array<unknown>>(
        source : BitflagType,
        flag : BitstreamTypesName,
        ...args : A
    ) {
        switch(flag) {
            case "String":
                Utilities.ensureCapacity(source.buffer,source.offset,3,true)
                writeu8(source.buffer,floor(source.offset),Enumeration.BitstreamEnumeration[flag])
                writeu16(source.buffer,floor(source.offset + 1),args[0] as number)
                source.offset += 3
                break;
            default: 
                Utilities.ensureCapacity(source.buffer,source.offset,1,true)
                writeu8(source.buffer,floor(source.offset),Enumeration.BitstreamEnumeration[flag])
                source.offset++  
                break;
        }
    }

    public static writeMarker(source : BitflagType,markerValue : number) {
        Utilities.ensureCapacity(source.buffer,source.offset,1,true)
        writeu8(source.buffer,source.offset,markerValue)
        source.offset++
    }

    public static writeStruct(param : WriteStructParameters) {
        this.writeMarker(param.sourceBuffer,this.MARKER_VALUE.STRUCT_START)
        for(const [key,value] of pairs(param.structFields)) {

        }
    }

    //#endregion

}