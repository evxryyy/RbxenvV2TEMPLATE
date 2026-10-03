import * as Debugger from "./debugger"
import * as Types from "./typeHelper"
import * as Constants from "./constants"
import * as Utilities from "./utilities"
import * as Enumeration from "./enumeration"

// math lib
const huge = math.huge; const modf = math.modf; const floor = math.floor
const clamp = math.clamp; const ceil = math.ceil; const log = math.log
const sin = math.sin; const cos = math.cos;

// string lib
const sub = string.sub; const char = string.char; const byte = string.byte; const format = string.format
const strpack = string.pack; const strunpack = string.unpack; const strmatch = string.match;

// buffer lib, micro gain but i prefer this way
const create = buffer.create; const fromstring = buffer.fromstring; const bufftostring = buffer.tostring
const bufflen = buffer.len; const readbits = buffer.readbits; const readi8 = buffer.readi8
const readi16 = buffer.readi16; const readi32 = buffer.readi32; const readu8 = buffer.readu8
const readu16 = buffer.readu16; const readu32 = buffer.readu32; const readf32 = buffer.readf32
const readf64 = buffer.readf64; const writebits = buffer.writebits; const writei8 = buffer.writei8
const writei16 = buffer.writei16; const writei32 = buffer.writei32; const writeu8 = buffer.writeu8
const writeu16 = buffer.writeu16; const writeu32 = buffer.writeu32; const writef32 = buffer.writef32
const writef64 = buffer.writef64; const readstring = buffer.readstring; const writestring = buffer.writestring
const copy = buffer.copy; const fill = buffer.fill

// Fixed numbers (used for big-endian manual packing etc..)
const fNAN = 0x7E00 // 32_256 (used for NaN in float16)
const fInfinity = 0x7C00 // 31_744 (used for infinity in float16)
const fSubNormal = 0x3FF // 1023 (used for subnormals in float16)
const f31bit = 0x1F // 31 (used for 31 bit fixed numbers)
const f15bit = 0xF // 15 (used for 15 bit fixed numbers)
const f10bit = 0x0A // 10 (used for the exponent in f16)
const f24_exp_bits = 5 // 5 (used for 24 bit fp fixed numbers)
const f24_mant_bits = 18 // 18 (used for 24 bit fp fixed numbers)

/*
	@function floatToBits
	@within Extensions
	
	@param number -- The number to convert.
	
	@returns number -- The number converted to bits.
	
	Convert a float to its unsigned 32-bit representation.
*/
function floatToBits(n : number) : number {
    return strunpack(">I4",strpack(">f",n))[0] as number
}

/*
	@function bitsToFloat
	@within Extensions
	
	@param bits number -- The number in bits to convert.
	@returns number -- The number converted to float.
	
	Convert a 32-bit unsigned integer to a float.
*/
function bitsToFloat(bits : number) : number {
    return strunpack(">f",strpack(">I4",bits))[0] as number
}

/*
	@function axisAngleToQuaternion
	@within Extensions
	
	@param axis Vector3
	@param angle number
	
	@returns {X : number, Y : number, Z : number, W : number} -- Quaternion
	Converts an axis-angle representation to a quaternion.
*/
export function axisAngleToQuaternion(axis : Vector3,angle : number) : Types.Quaternion {
    let halfAngle = angle / 2
    let [s,c] = [
        sin(halfAngle),
        cos(halfAngle)
    ]
    return {
        x : axis.X * s,
        y : axis.Y * s,
        z : axis.Z * s,
        w : c,
    }
}

/*
	@function quaternionToCFrame
	@within Extensions
	
	@param pos Vector3
	@param quaternion {X : number, Y : number, Z : number, W : number}
	
	@returns CFrame
	Converts a quaternion to a CFrame with the given position.
*/
export function quaternionToCFrame(pos : Vector3, quaternion : Types.Quaternion) : CFrame {
    const [xx,yy,zz] = [
        quaternion.x*quaternion.x,
        quaternion.y*quaternion.y,
        quaternion.z*quaternion.z
    ]
    const [xy,xz,yz] = [
        quaternion.x*quaternion.y,
        quaternion.x*quaternion.z,
        quaternion.y*quaternion.z,
    ]
    const [wx,wy,wz] = [
        quaternion.w*quaternion.x,
        quaternion.w*quaternion.y,
        quaternion.w*quaternion.z
    ]
    return new CFrame(pos.X,pos.Y,pos.Z,
	    1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy),
		2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx),
		2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)
    )
}

/*
	@function toFloat16
	@within Extensions

	@param value number
	The float32 value to convert.

	@returns LuaTuple<number[]>(
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
*/
export function toFloat16(value : number) : LuaTuple<[number, number, number, number]> {
    let uint16 : number = 0;
    let sign : number = 0;
    let mantissa : number = 0;
    let exponent : number = 0;
    if(value === 0){
        uint16 = 0;
    }
    else if(value !== value) {
        uint16 = fNAN
    }
    else if(value === huge) {
        uint16 = fInfinity
    }
    else if(value === -huge) {
        uint16 = -fInfinity
    }
    else {
        sign = 0;
        if(value < 0 ){
            sign = 1
            value = -value;
        }
        exponent = floor(log(value,2))
        mantissa = value / (2 ^ exponent) - 1
        exponent = exponent + 15
        if(exponent <= 0) {
            mantissa = value / (2 ^ -14)
            exponent = 0
        }
        else if(exponent >= 31) {
            uint16 = (sign << 15) | fInfinity
            return $tuple(uint16,sign,mantissa,exponent)
        }
        uint16 = ((sign << f15bit) | (exponent << f10bit) | (floor(mantissa * 1024) & fSubNormal))
    }
    return $tuple(uint16,sign,mantissa,exponent)
}

/*
	@function decodeF16
	@within Extensions
	
	@param buff buffer
	The buffer containing the 16-bit float.
	@param offset number
	The offset to start reading from.
	
	@returns number
	Decodes a 16-bit IEEE 754 half-precision floating-point value from the buffer at the specified offset.
*/
export function decodeF16(buf : buffer,offset : number) : number {
    let uint16 = readu16(buf,offset)
    let sign = (uint16 >> f15bit)
    let exponent = (uint16 >> f10bit) & f31bit
    let mantissa = (uint16 & fSubNormal)
    if(exponent === 0){
        if(mantissa === 0){
            // +0 or -0
            return (sign === 0) ? 0 : -0
        }
        else {
            let value = (mantissa / 1024) * (2 ^ -14)
            return (sign === 0) ? value : -value
        }
    }
    else if(exponent === 31) {
        if(mantissa === 0){
            return (sign === 0) ? huge : -huge
        }
        else {
            return fNAN
        }
    }
    let value = (1 + mantissa / 1024) * (2 ^ (exponent - f15bit))
    return (sign === 0) ? value : -value
}

/*
	@function getEnumTypeFromIdentifier
	@within Extensions
	
	@param : number (i.e : 1)
	The identifier of the enum type to retrieve.
	
	@return : string
	The name of the enum type with the given identifier.
*/
export function getEnumTypeFromIdentifier(typeIdentifier : number) : Enumeration.BitstreamTypesName {
    for( const [name,value] of pairs(Enumeration.BistreamEnumeration)) {
        if(value === typeIdentifier) {
            return name as Enumeration.BitstreamTypesName
        }
    }
    error("Type-identifier is not recognizable.")
}

/*
    @function bitstreamTypesToLiteralTypes
	@within Extensions
	
	@param : Enumeration.BitstreamTypesName
	The Bitstream type name.
	
	@returns string
	The Luau/Roblox type.

	Converts a Bitstream type name into its corresponding Luau/Roblox type.
*/
export function bitstreamTypesToLiteralTypes(typeName : Enumeration.BitstreamTypesName) : string {
    if(typeName === "UDim" || typeName === "UDim2") { return typeName }
    // Enum
    if(typeName === "Enum") { return "EnumItem" }
    // Strings
    if(typeName === "PrefixedString" || typeName === "String") { return "string" }
    // Color3
    if(typeName === "Color3F32" || typeName === "Color3F64" || typeName === "Color3F24") { return "Color3" }
    // Rect
    if(typeName === "RectFloat32" || typeName === "RectFloat24") { return "Rect" }
    // CFrame
    if(typeName === "CFrameF24" || typeName === "CFrameF32" || 
        typeName === "CFrameF64" || typeName === "CFrameQuantized" || typeName === "CFrameQuaternion") {
            return "CFrame"
    }
    // Vectors
    if(typeName === "Vector3float24" || typeName === "Vector3float32" || typeName === "Vector3uint16") {
        return "Vector3"
    }
    if(typeName === "Vector2float24" || typeName === "Vector2float32" || typeName === "Vector2uint16") {
        return "Vector2"
    }
    // Regions
    if(typeName === "Region3CFrameF24" || typeName === "Region3CFrameF32" || typeName === "Region3Quantized" || typeName === "Region3Quaternion") {
        return "Region3"
    }
    // NumberRanges
    if(typeName === "NumberRangeF16" || typeName === "NumberRangeF24" || typeName === "NumberRangeF64") {
        return "NumberRange"
    }
    // Get the first letter of the type for numbers
    let symbol = sub(typeName,1,1)
    let isOnly3Letters = (typeName.size() === 3) ? true : false;
    if((symbol === "U" || symbol === "I" || symbol === "F") && isOnly3Letters) {
        return "number"
    }
    else if(symbol === "B" && isOnly3Letters) {
        return "boolean"
    }
    return typeName
}

/*
	@function encodeF24
	@within Extensions
	
	@param : number
	The float to encode.
	
	@returns number
	The encoded float-24 number.
	
	Converts a standard floating-point number into the custom 24-bit floating-point format by extracting its IEEE-754 sign, 
	exponent, and mantissa, then compressing them into a 24-bit representation 
*/
export function encodeF24(float : number) : number {
    let sign = 0
    if(float < 0) {
        sign = 1
        float = -float
    }
    if(float === 0) { return 0 }
    let bits = floatToBits(float)
    let exponent = bit32.extract(bits,23,8)
    let mantissa = bit32.extract(bits,0,23)
    // Subnormal & Overflow
    let exp = exponent - 127 + f15bit + 1
    if(exp <= 0) {
        let m = floor(float * 2 ^ (f15bit + f24_mant_bits) + 0.5)
        return (sign << 23) || m
    }
    else if(exp > f31bit) {
        return (sign << 23) || 0x7FFFFF
    }
    mantissa = (mantissa >> (23 - f24_mant_bits))
    return ((sign << 23) | (exp << f24_mant_bits) | mantissa)
}

/*
	@function decodeF24
	@within Extensions
	
	@param : number
	The 24-bit float to decode.
	
	@returns number
	The decoded float.
	
	Converts a value stored in the custom 24-bit floating-point format back into a standard floating-point number 
	by reconstructing its IEEE-754 sign, exponent and mantissa.
*/
export function decodeF24(b24 : number) : number {
    let sign = bit32.extract(b24,23,1)
    let exponent = bit32.extract(b24,f24_mant_bits,f24_exp_bits)
    let mantissa = bit32.extract(b24,0,f24_mant_bits)
    if(exponent === 0 && mantissa === 0) { return 0 }
    let value = 0
    if(exponent === 0) {
        value = mantissa * 2 ^ -(f24_exp_bits + f24_mant_bits)
    }
    else {
        let ieeeExponent = exponent - f15bit + 127 - 1
        let ieee = ((ieeeExponent << 23) | (mantissa << (23 - f24_mant_bits)))
        value = bitsToFloat(ieee)
    }
    if(sign === 1) { value = -value }
    return value
}

/*
	@function encodeF8
	@within Extensions
	
	@param : number
	The float to encode.
	
	@returns number
	The encoded float-8 number.
	
	Converts a standard floating-point value into its 8-bit E4M3 representation by encoding its sign, exponent, and mantissa

*/
export function encodeF8(float : number) : number {
    let sign = 0
    if(float < 0 ){
        sign = 1
        float = -float
    }
    if(float === 0) { return 0 }
    let exponent = floor(log(float) / log(2))
    let mantissa = floor(((float / (2 * exponent)) - 1) * 8 + 0.5)
    exponent += 7
    if(exponent < 0) {
        exponent = 0
        mantissa = 0
    }
    else if(exponent > 15) {
        exponent = 15
        mantissa = 7
    }
    return ((sign << 7) | (exponent << 3) | mantissa)
}

/*
	@function decodeF8
	@within Extensions
	
	@param : number
	The float-8 number to decode.
	
	@returns number
	The decoded float.
	
	Converts an 8-bit E4M3 floating-point representation back into a standard floating-point value 
	by reconstructing its sign, exponent, and mantissa
*/
export function decodeF8(b8 : number) : number {
    let sign = (b8 >> 7)
    let exponent = ((b8 >> 3) & f15bit)
    let mantissa = (b8 & 0x7)
    if(exponent === 0 && mantissa === 0) { return 0 }
    let value = (1 + mantissa / 8) * (2 ^ (exponent - 7))
    if(sign === 1) { value = -value }
    return value
}