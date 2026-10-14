import * as Types from "./typeHelper"

// A utility type designed to simplify BitstreamTypes and BitstreamTypesNames
type ValidSignedIntegerBits = 8 | 16 | 24 | 32 | 40 | 48 | 54
type ValidUnsignedIntegerBits = 1 | 8 | 16 | 24 | 32 | 40 | 48 | 54
type ValidFloatBits = 8 | 16 | 24 | 32 | 64

//#region Name of all availables bitstream types.

export type BitstreamTypesName =
	| `I${ValidSignedIntegerBits}`
	| `U${ValidUnsignedIntegerBits}`
	| `F${ValidFloatBits}`
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


//#endregion

//#region List of all availables bitstream types (not names, actual types).
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


//#endregion

//#region Struct/Array and transform types

export type ArraySchema = {
	["Type"] : "Array",
	["Types"] : BitstreamTypes[],
}

export type StructSchema = {
	["Type"] : "Struct",
	["Fields"] : Record<string,BitstreamTypes>,
}

export type BitstreamTableType = {
    Type : BitstreamTypesName,
    Types : BitstreamTypes[],
    Length : number,
    Fields : Record<string,BitstreamTypes>,
	Option : string,
}

//#endregion

export abstract class Enumeration {

	// A list of all currently supported types.
	public static readonly BitstreamEnumeration : Record<BitstreamTypesName,number> = {
		I8: 0x00,
		I16: 0x01,
		I24: 0x02,
		I32: 0x03,
		I40: 0x04,
		I48: 0x05,
		I54: 0x06,
		
		U1: 0x07,
		U8: 0x08,
		U16: 0x09,
		U24: 0x0A,
		U32: 0x0B,
		U40: 0x0C,
		U48: 0x0D,
		U54: 0x0E,

		F8: 0x0F,
		F16: 0x10,
		F24: 0x11,
		F32: 0x12,
		F64: 0x13,

		String: 0x14,
		PrefixedString: 0x15,

		Bool1: 0x16,
		Bool8: 0x17,

		Vector2float24: 0x18,
		Vector2float32: 0x19,
		Vector2int16: 0x1A,
		Vector2uint16: 0x1B,
		Vector2: 0x1C,

		Vector3float24: 0x1D,
		Vector3float32: 0x1E,
		Vector3int16: 0x1F,
		Vector3uint16: 0x20,
		Vector3: 0x21,

		CFrameQuaternion: 0x22,
		CFrameF24: 0x23,
		CFrameF32: 0x24,
		CFrameF64: 0x25,
		CFrameQuantized: 0x26,

		Color3: 0x27,
		Color3F24: 0x28,
		Color3F32: 0x29,
		Color3F64: 0x2A,

		UDim: 0x2B,
		UDim2: 0x2C,

		RectFloat24: 0x2D,
		RectFloat32: 0x2E,
		Rect: 0x2F,

		Enum: 0x30,

		Region3: 0x31,
		Region3Quaternion: 0x32,
		Region3CFrameF24: 0x33,
		Region3CFrameF32: 0x34,
		Region3Quantized: 0x35,

		RotationCurveKey: 0x36,
		RotationCurveKeyQuaternion: 0x37,
		RotationCurveKeyCFrameF24: 0x38,
		RotationCurveKeyCFrameF32: 0x39,
		RotationCurveKeyQuantized: 0x3A,

		FloatCurveKey: 0x3B,
		FloatCurveKeyF16: 0x3C,
		FloatCurveKeyF24: 0x3D,
		FloatCurveKeyF32: 0x3E,

		ColorSequence: 0x3F,
		ColorSequenceF24: 0x40,
		ColorSequenceF32: 0x41,
		ColorSequenceF64: 0x42,

		NumberRange: 0x43,
		NumberRangeF16: 0x44,
		NumberRangeF24: 0x45,
		NumberRangeF64: 0x46,

		NumberSequence: 0x47,
		NumberSequenceF16: 0x48,
		NumberSequenceF24: 0x49,
		NumberSequenceF64: 0x4A,

		Instance: 0x4B,

		Array: 0x4C,
		Struct: 0x4D
	}

	// Given the specified number n, searches the list for the exact corresponding type (e.g., 1 → I8).
	public static fromValue(n : number) : BitstreamTypesName {
		assert(typeOf(n) === "number","First argument is expected to be a number.")
		for(const [k,v] of pairs(this.BitstreamEnumeration)) {
			if(v === n) return k
		}
		error("Could not find a valid BitstreamTypesName.")
	}

}