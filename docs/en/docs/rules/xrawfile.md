# xrawfile

xrawfile is a pass-through version of the [rawfile](./rawfile) rule, differing primarily in how it handles file non-existence:
- ✅ If the file exists: Returns the local file contents (same behavior as the [rawfile](./rawfile) rule)
- ❌ If the file does not exist: Continues with the normal network request (whereas the [rawfile](./rawfile) rule returns a `404` error).

## Rule Syntax
``` txt
pattern xrawfile://value [filters...]
```

For detailed usage, see: [rawfile](./rawfile)
