/**
 * Walking a tuple type by index. The usual `[infer Head, ...infer Tail]`
 * recursion re-slices the tuple at every step, which costs TypeScript
 * O(length) per step — quadratic over the list (a 200-unit list: ~650k type
 * instantiations for the walk alone; 400 units: 2.6M, at the compiler's
 * limit). `T[I]` is one lookup and `NextIndex[I]` the next position: linear.
 * The table is the only way to add one to a number literal at the type level
 * without building a tuple of that length (which is the same quadratic cost).
 */
//# sourceMappingURL=tuple-index.js.map