# MongoDB Lecture 02 — Data Types

> **Status: Partial / Work in Progress**
> This is Part 1 of this lecture — it will be continued in a future class. This file (and the accompanying commands file) will be updated and pushed again once more of the lecture is recorded.

An overview of MongoDB's **BSON data types**, with a focus on the different ways numbers can be stored (Integer vs Decimal), followed by a hands-on example inserting a document that uses most of these types together.

> **Environment:** MongoDB 6.0.13 · Mongosh 2.10.0 · Local instance (`mongodb://127.0.0.1:27017`)

---

## Table of Contents

- [1. BSON Data Types — Overview](#1-bson-data-types--overview)
- [2. Integer Types — Int32 vs Int64](#2-integer-types--int32-vs-int64)
- [3. Decimal Types — Double vs Decimal128](#3-decimal-types--double-vs-decimal128)
- [4. Setup — Database & Collections](#4-setup--database--collections)
- [5. Inserting a Document with Multiple Data Types](#5-inserting-a-document-with-multiple-data-types)
- [6. Notes & Warnings](#6-notes--warnings)
- [7. Quick Reference Cheat Sheet](#7-quick-reference-cheat-sheet)
- [8. Still To Come](#8-still-to-come)

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

> 💡 **Double vs Decimal128:** `Double` is fine for most everyday numbers but can introduce small floating-point rounding errors (like the `6050.000000000001` seen in Lecture 03's `$mul` examples). `Decimal128` avoids that and is the right choice for **financial/monetary values** where exact precision matters — always pass the value as a quoted string, e.g. `Decimal128("1.22")`.

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

## 7. Quick Reference Cheat Sheet

| Task | Command |
|---|---|
| Store a whole number (default) | `{ field: 300 }` → Int32 |
| Store a large integer explicitly | `{ field: NumberLong("300") }` → Int64 |
| Store a decimal number (default) | `{ field: 0.10 }` → Double |
| Store a precise decimal (money, etc.) | `{ field: Decimal128("99.99") }` → Decimal128 |
| Store true/false | `{ field: true }` → Boolean |
| Store an empty/unknown value | `{ field: null }` → Null |
| Store an embedded document | `{ field: { key: "value" } }` → Object |
| Store a list of values | `{ field: [ ... ] }` → Array |
| Store the current date/time | `{ field: new Date() }` → Date |

---

## 8. Still To Come

This lecture will be **continued in a future class** — more data types and topics (Timestamp, Binary, ObjectId internals, Regular Expressions, MinKey/MaxKey in practice, etc.) will be added and pushed to this same file. Check back for updates.

---

*Recorded via `Start-Transcript` in PowerShell for student reference — MongoDB Data Types (Part 1, in progress).*
