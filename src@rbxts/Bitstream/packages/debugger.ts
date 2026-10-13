import { HttpService } from "@rbxts/services"
import { version } from "./__version__"

type ErrorEnumeration = "Type-missmatch" | "Doesn't have enough space" | "Out of bounds"

interface IConfiguration { VerifyVersion : boolean }

/*
* @Class: Debugger
*
* A simple utility class for debugging read/write operations. 
* It can also be used to check the version of the Bitstream module.
*/
export abstract class Debugger {

    // raw link to public version of Bitstream (template link)
    private static readonly rawURL = "https://raw.githubusercontent.com/evxryyy/Rbxenv/refs/heads/main/Bitstream/VERSION.md"

    // Contains all common errrors
    public static readonly ErrorMessages : Record<ErrorEnumeration,string> = {
        ["Type-missmatch"] : "Bitstream.%s: Type missmatch this require a %s type.",
        ["Doesn't have enough space"] : "Bitstream.%s: Doesn't have enough space to write this type.",
        ["Out of bounds"] : "Bitstream.%s: Buffer read out of bounds (offset=%d, type_size=%d, buffer_size=%d)"
    }

    // Simple configuration table
    public static Configuration : IConfiguration = {
        VerifyVersion : true
    }

    /*
    * Checks the current module version against the version available on GitHub. 
    * If the versions do not match, the local version is considered outdated.
    */
    public static verifyVersion() {
        if(!this.Configuration.VerifyVersion) return;
        if(this.rawURL.size() <= 0) return;
        if(!HttpService.HttpEnabled) {
            warn("HttpService is not enabled, Bitstream version could not be evaluate.")
            return;
        }
        const [success,res] = pcall(() => {
            return HttpService.GetAsync(this.rawURL)
        }) as LuaTuple<[boolean,string]>
        if(!success) {
            warn("Error detected during Debugger.verifyVersion() : " + res)
            return;
        }
        const bitstreamSourceVersion = string.match(res,"[%d.]+")[0] as string
        if(bitstreamSourceVersion !== version) {
            warn(`Bitstream version missmatch, expected ${bitstreamSourceVersion} got ${version}. Please go to npm and install the lastest version.`)
        }
    }

    // Takes the error type and returns the exact error message corresponding to that type.
    public static catchError(errorType : ErrorEnumeration) : string | undefined {
        const targetError = this.ErrorMessages[errorType]
        if(!targetError) warn("Error not found");
        return targetError
    }

    /* 
    * Given the level argument, returns the name of the function at the specified stack level using Roblox's debug.info API.
    * More information here : https://create.roblox.com/docs/reference/engine/libraries/debug#info
    */
    public static getFunctionName(level? : number) {
        return debug.info(level | 2,"n")
    }

}