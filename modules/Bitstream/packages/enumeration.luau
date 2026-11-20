--!nocheck
-- replace nocheck to strict if is not the case (if everything turns red its because your IDE does not support this syntax yet)
const typeHelper = require("./typeHelper")

type function IntegerUnion(spec : type,prefix : type,validBits : type) : type
	if not spec:is("singleton") or type(spec:value()) ~= "string" then
		return types.never
	end
	if not prefix:is("singleton") or type(prefix:value()) ~= "string" then
		return types.never
	end
	const specStr = spec:value() :: string
	const prefixStr = prefix:value() :: string
	local bitsStr, countStr = string.match(specStr, "^(%d+):(%d+)$")
	if bitsStr == nil then
		bitsStr = string.match(specStr, "^(%d+)$")
	end
	if bitsStr == nil then
		return types.never
	end
	if countStr ~= nil then
		const count = tonumber(countStr)
		if count == nil or count < 1 or string.sub(countStr, 1, 1) == "0" then
			return types.never
		end
	end
	const bitsComponents = if validBits:is("union") then validBits:components() else { validBits }
	for _, bitType in bitsComponents do
		if bitType:is("singleton") and bitType:value() == bitsStr then
			return types.singleton(prefixStr .. specStr)
		end
	end
	return types.never
end

type function RbxTypeCountPattern(spec: type, validCount: type): type
	if not spec:is("singleton") or type(spec:value()) ~= "string" then
		return types.never
	end
	if not validCount:is("singleton") or type(validCount:value()) ~= "string" then
		return types.never
	end
	const specStr = spec:value() :: string
	const countInput = validCount:value() :: string
	if countInput == "" then
		return types.singleton(specStr)
	end
	const countStr = string.match(countInput, "^:(%d+)$")
	if countStr == nil then
		return types.never
	end
	const count = tonumber(countStr)
	if count == nil or count < 1 or string.sub(countStr, 1, 1) == "0" then
		return types.never
	end
	return types.singleton(specStr .. ":" .. countStr)
end

export type ValidSignedIntegerBits = '8' | '16' | '24' | '32' | '40' | '48' | '54'
export type ValidUnsignedIntegerBits = '1' | '8' | '16' | '24' | '32' | '40' | '48' | '54'
export type ValidFloatBits = '8' | '16' | '24' | '32' | '64'

-- Integer --
export type Int<T = ""> = IntegerUnion<T,'I',ValidSignedIntegerBits>
export type Uint<T = ""> = IntegerUnion<T,'U',ValidUnsignedIntegerBits>
export type Float<T = ""> = IntegerUnion<T,'F',ValidFloatBits>

-- Strings --
export type String<T = ""> = RbxTypeCountPattern<"String",T>
export type PrefixedString<T = ""> = RbxTypeCountPattern<"PrefixedString",T>

-- Booleans --
export type Bool1<T = ""> = RbxTypeCountPattern<"Bool1",T>
export type Bool8<T = ""> = RbxTypeCountPattern<"Bool8",T>

-- Vector2 --
export type Vector2float24<T = ""> = RbxTypeCountPattern<"Vector2float24",T>
export type Vector2float32<T = ""> = RbxTypeCountPattern<"Vector2float32",T>
export type Vector2int16<T = ""> = RbxTypeCountPattern<"Vector2int16",T>
export type Vector2uint16<T = ""> = RbxTypeCountPattern<"Vector2uint16",T>
export type Vector2<T = ""> = RbxTypeCountPattern<"Vector2",T>

-- Vector3 --
export type Vector3float24<T = ""> = RbxTypeCountPattern<"Vector3float24",T>
export type Vector3float32<T = ""> = RbxTypeCountPattern<"Vector3float32",T>
export type Vector3int16<T = ""> = RbxTypeCountPattern<"Vector3int16",T>
export type Vector3uint16<T = ""> = RbxTypeCountPattern<"Vector3uint16",T>
export type Vector3<T = ""> = RbxTypeCountPattern<"Vector3",T>

-- CFrame --
export type CFrameQuaternion<T = ""> = RbxTypeCountPattern<"CFrameQuaternion",T>
export type CFrameF24<T = ""> = RbxTypeCountPattern<"CFrameF24",T>
export type CFrameF32<T = ""> = RbxTypeCountPattern<"CFrameF32",T>
export type CFrameF64<T = ""> = RbxTypeCountPattern<"CFrameF64",T>
export type CFrameQuantized<T = ""> = RbxTypeCountPattern<"CFrameQuantized",T>

-- Color3 --
export type Color3<T = ""> = RbxTypeCountPattern<"Color3",T>
export type Color3F24<T = ""> = RbxTypeCountPattern<"Color3F24",T>
export type Color3F32<T = ""> = RbxTypeCountPattern<"Color3F32",T>
export type Color3F64<T = ""> = RbxTypeCountPattern<"Color3F64",T>

-- UDim --
export type UDim<T = ""> = RbxTypeCountPattern<"UDim",T>
export type UDim2<T = ""> = RbxTypeCountPattern<"UDim2",T>

-- Rect --
export type RectFloat24<T = ""> = RbxTypeCountPattern<"RectFloat24",T>
export type RectFloat32<T = ""> = RbxTypeCountPattern<"RectFloat32",T>
export type Rect<T = ""> = RbxTypeCountPattern<"Rect",T>

-- Enum --
export type Enum<T = ""> = RbxTypeCountPattern<"Enum",T>

-- Region3 --
export type Region3<T = ""> = RbxTypeCountPattern<"Region3",T>
export type Region3Quaternion<T = ""> = RbxTypeCountPattern<"Region3Quaternion",T>
export type Region3CFrameF32<T = ""> = RbxTypeCountPattern<"Region3CFrameF32",T>
export type Region3CFrameF24<T = ""> = RbxTypeCountPattern<"Region3CFrameF24",T>
export type Region3int16<T = ""> = RbxTypeCountPattern<"Region3int16",T>
export type Region3Quantized<T = ""> = RbxTypeCountPattern<"Region3Quantized",T>

-- RotationCurveKey --
export type RotationCurveKey<T = ""> = {
	["Type"] : RbxTypeCountPattern<"RotationCurveKey",T>,
	["Option"] : typeHelper.RotationCurveKeyOption
}

-- FloatCurveKey --
export type FloatCurveKey<T = ""> = {
	["Type"] : RbxTypeCountPattern<"FloatCurveKey",T>,
	["Option"] : typeHelper.FloatCurveKeyOption
}

-- ColorSequence --
export type ColorSequence<T = ""> = {
	["Type"] : RbxTypeCountPattern<"ColorSequence",T>,
	["Option"] : typeHelper.ColorSequenceOption
}

-- NumberRange --
export type NumberRange<T = ""> = RbxTypeCountPattern<"NumberRange",T>
export type NumberRangeF16<T = ""> = RbxTypeCountPattern<"NumberRangeF16",T>
export type NumberRangeF24<T = ""> = RbxTypeCountPattern<"NumberRangeF24",T>
export type NumberRangeF64<T = ""> = RbxTypeCountPattern<"NumberRangeF64",T>

-- NumberSequence --
export type NumberSequence<T = ""> = {
	["Type"] : RbxTypeCountPattern<"NumberSequence",T>,
	["Option"] : typeHelper.NumberSequenceOption
}

-- Instance --
export type Instance<T = ""> = RbxTypeCountPattern<"Instance",T>


export type BitstreamTypeName = 
	| Int
	| Uint
	| Float
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
	| "Region3int16"
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

export type BitstreamTypes<T = ""> =
	| Int<T>
	| Uint<T>
	| Float<T>
	| String<T>
	| PrefixedString<T>
	| Bool1<T>
	| Bool8<T>
	| Vector2<T> | Vector2float24<T> | Vector2float32<T> | Vector2int16<T> | Vector2uint16<T>
	| Vector3<T> | Vector3float24<T> | Vector3float32<T> | Vector3int16<T> | Vector3uint16<T>
	| CFrameF24<T> | CFrameF32<T> | CFrameF64<T> | CFrameQuantized<T> | CFrameQuaternion<T>
	| Color3<T> | Color3F24<T> | Color3F32<T> | Color3F64<T>
	| UDim<T> | UDim2<T>
	| Rect<T> | RectFloat24<T> | RectFloat32<T>
	| Enum<T>
	| Region3<T> | Region3CFrameF24<T> | Region3CFrameF32<T> | Region3int16<T> | Region3Quantized<T> | Region3Quaternion<T>
	| RotationCurveKey<T>
	| FloatCurveKey<T>
	| ColorSequence<T>
	| NumberRange<T> | NumberRangeF16<T> | NumberRangeF24<T> | NumberRangeF64<T>
	| NumberSequence<T>
	| Instance<T>


const x : Int<":2"> = "I8:2"

-- [I8:3]