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

--[[
    Type-level function that verifies whether a target literal string type exists within a given string union.

    @example
    type Valid = ValidateUnion<"I8", BitstreamTypeNames>   -- Resolves to: true
    type Invalid = ValidateUnion<"I4", BitstreamTypeNames> -- Resolves to: false ("I4" is not a member of BitstreamTypeNames)
]]
export type function ValidateUnion(target : string,validsTargets : type) : boolean
	if(not (typeof(target) == "string")) then return false end;
	if(not validsTargets:is("union")) then return false end;
	for _,v in validsTargets:components() :: {type} do
		if(type(v:value()) == "string" and v:value() == target) then
			return true
		end	
	end
	return false
end

--[[
    Type-level function that validates the array count modifier syntax (e.g., ":16" in "Int:16").
    Returns `true` if no modifier is present (empty string) or if it resolves to a valid count (N > 1, no leading zeros).
]]
export type function ValidateCount(count : string) : boolean
	if(count == "") then return true end
	local digits = string.match(count, "^:(%d+)$")
	if digits == nil then return false end
	const n = tonumber(digits)
	if n == nil or n <= 1 or string.sub(digits, 1, 1) == "0" then return false end
	return true
end

--[[
    Type-level function used to construct dynamic numeric type literal strings (e.g., `Int8`, `Uint16:4`, `Float32`).
    
    Powers dynamic numeric types such as `Int<T>`, `Uint<T>`, and `Float<T>`.
    It parses and validates the bit-width and optional array count modifier (`:N`), returning a validated string singleton type.
    
    @example
    -- Constructs dynamic type union under prefix "X" allowing bit-widths "10" or "11"
    type XUnion<T> = IntegerUnion<T, "X", "10" | "11">

    const x: XUnion<"10"> = "X10"     -- Valid (with autocomplete)
    const y: XUnion<"10:2"> = "X10:2" -- Valid array format (10-bit value, array length 2)
]]
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
	if(not ValidateUnion(bitsStr :: string,validBits)) then return types.never end;
	return types.singleton(`{prefixStr}{specStr}`)
end

--[[
    Type-level function equivalent to `IntegerUnion`, designed for Roblox primitive and complex types.
    
    Validates a type specification string against registered type names (`validNames`) and supports optional array count modifiers (`TypeName:N`).

    @example
    -- Helper type alias for registered Bitstream Roblox types
    export type RbxDesc<S> = RbxType<S, BitstreamTypeNames>

    const enumValue: RbxDesc<"Enum"> = "Enum"     -- Valid
    const badValue: RbxDesc<"Random"> = "Random"  -- Error: "Random" is not a member of BitstreamTypeNames
    const enumArray: RbxDesc<"Enum:2"> = "Enum:2" -- Valid array format
]]
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
	if(not ValidateUnion(nameStr, validNames)) then
		error(`Unknown type name "{nameStr}" in "{specStr}"`)
	end
	if(not ValidateCount(countStr)) then
		error(`Invalid count in "{specStr}" (expected "Name:N" with N > 1, no leading zero)`)
	end
	return types.singleton(`{specStr}`)
end

--[[
    Type-level function that appends an array count modifier to base type strings.
    
    Primarily used for complex or dictionary-backed types (e.g., `String`, `RotationCurveKey`).
    Unlike `RbxType`, it bypasses union validation and strictly enforces the array count pattern (`:N`).
]]
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

-- Array Descriptor --
export type ArrayDescriptor = {
	Type: "Array",
	Types: { string | ArrayDescriptor },
}

-- Struct Descriptor --
export type StructDescriptor = {
	Type: "Struct",
	Fields : { [string] : string | ArrayDescriptor }
}

return nil