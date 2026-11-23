--!strict

const typeHelper = require("./typeHelper")

type ValidSignedIntegerBits = typeHelper.ValidSignedIntegerBits
type ValidUnsignedIntegerBits = typeHelper.ValidUnsignedIntegerBits
type ValidFloatBits = typeHelper.ValidFloatBits
type BitstreamTypeNames = typeHelper.BitstreamTypeNames

-- Objects Types --
type Int<T> = typeHelper.Int<T>
type Uint<T> = typeHelper.Uint<T>
type Float<T> = typeHelper.Float<T>
type String<T> = typeHelper.String<T>
type RotationCurveKey<T> = typeHelper.RotationCurveKey<T>
type FloatCurveKey<T> = typeHelper.FloatCurveKey<T>
type ColorSequence<T> = typeHelper.ColorSequence<T>
type NumberSequence<T> = typeHelper.NumberSequence<T>

-- Custom Objects Types --
type ArrayDescriptor = typeHelper.ArrayDescriptor
type RbxDesc<T> = typeHelper.RbxDesc<T>

-- Objects Options -- 
type RotationCurveKeyOption = typeHelper.RotationCurveKeyOption
type FloatCurveKeyOption = typeHelper.FloatCurveKeyOption
type ColorSequenceOption = typeHelper.ColorSequenceOption
type NumberSequenceOption = typeHelper.NumberSequenceOption

const VALID_INT: { [string]: boolean } = {
	["8"] = true, ["16"] = true, ["24"] = true, ["32"] = true,
	["40"] = true, ["48"] = true, ["54"] = true,
}
const VALID_UINT: { [string]: boolean } = {
	["1"] = true, ["8"] = true, ["16"] = true, ["24"] = true,
	["32"] = true, ["40"] = true, ["48"] = true, ["54"] = true,
}
const VALID_FLOAT: { [string]: boolean } = {
	["8"] = true, ["16"] = true, ["24"] = true, ["32"] = true, ["64"] = true,
}

const Enumeration = {}
Enumeration.__index = Enumeration

-- Subclassing for creating schema
Enumeration.SchemaBuilder = {}

-- Meaning : EmptyCountPattern for types
Enumeration.ECP = ""

-- Schema creation configuration
Enumeration.SchemaBuilder.Configuration = {
	-- Enables runtime type verification (default: `true`).
	-- Disable this if your input data is strictly guaranteed and predictable to eliminate overhead and maximize performance.
	EnableTypeVerification = true,
}	
	
-- Registry of supported primitive and complex data type tags.
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
} :: {read [BitstreamTypeNames] : number}

--[[
	Constructs dynamic numeric type representations (e.g., `Int`, `Float`, `Uint`).
    Performs runtime syntax and bit-width validation when `EnableTypeVerification` is enabled.
    
    Fast-path: Directly returns concatenated type specifier if verification is disabled.
]]
const function makeNumeric<T>(prefix: string, valid: { [string]: boolean }, spec: string): T
	if(not Enumeration.SchemaBuilder.Configuration.EnableTypeVerification) then return (prefix .. spec) :: any end
	local bits, count = string.match(spec, "^(%d+):(%d+)$")
	if(bits == nil) then
		bits = string.match(spec, "^(%d+)$")
	end
	if(bits == nil or not valid[bits]) then
		error(`Invalid bits in "{spec}" for {prefix}`)
	end
	if(count ~= nil) then
		local n = tonumber(count)
		if n == nil or n <= 1 or string.sub(count, 1, 1) == "0" then
			error(`Invalid count in "{spec}"`)
		end
	end
	return (prefix .. spec) :: any
end

--[[
    Validates and resolves a Roblox primitive or custom type specification (e.g., "Vector3" or "Vector3:16").
    Performs runtime validation against registered type tags when `EnableTypeVerification` is enabled.

    Fast-path: Directly returns the specification string if verification is disabled.
]]
const function makeRbx<T>(spec: string): T
	if(not Enumeration.SchemaBuilder.Configuration.EnableTypeVerification) then return spec :: any end
	local name = spec
	local count = ""
	const colon = string.find(spec, ":", 1, true)
	if(colon ~= nil) then
		name = string.sub(spec, 1, colon - 1)
		count = string.sub(spec, colon)
	end
	if(not Enumeration.BitstreamEnumeration[name]) then
		error(`Unknown type name "{name}" in "{spec}"`)
	end
	if(count ~= "") then
		const digits = string.match(count, "^:(%d+)$")
		if digits == nil then
			error(`Invalid count in "{spec}" (expected "Name:N")`)
		end
		const n = tonumber(digits)
		if(n == nil or n <= 1 or string.sub(digits, 1, 1) == "0") then
			error(`Invalid count in "{spec}" (N > 1, no leading zero)`)
		end
	end
	return spec :: any
end

function Enumeration.SchemaBuilder.Int<T>(spec : T | ValidSignedIntegerBits) : Int<T> return makeNumeric<<Int<T>>>("I", VALID_INT, spec) end;
function Enumeration.SchemaBuilder.Uint<T>(spec : T | ValidUnsignedIntegerBits) : Uint<T> return makeNumeric<<Uint<T>>>("U", VALID_UINT, spec) end;
function Enumeration.SchemaBuilder.Float<T>(spec : T | ValidFloatBits) : Float<T> return makeNumeric<<Float<T>>>("F", VALID_FLOAT, spec) end;
function Enumeration.SchemaBuilder.RbxType<S>(spec: S | BitstreamTypeNames): RbxDesc<S> return makeRbx<<RbxDesc<S>>>((spec)) end;

function Enumeration.SchemaBuilder.String<T>(spec : T | "", len : number) : String<T>
return { Type = makeRbx<<T>>(`String:{spec}`), Length = len }
end

function Enumeration.SchemaBuilder.RotationCurveKey<T>(spec : T | "",option : RotationCurveKeyOption?) : RotationCurveKey<T>
	return { Type = makeRbx<<T>>(`RotationCurveKey:{spec}`), Option = option or "Normal"}
end

function Enumeration.SchemaBuilder.FloatCurveKey<T>(spec : T | "",option : FloatCurveKeyOption?) : FloatCurveKey<T>
	return { Type = makeRbx<<T>>(`FloatCurveKey:{spec}`), Option = option or "Normal"}
end

function Enumeration.SchemaBuilder.ColorSequence<T>(spec : T | "",option : ColorSequenceOption?) : ColorSequence<T>
	return { Type = makeRbx<<T>>(`ColorSequence:{spec}`), Option = option or "Normal"}
end

function Enumeration.SchemaBuilder.NumberSequence<T>(spec : T | "",option : NumberSequenceOption?) : NumberSequence<T>
	return { Type = makeRbx<<T>>(`NumberSequence:{spec}`), Option = option or "Normal"}
end

function Enumeration.SchemaBuilder.Array(types : {string | ArrayDescriptor}) : ArrayDescriptor
	return { Type = "Array", Types = types }
end

-- Given the specified number n, searches the list for the exact corresponding type (e.g., 0 → I8).
function Enumeration.fromValue(n : number) : keyof<typeof(Enumeration.BitstreamEnumeration)>
	for k,v in pairs(Enumeration.BitstreamEnumeration) do
	if(v == n) then 
		return k :: keyof<typeof(Enumeration.BitstreamEnumeration)> end
	end
	error("Could not find a valid Bitstream type.")
end

return table.freeze(Enumeration)