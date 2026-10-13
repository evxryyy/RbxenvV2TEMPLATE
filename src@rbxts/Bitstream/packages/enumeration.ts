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
		I8: 0x01,
		I16: 0x02,
		I24: 0x03,
		I32: 0x04,
		I40: 0x05,
		I48: 0x06,
		I54: 0x07,

		U1: 0x08,
		U8: 0x09,
		U16: 0x0A,
		U24: 0x0B,
		U32: 0x0C,
		U40: 0x0D,
		U48: 0x0E,
		U54: 0x0F,

		F8: 0x10,
		F16: 0x11,
		F24: 0x12,
		F32: 0x13,
		F64: 0x14,

		String: 0x15,
		PrefixedString: 0x16,

		Bool1: 0x17,
		Bool8: 0x18,

		Vector2float32: 0x19,
		Vector2int16: 0x1A,
		Vector2uint16: 0x1B,
		Vector2: 0x1C,
		Vector2float24: 0x3A,

		Vector3float32: 0x1D,
		Vector3int16: 0x1E,
		Vector3uint16: 0x1F,
		Vector3: 0x20,
		Vector3float24: 0x3B,

		CFrameQuaternion: 0x21,
		CFrameF32: 0x22,
		CFrameF64: 0x23,
		CFrameQuantized: 0x24,
		CFrameF24: 0x3C,

		Color3: 0x25,
		Color3F32: 0x26,
		Color3F64: 0x27,
		Color3F24: 0x3D,

		UDim: 0x28,
		UDim2: 0x29,

		RectFloat32: 0x2A,
		Rect: 0x2B,
		RectFloat24: 0x3E,

		Enum: 0x2C,

		Region3: 0x2D,
		Region3Quaternion: 0x2E,
		Region3CFrameF32: 0x2F,
		Region3Quantized: 0x30,
		Region3CFrameF24: 0x3F,

		RotationCurveKey: 0x31,
		RotationCurveKeyQuaternion: 0x40,
		RotationCurveKeyCFrameF24: 0x41,
		RotationCurveKeyCFrameF32: 0x42,
		RotationCurveKeyQuantized: 0x43,

		FloatCurveKey: 0x32,
		FloatCurveKeyF16: 0x44,
		FloatCurveKeyF24: 0x45,
		FloatCurveKeyF32: 0x46,

		ColorSequence: 0x33,
		ColorSequenceF24: 0x47,
		ColorSequenceF32: 0x48,
		ColorSequenceF64: 0x49,

		NumberRange: 0x34,
		NumberRangeF16: 0x35,
		NumberRangeF64: 0x36,
		NumberRangeF24: 0x4A,

		NumberSequence: 0x37,
		NumberSequenceF16: 0x4B,
		NumberSequenceF24: 0x4C,
		NumberSequenceF64: 0x4D,

		Array: 0x38,
		Struct: 0x39,

		Instance: 0x4E,
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