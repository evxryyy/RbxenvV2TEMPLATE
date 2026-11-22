--!strict

--[[
	Author : evxry_ll
	
	@Name: Types
	
	@Description:
	This module is part of `Bitstream` module. It contains some types used internally.
]]

--[[
	`ConstructorConfiguration` is used to configure the constructor of `Bitstream` module.
	You can use it to set the initial size of the buffer, the maximum allowed size and if you want to use auto allocation.
	Auto allocation is a feature that automatically allocates more memory when the current buffer is full.
	
	@Properties:
		- UseAutoAllocation : boolean
		- Size : number? (in bytes) @optional
		- MaximumAllowedSize : number? -- (in bytes) @optional
		- SourceBuffer : buffer? not optional you use `.fromBuffer`
]]
export type ConstructorConfiguration = {
	UseAutoAllocation : boolean,
	Size : number?,
	MaximumAllowedSize : number?,
	SourceBuffer : buffer?
}

--[[
	`BytesData` is returned by `Utitilies.GetEquivalentBytesInfoFromNumber` function.
	You can use it to get the number of bytes and bits required to represent `n`.
	
	@Properties:
	- bits : number
	- bytes : number
	- isUnsigned : boolean
]]
export type BytesData = {
	bits : number,
	bytes : number,
	isUnsigned : boolean,
}

--[[
	`Quaternion` is a 4D numbers that represent a quaternion, 
	Used in `Extensions.quaternionToCFrame` and `Extensions.axisAngleToQuaternion`.
	
	@Properties:
	- x : number
	- y : number
	- z : number
	- w : number
]]
export type Quaternion = {
	x : number,
	y : number,
	z : number,
	w : number,
}

--[[
	`RotationCurveKeyOption` is used in `Constants.RotationCurveKey`
	Since multiples CFrame types exist, this option is here to choose which one you want.
	
	@union
]]
export type RotationCurveKeyOption = "Quaternion" | "Normal" | "Quantized" | "CFrameF32" | "CFrameF24"

--[[
	`FloatCurveKeyOption` is used in `Constants.FloatCurveKey`
	Multiples float types exist, this option is here to choose which one you want to use.
	
	@union
]]
export type FloatCurveKeyOption = "Normal" | "F32" | "F16" | "F24"

--[[
	`ColorSequenceOption` is used in `Constants.ColorSequence`
	Determine the way to write the [R,G,B] of the color inside the keypoint
	
	@union
]]
export type ColorSequenceOption = "Normal" | "F32" | "F64" | "F24"

--[[
	`NumberSequenceOption` is used in `Constants.NumberSequence`
	Determine the way to write the number inside the keypoint
	
	@union
]]
export type NumberSequenceOption = "Normal" | "F16" | "F64" | "F24"

export type function ValidateBits(bits : string,validBits : type) : boolean
	if(not (typeof(bits) == "string")) then return false end;
	if(not validBits:is("union")) then return false end;
	for _,v in validBits:components() :: {type} do
		if(type(v:value()) == "string" and v:value() == bits) then
			return true
		end
	end
	return false
end

export type function ValidateRbxType(rbxType : string,validRbxTypes : type) : boolean
	if(not (typeof(rbxType) == "string")) then return false end;
	if(not validRbxTypes:is("union")) then return false end;
	for _,v in validRbxTypes:components() :: {type} do
		if(type(v:value()) == "string" and v:value() == rbxType) then
			return true
		end
	end
	return false
end

export type function ValidateCount(count : string) : boolean
	if(count == "") then return true end
	local digits = string.match(count, "^:(%d+)$")
	if digits == nil then return false end
	const n = tonumber(digits)
	if n == nil or n <= 1 or string.sub(digits, 1, 1) == "0" then return false end
	return true
end

export type function IntegerUnion(spec: type,prefix: type,validBits: type) : type
	if(not spec:is("singleton") or type(spec:value()) ~= "string") then return types.never end
	if(not prefix:is("singleton") or type(prefix:value()) ~= "string") then return types.never end
	const specStr = spec:value() :: string
	const prefixStr = prefix:value() :: string
	if(specStr == "") then error(`Expect specStr to be : {unpack(validBits:components() :: {type})} but got : <empty>`) end
	local bitsStr,countStr = string.match(specStr,"^(%d+):(%d+)$")
	if(bitsStr == nil) then bitsStr = string.match(specStr,"^(%d+)$") end
	if(countStr ~= nil) then
		const count = tonumber(countStr)
		if count == nil or count <= 1 or string.sub(countStr, 1, 1) == "0" then
			error(`Invalid count in "{specStr}" (must be > 1, no leading zero)`)
		end
	end
	if(not ValidateBits(bitsStr :: string,validBits)) then return types.never end;
	return types.singleton(`{prefixStr}{specStr}`)
end

export type function RbxType(spec: type,validNames: type) : type
	if(not spec:is("singleton") or type(spec:value()) ~= "string") then return types.never end
	const specStr = spec:value() :: string
	local nameStr = specStr
	local countStr = ""
	local colon = string.find(specStr, ":", 1, true)
	if colon ~= nil then
		nameStr = string.sub(specStr, 1, colon - 1)
		countStr = string.sub(specStr, colon)
	end
	if(not ValidateBits(nameStr, validNames)) then
		error(`Unknown type name "{nameStr}" in "{specStr}"`)
	end
	if(not ValidateCount(countStr)) then
		error(`Invalid count in "{specStr}" (expected "Name:N" with N > 1, no leading zero)`)
	end
	return types.singleton(`{specStr}`)
end

export type function WithCount(name : type, count : type) : type
	if(not name:is("singleton") or type(name:value()) ~= "string") then return types.never end
	if(not count:is("singleton") or type(count:value()) ~= "string") then return types.string end
	const nameStr = name:value() :: string
	const countStr = count:value() :: string
	if(not ValidateCount(countStr)) then
		error(`Invalid count "{countStr}" (expected ":N" with N > 1, no leading zero)`)
	end
	return types.singleton(`{nameStr}{countStr}`)
end

export type ValidSignedIntegerBits = '8' | '16' | '24' | '32' | '40' | '48' | '54'
export type ValidUnsignedIntegerBits = '1' | '8' | '16' | '24' | '32' | '40' | '48' | '54'
export type ValidFloatBits = '8' | '16' | '24' | '32' | '64'

-- Integer --
export type Int<T> = IntegerUnion<T,'I',ValidSignedIntegerBits>
export type Uint<T> = IntegerUnion<T,'U',ValidUnsignedIntegerBits>
export type Float<T> = IntegerUnion<T,'F',ValidFloatBits>

-- Roblox Types --

-- Simples types
export type RbxDesc<S> = RbxType<S, BitstreamTypeNames>

-- Types Descriptors --
export type String<T = ""> = {
	Type : WithCount<"String", T>,
	Length : number,
}

export type RotationCurveKey<T = ""> = {
	Type : WithCount<"RotationCurveKey", T>,
	Option : RotationCurveKeyOption
}

export type FloatCurveKey<T = ""> = {
	Type : WithCount<"FloatCurveKey", T>,
	Option : FloatCurveKeyOption
}

export type ColorSequence<T = ""> = {
	Type : WithCount<"ColorSequence", T>,
	Option : ColorSequenceOption,
}

export type NumberSequence<T = ""> = {
	Type : WithCount<"NumberSequence", T>,
	Option : NumberSequenceOption,
}

-- Availables types --
export type BitstreamTypeNames =
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


export type ArrayDescriptor = {
	Type: "Array",
	Types: { string | ArrayDescriptor },
}

export type StructDescriptor = {
	Type: "Struct",
	Fields : { [string] : string | ArrayDescriptor }
}

return nil