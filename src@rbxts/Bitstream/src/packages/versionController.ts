import { HttpService } from "@rbxts/services"
import { version } from "./__version__"

interface IConfiguration { VerifyVersion : boolean }

/*
* @Class: VersionController
*
* A simple utility class for checking the version of the Bitstream module.
*/
export abstract class VersionController {

    // raw link to public version of Bitstream (template link)
    public static readonly rawURL = "https://raw.githubusercontent.com/evxryyy/Rbxenv/refs/heads/main/Bitstream/VERSION.md"
    
    // Simple configuration table
    public static Configuration : IConfiguration = { VerifyVersion : true }

    /*
    * Checks the current module version against the version available on GitHub. 
    * If the versions do not match, the local version is considered outdated.
    */
    public static verifyVersion = () => {
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
            warn("Error detected during VersionControlleer.verifyVersion() : " + res)
            return;
        }
        const bitstreamSourceVersion = string.match(res,"[%d.]+")[0] as string
        if(bitstreamSourceVersion !== version) {
            warn(`Bitstream version missmatch, expected ${bitstreamSourceVersion} got ${version}. Please go to npm and install the lastest version.`)
        }
    }

}