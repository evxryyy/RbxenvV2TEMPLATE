import * as Types from "./typeHelper"

const abs = math.abs; const floor = math.floor; const log = math.log;
const ceil = math.ceil;

/*
* TODO REWRITE DOC
*/
export abstract class Utilities {

    /*
    * TODO REWRITE DOC
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
    * TODO REWRITE DOC
    */
    public static isBool8(values : boolean[]) : boolean {
        return values.every(value => typeOf(value) === "boolean") && values.size() === 8
    }

    /*
    * TODO REWRITE DOC
    */
    public static isArray(values : unknown[]) {
        assert(typeOf(values) === "table", "value must be a table");
        return values.every((_,i) => typeOf(i) === "number")
    }

}