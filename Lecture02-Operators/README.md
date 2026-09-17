# MongoDB Lecture 02 — Query & Update Operators

A hands-on walkthrough of MongoDB **query operators** (logical, comparison, type, array, and regex operators) and **update operators** (field update, array update, and upsert) using `mongosh`.

> **Environment:** MongoDB 6.0.13 · Mongosh 2.10.0 · Local instance (`mongodb://127.0.0.1:27017`)

---

## Table of Contents

**Part 1 — Query Operators (Basics)**
- [1. Setup — Database & Collection](#1-setup--database--collection)
- [2. Projections in find()](#2-projections-in-find)
- [3. Logical Operators — $and / $or](#3-logical-operators--and--or)
- [4. Comparison Operators — $eq / $ne](#4-comparison-operators--eq--ne)
- [5. The $not Operator](#5-the-not-operator)
- [6. Element Operator — $exists](#6-element-operator--exists)

**Part 2 — Query Operators (Advanced)**
- [7. Logical Operator — $nor](#7-logical-operator--nor)
- [8. Type Operator — $type](#8-type-operator--type)
- [9. Set Operators — $in / $nin](#9-set-operators--in--nin)
- [10. Array Operator — $size](#10-array-operator--size)
- [11. Updating a Nested Array Field](#11-updating-a-nested-array-field)
- [12. Array Operator — $elemMatch](#12-array-operator--elemmatch)
- [13. Array Operator — $all](#13-array-operator--all)
- [14. $all vs $elemMatch — What's the Difference?](#14-all-vs-elemmatch--whats-the-difference)
- [15. Pattern Matching — $regex](#15-pattern-matching--regex)

**Part 3 — Update Operators**
- [16. find() Second Argument vs updateOne() — Don't Confuse Them](#16-find-second-argument-vs-updateone--dont-confuse-them)
- [17. Renaming a Field — $rename](#17-renaming-a-field--rename)
- [18. Multiplying a Field — $mul](#18-multiplying-a-field--mul)
- [19. Setting a Bound — $max / $min](#19-setting-a-bound--max--min)
- [20. Incrementing a Field — $inc](#20-incrementing-a-field--inc)
- [21. Updating a Nested Object Field — Dot Notation](#21-updating-a-nested-object-field--dot-notation)
- [22. Insert-if-Not-Found — upsert](#22-insert-if-not-found--upsert)
- [23. Array Update Operators — $push / $pop / $pull / $pullAll / $addToSet / $unset](#23-array-update-operators--push--pop--pull--pullall--addtoset--unset)

**Reference**
- [24. Common Mistakes Seen in This Session](#24-common-mistakes-seen-in-this-session)
- [25. Quick Reference Cheat Sheet](#25-quick-reference-cheat-sheet)

---

## 1. Setup — Database & Collection

```js
use lecture02

db.createCollection("emp")
```

Insert sample employees — note the mix of custom string `_id`s, an auto-generated `ObjectId`, and inconsistent fields across documents (intentional, to demonstrate operators like `$exists`):

```js
db.emp.insertMany([
  {
    _id: "emp_001",
    name: "Abdullah",
    email: "abd@gmail.com",
    department: "sales",
    salary: 50000,
    allowances: 0.15,
    skills: ["html", "css", "js"]
  },
  {
    _id: "emp_002",
    name: "Hammad",
    email: "hammad@gmail.com",
    department: "Marketing",
    salary: 80000,
    allowances: 0.1
  },
  {
    name: "Jawwad",
    email: "jwd@gmail.com",
    department: "Production",
    salary: 55000,
    allowances: "",
    attendance: { jan: "80%", feb: "90%", mar: "79%" },
    skills: ["GIT", "GITHUB", "FLUTTER", "C#"]
  }
])
```

Add a `city` field to each document with `updateOne()`:

```js
db.emp.updateOne({ name: "Abdullah" }, { $set: { city: "Karachi" } })
db.emp.updateOne({ name: "Hammad" },   { $set: { city: "Karachi" } })
db.emp.updateOne({ name: "Jawwad" },   { $set: { city: "Lahore" } })
```

---

## 2. Projections in find()

`find()` takes a **second argument** — a projection — to control which fields are returned. As a *projection*, only the field **names** matter; values like `true`/`1` or `false`/`0` decide include/exclude, but even a string value here still just means "include this field."

```js
db.emp.find({ city: "Karachi" }, { department: "Marketing" })
```

Result — only `_id` and `department` come back for matching documents:

```js
[
  { _id: 'emp_001', department: 'Marketing' },
  { _id: 'emp_002', department: 'Marketing' }
]
```

> 🚫 A filter **cannot** be an array — `db.emp.find([{...}, {...}])` throws `MongoInvalidArgumentError`. Combine multiple conditions inside one object instead (see `$and`/`$or` below, or just add more keys to a plain filter object):
> ```js
> // ✅ Multiple conditions in a plain filter (implicit AND)
> db.emp.find({ city: "Karachi", department: "Marketing" })
> ```

---

## 3. Logical Operators — `$and` / `$or`

### `$and` — all conditions must match

```js
db.emp.find({
  $and: [
    { city: "Karachi", department: "Marketing" }
  ]
})
```

### `$or` — at least one condition must match

```js
db.emp.find({
  $or: [
    { city: "Karachi" },
    { department: "Sales" }
  ]
})
```

> 💡 Field values are **case-sensitive** — `"Sales"` won't match a document where `department` is stored as `"sales"`. Compare:
> ```js
> db.emp.find({ $or: [ { city: "Lahore" }, { department: "Sales" } ] })  // department "sales" (lowercase) won't match
> db.emp.find({ $or: [ { city: "Lahore" }, { department: "sales" } ] })  // matches correctly
> ```

A query with no matching documents simply returns an empty result:

```js
db.emp.find({ $or: [ { city: "Quetta" }, { department: "Administration" } ] })
// → (no documents)
```

---

## 4. Comparison Operators — `$eq` / `$ne`

`$eq` and `$ne` must be applied **on a field**, not as a top-level operator.

```js
// ❌ Wrong — $eq used at the top level
// db.emp.find({ $eq: { city: "Karachi" } })
// → MongoServerError: unknown top level operator: $eq

// ✅ Correct — $eq applied to the "city" field
db.emp.find({ city: { $eq: "Karachi" } })
```

`$ne` — not equal:

```js
db.emp.find({ city: { $ne: "Karachi" } })
```

---

## 5. The `$not` Operator

`$not` **cannot** take a plain value directly — it needs a regex or an operator document:

```js
// ❌ Wrong
// db.emp.find({ city: { $not: "Karachi" } })
// → MongoServerError: $not needs a regex or a document

// ✅ Correct usage
db.emp.find({ city: { $not: { $eq: "Karachi" } } })
```

---

## 6. Element Operator — `$exists`

Checks whether a field is present (`true`) or absent (`false`) in a document.

```js
db.emp.find({ about: { $exists: false } })
db.emp.find({ skills: { $exists: false } })
```

Result for `skills: { $exists: false }` — only Hammad's document lacks a `skills` array:

```js
[
  {
    _id: 'emp_002',
    name: 'Hammad',
    email: 'hammad@gmail.com',
    department: 'Marketing',
    salary: 80000,
    allowances: 0.1,
    city: 'Karachi'
  }
]
```

---

## 7. Logical Operator — `$nor`

`$nor` returns documents that match **none** of the given conditions — the opposite of `$or`.

```js
db.emp.find({ $nor: [ { city: "Lahore" }, { department: "sales" } ] })
```

Result — only Hammad matches, since he's neither in Lahore nor in the sales department:

```js
[
  {
    _id: 'emp_002',
    name: 'Hammad',
    email: 'hammad@gmail.com',
    department: 'Marketing',
    salary: 80000,
    allowances: 0.1,
    city: 'Karachi'
  }
]
```

---

## 8. Type Operator — `$type`

Filters documents based on the **BSON type** of a field's value.

```js
// ❌ Wrong — missing the $ before "type"
// db.emp.find({ salary: { type: "int" } })
// → no error, but returns nothing (treated as an exact-match filter for a field named "type")

// ✅ Correct
db.emp.find({ salary: { $type: "int" } })
```

> 🚫 Type alias names are case-sensitive and must match MongoDB's exact alias list — `"String"` is invalid, use lowercase `"string"`:
> ```js
> // ❌ Wrong
> // db.emp.find({ salary: { $type: "String" } })
> // → MongoServerError[BadValue]: Unknown type name alias: String
>
> // ✅ Correct
> db.emp.find({ allowances: { $type: "string" } })
> ```

`$type` also accepts an **array of types** — matches if the field is any one of them:

```js
db.emp.find({ department: { $type: ["string", "int"] } })
```

Common type aliases used here: `"int"`, `"double"`, `"string"`.

---

## 9. Set Operators — `$in` / `$nin`

### `$in` — field value matches any value in the given array

```js
db.emp.find({ department: { $in: ["sales", "Marketing"] } })
```

### `$nin` — field value matches **none** of the values in the given array

```js
db.emp.find({ department: { $nin: ["sales", "Marketing"] } })
```

Result — only Jawwad (Production) is returned, since his department isn't in the list:

```js
[
  {
    _id: ObjectId('6aa2cc4c2614da37283e53bf'),
    name: 'Jawwad',
    department: 'Production',
    ...
  }
]
```

---

## 10. Array Operator — `$size`

Matches arrays with an **exact** number of elements.

```js
db.emp.find({ skills: { $size: 3 } })   // Abdullah — exactly 3 skills
db.emp.find({ skills: { $size: 5 } })   // → no match
db.emp.find({ skills: { $size: 4 } })   // Jawwad — exactly 4 skills
```

> 💡 `$size` only checks the **count** of elements — it can't be combined with a range (e.g. "more than 3") in the same operator. Use `$expr` with `$size` in an aggregation for that.

---

## 11. Updating a Nested Array Field

Adding an array of embedded documents (`projects`) to an employee:

```js
// ❌ Wrong — using a colon instead of nesting inside one object
// db.emp.updateOne({ name: "Abdullah" }, { $set: projects: { ... } })
// → SyntaxError: Unexpected token, expected ","

// ❌ Wrong — square brackets around the whole $set body
// db.emp.updateOne({ _id: 'emp_001' }, { $set: [ projects: { ... } ] })
// → SyntaxError

// ✅ Correct — projects is the VALUE of a key inside $set, and its value is an array of objects
db.emp.updateOne(
  { _id: "emp_001" },
  {
    $set: {
      projects: [
        { name: "Website", status: "completed", hours: 20 },
        { name: "Application", status: "pending", hours: 40 }
      ]
    }
  }
)

db.emp.updateOne(
  { name: "Jawwad" },
  {
    $set: {
      projects: [
        { name: "Automation", status: "Ongoing", hours: 5 },
        { name: "Website", status: "Ongoing", hours: 3 }
      ]
    }
  }
)
```

---

## 12. Array Operator — `$elemMatch`

Matches documents where **at least one element** in an array satisfies **multiple conditions together** (on that same element).

```js
db.emp.find({
  projects: {
    $elemMatch: { status: "completed", hours: { $gt: 10 } }
  }
})
```

More examples:

```js
// Any project with more than 10 hours
db.emp.find({ projects: { $elemMatch: { hours: { $gt: 10 } } } })

// Any "Ongoing" project with more than 1 hour
db.emp.find({ projects: { $elemMatch: { status: "Ongoing", hours: { $gt: 1 } } } })

// Any "pending" project with fewer than 41 hours
db.emp.find({ projects: { $elemMatch: { status: "pending", hours: { $lt: 41 } } } })
```

> 🚫 `$elemMatch`'s value must be **one object** with all conditions inside it — not an array of separate condition objects:
> ```js
> // ❌ Wrong
> // db.emp.find({ projects: { $elemMatch: [ { status: "Ongoing" }, { hours: { $gt: 2 } } ] } })
> // → SyntaxError / invalid usage
>
> // ✅ Correct — both conditions inside ONE object
> db.emp.find({ projects: { $elemMatch: { status: "Ongoing", hours: { $gt: 2 } } } })
> ```

---

## 13. Array Operator — `$all`

Matches arrays that contain **all** of the specified values, regardless of order or extra elements — but each value is checked **independently**, not against a single element.

```js
db.emp.find({ skills: { $all: ["html", "css"] } })      // Abdullah has both
db.emp.find({ skills: { $all: ["html", "git"] } })      // → no match, nobody has both
db.emp.find({ skills: { $all: ["GITHUB", "GIT"] } })    // Jawwad has both (case-sensitive!)
```

---

## 14. `$all` vs `$elemMatch` — What's the Difference?

Both work on **arrays**, but they answer different questions:

| | `$all` | `$elemMatch` |
|---|---|---|
| **Question it answers** | "Does the array contain *all* of these values, anywhere in it?" | "Is there at least *one single element* that satisfies *all* these conditions *together*?" |
| **Works on** | Simple arrays of values (strings, numbers) | Arrays of embedded documents, or arrays where multiple conditions must hold on the *same* element |
| **Conditions checked** | Independently — each value can come from a different array position | Jointly — all conditions must be true on **one and the same** array element |
| **Example** | `skills: { $all: ["GIT", "GITHUB"] }` → true if `"GIT"` is *somewhere* in the array AND `"GITHUB"` is *somewhere* in the array (could be different elements, though for simple strings each value only exists once) | `projects: { $elemMatch: { status: "completed", hours: { $gt: 10 } } }` → true only if **one project object** has `status: "completed"` **and** `hours > 10` at the same time |

**Key takeaway:** if you're checking multiple conditions that must all be true on the *same* embedded document inside an array (like one specific `project` being both `"completed"` and having `hours > 10`), you need `$elemMatch`. If you're just checking that a flat array contains a set of values anywhere in it, `$all` is enough — and using `$all` on an array of embedded documents (checking one field at a time) will not correctly enforce that the matching values belong to the *same* element the way `$elemMatch` does.

---

## 15. Pattern Matching — `$regex`

Matches string fields against a regular expression pattern.

```js
db.emp.find({ name: { $regex: "A" } })     // contains "A" anywhere
db.emp.find({ name: { $regex: "^A" } })    // starts with "A"
db.emp.find({ name: { $regex: "^H" } })    // starts with "H"
db.emp.find({ name: { $regex: "ah" } })    // contains "ah"
db.emp.find({ name: { $regex: "ad$" } })   // ends with "ad"
db.emp.find({ name: { $regex: "ww" } })    // contains "ww"
db.emp.find({ name: { $regex: "a" } })     // contains lowercase "a" anywhere
```

| Symbol | Meaning |
|---|---|
| `^` | start of string |
| `$` | end of string |
| (no anchor) | matches anywhere in the string |

> 💡 `$regex` matching is case-sensitive by default. Add the `$options: "i"` field alongside it for case-insensitive matching, e.g. `{ name: { $regex: "a", $options: "i" } }`.

---

## 16. find() Second Argument vs updateOne() — Don't Confuse Them

`find()`'s second argument is a **projection**, not a way to change data — it can never modify a document, no matter what operator you put in it.

```js
// This does NOT update anything — it's just a (slightly odd) projection
db.emp.find({ name: "Hammad" }, { city: "Lahore" })
// → [ { _id: 'emp_002', city: 'Lahore' } ]   (just returns the _id + city fields)

// ❌ Wrong — trying to use $set inside find()'s projection
// db.emp.find({ name: "Hammad" }, { $set: { city: "Lahore" } })
// → MongoServerError: FieldPath field names may not start with '$'

// ❌ Wrong — same idea, still inside find()
// db.emp.find({ name: "Hammad" }, { city: { $set: "Lahore" } })
// → MongoServerError: Unknown expression $set
```

To actually change data you must use `updateOne()` / `updateMany()`, **and** the update document must use an atomic operator like `$set` — a plain field/value object is rejected:

```js
// ❌ Wrong — no atomic operator
// db.emp.updateOne({ name: "Hammad" }, { city: "Lahore" })
// → MongoInvalidArgumentError: Update document requires atomic operators

// ✅ Correct
db.emp.updateOne({ name: "Hammad" }, { $set: { city: "Lahore" } })
```

`updateMany()` applies the same update to **every** matching document:

```js
db.emp.updateMany({ department: "sales" }, { $set: { department: "Sales" } })
```

> 💡 Remember `updateOne()` only touches the **first** matching document — running `db.emp.updateOne({ department: "Sales" }, { $set: { city: "Lahore" } })` after the above only updates one of the (now two) `"Sales"` employees, not both.

---

## 17. Renaming a Field — `$rename`

Renames a field, keeping its value.

```js
db.emp.updateOne({ name: "Owais" }, { $set: { designation: "Manager" } })

// Rename "designation" to "role"
db.emp.updateOne({ name: "Owais" }, { $rename: { designation: "role" } })
```

---

## 18. Multiplying a Field — `$mul`

Multiplies a numeric field by the given value **in place**.

```js
// ❌ Wrong attempts — $mul is an UPDATE operator, not usable inside find()
// db.emp.find({ department: "Sales" }, { $mul: { salary: 12 } })
// → MongoServerError: FieldPath field names may not start with '$'
// db.emp.find({ department: "Sales" }, { salary: { $mul: 12 } })
// → MongoServerError: Unknown expression $mul
// db.emp.updateOne({ department: "Sales" }, { salary: { $mul: 12 } })
// → MongoInvalidArgumentError: Update document requires atomic operators

// ✅ Correct
db.emp.updateOne({ department: "Sales" }, { $mul: { salary: 12 } })
```

Multiplying by a decimal scales the value down/up proportionally (e.g. a 10% cut, a 10% raise):

```js
db.emp.updateOne({ name: "Jawwad" }, { $mul: { salary: 0.1 } })   // reduce to 10%
db.emp.updateOne({ name: "Jawwad" }, { $mul: { salary: 1.1 } })   // increase by 10%
```

> 💡 Multiplying decimals can leave a floating-point result like `6050.000000000001` — this is normal JavaScript/BSON floating-point behavior, not a bug.

You can also multiply using a variable defined in the shell session:

```js
let quantityy = 3
db.products.updateOne({ name: "Mobile" }, { $mul: { unitPrice: quantityy } })
```

---

## 19. Setting a Bound — `$max` / `$min`

### `$max` — only updates the field if the new value is **greater** than the current value

```js
db.emp.updateOne({ name: "Irfan" }, { $max: { salary: 8300 } })
// → modifiedCount: 0  (8300 < current salary 84000, so nothing changes)

db.emp.updateOne({ name: "Irfan" }, { $max: { salary: 85000 } })
// → modifiedCount: 1  (85000 > 84000, so salary updates to 85000)
```

### `$min` — only updates the field if the new value is **less** than the current value

```js
db.emp.updateOne({ name: "Irfan" }, { $min: { salary: 86000 } })
// → modifiedCount: 0  (86000 > current salary 85000, so nothing changes)

db.emp.updateOne({ name: "Irfan" }, { $min: { salary: 84000 } })
// → modifiedCount: 1  (84000 < 85000, so salary updates to 84000)
```

---

## 20. Incrementing a Field — `$inc`

Adds (or subtracts, with a negative value) to a numeric field.

```js
db.products.updateOne({ name: "Mobile" }, { $inc: { quantity: 3 } })    // +3
db.products.updateOne({ name: "Mobile" }, { $inc: { quantity: -1 } })   // -1
```

---

## 21. Updating a Nested Object Field — Dot Notation

To update **one key inside a nested/embedded object**, use a quoted "dot path" string as the field name — you cannot use `object.key` unquoted as a key.

```js
// ❌ Wrong — unquoted dot notation is invalid JS object syntax
// db.emp.updateOne({ name: "Owais" }, { $set: { attendance.feb: "95%" } })
// → SyntaxError: Unexpected token, expected ","

// ✅ Correct — the whole path goes in quotes as a single key
db.emp.updateOne({ name: "Owais" }, { $set: { "attendance.feb": "95%" } })
```

This updates only the `feb` key inside `attendance`, leaving `jan` and `mar` untouched.

---

## 22. Insert-if-Not-Found — `upsert`

Passing `{ upsert: true }` as a **third argument** to `updateOne()` inserts a new document if no document matches the filter, instead of doing nothing.

```js
// ❌ Wrong — trying to reference an undeclared variable as _id
// db.emp.updateOne({ _id: emp_008 }, { name: "Hamza", ... })
// → ReferenceError: emp_008 is not defined
// (Remember: string _id values must be quoted, e.g. "emp_008")

// ❌ Wrong — "$upsert" is not a field; upsert is an OPTION, not part of $set
// db.emp.updateOne({ _id: emp_008 }, { $set: { ... }, $upsert: true })
// → invalid

// ❌ Wrong — option key must be "upsert", not "$upsert"
// db.emp.updateOne({ name: "Hamza" }, { $set: { ... } }, { $upsert: true })
// → runs, but does nothing (matchedCount: 0, upsertedCount: 0) — the option is silently ignored

// ✅ Correct — third argument is a plain options object with "upsert": true
db.emp.updateOne(
  { name: "Hamza" },
  {
    $set: {
      name: "Hamza",
      email: "hamza@gmail.com",
      department: "Production",
      salary: 97000,
      role: "Senior Developer",
      city: "Karachi"
    }
  },
  { upsert: true }
)
// → upsertedCount: 1 — a brand-new document is inserted since no "Hamza" existed
```

> 💡 With `upsert: true`, if the filter finds a match, it updates normally; if it finds **no** match, it inserts a new document combining the filter fields and the `$set` fields.

---

## 23. Array Update Operators — `$push` / `$pop` / `$pull` / `$pullAll` / `$addToSet` / `$unset`

### `$push` — adds a single element to the end of an array

```js
db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "HTML" } })
```

> 🚫 Passing an array to `$push` adds the **whole array as one nested element**, not as separate items:
> ```js
> // ⚠️ Adds ["HTML", "CSS"] as a single nested array element inside skills
> db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: ["HTML", "CSS"] } })
> // result: skills: [ 'GIT', 'GITHUB', 'FLUTTER', 'C#', [ 'HTML', 'CSS' ] ]
> ```
> To push multiple values properly, use `$each`: `{ $push: { skills: { $each: ["HTML", "CSS"] } } }`.

> 🚫 `$push` does **not** de-duplicate — pushing the same value twice adds it twice:
> ```js
> db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "FLUTTER" } })
> db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "FLUTTER" } })
> // → skills now contains "FLUTTER" twice
> ```

### `$addToSet` — adds an element only if it doesn't already exist (no duplicates)

```js
db.emp.updateOne({ name: "Jawwad" }, { $addToSet: { skills: "FLUTTER" } })
// First call: adds it (modifiedCount: 1)
// Second call with the same value: modifiedCount: 0 — already present, skipped
```

### `$unset` — removes a field entirely from the document

```js
db.emp.updateOne({ name: "Jawwad" }, { $unset: { skills: "" } })
```

> 💡 The value given to `$unset` (here `""`) doesn't matter — the field is removed either way.

### `$pop` — removes the first or last element of an array

```js
db.emp.updateOne({ name: "Jawwad" }, { $pop: { skills: 1 } })    // removes the LAST element
db.emp.updateOne({ name: "Jawwad" }, { $pop: { skills: -1 } })   // removes the FIRST element
```

> 🚫 `$pop` needs its value wrapped in an object — `{ $pop: skills }` alone throws `ReferenceError: skills is not defined` (it's being read as a bare JS variable, not a field name).

### `$pull` — removes all array elements matching a given value/condition

```js
db.emp.updateOne({ name: "Jawwad" }, { $pull: { skills: "FLUTTER" } })
```

### `$pullAll` — removes all occurrences of several exact values at once

```js
// ❌ Wrong — $pullAll requires an ARRAY of values, not a single value
// db.emp.updateOne({ name: "Jawwad" }, { $pullAll: { skills: 1 } })
// → MongoServerError: $pullAll requires an array argument but was given a int

// ❌ Wrong — $pullAll's value must itself be an object naming the field
// db.emp.updateOne({ name: "Jawwad" }, { $pullAll: 1 })
// → MongoServerError: Modifiers operate on fields but we found type int instead

// ✅ Correct — array of exact values to remove
db.emp.updateOne({ name: "Jawwad" }, { $pullAll: { skills: ["CSS", "GITHUB"] } })
```

> 💡 **`$pull` vs `$pullAll`:** `$pull` can take a condition (e.g. `{ $gt: 10 }`) and removes every matching element; `$pullAll` only takes an exact list of values to remove, with no conditions.

---

## 24. Common Mistakes Seen in This Session

| Mistake | Error | Fix |
|---|---|---|
| Missing comma between filter and update object | `SyntaxError: Unexpected token, expected ","` | `db.emp.updateOne({ name: "Hammad" }, { $set: { city: "Karachi" } })` |
| Passing an array directly as a filter | `MongoInvalidArgumentError: Query filter must be a plain object or ObjectId` | Wrap conditions in `$and` / `$or`, or use a plain object |
| Unbalanced/mismatched braces `{)` or extra `}` | `SyntaxError: Unexpected token` | Carefully match every `{` with its `}` |
| Using `$eq` as a top-level operator | `unknown top level operator: $eq` | Apply it on the field: `{ field: { $eq: value } }` |
| Using `$not` with a plain value | `$not needs a regex or a document` | Wrap the condition: `{ field: { $not: { $eq: value } } }` |
| Forgetting the `$` before an operator (`type` instead of `$type`) | No error, but silently returns nothing | Always prefix operators with `$`: `{ field: { $type: "int" } }` |
| Using a wrong-case type alias (`"String"`) | `Unknown type name alias: String` | Use the exact lowercase alias: `"string"` |
| Writing `$set: projects: {...}` or `$set: [ projects: {...} ]` | `SyntaxError` | Nest correctly: `{ $set: { projects: [ {...}, {...} ] } }` |
| Passing an array of objects to `$elemMatch` | `SyntaxError` / invalid usage | Put all conditions inside **one** object: `{ $elemMatch: { field1: ..., field2: ... } }` |
| Trying to use `$set`/`$mul` inside `find()`'s projection | `FieldPath field names may not start with '$'` / `Unknown expression` | Update operators only work with `updateOne()`/`updateMany()`, never inside `find()` |
| Passing a plain object (no operator) to `updateOne()` | `Update document requires atomic operators` | Always wrap changes in `$set`, `$inc`, etc. |
| Using an unquoted, undeclared value as `_id` (e.g. `emp_008`) | `ReferenceError: ... is not defined` | Quote string ids: `"emp_008"` |
| Writing `{ $upsert: true }` instead of the 3rd-argument option | Silently does nothing (no error, no insert) | Pass `{ upsert: true }` (no `$`) as the **third** argument to `updateOne()` |
| Using unquoted dot notation for a nested field (`attendance.feb`) | `SyntaxError: Unexpected token, expected ","` | Quote the whole path as one key: `{ "attendance.feb": "95%" } ` |
| Pushing an array into `$push` without `$each` | Adds the array as one nested element instead of separate items | Use `{ $push: { field: { $each: [...] } } }` for multiple items |
| Calling `$pop` with a bare field name instead of an object | `ReferenceError: <field> is not defined` | Use `{ $pop: { field: 1 } }` (1 = last, -1 = first) |
| Passing a single value (not an array) to `$pullAll` | `$pullAll requires an array argument` | Always give `$pullAll` an array: `{ $pullAll: { field: [v1, v2] } }` |

---

## 25. Quick Reference Cheat Sheet

### Query Operators

| Task | Command |
|---|---|
| Projection — include only certain fields | `db.emp.find({ filter }, { field: 1 })` |
| Logical AND | `db.emp.find({ $and: [ { ... }, { ... } ] })` |
| Logical OR | `db.emp.find({ $or: [ { ... }, { ... } ] })` |
| Logical NOR (matches neither) | `db.emp.find({ $nor: [ { ... }, { ... } ] })` |
| Equal to | `db.emp.find({ field: { $eq: value } })` |
| Not equal to | `db.emp.find({ field: { $ne: value } })` |
| Negate a condition | `db.emp.find({ field: { $not: { $eq: value } } })` |
| Field does not exist | `db.emp.find({ field: { $exists: false } })` |
| Field exists | `db.emp.find({ field: { $exists: true } })` |
| Match by BSON type | `db.emp.find({ field: { $type: "string" } })` |
| Match by any of several types | `db.emp.find({ field: { $type: ["string", "int"] } })` |
| Value in a list | `db.emp.find({ field: { $in: [v1, v2] } })` |
| Value NOT in a list | `db.emp.find({ field: { $nin: [v1, v2] } })` |
| Array has exact length | `db.emp.find({ arrField: { $size: n } })` |
| Array contains all these values | `db.emp.find({ arrField: { $all: [v1, v2] } })` |
| One array element matches multiple conditions | `db.emp.find({ arrField: { $elemMatch: { f1: v1, f2: { $gt: v2 } } } })` |
| Pattern match on a string | `db.emp.find({ field: { $regex: "pattern" } })` |
| Case-insensitive pattern match | `db.emp.find({ field: { $regex: "pattern", $options: "i" } })` |

### Update Operators

| Task | Command |
|---|---|
| Set/replace a field's value | `db.emp.updateOne({ filter }, { $set: { field: value } })` |
| Rename a field | `db.emp.updateOne({ filter }, { $rename: { oldName: "newName" } })` |
| Multiply a numeric field | `db.emp.updateOne({ filter }, { $mul: { field: factor } })` |
| Only update if new value is greater | `db.emp.updateOne({ filter }, { $max: { field: value } })` |
| Only update if new value is smaller | `db.emp.updateOne({ filter }, { $min: { field: value } })` |
| Increment/decrement a number | `db.emp.updateOne({ filter }, { $inc: { field: amount } })` |
| Update a field inside a nested object | `db.emp.updateOne({ filter }, { $set: { "parent.child": value } })` |
| Insert if no match found | `db.emp.updateOne({ filter }, { $set: { ... } }, { upsert: true })` |
| Add one item to an array | `db.emp.updateOne({ filter }, { $push: { arrField: value } })` |
| Add multiple items to an array | `db.emp.updateOne({ filter }, { $push: { arrField: { $each: [v1, v2] } } })` |
| Add item only if not already present | `db.emp.updateOne({ filter }, { $addToSet: { arrField: value } })` |
| Remove a field entirely | `db.emp.updateOne({ filter }, { $unset: { field: "" } })` |
| Remove first/last array element | `db.emp.updateOne({ filter }, { $pop: { arrField: -1 } })` *(1 = last, -1 = first)* |
| Remove all matching elements | `db.emp.updateOne({ filter }, { $pull: { arrField: value } })` |
| Remove several exact values at once | `db.emp.updateOne({ filter }, { $pullAll: { arrField: [v1, v2] } })` |
| Update every matching document | `db.emp.updateMany({ filter }, { $set: { ... } })` |

---

*Recorded via `Start-Transcript` in PowerShell for student reference — MongoDB Query & Update Operators (Parts 1, 2 & 3 — complete).*
