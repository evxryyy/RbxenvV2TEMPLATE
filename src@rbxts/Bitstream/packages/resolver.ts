import * as Enumeration from "./enumeration"
import { Constants } from "./constants"
import { Utilities } from "./utilities"

const strmatch = string.match; const strsub = string.sub; const strrep = string.rep;

const tblclone = table.clone; const tblclear = table.clear;

type BitstreamTableType = Enumeration.BitstreamTableType

type IterationCallback = (type : unknown, value : unknown) => void
type ResolveCallback = (type : unknown,count : number,nestedFlag? : boolean) => void
type ResolveValueCallback = (type : unknown) => defined[]

const ERROR_MESSAGES_LIST = {
	CANT_WRITE_STRUCT_IN_ARRAY : `
		Trying to write a struct in an array, but it's not supported.
		You can only write simple types in arrays and nested arrays.
		Please see : \`#### API LINK ###\`
	`,
	CANT_WRITE_DEEPLY_NESTED_ARRAY : `
		Trying to write a table nested more than two levels deep, but it's not supported.
		You can only write simple types in arrays and nested arrays.
		I.e. : {10,{{10}},10} -> error you can only do {10,10,10} or {{10,10,10},{10,10,10}}.
	`,
	CANT_WRITE_DEEPLY_NESTED_STRUCT : "Cannot write a deeply nested struct. Example: { value: { nested: { tooDeep: ... } } }",
}

const MAPPED_RBX_TYPES = {
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

// Simple abbrevation for `resolveStruct` when an array is detected.
function resolveArrayTypes(
	valuesTypes : Enumeration.BitstreamTypes[],
	source : Record<string | number,defined>,
	callback : ResolveValueCallback
) : void {
	let nestedArray : defined[] = []
	resolveArray(valuesTypes,(targetType,count,isNested) => {
		for(let i = 1; i < count; i++) {
			let [element,elementOffset] = callback(targetType)
			if(isNested) {
				nestedArray.insert(nestedArray.size(),element)
			}
			else {
				table.insert(source,element)
			}
		}
		if(isNested) {
			table.insert(source,table.clone(nestedArray))
		}
		table.clear(nestedArray)
	})
}

/*
	Iterates over an array schema and executes a callback for each resolved value.

	Supports repeated types using the `:<count>` syntax (e.g. `"U8:3"`),
	as well as nested arrays.

	Multi-dimensional arrays are currently not supported.
	
	@Note: only used for writeAs/Serialize and nothing else.

	@Parameters:
		- valueTypes : Enumeration.BitstreamTypes[],
		- values : unknown[]
		- callback : IterationCallback

	@Returns: ()
*/
export function iterateArray(
	valueTypes : Enumeration.BitstreamTypes[],
	values : unknown[],
	callback : IterationCallback,
) {
	let array_size = valueTypes.size()
	let array_index = 1
	for(let i = 1; i < array_size; i++){
		let elementType = valueTypes[i] as Enumeration.BitstreamTypes | Enumeration.BitstreamTypesName
		let element = values[array_index]
		if(typeOf(elementType) === "table" && ((elementType as BitstreamTableType)).Type) {
			if((elementType as BitstreamTableType).Type === "Struct") {
				error(ERROR_MESSAGES_LIST.CANT_WRITE_STRUCT_IN_ARRAY,2)
			}
			// Nested array
			if(containNestedArray((elementType as BitstreamTableType).Types)) { continue }
			iterateArray(
				(elementType as BitstreamTableType).Types,
				element as unknown[],
				callback
			)
		}
		// Handles types like String or RotationCurveKey etc...
		else if(typeOf(elementType) === "table") {
			let typeHasCount = tonumber(
				strmatch((elementType as BitstreamTableType).Type as string,":(%d+)")
			)
			let cloneTypedInfo = table.clone(elementType as BitstreamTableType)
			cloneTypedInfo.Type = strmatch(cloneTypedInfo.Type,"([^:]+)")[0] as Enumeration.BitstreamTypesName
			if(typeHasCount) {
				for(let i = 1; i < typeHasCount; i++){
					callback(cloneTypedInfo,values[array_index])
					array_index += 1
				}
			}
			else {
				callback(cloneTypedInfo,values[array_index])
				array_index += 1
			}
		}
		else {
			// Simples types or type with count that came from an array (i.e U8:3)
			let typeHasCount = tonumber(strmatch(elementType as string,":(%d+)")[0])
			if(typeHasCount) {
				let elementTypeOf = strmatch(elementType as string,"([^:]+)")[0]
				for(let i = 1; i < typeHasCount; i++) {
					callback(elementTypeOf,element)
					array_index += 1
				}
			}
			else {
				callback(elementType,values[array_index])
				array_index += 1
			}
		}
	}
}

/*
	Iterates over a struct schema and executes a callback for each resolved value.

	Supports nested structs and arrays.

	Multi-dimensional arrays and structs are currently not supported.

	@Note: only used for writeAs/Serialize and nothing else.

	@Parameters:
		- structFields : Record<string,Enumeration.BitstreamTypes>
		- values : Record<string,unknown>,
		- callback : IterationCallback

	@Returns: ()
*/
export function iterateStruct(
	structFields : Record<string,Enumeration.BitstreamTypes>,
	values : Record<string,unknown>,
	callback : IterationCallback
) {
	for(const [i,v] of pairs(structFields)) {
		if(values[i] === undefined) { continue }
		if(typeOf(v) === "table") {
			if((v as BitstreamTableType).Type === "Array") {
				iterateArray((v as BitstreamTableType).Types,values[i] as unknown[],callback)
			}
			else if((v as BitstreamTableType).Type === "Struct") {
				if(containNestedStruct((v as BitstreamTableType).Fields)) continue
				iterateStruct(
					(v as BitstreamTableType).Fields,
					values[i] as Record<string,unknown>,
					callback
				)
			}
		}
		else {
			callback(v,values[i])
		}
	}
}

/*
	Resolves an array of bitstream types and executes a callback for each type.
	
	@Parameters:
		- valuesTypes : Enumeration.BitstreamTypes[],
		- callback : ResolveCallback,
		- isNested? : boolean
		
	@Returns: ()
*/
export function resolveArray(
	valuesTypes : Enumeration.BitstreamTypes[],
	callback : ResolveCallback,
	isNested? : boolean,
) {
	for(let i = 1; i < valuesTypes.size(); i++) {
		let typeInfo = valuesTypes[i] as Enumeration.BitstreamTypes | Enumeration.BitstreamTypesName
		if(typeOf(typeInfo) === "table") {
			if((typeInfo as BitstreamTableType).Type === "Struct") {
				error(ERROR_MESSAGES_LIST.CANT_WRITE_STRUCT_IN_ARRAY,2)
			}
			// Check nested array
			if(containNestedArray((typeInfo as BitstreamTableType).Types)) continue;
			resolveArray(
				(typeInfo as BitstreamTableType).Types,
				callback,
				true
			)
		}
		// Handles table types (String,RotationCurveKey etc...)
		else if(typeOf(typeInfo) === "table") {
			let typeHasCount = tonumber(
				strmatch((typeInfo as BitstreamTableType).Type as string,":(%d+)")[0]
			);
			(typeInfo as BitstreamTableType).Type = strmatch((typeInfo as BitstreamTableType).Type,"([^:]+)")[0] as Enumeration.BitstreamTypesName;
			callback(typeInfo,typeHasCount || 1,isNested)
		}
		// Simples types or type with count that came from an array (i.e U8:3)
		else {
			let elementTypeOf = strmatch(typeInfo as Enumeration.BitstreamTypesName,"([^:]+)")[0]
			let typeHasCount = tonumber(strmatch(typeInfo as Enumeration.BitstreamTypesName,":(%d+)")[0])
			callback(elementTypeOf,typeHasCount || 1,isNested)
		}
	}
}

/*
	Resolves a struct and executes a callback for each field.
	
	@Parameters:
		- structFields : Record<string,Enumeration.BitstreamTypes>,
		- callback : ResolveValueCallback
		
	@Returns: Record<string,defined>
*/
export function resolveStruct(
	structFields : Record<string,Enumeration.BitstreamTypes>,
	callback : ResolveValueCallback
) : Record<string,defined> {
	let resolve_struct : Record<string,defined> = {}
	for(const [i,v] of pairs(structFields)) {
		if(typeOf(v) === "table") {
			// Resolve array tables
			if((v as BitstreamTableType).Type === "Array") {
				if(resolve_struct[i] === undefined) resolve_struct[i] = []
				resolveArrayTypes((v as BitstreamTableType).Types,resolve_struct[i],callback)
			}
			// Handle sub-struct
			else if((v as BitstreamTableType).Type === "Struct") {
				if(resolve_struct[i] === undefined) resolve_struct[i] = {}
				if(containNestedStruct((v as BitstreamTableType).Fields)) continue;
				for(const [j,k] of pairs((v as BitstreamTableType).Fields)) {
					if(typeOf(k) === "table" && (k as BitstreamTableType).Type === "Array") {
						if((resolve_struct[i] as Record<string,defined>)[j] === undefined) { 
							(resolve_struct[i] as Record<string,defined>)[j] = {}
						}
						resolveArrayTypes(
							(k as BitstreamTableType).Types,
							(resolve_struct[i] as Record<string,defined>)[j],
							callback
						)
					}
					else {
						let [element,elementOffset] = callback(k)
						resolve_struct[i] = element
					}
				}
			}
			// Handle simple types
			else {
				let [element,elementOffset] = callback(v)
				resolve_struct[i] = element
			}
		}
	}
	return resolve_struct
}

/*
	Resolves the number of bytes needed to encode a value.
	
	@Parameters:
		- dataType : string
		- value : any
		
	@Returns: number
*/
export function resolveBytesNeeded(
	typeInfo : Enumeration.BitstreamTypes,
	value : unknown
) : number {
	let bytes = 0
	if(typeOf(typeInfo) === "table") {
		let extra = (typeInfo as BitstreamTableType).Length || (typeInfo as BitstreamTableType).Option
		let expressionIndex = Constants.REQUIRED_BYTES[(typeInfo as BitstreamTableType).Type as keyof defined] as (...args : unknown[]) => number
		bytes += expressionIndex(value,extra)
	}
	else {
		let elementIndex = Constants.REQUIRED_BYTES[(typeInfo as BitstreamTableType).Type as keyof defined]
		if(typeOf(elementIndex) === "function") {
			bytes += (elementIndex as (...args : unknown[]) => number)(value)
		}
		else {
			bytes += (elementIndex as number)
		}
	}
	return bytes
}

/*
	Resolves the type of a value.
	
	Some Roblox types can be redirected via the MAPPED_RBX_TYPES table.
	For example, "CFrame" is redirected to "CFrameF32".
	You can change the target variation by modifying the corresponding mapping entry.
	
	@Parameters:
		- value : unknown
		
	@Returns: string (i.e. Enumeration.BitstreamTypesName)
*/
export function resolveValueType(value : unknown) : Enumeration.BitstreamTypesName {
	const valueType = typeOf(value)
	let enumerationName = ""
	if(valueType === "number") {
		const isInt = (value as number % 1 === 0)
		let valueData = Utilities.getEquivalentBytesInfoFromNumber(value as number)
		valueData.bits = valueData.bytes * 8
		if(isInt !== true) enumerationName = `F${valueData.bits}`
		else if(valueData.isUnsigned) enumerationName = `U${valueData.bits}`
		else enumerationName = `I${valueData.bits}`
	}
	else if(valueType === "string") enumerationName = "String"
	else if(valueType === "boolean") enumerationName = "Bool1"
	else if(valueType === "table") {
		if(Utilities.isBool8(value as [boolean])) enumerationName = "Bool8"
		else if(Utilities.isArray(value as object)) enumerationName = "Array"
		else enumerationName = "Struct"
	}
	else if(MAPPED_RBX_TYPES[valueType as keyof defined]) {
		if((MAPPED_RBX_TYPES[valueType as keyof defined] as BitstreamTableType).Option) {
			enumerationName = `${valueType}${(MAPPED_RBX_TYPES[valueType as keyof defined] as BitstreamTableType).Option}`
		}
		else enumerationName = `${MAPPED_RBX_TYPES[valueType as keyof defined]}`
	}
	else enumerationName = Enumeration.BistreamEnumeration[valueType as keyof defined]
	return enumerationName as Enumeration.BitstreamTypesName
}

/*
	Rebuilds the schema representation of an array from its contained values.
	
	Each element is analyzed to determine its corresponding type, including nested arrays,
	while validating unsupported structures and invalid deep nesting cases.
	
	@Parameters:
		- array : Array<T>
		
	@Returns: ArraySchema
*/
export function resolveArraySchema<T>(array : Array<T>) : Enumeration.ArraySchema {
	let schema = {
		Type : "Array",
		Types : {}
	}
	for(let i = 1; i < array.size(); i++){
		let valueType = resolveValueType(array[i])
		if(valueType === "String"){
			table.insert(schema.Types,{
				Type : "String",
				Length : (array[i] as string).size()
			})
		}
		else if(valueType === "Array") {
			let subSchema = resolveArraySchema(array[i] as unknown[])
			table.insert(schema.Types,subSchema)
			continue
		}
		else if(valueType === "Struct") {
			error(ERROR_MESSAGES_LIST.CANT_WRITE_STRUCT_IN_ARRAY,2)
		}
		else table.insert(schema.Types,valueType)
	}
	let schemaSize = (schema.Types as defined[]).size()
	for(let i = 1; i < schemaSize; i++) {
		let typeInfo = (schema.Types as Record<number,Enumeration.BitstreamTypes>)[i]
		if(typeOf(typeInfo) === "table" && (typeInfo as BitstreamTableType).Type === "Array") {
			// Verify for unvalid nested array.
			if(containNestedArray((typeInfo as BitstreamTableType).Types)) continue
		}
	}
	return schema as Enumeration.ArraySchema
}

/*
	Rebuilds the schema representation of a struct from its fields.
	
	Each field is assigned to a corresponding type, including nested structs, 
	while validating unsupported structures and invalid deep nesting cases.
	
	@Parameters:
		- struct : Record<string,defined>
		
	@Returns: StructSchema
*/
export function resolveStructSchema(struct : Record<string,defined>) : Enumeration.StructSchema {
	let schema = {
		Type : "Struct",
		Fields : {} as Record<string,defined>
	}
	for(const [k,v] of pairs(struct)) {
		let valueType = resolveValueType(v)
		if(valueType === "String") {
			schema.Fields[k] = {Type : "String",Length : (v as string).size()}
		}
		else if(valueType === "Array") {
			let subSchema = resolveArraySchema(v as unknown[])
			schema.Fields[k] = subSchema
			continue
		}
		else if(valueType === "Struct") {
			let subStruct = resolveStructSchema(v as Record<string,defined>)
			schema.Fields[k] = subStruct
			continue
		}
		else schema.Fields[k] = valueType
	}
	for(const [k,_] of pairs(struct)) {
		let typeInfo = schema.Fields[k]
		// nested array check
		if(typeOf(typeInfo) === "table" && (typeInfo as BitstreamTableType).Type === "Array") {
			if(containNestedArray((typeInfo as BitstreamTableType).Types)) error(ERROR_MESSAGES_LIST.CANT_WRITE_DEEPLY_NESTED_ARRAY,2)
		}
		// nested struct check
		else if(typeOf(typeInfo) === "table" && (typeInfo as BitstreamTableType).Type === "Struct") {
			if(containNestedStruct((typeInfo as BitstreamTableType).Fields)) error(ERROR_MESSAGES_LIST.CANT_WRITE_DEEPLY_NESTED_STRUCT,2)
		}
	}
	return schema as Enumeration.StructSchema
}

/*
	Rebuilds the schema representation dynamically from the given data.
	
	@Parameters:
		- data : Record<string,defined> | Array<unknown>
		
	@Returns: StructSchema | ArraySchema
*/
export function resolveSchema(data : Record<string,defined> | Array<unknown>) {
	if(Utilities.isArray(data)) return resolveArraySchema(data as Array<unknown>);
	return resolveStructSchema(data as Record<string,defined>)
}