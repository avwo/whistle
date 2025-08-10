# xtpl

xtpl is a fall-through version of the [tpl](./tpl) rule. The main difference lies in how it handles file non-existence:
- ✅ If the file exists: Returns the local file contents (same behavior as the [tpl](./tpl) rule)
- ❌ If the file does not exist: Continues with the normal network request (whereas the [tpl](./tpl) rule returns a `404` error).

## Rule Syntax
``` txt
pattern xtpl://value [filters...]
```

For detailed usage, see: [tpl](./tpl)
