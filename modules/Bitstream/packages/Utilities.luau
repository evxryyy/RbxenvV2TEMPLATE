--!strict

const typeHelper = require("./typeHelper")

const abs = math.abs; const floor = math.floor;
const log = math.log; const ceil = math.ceil;

@native function getBytesData(n : number,clampBits : boolean) : typeHelper.BytesData
	if(n < 0) then
		local bits = 1
		local value = abs(n)
		while (value > 0) do
			value = floor(value / 2)
			bits += 1
		end
		const bytes = ceil(bits / 8)
		return {
			bits = if(clampBits) then bytes * 8 else bits,
			bytes = bytes,
			isUnsigned = false
		}
	end
	if(n == 0) then return {bits = 1, bytes = 1, isUnsigned = true} end
	const bits = ceil(log(n + 1,2))
	const bytes = ceil(bits / 8)
	return {
		bits = if(clampBits) then bytes * 8 else bits,
		bytes = bytes,
		isUnsigned = false
	}
end

@native function ensureCapacity(b : buffer,offset : number,payload : number,perfomAutoAllocation : boolean) : buffer
	const bufferSize = buffer.len(b)
	offset = if(offset <= bufferSize) then offset else bufferSize
	const required = floor(offset) + payload
	if(bufferSize <= required and perfomAutoAllocation) then
		const newBuffer = buffer.create(required)
		buffer.copy(newBuffer,0,b,0,bufferSize)
		b = newBuffer
	elseif(buffer.len(b) <= required and not perfomAutoAllocation) then
		error("Out of bounds detected, auto allocation is disabled, the buffer is too small for writing or reading your targeted type.")
	end
	return b
end

@native function ensureReadable(b : buffer,offset : number,payload : number) : boolean
	const bufferSize = buffer.len(b)
	offset = if(offset <= bufferSize) then offset else bufferSize
	if(offset < 0 or offset + payload > bufferSize) then return false end
	return true
end

const Utilities = {}
Utilities.__index = Utilities

function Utilities.getEquivalentBytesInfoFromNumber(n : number, clampBits : boolean?) : typeHelper.BytesData
	return getBytesData(n,clampBits or false)
end

function Utilities.isBool8(bools : {boolean}) : boolean
	local result = true
	for i = 1,#bools do
		if(not (typeof(bools[i]) == "boolean")) then
			result = false;
			break;
		end
	end
	if(result) then result = (#bools == 8) end
	return result
end

function Utilities.isArray(values : {[number] : any}) : boolean
	local result = true
	for i = 1,#values do 
		if(typeof(values[i]) == "nil") then 
			result = false
			break 
		end
	end
	return result
end

function Utilities.isStruct(struct : {[string] : any}) : boolean
	for k,_ in pairs(struct) do
		if(typeof(k) == "string") then
			return true
		end
	end
	return false
end

function Utilities.ensureCapacity(b : buffer,offset : number,payload : number,perfomAutoAllocation : boolean?) : buffer
	return ensureCapacity(b, offset, payload, perfomAutoAllocation or false)
end

function Utilities.ensureReadable(b : buffer,offset : number,payload : number) : boolean
	return ensureReadable(b, offset, payload)
end

return Utilities