declare global {

    /// Added Mutable type
    type Mutable<T, K extends keyof T> =
    	// Take all properties from T EXCEPT the ones in K
        Omit<T, K> & {
            // Re-create the properties in K
		    // but remove the readonly modifier using -readonly
            -readonly [P in K]: T[P];
        };

    // Added .Interpolation for FloatCurveKey
    interface FloatCurveKey {
        Interpolation : Enum.KeyInterpolationMode,   
    }

    type EditableFloatCurveKey = Mutable<FloatCurveKey, "RightTangent" | "LeftTangent">;

    // Added .Interpolation for RotationCurveKey
    interface RotationCurveKey {
        Interpolation : Enum.KeyInterpolationMode,
        LeftTangent : number,
        RightTangent : number,
    }

    // Added the following types :
    /**
     * RotationCurveKey
     * FloatCurveKey
     */
    interface CheckableTypes {
        RotationCurveKey : RotationCurveKey,
        FloatCurveKey : FloatCurveKey,
    }
 
    namespace table {
        export function pack(...values : defined[]) : defined[] & { n : number }
        export function unpack<T>(list : readonly T[],i? : number,j? : number) : LuaTuple<[T]>
        export function insert<T,A>(list : T[] | Record<string | number,T>,value : A) : void

        // Two different variants for table.move
        export function move<T>(
            src: T[] | Record<string | number, T>,
            a: number,
            b: number,
            t: number,
        ): T[] | Record<string | number, T>;

        export function move<T0, T1>(
            src: T0[] | Record<string | number, T0>,
            a: number,
            b: number,
            t: number,
            dst: T1[] | Record<string | number, T1>,
        ): T1[] | Record<string | number, T1>;
        // 

    } 

    namespace debug {
        export function info(level : number,options : string) : LuaTuple<[unknown]>
    }
}

// Add missing services.
declare module "@rbxts/services" {
    export const EncodingService: EncodingService;
}

export {}