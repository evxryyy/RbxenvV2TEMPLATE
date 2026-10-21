import * as Enumeration from "./enumeration"
import { Constants } from "./constants"
import { Utilities } from "./utilities"

const strmatch = string.match;

const tblinsert = table.insert; const tblclone = table.clone; const tblclear = table.clear

/*
* Accepts a type <T extends BitstreamTypes> and a value of type <A>, returns void, and is used when iterating through structs and arrays.
*/
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

    // Map a RobloxType into a Bitstream Type this mostly used for schemaless serialization.
    private static readonly MAPPED_RBX_TYPES = {
        ["CFrame"] : "CFrameF32",
        ["Color3"] : "Color3",
        ["Rect"] : "Rect",
        ["Region3"] : "Region3CFrameF32",
        ["RotationCurveKey"] : {
            Type : "RotationCurveKey",
            Option : "CFrameF32"
        },
        ["FloatCurveKey"] : {
            Type : "FloatCurveKey",
            Option : "F32"
        },
        ["ColorSequence"] : {
            Type : "ColorSequence",
            Option : "F32"
        },
    }
    
    // A list of all possible errors that can occur when calling certain functions.
    private static readonly ERROR_LIST = {
        DEEPLY_NESTED_ARRAY : `
        A deeply nested array was detected during iteration. Deeply nested arrays (e.g., [ [ [ 10 ] ] ] ) are not supported; 
        only one level of nesting (e.g., [ [ 10 ] ] ) is supported.
        `,
        DEEPLY_NESTED_STRUCT : `
        A deeply nested struct was detected during iteration. 
        Deeply nested structs (e.g., [ Outer = [ Inner = [ Value = 10 ] ] ]) are not supported; 
        only one level of nesting (e.g., [ Inner = [ Value = 10 ] ]) is supported.
        `,
        ITERATE_STRUCT_IN_ARRAY : `Cannot iterate a struct inside an array.`,

    }

    private static readonly _validPrefixPartRegex = ["RotationCurveKey","ColorSequence","FloatCurveKey","NumberSequence"]

    private static getPrefixPartRegex(valueType : Enumeration.BitstreamTypesName) : string | undefined {
        let result : string | undefined;
        for(const prefix of this._validPrefixPartRegex) {
            result = strmatch(valueType,`^(${prefix})`)[0] as string
            if(result) break;
        }
        return result
    }

    private static getTechinalPartRegex(valueType : Enumeration.BitstreamTypesName) : string | undefined {
        for (const prefix of this._validPrefixPartRegex) {
            const result = strmatch(valueType, `^${prefix}(.+)`);
            if (result[0]) return result[0] as string;
        }
        return undefined
    }

    // Extract the <count> pattern ex : ColorSequence:3 -> 3
    private static readonly extractCountPattern = ":(%d+)"

    // Remove the <count> pattern ex : ColorSequence:3 -> ColorSequence
    private static readonly removeCountPattern = "([^:]+)"

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
            if(count) {
                for(let i = 1; i < count; i++) {
                    let element = callback(targetType)
                    if(hasNestedFlag) {
                        nestedArray.insert(nestedArray.size(),element)
                    }
                    else tblinsert(source,element)
                }
            }
            else {
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
                return result;
            case "Struct":
                return this.resolveStruct(tableType as Enumeration.StructSchema,callback);
            default:
                const element = callback(fieldType)
                return element
        }
    }

    /*
    * A helper function that simplifies resolveArraySchema. 
    * It can recursively call resolveArraySchema when a nested array is detected. 
    * Each element is re-indexed in its original order.
    */
    private static resolveElement<T>(element : T) : Enumeration.BitstreamTypes {
        const valueType = this.resolveValueType(element)
        switch(valueType) {
            case "String":
                return {
                    Type : "String",
                    Length : (element as string).size()
                }
            case "Array":
                let subArray = this.resolveArraySchema(element as unknown[])
                if(this.containNestedArray(subArray.Types)) {
                    error(this.ERROR_LIST.DEEPLY_NESTED_ARRAY)
                }
                return subArray
            case "Struct":
                error(this.ERROR_LIST.ITERATE_STRUCT_IN_ARRAY)
            default:
                let tryGetPrefixPart = this.getPrefixPartRegex(valueType)
                if(typeIs(tryGetPrefixPart,"string")) {
                    let option = this.getTechinalPartRegex(valueType)
                    // Reverse: ColorSequenceF32 back to {Type : ColorSequence,Option : F32}
                    return {
                        Type : tryGetPrefixPart as Enumeration.BitstreamTypesName,
                        Option : option
                    } as Enumeration.BitstreamTypes
                }
                else return valueType as Enumeration.BitstreamTypes
        }
    }

    //#endregion

    //#region Public methods

    /*
    * Check whether the current input (the array containing Bitstream types)
    * includes any nested arrays. Return true if any are found; otherwise, return false.
    */
    public static containNestedArray(t : Enumeration.BitstreamTypes[]) {
        for(const elementType of t) {
            if(typeOf(elementType) === "table") {
                let result = (elementType as Enumeration.BitstreamTableType)
                let nestedFlag = result.Type === "Array" || result.Type === "Struct" ? true : false
                if(nestedFlag) return nestedFlag; 
            }
        }
        return false
    }

    /*
    * Similar to containNestedArray, but checks only for structs.
    */
    public static containNestedStruct(struct : Record<string,defined>) {
        for(const [_,field] of pairs(struct)) {
            if(typeOf(field) === "table") {
                let nestedFlag = (field as Enumeration.BitstreamTableType).Type === "Struct" ? true : false
                if(nestedFlag) return nestedFlag
            }
        }
        return false
    }

    /*
    * Iterates through all elements in the arrayTypes argument and invokes the provided callback for each element. 
    * For example, the callback can have the following signature: 
    * `(valueType: BitstreamTypes, value: A) => {...}`
    */
    public static iterateArray<T extends Enumeration.BitstreamTypes,A>(
        arrayType : Enumeration.BitstreamTypes[],
        array : A[],
        callback : IterationCallback<T,A>
    ) {

    }

    /*
    * Iterates through all structs, including arrays and nested structs, using their corresponding keys. 
    * The callback can have the following signature:
    * `(valueType: BitstreamTypes, value: A | unknown) => {}`
    */
    public static iterateStruct<T extends Enumeration.BitstreamTypes,A>(
        struct : Enumeration.StructSchema,
        values : Record<string,unknown>,
        callback : IterationCallback<T,A>
    ) {
        for(const [key,value] of pairs(struct.Fields)) {
            if(values[key] === undefined) continue;
            if(typeOf(value) === "table") {
                let _TEMPValue = value as Enumeration.BitstreamTableType
                if(_TEMPValue.Type === "Array") {
                    this.iterateArray(_TEMPValue.Types,values[key] as A[],callback)
                }
                else if(_TEMPValue.Type === "Struct") {
                    if(this.containNestedStruct(_TEMPValue.Fields)) continue
                    this.iterateStruct(
                        _TEMPValue as Enumeration.StructSchema,
                        values[key] as Record<string,unknown>,
                        callback
                    )
                }
                else callback(value as T,values[key] as A)
            }
            else callback(value as T,values[key] as A)
        }
    }

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
                    error(this.ERROR_LIST.ITERATE_STRUCT_IN_ARRAY)
                }
                else if(typeName === "Array") {
                    let elementTypes = _TEMPtypeInfo.Types
                    if(this.containNestedArray(elementTypes)) continue;
                    this.resolveArray(_TEMPtypeInfo.Types,callback,true)
                }
                else {
                    let typeHasCount = tonumber(strmatch(_TEMPtypeInfo.Type,this.extractCountPattern)[0])
                    let formattedType = strmatch(_TEMPtypeInfo.Type,this.removeCountPattern)[0]
                    callback(formattedType as T,typeHasCount)
                }
            }
            // Simples types or type with count that came from an array (i.e U8:3)
            else {
                let elementTypeOf = strmatch(typeInfo as string,this.removeCountPattern)[0]
                let typeHasCount = tonumber(strmatch(typeInfo as string,this.extractCountPattern)[0])
                callback(elementTypeOf as T,typeHasCount,isNested)
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
            let elementIndex = Constants.REQUIRED_BYTES[typeInfo as keyof defined] as unknown
            if(typeIs(elementIndex,"function")) {
                bytes += elementIndex(value)
            }
            else {
                bytes += (elementIndex as number)
            }
        }
        return bytes
    }

    /*
    * Returns the corresponding Bitstream type based on the given Roblox type (e.g., number → U[n]).
    */
    public static resolveValueType(value : unknown) : Enumeration.BitstreamTypesName {
        const valueType = typeOf(value)
        switch(valueType) {
            case "number":
                const isInt = (value as number) % 1 === 0
                const valueData = Utilities.getEquivalentBytesInfoFromNumber(value as number,true)
                let symbol = ''
                if(isInt !== true) {
                    symbol = 'F'
                    if(valueData.bits < 32 && valueData.bits > 64) valueData.bits = 32;
                }
                else if(valueData.isUnsigned) symbol = 'U'
                else symbol = 'I';
                return `${symbol}${valueData.bits}` as Enumeration.BitstreamTypesName;
            case "string":
                return "String";
            case "boolean":
                return "Bool1";
            case "table":
                if(Utilities.isStruct(value as Record<string,defined>)) return "Struct"
                else if(Utilities.isBool8(value as boolean[])) return "Bool8"
                else if(Utilities.isArray(value as unknown[])) return "Array"
                break;
            default:
                let enumerationName = "" 
                let mappedTypes = this.MAPPED_RBX_TYPES[valueType as keyof defined]
                if(typeOf(mappedTypes) === "string") {
                    enumerationName = mappedTypes as string
                }
                else if(typeOf(mappedTypes) === "table") {
                    enumerationName = `${valueType}${(mappedTypes as Enumeration.BitstreamTableType).Option}`
                }
                else enumerationName = valueType;
                return enumerationName as Enumeration.BitstreamTypesName
        }
    }

    /*
    * Given an array of type T[], the function returns its schema with the corresponding types in the agreed order, 
    * preserving the original order as closely as possible.
    */
    public static resolveArraySchema<T>(array : T[]) : Enumeration.ArraySchema {
        let schema = {
            Type : "Array",
            Types : [] as Enumeration.BitstreamTypes[],
        } as Enumeration.ArraySchema
        for(let i = 0; i < array.size(); i++) {
            let element = this.resolveElement(array[i])
            tblinsert(schema.Types,element)
        }
        return schema
    }

    /*
    * Builds a schema from the given struct (Record<string, defined>), 
    * preserving the order of its corresponding keys.
    */
    public static resolveStructSchema(struct : Record<string,defined>) : Enumeration.StructSchema {
        let schema = {
            Type : "Struct",
            Fields : {} as Record<string,defined>
        }
        for(const [key,value] of pairs(struct)) {
            const valueType = this.resolveValueType(value)
            if(valueType === "String") {
                schema.Fields[key] = {Type : "String",Length : (value as string).size()}
            }
            else if(valueType === "Array") {
                const subSchema = this.resolveArraySchema(value as unknown[])
                if(this.containNestedArray(subSchema.Types)) {
                   error(this.ERROR_LIST.DEEPLY_NESTED_ARRAY)
                }
                schema.Fields[key] = subSchema
                continue
            }
            else if(valueType === "Struct") {
                const subStruct = this.resolveStructSchema(value)
                if(this.containNestedStruct(subStruct.Fields)) {
                    error(this.ERROR_LIST.DEEPLY_NESTED_STRUCT)
                }
                schema.Fields[key] = subStruct
                continue
            }
            else schema.Fields[key] = valueType
        }
        return schema as Enumeration.StructSchema
    }

    /*
    * Calls resolveArraySchema or resolveStructSchema depending on the given type.
    */
    public static resolveSchema(param : Record<string,defined> | unknown[]) {
        if(Utilities.isArray(param as unknown[])) return this.resolveArraySchema(param as unknown[]);
        return this.resolveStructSchema(param as Record<string,defined>)
    }

    //#endregion

}