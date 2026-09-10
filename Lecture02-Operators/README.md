# MongoDB Lecture 02 — Query Operators

> ⚠️ **Status: Partial / Work in Progress**
> This lecture is not finished yet — it will be continued in the next class. This file (and the accompanying commands file) will be updated and pushed again once the rest of the lecture is recorded. For now, it covers projections, `$and`, `$or`, `$eq`, `$ne`, `$not`, and `$exists`.

A hands-on walkthrough of MongoDB **query operators** (logical + comparison + element operators) using `mongosh`.

> **Environment:** MongoDB 6.0.13 · Mongosh 2.10.0 · Local instance (`mongodb://127.0.0.1:27017`)

---

## Table of Contents

- [1. Setup — Database & Collection](#1-setup--database--collection)
- [2. Projections in find()](#2-projections-in-find)
- [3. Logical Operators — $and / $or](#3-logical-operators--and--or)
- [4. Comparison Operators — $eq / $ne](#4-comparison-operators--eq--ne)
- [5. The $not Operator](#5-the-not-operator)
- [6. Element Operator — $exists](#6-element-operator--exists)
- [7. Common Mistakes Seen in This Session](#7-common-mistakes-seen-in-this-session)
- [8. Quick Reference Cheat Sheet](#8-quick-reference-cheat-sheet)
- [9. Still To Come](#9-still-to-come)

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

// ✅ Correct usage (for reference)
db.emp.find({ city: { $not: { $eq: "Karachi" } } })
```

---

## 6. Element Operator — `$exists`

Checks whether a field is present (`true`) or absent (`false`) in a document.

```js
// Find documents where "about" field does NOT exist
db.emp.find({ about: { $exists: false } })

// Find documents where "skills" field does NOT exist
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

## 7. Common Mistakes Seen in This Session

| Mistake | Error | Fix |
|---|---|---|
| Missing comma between filter and update object | `SyntaxError: Unexpected token, expected ","` | `db.emp.updateOne({ name: "Hammad" }, { $set: { city: "Karachi" } })` |
| Passing an array directly as a filter | `MongoInvalidArgumentError: Query filter must be a plain object or ObjectId` | Wrap conditions in `$and` / `$or`, or use a plain object |
| Unbalanced/mismatched braces `{)` or extra `}` | `SyntaxError: Unexpected token` | Carefully match every `{` with its `}` |
| Using `$eq` as a top-level operator | `unknown top level operator: $eq` | Apply it on the field: `{ field: { $eq: value } }` |
| Using `$not` with a plain value | `$not needs a regex or a document` | Wrap the condition: `{ field: { $not: { $eq: value } } }` |

---

## 8. Quick Reference Cheat Sheet

| Task | Command |
|---|---|
| Projection — include only certain fields | `db.emp.find({ filter }, { field: 1 })` |
| Logical AND | `db.emp.find({ $and: [ { ... }, { ... } ] })` |
| Logical OR | `db.emp.find({ $or: [ { ... }, { ... } ] })` |
| Equal to | `db.emp.find({ field: { $eq: value } })` |
| Not equal to | `db.emp.find({ field: { $ne: value } })` |
| Field does not exist | `db.emp.find({ field: { $exists: false } })` |
| Field exists | `db.emp.find({ field: { $exists: true } })` |

---

## 9. Still To Come

This lecture will be **continued in the next class** — more operators and topics will be added and pushed to this same file. Check back for updates.

---

*Recorded via `Start-Transcript` in PowerShell for student reference — MongoDB Query Operators (Part 1, in progress).*
