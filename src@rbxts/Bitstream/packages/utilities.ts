/*
	Author : evxry_ll
	
	@Name: Utilities
	
	@Description:
	This module is part of `Bitstream` module. It contains some utility functions used internally.
*/

import * as Types from "./typeHelper"

const abs = math.abs; const floor = math.floor; const log = math.log;
const ceil = math.ceil; const modf = math.modf; const clamp = math.clamp;

export abstract class Utilities {

    /*
	Return `table(bits,bytes,isUnsigned)` required depending on the number.
	
	@example :
	```luau
	let bytesData = Utilities.getEquivalentBytesInfoFromNumber(65_535) -- this will return 2 cause it will required 2 bytes to write 65_535
	```
	
	@return : {bits : number, bytes : number, isUnsigned : boolean }
    */
    static getEquivalentBytesInfoFromNumber(n : number) : Types.BytesData {
        if(n < 0) {
            // signed
            let bits = 1
            let value = abs(n)
            while(value > 0) {
                value = floor(value / 2)
                bits = bits + 1
            };
            return { bits : bits, bytes : ceil(bits / 8), isUnsigned : false}
        }
        else {
            // unsigned
            if (n === 0) {
                return { bits : 1, bytes : 1, isUnsigned : true}
            }
            let bits = ceil(log(n + 1,2))
            return { bits : bits, bytes : ceil(bits / 8), isUnsigned : true}
        }
    };

    /*
        Return a `boolean` to check if the value is a valid bool8 (i.e. 8 packed booleans).
	
        @example :
        ```luau
        let result = Utilities.isBool8([true, false, true, false, true, false, true, false]) -- this will return true
        
        let result2 = Utilities.isBool8([true, false, true, false, true, false, true]) -- 
                -- this will return false because the table doesn't have 8 elements
        ```
        
        @return : boolean
    */
    static isBool8(values : [boolean]) : boolean {
        return values.every(value => typeOf(value) === "boolean") && values.size() === 8
    }

    /*
        Return a `boolean` to check if the value is a valid array (i.e. array with no nil values).
        
        @example :
        ```luau
        let A = Utilities.isArray([10, 20, 30, 40, 50]) -- this will return true
        let B = Utilities.isArray({10, 20, 30, 40, key = 50}) -- this will return false
        ```
        
        @return : boolean
    */
    static isArray(values : object) {
        assert(typeOf(values) === "table", "value must be a table");
        let count = 0;
        for(const [i] of pairs(values)) {
            if(typeOf(i) !== "number") continue;
            count += 1;
        }
        return count >= (values as unknown[]).size()
    }

}