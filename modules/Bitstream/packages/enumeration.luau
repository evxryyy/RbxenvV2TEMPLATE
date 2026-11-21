--!strict

const typeHelper = require("./typeHelper")

const Enumeration = {}
Enumeration.__index = Enumeration

Enumeration.BitstreamEnumeration = {
	I8 = 0x00,
	I16 = 0x01,
	I24 = 0x02,
	I32 = 0x03,
	I40 = 0x04,
	I48 = 0x05,
	I54 = 0x06,

	U1 = 0x07,
	U8 = 0x08,
	U16 = 0x09,
	U24 = 0x0A,
	U32 = 0x0B,
	U40 = 0x0C,
	U48 = 0x0D,
	U54 = 0x0E,

	F8 = 0x0F,
	F16 = 0x10,
	F24 = 0x11,
	F32 = 0x12,
	F64 = 0x13,

	String = 0x14,
	PrefixedString = 0x15,

	Bool1 = 0x16,
	Bool8 = 0x17,

	Vector2float24 = 0x18,
	Vector2float32 = 0x19,
	Vector2int16 = 0x1A,
	Vector2uint16 = 0x1B,
	Vector2 = 0x1C,

	Vector3float24 = 0x1D,
	Vector3float32 = 0x1E,
	Vector3int16 = 0x1F,
	Vector3uint16 = 0x20,
	Vector3 = 0x21,

	CFrameQuaternion = 0x22,
	CFrameF24 = 0x23,
	CFrameF32 = 0x24,
	CFrameF64 = 0x25,
	CFrameQuantized = 0x26,

	Color3 = 0x27,
	Color3F24 = 0x28,
	Color3F32 = 0x29,
	Color3F64 = 0x2A,

	UDim = 0x2B,
	UDim2 = 0x2C,

	RectFloat24 = 0x2D,
	RectFloat32 = 0x2E,
	Rect = 0x2F,

	Enum = 0x30,

	Region3 = 0x31,
	Region3Quaternion = 0x32,
	Region3CFrameF24 = 0x33,
	Region3CFrameF32 = 0x34,
	Region3Quantized = 0x35,

	RotationCurveKey = 0x36,
	RotationCurveKeyQuaternion = 0x37,
	RotationCurveKeyCFrameF24 = 0x38,
	RotationCurveKeyCFrameF32 = 0x39,
	RotationCurveKeyQuantized = 0x3A,

	FloatCurveKey = 0x3B,
	FloatCurveKeyF16 = 0x3C,
	FloatCurveKeyF24 = 0x3D,
	FloatCurveKeyF32 = 0x3E,

	ColorSequence = 0x3F,
	ColorSequenceF24 = 0x40,
	ColorSequenceF32 = 0x41,
	ColorSequenceF64 = 0x42,

	NumberRange = 0x43,
	NumberRangeF16 = 0x44,
	NumberRangeF24 = 0x45,
	NumberRangeF64 = 0x46,

	NumberSequence = 0x47,
	NumberSequenceF16 = 0x48,
	NumberSequenceF24 = 0x49,
	NumberSequenceF64 = 0x4A,

	Instance = 0x4B,

	Array = 0x4C,
	Struct = 0x4D,

	-- New types or missing types go on the bottom

	Region3int16 = 0x4E,
}

-- Given the specified number n, searches the list for the exact corresponding type (e.g., 0 → I8).
function Enumeration.fromValue(n : number) : keyof<typeof(Enumeration.BitstreamEnumeration)> 
	for k,v in pairs(Enumeration.BitstreamEnumeration) do
		if(v == n) then return k end
	end
	error("Could not find a valid Bitstream type.")
end

return table.freeze(Enumeration)