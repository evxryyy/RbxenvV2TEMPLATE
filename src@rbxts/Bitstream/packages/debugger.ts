/*
	Bitstream Debugger + Version Control Module

	Author : evxry_ll

	This module provides:
	- Centralized error message handling
	- Runtime version verification against a remote source
	- Lightweight configuration system
	- Safe error retrieval API

	The goal is to ensure:
	- Consistent error formatting across Bitstream
	- Optional GitHub-based version validation
	- Reduced duplication of error strings
*/

import * as Services from "@rbxts/services"
import { version } from "./__version__"

const HttpService = Services.HttpService

const rawUrl = "https://raw.githubusercontent.com/evxryyy/Rbxenv/refs/heads/main/Bitstream/VERSION.md"

type ErrorEnumeration = "Type-missmatch" | "Doesn't have enough space" | "Out of bounds"

// Error message registry.
const ErrorMessages : Record<ErrorEnumeration,string> = {
    ["Type-missmatch"] : "Bitstream.%s: Type missmatch this require a %s type.",
    ["Doesn't have enough space"] : "Bitstream.%s: Doesn't have enough space to write this type.",
    ["Out of bounds"] : "Bitstream.%s: Buffer read out of bounds (offset=%d, type_size=%d, buffer_size=%d)"
}

/*
	Configuration system.
	Allows for the modification of the module's behavior.
*/
const Configuration = {
    VerifiyVersion : true,
}

/*
	Version verification system.
	Checks the version of the Bitstream module against a remote source.
	Only runs if Configuration.VerifiyVersion is true.
*/
export function verifiyVersion() : void {
    if(Configuration.VerifiyVersion === false) { return; }
    if(rawUrl.size() === 0) { return; }
    if(HttpService.HttpEnabled === false) {
        warn("HttpService is not enabled, Bitstream version could not be evaluate.")
        return;
    }
    const [success,res] = pcall(() => {
        return HttpService.GetAsync(rawUrl)
    })
    if(success === false) {
        warn(res)
        return;
    }
    const bitstreamSourceVersion = string.match(res,"[%d%.]+")[0] as string
    if(bitstreamSourceVersion !== version) {
        warn(`Bitstream version missmatch, expected ${bitstreamSourceVersion} got ${version}. Please go to npm and install the lastest version.`)
    }
}

/*
	Error retrieval function.

	@param errorType The type of error to retrieve.
	@return The error message string.
*/
export function catchError(errorType : ErrorEnumeration) : string | undefined {
    const targetError = ErrorMessages[errorType]
    if(typeOf(targetError) !== "string") {
        warn("Error not found")
    }
    return targetError
}

export function getFunctionName(level? : number) {
    return debug.info(level || 2,"n")
}