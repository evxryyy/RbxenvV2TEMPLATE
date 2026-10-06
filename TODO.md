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

----

## Rbxts Version
- Finish readers
- Finish utility functions of the component
- Same as Luau more generic functions
- Rewrite `Extensions` and `Resolver` as abstracted class with static functions
- Finish serialization with schema and schemaless
- Test