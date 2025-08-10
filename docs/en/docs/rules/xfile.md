# xfile

xfile is a pass-through version of the [file](./file) rule, differing primarily in how it handles file non-existence:
- ✅ If the file exists: Returns the local file contents (same behavior as the [file](./file) rule)
- ❌ If the file does not exist: Continues with the normal network request (whereas the [file](./file) rule returns a `404` error).

## Rule Syntax
``` txt
pattern xfile://value [filters...]
```

For detailed usage, see: [file](./file)
