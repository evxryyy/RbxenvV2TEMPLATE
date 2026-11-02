import * as Types from "./typeHelper"
import { Enumeration,BitstreamTypesName } from "./enumeration"

// math lib
const huge = math.huge; const floor = math.floor
const log = math.log; const sin = math.sin; 
const cos = math.cos; const pow = math.pow

// string lib
const sub = string.sub;
const strpack = string.pack; 
const strunpack = string.unpack;

// buffer lib
const readu16 = buffer.readu16; 

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
* @Class: Extensions
*
* A lightweight utility class that provides extension methods for encoding, decoding, conversions, 
* and other helper functions used by the main component.
*/
export abstract class Extensions {

    /*
    * Convert the floating-point number to its unsigned 32-bit representation.
    *
    * @Returns : number
    */
    public static floatToBits(n : number) : number {
        return strunpack(">I4",strpack(">f",n))[0] as number
    }

    /* 
    * Convert the unsigned 32-bit number into a floating-point number.
    *
    * @Returns : number
    */
    public static bitsToFloat(bits : number) : number {
        return strunpack(">f",strpack(">I4",bits))[0] as number
    }

    /*
    * Convert the axis (Vector3) and its angle into a Quaternion.
    *
    * @Returns : Types.Quaternion (e.g. {x,y,z,w})
    */
    public static axisAngleToQuaternion(axis : Vector3,angle : number) : Types.Quaternion {
        let halfAngle = angle / 2
        let [s,c] = [sin(halfAngle),cos(halfAngle)]
        return {
            x: axis.X * s,
            y: axis.Y * s,
            z: axis.Z * s,
            w : c
        }
    }

    /*
    * Convert a Quaternion to a CFrame using the given position.
    *
    * @Returns : CFrame
    */
    public static quaternionToCFrame(pos : Vector3,quaternion : Types.Quaternion) : CFrame {
        const [xx,yy,zz] = [
            quaternion.x*quaternion.x,
            quaternion.y*quaternion.y,
            quaternion.z*quaternion.z
        ]
        const [xy,xz,yz] = [
            quaternion.x*quaternion.y,
            quaternion.x*quaternion.z,
            quaternion.y*quaternion.z
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
    * Return the IEEE 754 half-precision (16-bit) representation of the floating-point number.
    *
    * @Returns : LuaTuple<[number,number,number,number]>
    * Return the unsigned 16-bit value, the sign, mantissa, and exponent.
    */
    public static toFloat16(value : number) : LuaTuple<[number,number,number,number]> {
        let sign = 0
        let mantissa = 0
        let exponent = 0
        if(value < 0) { sign = 1; value = -value }
        else if(value !== value) { exponent = 31; mantissa = 512 }
        else if(value === huge) { exponent = 31 }
        else if(value === 0) { return $tuple(0,sign,0,0) }
        else if(value < pow(2,-14)) {
            mantissa = floor(value * pow(2,24) + 0.5);
            if(exponent >= 1024) { exponent = 1; mantissa = 0 }
        }
        else {
            let e = floor(log(value) / log(2))
            mantissa = floor(((value / pow(2,e)) - 1) * 1024 + 0.5)
            exponent = e + 15
            if(mantissa >= 1024) { mantissa = 0; exponent++ }
            if(exponent >= 31) { exponent = 31; mantissa = 0 }
        }
        const uint16 = (sign << 15) | (exponent << 10) | mantissa
        return $tuple(uint16,sign,mantissa,exponent)
    }

    /* 
    * Decode a 16-bit IEEE 754 half-precision floating-point value into its corresponding floating-point number,
    * Using the buffer and the given offset.
    *
    * @Returns: number
    * The decoded IEEE 754 half-precision floating-point.
    */
    public static decodeF16(buf : buffer,offset : number) : number {
        let uint16 = readu16(buf,offset)
        let sign = (uint16 >>> f15bit)
        let exponent = (uint16 >>> f10bit) & f31bit
        let mantissa = (uint16 & fSubNormal)
        if(exponent === 0) {
            if(mantissa === 0) return (sign === 0) ? 0 : -0
            else {
                const value = mantissa * pow(2,24)
                return (sign === 0) ? value : -value
            }
        }
        else if(exponent === 31) {
            if(mantissa === 0) return (sign === 0) ? huge : -huge
            else return fNAN
        }
        const value = (1 + mantissa / 1024) * (pow(2,exponent - f15bit))
        return (sign === 0) ? value : -value
    }

    /*
    * Find the corresponding enum value using the given ID. If no matching value is found, an error is thrown.
    *
    * @Returns : Enumeration.BitstreamTypesName
    */
    public static searchEnumTypeIdentifier(typeIdentifier : number) : BitstreamTypesName {
        for(const [name,value] of pairs(Enumeration.BitstreamEnumeration)) {
            if(value === typeIdentifier) {
                return name as BitstreamTypesName
            }
        }
        error("Type-identifier is not recognizable.")        
    }

    /*
    * Simply convert the Bitstream type to its corresponding Roblox type (e.g., I8 → number).
    *
    * @Returns : string
    */
    public static bitstreamTypesToLiteralTypes(typeName : BitstreamTypesName) : string {
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
    * Convert a standard floating-point number to a custom 24-bit format by extracting its IEEE 754 sign,
    * exponent, and mantissa, then compressing them into a 24-bit representation.
    * 
    * @Returns : number
    * The encoded 24-bit float number
    */
    public static encodeF24(float : number) : number {
        let sign = 0
        if(float < 0) { sign = 1; float = -float }
        else if(float === 0) return 0;
        const bits = this.floatToBits(float)
        const exponent32 = bit32.extract(bits,23,8)
        const mantissa32 = bit32.extract(bits,0,23)
        let exponent = exponent32 - 127 + 16
        let mantissa = 0
        if(exponent32 === 255) return (sign << 23) | 0x7FFFFF;
        if(exponent <= 0) {
            mantissa = floor(float * pow(2,33) + 0.5)
            if(mantissa >= 262_144) {
                return (sign << 23) | (1 << 18)
            }
            return (sign << 23) | mantissa
        }
        mantissa = floor(mantissa32 / 32 + 0.5)
        if(mantissa >= 262_144) {
            mantissa = 0;
            exponent++;
        }
        if(exponent > 31) return (sign << 23) | 0x7FFFFF
        return (sign << 23) | (exponent << 18) | mantissa
    }

    /*
    * Convert the value stored in the 24-bit floating-point format and decode it into a standard-
    * floating-point number by reconstructing its IEEE 754 representation from its sign, exponent, and mantissa.
    *
    * @Returns : number
    * The decoded floating-point number
    */
    public static decodeF24(b24 : number) : number {
        let sign = bit32.extract(b24,23,1)
        let exponent = bit32.extract(b24,f24_mant_bits,f24_exp_bits)
        let mantissa = bit32.extract(b24,0,f24_mant_bits)
        if(exponent === 0 && mantissa === 0) return 0;
        let value = 0
        if(exponent === 0) value = mantissa * pow(2,-33)
        else {
            value = (1 + mantissa / 262_144) * pow(2,exponent - 16)
        }
        return (sign === 1) ? -value : value
    }

    /*
    * Convert the standard floating-point number into an E4M3 representation, 
    * i.e. an 8-bit floating-point number, by encoding its sign, exponent, and mantissa.
    *
    * @Returns : number
    */
    public static encodeF8(float : number) : number {
        let sign = 0
        if(float < 0) {sign = 1; float = -float }
        else if(float === 0) return 0;
        else if(float !== float || float === huge) return (sign << 7) | 0x7F;
        let exponent = floor(log(float) / log(2))
        let mantissa = floor(((float / (pow(2,exponent))) - 1) * 8 + 0.5)
        if(exponent < -7) return sign << 7;
        if(mantissa >= 8) {
            mantissa = 0;
            exponent++;
        }
        exponent += 7
        if(exponent > 15) {
            exponent = 15
            mantissa = 7
        }
        return ((sign << 7) | (exponent << 3) | mantissa)
    }

    /*
    * Convert an E4M3 representation (8-bit floating-point format) to a standard floating-point-
    * number by reconstructing its sign, exponent, and mantissa.
    *
    * @Returns : number
    * The decoded 8-bit float number.
    */
    public static decodeF8(b8 : number) : number {
        let sign = (b8 >>> 7)
        let exponent = ((b8 >>> 3) & f15bit)
        let mantissa = (b8 & 0x7)
        if(exponent === 0 && mantissa === 0) { return 0 }
        let value = (1 + mantissa / 8) * pow(2,exponent - 7)
        return (sign === 1) ? -value : value
    }

}