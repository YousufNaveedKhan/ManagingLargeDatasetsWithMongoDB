# MongoDB Lecture 02 — Query Operators

A hands-on walkthrough of MongoDB **query operators** (logical, comparison, type, array, and regex operators) using `mongosh`.

> **Environment:** MongoDB 6.0.13 · Mongosh 2.10.0 · Local instance (`mongodb://127.0.0.1:27017`)

---

## Table of Contents

**Part 1**
- [1. Setup — Database & Collection](#1-setup--database--collection)
- [2. Projections in find()](#2-projections-in-find)
- [3. Logical Operators — $and / $or](#3-logical-operators--and--or)
- [4. Comparison Operators — $eq / $ne](#4-comparison-operators--eq--ne)
- [5. The $not Operator](#5-the-not-operator)
- [6. Element Operator — $exists](#6-element-operator--exists)

**Part 2**
- [7. Logical Operator — $nor](#7-logical-operator--nor)
- [8. Type Operator — $type](#8-type-operator--type)
- [9. Set Operators — $in / $nin](#9-set-operators--in--nin)
- [10. Array Operator — $size](#10-array-operator--size)
- [11. Updating a Nested Array Field](#11-updating-a-nested-array-field)
- [12. Array Operator — $elemMatch](#12-array-operator--elemmatch)
- [13. Array Operator — $all](#13-array-operator--all)
- [14. $all vs $elemMatch — What's the Difference?](#14-all-vs-elemmatch--whats-the-difference)
- [15. Pattern Matching — $regex](#15-pattern-matching--regex)

**Reference**
- [16. Common Mistakes Seen in This Session](#16-common-mistakes-seen-in-this-session)
- [17. Quick Reference Cheat Sheet](#17-quick-reference-cheat-sheet)

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

## 16. Common Mistakes Seen in This Session

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

---

## 17. Quick Reference Cheat Sheet

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

---

*Recorded via `Start-Transcript` in PowerShell for student reference — MongoDB Query Operators (Parts 1 & 2).*
