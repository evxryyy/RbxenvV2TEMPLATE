# TODO List (Bitstream for now)

## Luau Version
- Fixes : FloatCurveKey(F16 & F24) the rightTangent is using the wrong offset.
- Fixes : Some functions using `ensureReadable` had an incorrect bytes argument and did not use the required number of bytes before reading, which could lead to a security vulnerability.
- Add more generics functions (optional), example :
    ```lua
    self:ReadEnum<Enum.KeyInterpolation>(offset? : number) --> return Enum.KeyInterpolation instead of EnumItem (unknown EnumItem)
    ```
- Many others fixes
- Fixes : Some functions use `ensureReadable` with a byte count that is higher than what is actually required.
- Fixes : in `.copy` the the function `buffer.copy` returns void but i accidently write `new = buffer.copy()`.

----

## Rbxts Version
- Make `zignal.ts` actually readable since its not my lib but i ported it to @rbxts
- Make any ported luau code to @rbxts very different and looks real modern ts and not some copy and paste code.
- Rewrite `Resolver` as abstracted class with static functions and more readable
- Same as Luau more generic functions
- Finish custom readers
- Finish serialization with schema and schemaless
- Test