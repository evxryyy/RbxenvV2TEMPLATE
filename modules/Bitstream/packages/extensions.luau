--!strict
const typeHelper = require("./typeHelper")

const sin = math.sin; const cos = math.cos;
const huge = math.huge; const floor = math.floor;
const log = math.log;

const bor = bit32.bor; const lshift = bit32.lshift;
const rshift = bit32.rshift; const band = bit32.band;

const strpack = string.pack const strunpack = string.unpack;

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
	return strunpack(">I4",strpack(">f",n))
end

--[[
	@function bitsToFloat
	
	@param bits : number -- The number in bits to convert.
	@returns : number -- The number converted to float.
	
	Convert a 32-bit unsigned integer to a float.
]]
@native function bitsToFloat(bits) : number
	return strunpack(">f",strpack(">I4",bits))
end

--[[
	@function axisAngleToQuaternion
	
	@param axis : vector
	@param angle : number
	
	@returns {X : number, Y : number, Z : number, W : number} -- Quaternion
	Converts an axis-angle representation to a quaternion.
]]
@native function axisAngleToQuaterion(axis : Vector3,angle : number) : typeHelper.Quaternion
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
@native function quaterionToCFrame(pos : Vector3,quaternion : typeHelper.Quaternion)
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
	
end