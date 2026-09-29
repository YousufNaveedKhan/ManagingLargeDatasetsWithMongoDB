# MongoDB Lecture 02 — Data Types

An overview of MongoDB's **BSON data types**, with a focus on the different ways numbers can be stored (Integer vs Decimal), plus Dates, Timestamps, and ObjectIds — followed by two hands-on examples inserting documents that use most of these types together.

> **Environment:** MongoDB 6.0.13 · Mongosh 2.10.0 · Local instance (`mongodb://127.0.0.1:27017`)

---

## Table of Contents

**Part 1**
- [1. BSON Data Types — Overview](#1-bson-data-types--overview)
- [2. Integer Types — Int32 vs Int64](#2-integer-types--int32-vs-int64)
- [3. Decimal Types — Double vs Decimal128](#3-decimal-types--double-vs-decimal128)
- [4. Setup — Database & Collections](#4-setup--database--collections)
- [5. Inserting a Document with Multiple Data Types](#5-inserting-a-document-with-multiple-data-types)
- [6. Notes & Warnings](#6-notes--warnings)

**Part 2**
- [7. Explicit Int32 — NumberInt()](#7-explicit-int32--numberint)
- [8. NumberLong() the Safe Way — Passing a String](#8-numberlong-the-safe-way--passing-a-string)
- [9. Timestamp](#9-timestamp)
- [10. Explicit ObjectId()](#10-explicit-objectid)
- [11. ISODate with a Specific Date String](#11-isodate-with-a-specific-date-string)
- [12. Full Example — Employees Document](#12-full-example--employees-document)
- [13. Common Mistakes Seen in This Session](#13-common-mistakes-seen-in-this-session)

**Reference**
- [14. Quick Reference Cheat Sheet](#14-quick-reference-cheat-sheet)

---

## 1. BSON Data Types — Overview

MongoDB stores documents in **BSON** (Binary JSON), which supports more data types than plain JSON. Here are the main ones:

| Type | Example |
|---|---|
| String | `"Ali"` |
| Double | `10.5` |
| Int32 | `NumberInt(25)` |
| Int64 | `NumberLong(25)` |
| Decimal128 | `Decimal128("99.99")` |
| Boolean | `true` |
| Null | `null` |
| Object | `{ city: "Karachi" }` |
| Array | `["HTML", "CSS"]` |
| ObjectId | `ObjectId(...)` |
| Date | `ISODate(...)` |
| Timestamp | `Timestamp(...)` |
| Binary | Binary data |
| Regular Expression | `/Ali/i` |
| JavaScript | JavaScript code |
| MinKey | special BSON value (always sorts lowest) |
| MaxKey | special BSON value (always sorts highest) |

---

## 2. Integer Types — Int32 vs Int64

MongoDB has two integer sizes:

| Type | Description |
|---|---|
| **Int32** | 32-bit integer — this is the **default** when you write a plain whole number, e.g. `300` |
| **Int64** | 64-bit integer — used for much larger numbers, created explicitly with `NumberLong()` |

```js
// Plain number → stored as Int32 by default
{ quantity: 300 }

// Explicitly stored as Int64
{ quantity: NumberLong(300) }
```

> 💡 Use `NumberLong()` when a value might exceed the Int32 range (roughly ±2.1 billion) — for example, very large counters, IDs, or timestamps in milliseconds.

---

## 3. Decimal Types — Double vs Decimal128

MongoDB has two ways to store decimal (non-whole) numbers:

| Type | Description |
|---|---|
| **Double** | Standard floating-point number — this is the **default** when you write a decimal, e.g. `0.10` |
| **Decimal128** | High-precision decimal type, created explicitly with `Decimal128("...")` (value passed as a **string**) |

```js
// Plain decimal → stored as Double by default
{ discount: 0.10 }

// Explicitly stored as Decimal128 (higher precision, no floating-point rounding errors)
{ taxRate: Decimal128("99.99") }
```

> 💡 **Double vs Decimal128:** `Double` is fine for most everyday numbers but can introduce small floating-point rounding errors (like the `6050.000000000001` seen in Lecture 02's `$mul` examples). `Decimal128` avoids that and is the right choice for **financial/monetary values** where exact precision matters — always pass the value as a quoted string, e.g. `Decimal128("1.22")`.

---

## 4. Setup — Database & Collections

```js
use lecture02

db.createCollection("users")
db.createCollection("products")
```

---

## 5. Inserting a Document with Multiple Data Types

This single document deliberately uses many different BSON types together, to show how they look once inserted and retrieved:

```js
db.products.insertOne({
  name: "Laptop",                          // String
  unitPrice: 30000,                        // Int32 (default for whole numbers)
  discount: 0.10,                          // Double (default for decimals)
  quantity: NumberLong(300),               // Int64
  taxRate: Decimal128("1.22"),             // Decimal128
  isActive: true,                          // Boolean
  image: null,                             // Null
  brand: {                                 // Object (embedded document)
    brandOne: "Lenovo",
    brandTwo: "Dell",
    brandThree: "HP"
  },
  specifications: ["8GB RAM", "128GB CORE"], // Array
  createdAt: new Date(),                   // Date
  updatedAt: new Date()                    // Date
})
```

Fetching it back with `find()` shows how mongosh displays each type:

```js
db.products.find()
```

```js
[
  {
    _id: ObjectId('6aaea53c2be11a7e4d329a43'),
    name: 'Laptop',
    unitPrice: 30000,
    discount: 0.1,
    quantity: Long('300'),
    taxRate: Decimal128('1.22'),
    isActive: true,
    image: null,
    brand: { brandOne: 'Lenovo', brandTwo: 'Dell', brandThree: 'HP' },
    specifications: [ '8GB RAM', '128GB CORE' ],
    createdAt: ISODate('2026-09-19T15:07:40.312Z'),
    updatedAt: ISODate('2026-09-19T15:07:40.312Z')
  }
]
```

Notice how mongosh displays the special types back to you:
- `NumberLong(300)` → shown as `Long('300')`
- `Decimal128("1.22")` → shown as `Decimal128('1.22')`
- `new Date()` → shown as `ISODate('...')`
- A plain whole number (`unitPrice: 30000`) and a plain decimal (`discount: 0.1`) are shown as-is — no special wrapper, because they're the default Int32/Double types.

---

## 6. Notes & Warnings

> 🚫 Passing a plain **number** (not a string) to `NumberLong()` triggers a deprecation warning:
> ```js
> NumberLong(300)
> // → Warning: NumberLong: specifying a number as argument is deprecated and may
> //   lead to loss of precision, pass a string instead
> ```
> **Recommended:** pass it as a string instead — `NumberLong("300")` — to avoid any precision loss, especially for very large numbers.

---

## 7. Explicit Int32 — `NumberInt()`

Just like `NumberLong()` forces Int64, `NumberInt()` explicitly forces a value to be stored as **Int32** — useful when you want to be clear/consistent about the type rather than relying on the default.

```js
{ age: NumberInt(20) }
```

> 💡 Since a plain whole number is already Int32 by default, `NumberInt()` is mostly for **explicitness** — making the schema's intent obvious to anyone reading the code, and for consistency across a team's codebase.

---

## 8. NumberLong() the Safe Way — Passing a String

Following the warning from Part 1, here's `NumberLong()` used **correctly** — with the value passed as a quoted string, which avoids the deprecation warning entirely:

```js
{ empCode: NumberLong("123456789") }
```

No warning is produced this way, and there's no risk of precision loss for large numbers.

---

## 9. Timestamp

`Timestamp` is a special BSON type mainly used internally by MongoDB (e.g. in the oplog for replication) to record **when an operation happened**, with second + ordinal precision. You can also add one manually with `new Timestamp()`:

```js
{ timestamp: new Timestamp() }
```

> 💡 For general "when was this document created/updated" fields in your own application data, prefer `Date` (`new Date()`) — `Timestamp` is intended for MongoDB's own internal operation ordering, not everyday app timestamps.

---

## 10. Explicit `ObjectId()`

MongoDB auto-generates an `_id` of type `ObjectId` for every document if you don't supply one. You can also generate one explicitly and assign it yourself:

```js
{ _id: ObjectId() }
```

Calling `ObjectId()` with no arguments generates a brand-new, unique id — same as what MongoDB would auto-assign if you left `_id` out entirely.

---

## 11. ISODate with a Specific Date String

Besides `new Date()` (current date/time), you can create a `Date` for a **specific** point in time by passing a date string to `ISODate()`:

```js
{ joiningDate: ISODate("2026-07-09") }
```

This stores an exact calendar date (midnight UTC on that day), as opposed to `new Date()` which captures the exact current timestamp at the moment the command runs.

---

## 12. Full Example — Employees Document

Putting it all together — a single `employees` document using nearly every data type covered so far:

```js
db.employees.insertOne({
  name: "Anusha",
  age: NumberInt(20),                            // explicit Int32
  empCode: NumberLong("123456789"),               // Int64, safely passed as a string
  attendance: 92.5,                                // Double (default)
  salary: Decimal128("25000.08"),                  // Decimal128 (precise money value)
  isActive: true,                                  // Boolean
  phone: null,                                      // Null
  skills: ["HTML", "CSS", "PYTHON", "JS", "C#"],   // Array
  projects: [                                       // Array of embedded documents
    { name: "Starteq", status: "Completed" },
    { name: "Storm Digitizing", status: "In Progress" }
  ],
  address: {                                        // Object (embedded document)
    city: "Karachi",
    area: "Gulshan",
    postalCode: "75300"
  },
  joiningDate: ISODate("2026-07-09"),               // Date — specific date
  createdAt: new Date(),                            // Date — current timestamp
  timestamp: new Timestamp(),                       // Timestamp
  _id: ObjectId()                                   // explicit ObjectId
})
```

```js
{
  acknowledged: true,
  insertedId: ObjectId('6abbcf30c31f3a11e7d9e737')
}
```

> 💡 Notice `_id` was placed as the **last** key in this document, not the first. MongoDB doesn't care about field order when you're the one supplying `_id` explicitly — it's still recognized and used correctly. It's just a matter of style to normally put `_id` first for readability.

---

## 13. Common Mistakes Seen in This Session

| Mistake | Error | Fix |
|---|---|---|
| Running `db.createCollection("employees")` when a collection with that name already exists | `MongoServerError[NamespaceExists]: Collection <db>.employees already exists.` | Check `show collections` first, or just skip creation and `insertOne()`/`insertMany()` directly — MongoDB creates the collection automatically on first insert if it doesn't already exist |
| Passing a plain number to `NumberLong()` | Deprecation warning: may lead to loss of precision | Always pass a quoted string: `NumberLong("123456789")` |

---

## 14. Quick Reference Cheat Sheet

| Task | Command |
|---|---|
| Store a whole number (default) | `{ field: 300 }` → Int32 |
| Store a whole number explicitly as Int32 | `{ field: NumberInt(300) }` → Int32 |
| Store a large integer explicitly (safe form) | `{ field: NumberLong("300") }` → Int64 |
| Store a decimal number (default) | `{ field: 0.10 }` → Double |
| Store a precise decimal (money, etc.) | `{ field: Decimal128("99.99") }` → Decimal128 |
| Store true/false | `{ field: true }` → Boolean |
| Store an empty/unknown value | `{ field: null }` → Null |
| Store an embedded document | `{ field: { key: "value" } }` → Object |
| Store a list of values | `{ field: [ ... ] }` → Array |
| Store the current date/time | `{ field: new Date() }` → Date |
| Store a specific calendar date | `{ field: ISODate("YYYY-MM-DD") }` → Date |
| Store MongoDB's internal operation timestamp | `{ field: new Timestamp() }` → Timestamp |
| Generate/assign a new unique id explicitly | `{ _id: ObjectId() }` → ObjectId |

---

*Recorded via `Start-Transcript` in PowerShell for student reference — MongoDB Data Types (Parts 1 & 2 — complete).*
