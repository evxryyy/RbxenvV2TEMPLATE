import * as Types from "./typeHelper"

const abs = math.abs; const floor = math.floor; const log = math.log;
const ceil = math.ceil;

/*
* @Class Utilities

* A small class containing numerous utility functions across different modules, extensions, the component, and the resolver
*/
export abstract class Utilities {

    /*
    * Based on the number n provided in the parameters, it returns the following data:
    * ```ts
    * {
        bits: number,
        bytes: number,
        isUnsigned: boolean
    * }
    * ``` 
    * There is an optional parameter called clampBits. 
    * It simply adjusts the bit count. For example, if you have 15 bits but want 16, bits will be set to 16 instead of 15. 
    * In other words, it takes the number of bytes and multiplies it by 8.
    */
    public static getEquivalentBytesInfoFromNumber(
        n : number,
        clampBits? : boolean
    ) : Types.BytesData {
        if(n < 0) {
            // signed
            let bits = 1
            let value = abs(n)
            while(value > 0) {
                value = floor(value / 2)
                bits = bits + 1
            };
            return { bits : (clampBits) ? ceil(bits / 8) * 8 : bits, bytes : ceil(bits / 8), isUnsigned : false}
        }
        else {
            // unsigned
            if (n === 0) {
                return { bits : 1, bytes : 1, isUnsigned : true}
            }
            let bits = ceil(log(n + 1,2))
            return { bits : (clampBits) ? ceil(bits / 8) * 8 : bits, bytes : ceil(bits / 8), isUnsigned : true}
        }
    };

    /*
    * Check whether all entries in the array are booleans and whether the size is exactly 8.
    */
    public static isBool8(values : boolean[]) : boolean {
        return values.every(value => typeOf(value) === "boolean") && values.size() === 8
    }

    /*
    * Check all entries and verify whether index i is a number rather than a key (this should normally always return true).
    */
    public static isArray(values : unknown[]) {
        assert(typeOf(values) === "table", "value must be a table");
        return values.every((_,i) => typeOf(i) === "number")
    }

    /*
    * Check whether the buffer has enough capacity to write this type. 
    * The function calculates the offset plus the type's payload size and, if the last argument is set to true, 
    * performs automatic allocation. If the last argument is undefined or false, an error will be thrown when the buffer runs out of space.
    */
    public static ensureCapacity(
        b : buffer,
        offset : number,
        payload : number,
        perfomAutoAllocation? : boolean
    ) : buffer {
        let bufferSize = buffer.len(b)
        offset = offset <= bufferSize ? offset : bufferSize
        let required = floor(offset) + payload
        if(bufferSize <= required && perfomAutoAllocation) {
            let newBuffer = buffer.create(required)
            buffer.copy(newBuffer,0,b,0,bufferSize)
            b = newBuffer
        }
        else if(buffer.len(b) <= required && !perfomAutoAllocation) {
            error("Out of bounds detected, auto allocation is disabled, the buffer is too small for writing or reading your targeted type.")
        }
        return b
    }
    
    /*
    * Check whether the buffer has enough space to read the payload required by the type. 
    * Calculate the offset plus the payload size to ensure that sufficient space is available.
    */
    public static ensureReadable(
        b : buffer,
        offset : number,
        payload : number,
    ) : boolean {
        let bufferSize = buffer.len(b)
        offset = offset <= bufferSize ? offset : bufferSize
        if(offset < 0 || offset + payload > bufferSize) return false;
        return true
    }

}