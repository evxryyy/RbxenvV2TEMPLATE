import * as Enumeration from "./enumeration"
import { Constants } from "./constants"
import { Utilities } from "./utilities"

const strmatch = string.match;

const tblinsert = table.insert; const tblclone = table.clone; const tblclear = table.clear

type IterationCallback<T extends Enumeration.BitstreamTypes,A> = (type : T,value : A) => void

/*
* A type used to track type occurrences,-
* such as the total number of U8 entries, with an optional parameter for nested arrays.
*/
type ResolveCallback<T extends Enumeration.BitstreamTypes> = 
    (type : T,count : number,hasNestedFlag? : boolean) => void

// The returned value must be the Roblox equivalent of the type provided in the Type argument (e.g., U8 -> number).
type ResolveValueCallback = (type : Enumeration.BitstreamTypes) => defined

// Simple type for catching functions returning the amount of bytes needed in `Constants.ts`
type ConstantsIndexCallback = (...args : unknown[]) => number

/*
* @Class: Resolver
*
* A utility class for resolving custom types, such as arrays and structs, as well as handling byte calculations and resolving types provided by Bitstream.
* Note: This class is still being rewritten and is not yet complete. Thank you for your patience.
*/
export abstract class Resolver {

    //#region Private methods

    /*
    * Check whether the current input (the array containing Bitstream types)
    * includes any nested arrays. Return true if any are found; otherwise, return false.
    */
    private static containNestedArray(type : Enumeration.BitstreamTypes[]) {
        type.forEach((elementType) => {
            if(typeOf(elementType) === "table") {
                let result = elementType as Enumeration.BitstreamTableType
                let nestedFlag = result.Type === "Array" || result.Type === "Struct" ? true : false
                if(nestedFlag) return nestedFlag
            }
        })
        return false
    }

    /*
    * Similar to containNestedArray, but checks only for structs.
    */
    private static containNestedStruct(struct : Record<string,defined>) {
        for(const [_,field] of pairs(struct)) {
            if(typeOf(field) === "table") {
                let nestedFlag = (field as Enumeration.BitstreamTableType).Type === "Struct" ? true : false
                if(nestedFlag) return nestedFlag
            }
        }
        return false
    }

    /*
    * Iterate through each element of the array and include it in the source provided as the second argument. 
    * This function is used by resolveField, which is called directly by resolveStruct. 
    * Note that this function returns void.
    */
    private static resolveArrayTypes(
        arrayTypes : Enumeration.BitstreamTypes[],
        source : defined[],
        callback : ResolveValueCallback
    ) {
        let nestedArray : defined[] = []
        this.resolveArray(arrayTypes,(targetType,count,hasNestedFlag) => {
            for(let i = 1; i < count; i++) {
                let element = callback(targetType)
                if(hasNestedFlag) {
                    nestedArray.insert(nestedArray.size(),element)
                }
                else tblinsert(source,element)
            }
            if(hasNestedFlag) tblinsert(source,tblclone(nestedArray));
            tblclear(nestedArray)
        })
    }

    /*
    * A helper function that simplifies resolveStruct when retrieving elements. 
    * It can recursively call resolveStruct if nested structs are detected during iteration. 
    * Each elements are indexed using their original keys from the schema provided to resolveStruct.
    */
    private static resolveField(
        fieldType : Enumeration.BitstreamTypes,
        callback : ResolveValueCallback
    ) : defined {
        if(typeOf(fieldType) !== "table") {
            const element = callback(fieldType)
            return element
        }
        const tableType = fieldType as Enumeration.BitstreamTableType
        switch(tableType.Type) {
            case "Array":
                const result : defined[] = []
                this.resolveArrayTypes(tableType.Types,result,callback)
                return;
            case "Struct":
                const tableFields = (tableType.Fields as unknown) as Enumeration.StructSchema
                return this.resolveStruct(tableFields,callback);
            default:
                const element = callback(fieldType)
                return element
        }
    }

    //#endregion

    //#region Public methods

    /*
    * A function that invokes the callback specified in the arguments.
    * For example, when implementing this function, you should use a method that reads data (a reader method). 
    * In Bitstream(Component).readAs, this function is used to read individual types, 
    * regardless of how many times they are specified (e.g., "U8:3" will call readAs three times).
    */
    public static resolveArray<T extends Enumeration.BitstreamTypes>(
        arrayTypes :  Enumeration.BitstreamTypes[],
        callback : ResolveCallback<T>,
        isNested? : boolean
    ) {
        for(let i = 0; i < arrayTypes.size(); i++) {
            let typeInfo = arrayTypes[i]
            let _TEMPtypeInfo = typeInfo as Enumeration.BitstreamTableType
            if(typeOf(typeInfo) === "table") {
                let typeName = _TEMPtypeInfo.Type
                if(typeName === "Struct") {
                    // TODO: thrown error
                }
                else if(typeName === "Array") {
                    let elementTypes = _TEMPtypeInfo.Types
                    if(this.containNestedArray(elementTypes)) continue;
                    this.resolveArray(_TEMPtypeInfo.Types,callback,true)
                }
                else {
                    let typeHasCount = tonumber(strmatch(_TEMPtypeInfo.Type,":(%d+)")[0])
                    let formattedType = strmatch(_TEMPtypeInfo.Type,"([^:]+)")[0]
                    callback(formattedType as T,typeHasCount)
                }
            }
            // Simples types or type with count that came from an array (i.e U8:3)
            else {
                let elementTypeOf = strmatch(typeInfo as string,"([^:]+)")[0]
                let typeHasCount = tonumber(strmatch(typeInfo as string,":(%d+)")[0])
                callback(elementTypeOf as T,typeHasCount)
            }
        }
    }

    /*
    * Reconstructs the struct with values matching their respective types. 
    * The callback must also handle the type argument passed to it. 
    * Refer to the struct-reading section of Bitstream(Component).readAs for an example of how to use it. 
    * The callback argument is directly defined as BitstreamTypes.
    */
    public static resolveStruct(
        struct : Enumeration.StructSchema,
        callback : ResolveValueCallback
    ) : Record<string,defined> {
        let resolvedStruct : Record<string,defined> = {}
        for(const [fieldName,fieldType] of pairs(struct.Fields)) {
            resolvedStruct[fieldName] = this.resolveField(fieldType,callback)
        }
        return resolvedStruct
    }

    /*
    * Returns the number of bytes required for the specified type. 
    * Note that this only works for primitive types, not arrays or structs.
    */
    public static resolveBytesNeeded(
        typeInfo : Enumeration.BitstreamTypes,
        value : defined
    ) : number {
        let bytes = 0
        let _TEMPtypeInfo = typeInfo as Enumeration.BitstreamTableType
        if(typeOf(typeInfo) === "table") {
            let extra = (_TEMPtypeInfo.Length || _TEMPtypeInfo.Option)
            let expressionIndex = Constants.REQUIRED_BYTES[_TEMPtypeInfo.Type as keyof defined] as ConstantsIndexCallback
            bytes += expressionIndex(value,extra)
        }
        else {
            let elementIndex = Constants.REQUIRED_BYTES[_TEMPtypeInfo.Type as keyof defined] as unknown
            if(typeIs(elementIndex,"function")) {
                bytes += elementIndex(value)
            }
            else {
                bytes += (elementIndex as number)
            }
        }
        return bytes
    }

    //#endregion

}