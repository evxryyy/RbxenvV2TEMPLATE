import { Utilities } from "./utilities";
import * as Types from "./typeHelper"

const mutableEnumItemList : EnumItem[] = [];
const mutableEnumItemIndex = new Map<EnumItem, number>();

for (const enumType of Enum.GetEnums()) {
	for (const enumItem of enumType.GetEnumItems()) {
		mutableEnumItemList.push(enumItem);
		mutableEnumItemIndex.set(enumItem, mutableEnumItemList.size());
	}
}

const EnumItemList: readonly EnumItem[] = mutableEnumItemList;
const EnumItemIndex: ReadonlyMap<EnumItem, number> = mutableEnumItemIndex;

export const Constants = table.freeze({

    // INTEGER TYPES //

    // Signed integers //
    MIN_INT8 : -128, MAX_INT8 : 127, // [min = -2^7, max = 2^7 - 1]
    MIN_INT16 : -32_768, MAX_INT16 : 32_767, // [min = -2^15, max = 2^15 - 1]
    MIN_INT24 : -8_388_608, MAX_INT24 : 8_388_607, // [min = -2^23, max = 2^23 - 1]
    MIN_INT32 : -2_147_483_648, MAX_INT32 : 2_147_483_647, // [min = -2^31, max = 2^31 - 1]
    MIN_INT40 : -549_755_813_887, MAX_INT40 : 549_755_813_887, // [min = -2^39, max = 2^39 - 1]
    MIN_INT48 : -140_737_488_355_328, MAX_INT48 : 140_737_488_355_327, // [min = -2^47, max = 2^47 - 1]
    MIN_INT54 : -9_007_199_254_740_992, MAX_INT54 : 9_007_199_254_740_991, // [min = -2^53, max = 2^53 - 1]

    // Unsigned integers //
    MIN_UINT : 0,
    MAX_UINT8 : 255, // [max = 2^8 - 1]
    MAX_UINT16 : 65_535, // [max = 2^16 - 1]
    MAX_UINT24 : 16_777_215, // [max = 2^24 - 1]
    MAX_UINT32 : 4_294_967_295, // [max = 2^32 - 1]
    MAX_UINT40 : 1_099_511_627_775, // [max = 2^40 - 1]
    MAX_UINT48 : 281_474_976_710_655, // [max = 2^48 - 1]
    MAX_UINT54 : 18_014_398_509_481_980, // [max = 2^54 - 1], max is reduced by 3 due to `IEEE754` range
	
    REQUIRED_BYTES : {
        // Signed Integers
        I1 : 1,
        I8 : 1,
        I16 : 2,
        I24 : 3,
        I32 : 4,
        I40 : 5,
        I48 : 6,
        I54 : 7,
        // Unsigned Integers
        U1 : 1,
        U8 : 1,
        U16 : 2,
        U24 : 3,
        U32 : 4,
        U40 : 5,
        U48 : 6,
        U54 : 7,
        // Floats,
        F8 : 1,
        F16 : 2,
        F24 : 3,
        F32 : 4,
        F64 : 8,
        // Strings,
        String(str : string) : number {
            return str.size()
        },
        PrefixedString(str : string) : number {
            const len = str.size();
            const bytesData = Utilities.getEquivalentBytesInfoFromNumber(len)
            /*
		        calculation:
					1 byte for the type identifier
					n bytes for the string length (U8, U16, U24, ..., U48)
					len bytes for the string data

				schema:
					(1 + n + len)
            */
            return 1 + bytesData.bytes + len
        },
        // Bools
        Bool1 : 1,
        Bool8 : 1,
        // Others
        Vector2float24 : 6, // (x.y float24 each)
        Vector2float32 : 8, // (half-precision vector2)
        Vector2int16 : 4, // (Vector2int16 by default)
        Vector2uint16 : 4, // (Same as Vector2int16 but use unsigned integer)
        Vector2 : 16, // (full precision Vector2)
        Vector3float24 : 9, // (x,y,z float24 each)
        Vector3float32 : 12, // (half-precision vector3)
        Vector3int16 : 6, // (Vector3int16 by default)
        Vector3uint16 : 6, // (Same as Vector3int16 but use unsigned integer)
        Vector3 : 24, // (full precision Vector3)
        CFrameQuaternion : 28, // (CFrame converted into a quaternion (x,y,z,w))
        CFrameF24 : 18, // (convert to euler angles and write (pos + rx,ry,rz) as f24)
        CFrameF32 : 24, // (convert to euler angles and write (pos + rx,ry,rz) as f32
        CFrameF64 : 48, // (convert to euler angles and write (pos + rx,ry,rz) as f64)
        CFrameQuantized : 12, // (quantized CFrame, 12 bytes using i16)
        Color3 : 3, // (1 byte each for R,G,B)
        Color3F24 : 9, // (3 bytes each for R,G,B)
        Color3F32 : 12, // (4 bytes each for R,G,B)
        Color3F64 : 24, // (8 bytes each for R,G,B)
        UDim : 8, // (Offset as i32, Scale as f32)
        UDim2 : 16, // (Offset.X&Y as i32, Scale.X%Y as f32)
        RectFloat24 : 12, // (Store min and max vector as f24)
        RectFloat32 : 16, // (Store min and max vector as f32)
        Rect : 32, // (Store min and max vector as f64)
        Enum : 2, // (u16 for enum identifier)
        Region3 : 72, // (Vec3, CFrameF64)
        Region3Quaternion : 52, // (Vec3, CFrameQuaternion)
        Region3CFrameF24 : 42, // (Vec3, CFrameF24)
        Region3CFrameF32 : 48, // (Vec3, CFrameF32)
        Region3Quantized : 36, // (Vec3, CFrameQuantized)
        Region3int16 : 12, // (Vec3int16, Vec3int16)
        RotationCurveKey(rot : RotationCurveKey,option : Types.RotationCurveKeyOption) {
            if(option === "Normal"){
                return (rot.Interpolation === Enum.KeyInterpolationMode.Cubic) ? 62 : 54
            }
            else if(option === "Quaternion") {
                return (rot.Interpolation === Enum.KeyInterpolationMode.Cubic) ? 42 : 34
            }
            else if(option === "CFrameF32") {
                return (rot.Interpolation === Enum.KeyInterpolationMode.Cubic) ? 38 : 30
            }
            else if(option === "CFrameF24") {
                return (rot.Interpolation === Enum.KeyInterpolationMode.Cubic) ? 32 : 24
            }
            else if(option === "Quantized") {
                return (rot.Interpolation === Enum.KeyInterpolationMode.Cubic) ? 26 : 18
            }
            error("Current option is invalid. Please see ./typeHelper")
        },
        FloatCurveKey(key : FloatCurveKey,option : Types.FloatCurveKeyOption) {
            if(option === "Normal") {
                return (key.Interpolation === Enum.KeyInterpolationMode.Cubic) ? 22 : 14
            }
            else if(option === "F32") {
                return (key.Interpolation === Enum.KeyInterpolationMode.Cubic) ? 18 : 10
            }
            else if(option === "F24") {
                return (key.Interpolation === Enum.KeyInterpolationMode.Cubic) ? 17 : 9
            }
            else if(option === "F16") {
                return (key.Interpolation === Enum.KeyInterpolationMode.Cubic) ? 16 : 8
            }
            error("Current option is invalid. Please see ./typeHelper")
        },
        ColorSequence(key : ColorSequence,option : Types.ColorSequenceOption) {
            if(option === "Normal") {
                return 1 + (7 * key.Keypoints.size())
            }
            else if(option === "F24") {
                return 1 + (13 * key.Keypoints.size())               
            }
            else if(option === "F32") {
                return 1 + (16 * key.Keypoints.size())               
            }
            else if(option === "F64") {
                return 1 + (28 * key.Keypoints.size())               
            }
            error("Current option is invalid. Please see ./typeHelper")
        },
        NumberRange : 8,
        NumberRangeF16 : 4,
        NumberRangeF24 : 6,
        NumberRangeF64 : 16,
        NumberSequence(key : NumberSequence,option : Types.NumberSequenceOption) {
            if(option === "Normal") {
                return 1 + (12 * key.Keypoints.size())
            }
            else if(option === "F16") {
                return 1 + (10 * key.Keypoints.size())
            }
            else if(option === "F24") {
                return 1 + (11 * key.Keypoints.size())
            }
            else if(option === "F64") {
                return 1 + (16 * key.Keypoints.size())
            }
            error("Current option is invalid. Please see ./typeHelper")
        },
    },

    // [number] = EnumItem, table identifiers to avoid 2 extra bytes while writing Enums
	EnumItemList : EnumItemList,
	// [EnumItem] = number, O(1) research when writing
	EnumItemIndex : EnumItemIndex

})