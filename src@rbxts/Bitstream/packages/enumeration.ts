/*
	Bitstream - Buffer Type Enumeration

	author : evxry_ll

	Purpose:
	This module defines the full set of supported buffer types used by Bitstream.

	It acts as a strict, type-safe enumeration mapping each buffer type name
	to a numeric identifier.

	Design goals:
	- Strong typing for all buffer primitives
	- Centralized definition of supported serialization types
	- Avoid accidental modification (frozen structure)

	Notes:
	- This enumeration is static and should not be modified at runtime.
	- Any change here affects serialization compatibility.
	- Values are explicit and must remain stable across versions.
*/


import * as Types from "./typeHelper"

// Represents all supported types in Bitstream.
export type BitstreamTypesName =
	| "I8"
	| "I16"
	| "I24"
	| "I32"
	| "I40"
	| "I48"
	| "I54"
	| "U1"
	| "U8"
	| "U16"
	| "U24"
	| "U32"
	| "U40"
	| "U48"
	| "U54"
	| "F8"
	| "F16"
	| "F24"
	| "F32"
	| "F64"
	| "String"
	| "PrefixedString"
	| "Bool1"
	| "Bool8"
	| "Vector2float24"
	| "Vector2float32"
	| "Vector2int16"
	| "Vector2uint16"
	| "Vector2"
	| "Vector3float24"
	| "Vector3float32"
	| "Vector3int16"
	| "Vector3uint16"
	| "Vector3"
	| "CFrameQuaternion"
	| "CFrameF24"
	| "CFrameF32"
	| "CFrameF64"
	| "CFrameQuantized"
	| "Color3"
	| "Color3F24"
	| "Color3F32"
	| "Color3F64"
	| "UDim"
	| "UDim2"
	| "RectFloat24"
	| "RectFloat32"
	| "Rect"
	| "Enum"
	| "Region3"
	| "Region3Quaternion"
	| "Region3CFrameF24"
	| "Region3CFrameF32"
	| "Region3Quantized"
	| "RotationCurveKey"
	| "RotationCurveKeyQuaternion"
	| "RotationCurveKeyCFrameF24"
	| "RotationCurveKeyCFrameF32"
	| "RotationCurveKeyQuantized"
	| "FloatCurveKey"
	| "FloatCurveKeyF16"
	| "FloatCurveKeyF24"
	| "FloatCurveKeyF32"
	| "ColorSequence"
	| "ColorSequenceF24"
	| "ColorSequenceF32"
	| "ColorSequenceF64"
	| "NumberRange"
	| "NumberRangeF16"
	| "NumberRangeF24"
	| "NumberRangeF64"
	| "NumberSequence"
	| "NumberSequenceF16"
	| "NumberSequenceF24"
	| "NumberSequenceF64"
	| "Instance"
	| "Array"
	| "Struct"


// Represents the types that can be used at seriliazation and at dynamic runtime (writeAs, etc...)
type ValidSignedIntegerBits = 8 | 16 | 24 | 32 | 40 | 48 | 54
type ValidUnsignedIntegerBits = 1 | 8 | 16 | 24 | 32 | 40 | 48 | 54
type ValidFloatBits = 8 | 16 | 24 | 32 | 64

export type BitstreamTypes = 
	`I${ValidSignedIntegerBits}` | `I${ValidSignedIntegerBits}:${number}` 
	| // Unsigned integer //
	`U${ValidUnsignedIntegerBits}` | `U${ValidUnsignedIntegerBits}:${number}`
	| // Float //
	`F${ValidFloatBits}` | `F${ValidFloatBits}:${number}`
	| // String //
	{Type : "String" | `String${number}`,Length? : number}
	| "PrefixedString" | `PrefixedString:${number}`
	| // Booleans //
	"Bool1" | "Bool8" | `Bool1:${number}` | `Bool8:${number}`
	| // Vector2 //
	"Vector2float24" | `Vector2float24:${number}` |
	"Vector2float32" | `Vector2float32:${number}` |
	"Vector2int16" | `Vector2int16:${number}` |
	"Vector2uint16" | `Vector2uint16:${number}` |
	"Vector2" | `Vector2:${number}`
	| // Vector3 // 
	"Vector3float24" | `Vector3float24:${number}` |
	"Vector3float32" | `Vector3float32:${number}` |
	"Vector3int16" | `Vector3int16:${number}` |
	"Vector3uint16" | `Vector3uint16:${number}` |
	"Vector3" | `Vector3:${number}`
	| // CFrame //
	"CFrameQuaternion" | `CFrameQuaternion:${number}` |
	"CFrameF24" | `CFrameF24:${number}` |
	"CFrameF32" | `CFrameF32:${number}` |
	"CFrameF64" | `CFrameF64:${number}` |
	"CFrameQuantized" | `CFrameQuantized:${number}`
	| // Color3 //
	"Color3" | `Color3:${number}` |
	"Color3F24" | `Color3F24:${number}` |
	"Color3F32" | `Color3F32:${number}` |
	"Color3F64" | `Color3F64:${number}` 
	| // UDim //
	"UDim" | `UDim:${number}` |
	"UDim2" | `UDim2:${number}`
	| // Rect //
	"RectFloat24" | `RectFloat24:${number}` |
	"RectFloat32" | `RectFloat32:${number}` |
	"Rect" | `Rect:${number}`
	| // Enum //
	"Enum" | `Enum:${number}`
	| // Region3 //
	"Region3" | `Region3:${number}` |
	"Region3Quaternion" | `Region3Quaternion:${number}` |
	"Region3CFrameF24" | `Region3CFrameF24:${number}` |
	"Region3CFrameF32" | `Region3CFrameF32:${number}` |
	"Region3Quantized" | `Region3Quantized:${number}`
	| // RotationCurveKey //
	{["Type"] : "RotationCurveKey" | `RotationCurveKey:${number}`, Option : Types.RotationCurveKeyOption}
	| // FloatCurveKey //
	{["Type"] : "FloatCurveKey" | `FloatCurveKey:${number}`, Option : Types.FloatCurveKeyOption}
	| // ColorSequence //
	{["Type"] : "ColorSequence" | `ColorSequence:${number}`, Option : Types.ColorSequenceOption}
	| // NumberRange //
	"NumberRange" | `NumberRange:${number}` |
	"NumberRangeF16" | `NumberRangeF16:${number}` |
	"NumberRangeF24" | `NumberRangeF24:${number}` |
	"NumberRangeF64" | `NumberRangeF64:${number}`
	| // NumberSequence //
	{["Type"] : "NumberSequence" | `NumberSequence:${number}`, Option : Types.NumberSequenceOption}
	| // Instance //
	"Instance" | `Instance:${number}`
	| // Custom //
	ArraySchema | StructSchema


// Serialization types
export type SerializationSchema = Record<string,BitstreamTypes>

// Array and struct types
export type ArraySchema = {
	["Type"] : "Array",
	["Types"] : Record<string,BitstreamTypes>,
}

export type StructSchema = {
	["Type"] : "Struct",
	["Fields"] : Record<string,BitstreamTypes>,
}

// Regroup all tables types into one single type (used for type casting)
export type BitstreamTableType = {
    Type : BitstreamTypesName,
    Types : BitstreamTypes[],
    Length : number,
    Fields : Record<string,BitstreamTypes>,
	Option : string,
}

/*
	Runtime enumeration instance.

	Represents the full set of supported buffer types with stable numeric IDs.

	IMPORTANT:
	- These IDs are part of serialization compatibility
	- Any change must be versioned explicitly
*/
export const BistreamEnumeration = table.freeze({
    I8 : 0x01,
	I16 : 0x02,
	I24 : 0x03,
	I32 : 0x04,
	I40 : 0x05,
	I48 : 0x06,
	I54 : 0x07,

	U1 : 0x08,
	U8 : 0x09,
	U16 : 0x0A,
	U24 : 0x0B,
	U32 : 0x0C,
	U40 : 0x0D,
	U48 : 0x0E,
	U54 : 0x0F,

	F8 : 0x10,
	F16 : 0x11,
	F24 : 0x12,
	F32 : 0x13,
	F64 : 0x14,

	String : 0x15,
	PrefixedString : 0x16,

	Bool1 : 0x17,
	Bool8 : 0x18,

	Vector2float32 : 0x19,
	Vector2int16 : 0x1A,
	Vector2uint16 : 0x1B,
	Vector2 : 0x1C,

	Vector3float32 : 0x1D,
	Vector3int16 : 0x1E,
	Vector3uint16 : 0x1F,
	Vector3 : 0x20,

	CFrameQuaternion : 0x21,
	CFrameF32 : 0x22,
	CFrameF64 : 0x23,
	CFrameQuantized : 0x24,

	Color3 : 0x25,
	Color3F32 : 0x26,
	Color3F64 : 0x27,

	UDim : 0x28,
	UDim2 : 0x29,

	RectFloat32 : 0x2A,
	Rect : 0x2B,

	Enum : 0x2C,

	Region3 : 0x2D,
	Region3Quaternion : 0x2E,
	Region3CFrameF32 : 0x2F,
	Region3Quantized : 0x30,

	RotationCurveKey : 0x31,

	FloatCurveKey : 0x32,

	ColorSequence : 0x33,

	NumberRange : 0x34,
	NumberRangeF16 : 0x35,
	NumberRangeF64 : 0x36,

	NumberSequence : 0x37,

	Array : 0x38,
	Struct : 0x39,
	
	Instance : 0x4A,
}) as Record<BitstreamTypesName,number>

export function fromValue(n : number) : BitstreamTypesName {
	assert(typeOf(n) === "number","A number must be provided.")
	for(const [k,v] of pairs(BistreamEnumeration)) {
		if(v === n) {
			return k
		}
	}
	error("Could not find a valid BitstreamTypesName.")
}