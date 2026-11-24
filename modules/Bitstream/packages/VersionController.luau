--!strict

const HttpService = game:GetService("HttpService")

type IConfiguration = {VerifyVersion : boolean}

-- Current local version
const CURRENT_VERSION = "4.0.1"

-- Simple configuration table
const Configuration : IConfiguration = {VerifyVersion = true}

-- raw link to public version of Bitstream (TEMPLATE LINK)
const RAW_URL = "https://raw.githubusercontent.com/evxryyy/Rbxenv/refs/heads/main/Bitstream/VERSION.md"

-- At now this is a beta feature from roblox studio called `Luau Exports and Cyclic Requires` (turn this on)
--[[
	Checks the current module version against the version available on GitHub.
	If the versions do not match, the local version is considered outdated.
]]
export function verifyVersion() : ()
	if(not Configuration.VerifyVersion) then return end;
	if(RAW_URL == "") then return end;
	if(not HttpService.HttpEnabled) then
		warn("HttpService is not enabled, Bitstream version could not be evaluate.")
		return;
	end
	local success : boolean, result : string? = pcall(function()
		return HttpService:GetAsync(RAW_URL)
	end)
	if(not success) then
		warn("Failed to fetch version from Bitstream, HttpService is not enabled or the URL is invalid.")
		return;
	end
	result = string.match(result :: string,"[%d.]+")
	if(result ~= CURRENT_VERSION) then
		warn(`Bitstream version missmatch, expected ${result} got ${CURRENT_VERSION}. Please go to github and install the lastest version.`)
	end
end