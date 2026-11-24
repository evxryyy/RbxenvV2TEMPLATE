--!strict
const TypeHelper = require("./TypeHelper")
const Enumeration = require("./Enumeration")

const sin = math.sin; const cos = math.cos;
const huge = math.huge; const floor = math.floor;
const log = math.log;

const bor = bit32.bor; const lshift = bit32.lshift;
const rshift = bit32.rshift; const band = bit32.band;
const extract = bit32.extract;

const strpack = string.pack const strunpack = string.unpack;
const sub = string.sub;

const readu16 = buffer.readu16;

-- Fixed numbers (used for big-endian manual packing etc..)
const fNaN = 0x7E00 -- 32_256 (used for NaN in float16)
const fInfinity = 0x7C00 -- 31_744 (used for infinity in float16)
const fSubNormal = 0x3FF -- 1023 (used for subnormals in float16)
const f31bit = 0x1F -- 31 (used for 31 bit fixed numbers)
const f15bit = 0xF -- 15 (used for 15 bit fixed numbers)
const f10bit = 0x0A -- 10 (used for the exponent in f16)
const f24_exp_bits = 5 -- 5 (used for 24 bit fp fixed numbers)
const f24_mant_bits = 18 -- 18 (used for 24 bit fp fixed numbers)

--[[
	@function floatToBits
	
	@param : number -- The number to convert.
	
	@returns : number -- The number converted to bits.
	
	Convert a float to its unsigned 32-bit representation.
]]
@native function floatToBits(n) : number
	return strunpack(">I4",strpack(">f",n)) :: number
end

--[[
	@function bitsToFloat
	
	@param bits : number -- The number in bits to convert.
	@returns : number -- The number converted to float.
	
	Convert a 32-bit unsigned integer to a float.
]]
@native function bitsToFloat(bits) : number
	return strunpack(">f",strpack(">I4",bits)) :: number
end

--[[
	@function axisAngleToQuaternion
	
	@param axis : vector
	@param angle : number
	
	@returns {X : number, Y : number, Z : number, W : number} -- Quaternion
	Converts an axis-angle representation to a quaternion.
]]
@native function axisAngleToQuaterion(axis : Vector3,angle : number) : TypeHelper.Quaternion
	const halfAngle = angle / 2
	const s = sin(halfAngle)
	const c = cos(halfAngle)
	return {
		x = axis.X * s,
		y = axis.Y * s,
		z = axis.Z * s,
		w = c
	}
end

--[[
	@function quaternionToCFrame
	
	@param pos : Vector3
	@param quaternion : {X : number, Y : number, Z : number, W : number}
	
	@returns : CFrame
	Converts a quaternion to a CFrame with the given position.
]]
@native function quaternionToCFrame(pos : Vector3,quaternion : TypeHelper.Quaternion)
	const xx,yy,zz =
		quaternion.x*quaternion.x,
		quaternion.y*quaternion.y,
		quaternion.z*quaternion.z
	const xy,xz,yz =
		quaternion.x*quaternion.y,
		quaternion.x*quaternion.z,
		quaternion.y*quaternion.z
	const wx,wy,wz =
		quaternion.w*quaternion.x,
		quaternion.w*quaternion.y,
		quaternion.w*quaternion.z
	return CFrame.new(pos.X,pos.Y,pos.Z,
		1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy),
		2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx),
		2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)
	)
end

--[[
	@function toFloat16

	@param value : number
	The float32 value to convert.

	@returns Tuple(
		uint16: number,
		sign: number,
		mantissa: number,
		exponent: number
	)

	Returns the IEEE 754 half-precision floating-point representation.

	- uint16: The encoded 16-bit unsigned integer value.
	- sign: The sign bit (0 = positive, 1 = negative).
	- mantissa: The 10-bit mantissa field.
	- exponent: The 5-bit exponent field.
]]
@native function toFloat16(value : number) : (number,number,number,number)
	local sign,mantissa,exponent = 0,0,0
	if(value < 0) then 
		sign = 1; value = -value
		elseif (value ~= value) then exponent = 31; mantissa = 512;
		elseif (value == huge) then exponent = 31;
		elseif (value == 0) then return 0,sign,0,0;
		elseif (value < (2 ^ -14)) then
			mantissa = floor(value * (2 ^ 24) + 0.5)
			if(exponent >= 1024) then exponent = 1; mantissa = 0 end;
		else
			const e = floor(log(value) / log(2))
			mantissa = floor((((value / 2 ^ e)) - 1) * 1024 + 0.5)
			exponent = e + 15
			if(mantissa >= 1024) then mantissa = 0; exponent += 1; end
			if(exponent >= 31) then exponent = 31; mantissa = 0; end
	end
	const uint16 = bor(lshift(sign,15),lshift(exponent,10),mantissa)
	return uint16,sign,mantissa,exponent
end

--[[
	@function decodeF16
	
	@param buff : buffer
	The buffer containing the 16-bit float.
	@param offset : number
	The offset to start reading from.
	
	@returns : number
	Decodes a 16-bit IEEE 754 half-precision floating-point value from the buffer at the specified offset.
]]
@native function decodeF16(buff : buffer,offset : number) : number 
	const uint16 = readu16(buff,offset)
	const sign = rshift(uint16,f15bit)
	const exponent = band(rshift(uint16, f10bit),f31bit)
	const mantissa = band(uint16,fSubNormal)
	if(exponent == 0) then
		if(mantissa == 0) then return if(sign == 0) then 0 else -0;
		else 
			const value = mantissa * 2 ^ 24;
			return if(sign == 0) then value else -value;
		end
		elseif(exponent == 31) then
			if(mantissa == 0) then
				return if(sign == 0) then huge else -huge;
			else 
				return fNaN;
			end
	end
	const value = (1 + mantissa / 1024) * (2 ^ (exponent - f15bit))
	return if(sign == 0) then value else -value;
end

@native function searchEnumTypeIdentifier<EnumItem>(typeIdentifier : number) : EnumItem
	return Enumeration.fromValue(typeIdentifier)
end

function bitstreamTypesToLiteralTypes(typeName) : string
	if typeName == "UDim" or typeName == "UDim2" then
		return typeName
	end
	-- Enum
	if typeName == "Enum" then
		return "EnumItem"
	end
	-- Strings
	if typeName == "PrefixedString" or typeName == "String" then
		return "string"
	end
	-- Color3
	if typeName == "Color3F32" or typeName == "Color3F64" or typeName == "Color3F24" then
		return "Color3"
	end
	-- Rect
	if typeName == "RectFloat32" or typeName == "RectFloat24" then
		return "Rect"
	end
	-- CFrame
	if typeName == "CFrameF24" or typeName == "CFrameF32" or typeName == "CFrameF64" or typeName == "CFrameQuantized" or typeName == "CFrameQuaternion" then
		return "CFrame"
	end
	-- Vectors
	if typeName == "Vector3float24" or typeName == "Vector3float32" or typeName == "Vector3uint16" then
		return "Vector3"
	end
	if typeName == "Vector2float24" or typeName == "Vector2float32" or typeName == "Vector2uint16" then
		return "Vector2"
	end
	-- Regions
	if typeName == "Region3CFrameF24" or typeName == "Region3CFrameF32" or typeName == "Region3Quantized" or typeName == "Region3Quaternion" then
		return "Region3"
	end
	-- NumberRanges
	if typeName == "NumberRangeF16" or typeName == "NumberRangeF24" or typeName == "NumberRangeF64" then
		return "NumberRange"
	end
	-- Get the first letter of the type for numbers
	const symbol = sub(typeName, 1, 1)
	const isOnly3Letters = if (#typeName == 3) then true else false
	if (symbol == "U" or symbol == "I" or symbol == "F") and isOnly3Letters then
		return "number"
	elseif symbol == "B" and isOnly3Letters then
		return "boolean"
	end
	return typeName
end

@native function encodeF24(float : number) : number
	local sign = 0
	if(float < 0) then 
		sign = 1; float = -float;
		elseif (float == 0) then return 0;
	end
	const bits = floatToBits(float)
	const exponent32 = extract(bits,23,0)
	const mantissa32 = extract(bits,0,23)
	local exponent = exponent32 - 127 + 16
	local mantissa = 0
	if(exponent32 == 255) then return bor(lshift(sign, 23),0x7FFFFF) end;
	if(exponent <= 0) then
		mantissa = floor(float * (2 ^ 33) + 0.5)
		if(mantissa >= 262_144) then return bor(lshift(sign, 23),lshift(1,18)) end;
		return bor(lshift(sign, 23),mantissa)
	end
	mantissa = floor(mantissa32 / 32 + 0.5)
	if(mantissa == 262_144) then
		mantissa = 0; exponent += 1
	end
	if(exponent > 31) then return bor(lshift(sign,23),0x7FFFFF) end;
	return bor(lshift(sign, 23),lshift(exponent, 18),mantissa)
end

@native function decodeF24(b24 : number) : number
	const sign = extract(b24,23,1)
	const exponent = extract(b24,f24_mant_bits,f24_exp_bits)
	const mantissa = extract(b24,0,f24_mant_bits)
	if(exponent == 0 and mantissa == 0) then return 0 end;
	local value = 0
	if(exponent == 0) then 
		value = mantissa * (2 ^ -33)
	else 
		value = (1 + mantissa / 262_144) * (2 ^ (exponent - 16))
	end
	return if(sign == 1) then -value else value;
end

@native function encodeF8(float : number) : number
	local sign = 0 
	if(float < 0) then
		sign = 1; float = -float;
		elseif(float == 0) then return 0;
		elseif(float ~= float or float == huge) then return bor(lshift(sign, 7),0x7F);
	end
	local exponent = floor(log(float) / log(2))
	local mantissa = floor((((float / (2 ^ exponent))) - 1) * 8 + 0.5)
	if(exponent < -7) then return lshift(sign, 7) end;
	if(mantissa >= 8) then
		mantissa = 0; exponent += 1;
	end
	exponent += 7
	if(exponent > 15) then
		exponent = 15;
		mantissa = 7;
	end
	return bor(lshift(sign,7),lshift(exponent,3),mantissa)
end

@native function decodeF8(b8 : number) : number
	const sign = rshift(b8,7)
	const exponent = band(rshift(b8,3),f15bit)
	const mantissa = band(b8,0x7)
	if(exponent == 0 and mantissa == 0) then return 0 end;
	const value = (1 + mantissa / 8) * (2 ^ (exponent - 7))
	return if(sign == 1) then -value else value;
end

return table.freeze({
	floatToBits = floatToBits,
	bitsToFloat = bitsToFloat,
	axisAngleToQuaterion = axisAngleToQuaterion,
	quaternionToCFrame = quaternionToCFrame,
	toFloat16 = toFloat16,
	decodeF16 = decodeF16,
	searchEnumTypeIdentifer = searchEnumTypeIdentifier,
	bitstreamTypesToLiteralTypes = bitstreamTypesToLiteralTypes,
	encodeF24 = encodeF24,
	decodeF24 = decodeF24,
	encodeF8 = encodeF8,
	decodeF8 = decodeF8
})