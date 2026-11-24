--!strict

const Utilities = require("./Utilities")
const TypeHelper = require("./TypeHelper")

const EnumItemList : {[number] : EnumItem} = {}
const EnumItemIndex : {[EnumItem] : number} = {}

for _,enumType in Enum:GetEnums() do
	for _,enumItem in enumType:GetEnumItems() do
		table.insert(EnumItemList,enumItem)
		EnumItemIndex[enumItem] = #EnumItemList
	end
end

@native function StringSize(str : string) : number return #str end;

@native function PrefixedStringSize(str : string) : number
	const len = #str
	return 1 + Utilities.getEquivalentBytesInfoFromNumber(len).bytes + len
end

function RotationCurveKeySize(rot : RotationCurveKey,option : TypeHelper.RotationCurveKeyOption) : number
	if option == "Normal" then
		return if (rot.Interpolation == Enum.KeyInterpolationMode.Cubic) then 62 else 54
	elseif option == "Quaternion" then
		return if (rot.Interpolation == Enum.KeyInterpolationMode.Cubic) then 42 else 34
	elseif option == "CFrameF32" then
		return if (rot.Interpolation == Enum.KeyInterpolationMode.Cubic) then 38 else 30
	elseif option == "CFrameF24" then
		return if (rot.Interpolation == Enum.KeyInterpolationMode.Cubic) then 32 else 24
	elseif option == "Quantized" then
		return if (rot.Interpolation == Enum.KeyInterpolationMode.Cubic) then 26 else 18
	end
	error("Current option is invalid. Please see ./typeHelper")
end

function FloatCurveKeySize(key : FloatCurveKey,option : TypeHelper.FloatCurveKeyOption) : number
	if option == "Normal" then
		return if (key.Interpolation == Enum.KeyInterpolationMode.Cubic) then 22 else 14
	elseif option == "F32" then
		return if (key.Interpolation == Enum.KeyInterpolationMode.Cubic) then 18 else 10
	elseif option == "F24" then
		return if (key.Interpolation == Enum.KeyInterpolationMode.Cubic) then 17 else 9
	elseif option == "F16" then
		return if (key.Interpolation == Enum.KeyInterpolationMode.Cubic) then 16 else 8
	end
	error("Current option is invalid. Please see ./typeHelper")
end

@native function ColorSequenceSize(key : ColorSequence,option : TypeHelper.ColorSequenceOption) : number
	if option == "Normal" then
		return 1 + (7 * #key.Keypoints)
	elseif option == "F24" then
		return 1 + (13 * #key.Keypoints)
	elseif option == "F32" then
		return 1 + (16 * #key.Keypoints)
	elseif option == "F64" then
		return 1 + (28 * #key.Keypoints)
	end
	error("Current option is invalid. Please see ./typeHelper")
end

@native function NumberSequenceSize(key : NumberSequence,option : TypeHelper.NumberSequenceOption) : number
	if option == "Normal" then
		return 1 + (12 * #key.Keypoints)
	elseif option == "F16" then
		return 1 + (10 * #key.Keypoints)
	elseif option == "F24" then
		return 1 + (11 * #key.Keypoints)
	elseif option == "F64" then
		return 1 + (16 * #key.Keypoints)
	end
	error("Current option is invalid. Please see ./typeHelper")
end

return table.freeze({
	-- INTEGER TYPES -

	-- Signed integers --
	MIN_INT8 = -128, MAX_INT8 = 127, -- [min = -2^7, max = 2^7 - 1]
	MIN_INT16 = -32_768, MAX_INT16 = 32_767, -- [min = -2^15, max = 2^15 - 1]
	MIN_INT24 = -8_388_608, MAX_INT24 = 8_388_607, -- [min = -2^23, max = 2^23 - 1]
	MIN_INT32 = -2_147_483_648, MAX_INT32 = 2_147_483_647, -- [min = -2^31, max = 2^31 - 1]
	MIN_INT40 = -549_755_813_887, MAX_INT40 = 549_755_813_887, -- [min = -2^39, max = 2^39 - 1]
	MIN_INT48 = -140_737_488_355_328, MAX_INT48 = 140_737_488_355_327, -- [min = -2^47, max = 2^47 - 1]
	MIN_INT54 = -9_007_199_254_740_992, MAX_INT54 = 9_007_199_254_740_991, -- [min = -2^53, max = 2^53 - 1]

	-- Unsigned integers --
	MIN_UINT = 0,
	MAX_UINT8 = 255, -- [max = 2^8 - 1]
	MAX_UINT16 = 65_535, -- [max = 2^16 - 1]
	MAX_UINT24 = 16_777_215, -- [max = 2^24 - 1]
	MAX_UINT32 = 4_294_967_295, -- [max = 2^32 - 1]
	MAX_UINT40 = 1_099_511_627_775, -- [max = 2^40 - 1]
	MAX_UINT48 = 281_474_976_710_655, -- [max = 2^48 - 1]
	MAX_UINT54 = 18_014_398_509_481_980, -- [max = 2^54 - 1], max is reduced by 3 due to `IEEE754` range

	REQUIRED_BYTES = {
		-- Signed Integers
		I1 = 1,
		I8 = 1,
		I16 = 2,
		I24 = 3,
		I32 = 4,
		I40 = 5,
		I48 = 6,
		I54 = 7,
		-- Unsigned Integers
		U1 = 1,
		U8 = 1,
		U16 = 2,
		U24 = 3,
		U32 = 4,
		U40 = 5,
		U48 = 6,
		U54 = 7,
		-- Floats,
		F8 = 1,
		F16 = 2,
		F24 = 3,
		F32 = 4,
		F64 = 8,
		-- Strings,
		String = StringSize,
		PrefixedString = PrefixedStringSize,
		-- Bools
		Bool1 = 1,
		Bool8 = 1,
		-- Others
		Vector2float24 = 6, -- (x.y float24 each)
		Vector2float32 = 8, -- (half-precision vector2)
		Vector2int16 = 4, -- (Vector2int16 by default)
		Vector2uint16 = 4, -- (Same as Vector2int16 but use unsigned integer)
		Vector2 = 16, -- (full precision Vector2)
		Vector3float24 = 9, -- (x,y,z float24 each)
		Vector3float32 = 12, -- (half-precision vector3)
		Vector3int16 = 6, -- (Vector3int16 by default)
		Vector3uint16 = 6, -- (Same as Vector3int16 but use unsigned integer)
		Vector3 = 24, -- (full precision Vector3)
		CFrameQuaternion = 28, -- (CFrame converted into a quaternion (x,y,z,w))
		CFrameF24 = 18, -- (convert to euler angles and write (pos + rx,ry,rz) as f24)
		CFrameF32 = 24, -- (convert to euler angles and write (pos + rx,ry,rz) as f32
		CFrameF64 = 48, -- (convert to euler angles and write (pos + rx,ry,rz) as f64)
		CFrameQuantized = 12, -- (quantized CFrame, 12 bytes using i16)
		Color3 = 3, -- (1 byte each for R,G,B)
		Color3F24 = 9, -- (3 bytes each for R,G,B)
		Color3F32 = 12, -- (4 bytes each for R,G,B)
		Color3F64 = 24, -- (8 bytes each for R,G,B)
		UDim = 8, -- (Offset as i32, Scale as f32)
		UDim2 = 16, -- (Offset.X&Y as i32, Scale.X%Y as f32)
		RectFloat24 = 12, -- (Store min and max vector as f24)
		RectFloat32 = 16, -- (Store min and max vector as f32)
		Rect = 32, -- (Store min and max vector as f64)
		Enum = 2, -- (u16 for enum identifier)
		Region3 = 72, -- (Vec3, CFrameF64)
		Region3Quaternion = 52, -- (Vec3, CFrameQuaternion)
		Region3CFrameF24 = 42, -- (Vec3, CFrameF24)
		Region3CFrameF32 = 48, -- (Vec3, CFrameF32)
		Region3Quantized = 36, -- (Vec3, CFrameQuantized)
		Region3int16 = 12, -- (Vec3int16, Vec3int16)
		RotationCurveKey = RotationCurveKeySize,
		FloatCurveKey = FloatCurveKeySize,
		ColorSequence = ColorSequenceSize,
		NumberRange = 8,
		NumberRangeF16 = 4,
		NumberRangeF24 = 6,
		NumberRangeF64 = 16,
		NumberSequence = NumberSequenceSize,
	},

	-- [number] = EnumItem, table identifiers to avoid 2 extra bytes while writing Enums
	EnumItemList = EnumItemList,
	-- [EnumItem] = number, O(1) research when writing
	EnumItemIndex = EnumItemIndex
})