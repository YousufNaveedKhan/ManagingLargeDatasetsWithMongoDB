# MongoDB Lecture 05 — Indexing

What an **index** is, why it makes queries fast, how to check whether a query used one with `explain()`, and every index type covered in class: single field, compound, unique, multikey, text, geospatial, wildcard, partial, sparse, TTL and hidden indexes, plus how to drop them.

> **Environment:** MongoDB 6.0.13 · VS Code + MongoDB for VS Code extension (Playground) · Local instance (`mongodb://127.0.0.1:27017`)
>
> **Playground file:** [`lec05-commands.mongodb.js`](./lec05-commands.mongodb.js) · **Database:** `lecture05_indexing`

---

## Table of Contents

**Part 1 — Theory**
- [1. What Is an Index? (The Book Analogy)](#1-what-is-an-index-the-book-analogy)
- [2. How MongoDB Stores an Index — B-Tree](#2-how-mongodb-stores-an-index--b-tree)
- [3. Advantages and Costs of Indexes](#3-advantages-and-costs-of-indexes)

**Part 2 — Practical**
- [4. Setup — The `book` Collection](#4-setup--the-book-collection)
- [5. The Default `_id` Index](#5-the-default-_id-index)
- [6. Reading `explain("executionStats")`](#6-reading-explainexecutionstats)
- [7. Single Field Index](#7-single-field-index)
- [8. Compound Index and the Prefix Rule](#8-compound-index-and-the-prefix-rule)
- [9. Unique Index](#9-unique-index)
- [10. Multikey Index (Arrays)](#10-multikey-index-arrays)
- [11. Text Index](#11-text-index)
- [12. Geospatial Index (2dsphere)](#12-geospatial-index-2dsphere)
- [13. Wildcard Index](#13-wildcard-index)
- [14. Partial Index](#14-partial-index)
- [15. Sparse Index](#15-sparse-index)
- [16. TTL Index (Auto-Delete)](#16-ttl-index-auto-delete)
- [17. Hidden Index](#17-hidden-index)
- [18. Dropping Indexes](#18-dropping-indexes)

**Reference**
- [19. Things to Remember](#19-things-to-remember)
- [20. Quick Reference Cheat Sheet](#20-quick-reference-cheat-sheet)

---

## 1. What Is an Index? (The Book Analogy)

Think of a 500-page book. You want the page about **"Sharding"**.

- **Without an index:** you start at page 1 and turn every page until you find it. In MongoDB this is a **Collection Scan (`COLLSCAN`)**: every document is checked.
- **With an index:** you open the index at the back of the book, find "Sharding → page 12", and jump straight there. In MongoDB this is an **Index Scan (`IXSCAN`)**.

An **index** is a separate, **sorted** list of the values of one or more fields, where each value points to the document it came from.

| Book | MongoDB |
|---|---|
| Book pages | Documents in a collection |
| Index at the back of the book | Index on a field |
| Topic name in the index | Indexed field value |
| Page number | Pointer to the document |
| Reading every page | `COLLSCAN` |
| Using the index | `IXSCAN` |

---

## 2. How MongoDB Stores an Index — B-Tree

MongoDB stores indexes in a **B-Tree** (balanced tree) data structure.

```
                    [ 50 ]
                  /        \
           [ 20 | 35 ]    [ 70 | 90 ]
           /   |    \       /   |   \
        [10] [25] [40]  [60] [80] [95]
```

- Values are kept **in sorted order**.
- To find a value, MongoDB starts at the top (root) and at each level goes **left or right**, so it skips most of the data.
- The tree stays **balanced**: every leaf is at the same depth, so every search takes about the same number of steps.

That is why a search through 1 crore documents with an index takes only a few steps instead of 1 crore checks.

---

## 3. Advantages and Costs of Indexes

| Advantages | Costs |
|---|---|
| Much faster `find`, `sort` and `$match` | Extra **disk space and RAM** for every index |
| Fewer documents examined | **Inserts, updates and deletes become slower**, because every index must also be updated |
| Can enforce rules (unique values, auto-delete) | Too many indexes waste memory |

> **Rule:** create indexes on the fields you **search, sort or filter on often** — not on every field.

---

## 4. Setup — The `book` Collection

```js
use('lecture05_indexing');

db.book.insertMany([
  { pageNo: 1,  chapter: 1, topic: "Introduction",   tags: ["mongodb"] },
  { pageNo: 2,  chapter: 1, topic: "Installation",   tags: ["mongodb"] },
  { pageNo: 3,  chapter: 2, topic: "CRUD",           tags: ["insert", "find"] },
  { pageNo: 4,  chapter: 2, topic: "Update",         tags: ["update"] },
  { pageNo: 5,  chapter: 3, topic: "Operators",      tags: ["query", "operators"] },
  { pageNo: 6,  chapter: 3, topic: "Projection",     tags: ["query"] },
  { pageNo: 7,  chapter: 4, topic: "Aggregation",    tags: ["pipeline", "group"] },
  { pageNo: 8,  chapter: 4, topic: "Lookup",         tags: ["pipeline", "join"] },
  { pageNo: 9,  chapter: 5, topic: "Indexing",       tags: ["index", "performance"] },
  { pageNo: 10, chapter: 5, topic: "Unique Index",   tags: ["index"] },
  { pageNo: 11, chapter: 6, topic: "Replication",    tags: ["replica", "backup"] },
  { pageNo: 12, chapter: 6, topic: "Sharding",       tags: ["shard", "scaling"] }
])
```

The collection is a small "book": every document is one page.

---

## 5. The Default `_id` Index

```js
db.book.getIndexes()
```

Output:

```js
[ { v: 2, key: { _id: 1 }, name: '_id_' } ]
```

Every collection gets an index on `_id` **automatically**. You cannot drop it.

---

## 6. Reading `explain("executionStats")`

Add `.explain("executionStats")` to the end of any `find()` to see **how** MongoDB ran it.

```js
db.book.find({ chapter: 2 }).explain("executionStats")
```

The three things to look at:

| Field | Meaning | Good value |
|---|---|---|
| `winningPlan.stage` (or `inputStage.stage`) | How the search was done | `IXSCAN` (index used) — `COLLSCAN` means no index |
| `executionStats.totalDocsExamined` | How many documents MongoDB checked | As close to `nReturned` as possible |
| `executionStats.nReturned` | How many documents came back | — |

Without any index, the query above shows:

```
stage: 'COLLSCAN'
totalDocsExamined: 12     ← all 12 pages checked
nReturned: 2              ← only 2 needed
```

---

## 7. Single Field Index

An index on **one field**. `1` = ascending, `-1` = descending.

```js
db.book.createIndex({ topic: 1 })
```

MongoDB names it automatically: `topic_1`.

```js
db.book.find({ topic: "Introduction" }).explain("executionStats")
```

```
stage: 'IXSCAN'  (inside a FETCH stage)
totalKeysExamined: 1
totalDocsExamined: 1
nReturned: 1
```

Only **1** document was examined instead of 12.

> For a single field index, `1` or `-1` doesn't matter much — MongoDB can read the index in either direction.

---

## 8. Compound Index and the Prefix Rule

An index on **more than one field**.

```js
db.book.createIndex({ chapter: 1, topic: 1 })
```

The index is sorted first by `chapter`, then by `topic` inside each chapter — like a phone directory sorted by city, then by name.

### The Prefix Rule

A compound index can be used only when the query includes its fields **starting from the left**.

Index `{ chapter: 1, topic: 1 }`:

| Query | Uses the index? |
|---|---|
| `{ chapter: 2 }` | ✅ Yes (left-most field) |
| `{ chapter: 2, topic: "CRUD" }` | ✅ Yes (both fields) |
| `{ topic: "CRUD" }` | ❌ No (skips `chapter`) |

```js
db.book.find({ chapter: 2 }).explain("executionStats")                 // IXSCAN
db.book.find({ chapter: 2, topic: "CRUD" }).explain("executionStats")  // IXSCAN
```

> Directory analogy: you can find "everyone in Karachi" or "Ali in Karachi", but you cannot find "everyone named Ali" quickly, because names are only sorted *inside* each city.

---

## 9. Unique Index

Does not allow **duplicate values** in a field — like a roll number.

```js
db.students.insertMany([
  { rollNo: 1, name: "Ali",    city: "Karachi",  marks: 85 },
  { rollNo: 2, name: "Hammad", city: "Lahore",   marks: 89 },
  { rollNo: 3, name: "",       city: "Peshawar", marks: 81 }
])

db.students.createIndex({ rollNo: 1 }, { unique: true })
```

Now try inserting a duplicate `rollNo`:

```js
db.students.insertOne({ rollNo: 3, name: "Irfan", city: "Quetta", marks: 100 })
```

```
MongoServerError: E11000 duplicate key error collection: lecture05_indexing.students
index: rollNo_1 dup key: { rollNo: 3 }
```

> If the collection **already** has duplicate values, `createIndex` with `unique: true` will fail. Clean the data first.

---

## 10. Multikey Index (Arrays)

When you index a field that holds an **array**, MongoDB automatically makes a **multikey index**: it adds **one index entry for every array element**.

```js
db.book.createIndex({ tags: 1 })

db.book.find({ tags: "mongodb" }).explain("executionStats")
```

```
stage: 'IXSCAN'
isMultiKey: true
nReturned: 2       ← pages 1 and 2
```

You don't write any special option — `isMultiKey: true` appears on its own.

---

## 11. Text Index

Used to **search words inside text**, like a search bar.

```js
db.articles.insertMany([
  { title: "MongoDB Basics",  body: "MongoDB is a nosql database" },
  { title: "Indexing Guide",  body: "INDEXES MAKE SEARCH FAST" },
  { title: "NoSQL Basics",    body: "SQL uses tables and rows" }
])

db.articles.createIndex({ title: "text", body: "text" })
```

Search with `$text` and `$search`:

```js
db.articles.find({ $text: { $search: "mongodb" } })   // "MongoDB Basics"
db.articles.find({ $text: { $search: "fast" } })      // "Indexing Guide"
```

- The search is **case-insensitive** — `"fast"` found `"FAST"`.
- A collection can have **only one** text index (but it can cover several fields, like `title` and `body` above).
- `$text` **needs** a text index; without one it gives an error.

---

## 12. Geospatial Index (2dsphere)

Used for **location** searches: "find the branches near me".

```js
db.branches.insertMany([
  { name: "Gulshan Branch", location: { type: "Point", coordinates: [67.09, 24.92] } },
  { name: "Saddar Branch",  location: { type: "Point", coordinates: [67.03, 24.86] } },
  { name: "Clifton Branch", location: { type: "Point", coordinates: [67.03, 24.81] } }
])

db.branches.createIndex({ location: "2dsphere" })
```

> ⚠️ In GeoJSON, `coordinates` are **`[longitude, latitude]`** — longitude first. Google Maps shows them the other way around (latitude first).

Find branches within **5 km** of a point:

```js
db.branches.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [67.08, 24.89] },
      $maxDistance: 5000
    }
  }
})
```

- `$maxDistance` is in **metres** (5000 = 5 km).
- `$near` returns results **sorted from nearest to farthest**.
- Result: only **Gulshan Branch** (≈ 3.5 km). Saddar (≈ 6 km) and Clifton (≈ 10 km) are outside 5 km.

---

## 13. Wildcard Index

Used when documents have **different fields inside an object** and you don't know in advance which ones will be searched.

```js
db.products.insertMany([
  { name: "Laptop", specs: { ram: "16GB", cpu: "i7" } },
  { name: "Phone",  specs: { camera: "48MP", battery: "5000mAh" } }
])

db.products.createIndex({ "specs.$**": 1 })
```

One index now covers **every** field inside `specs` (`ram`, `cpu`, `camera`, `battery`, and any new one added later).

```js
db.products.find({ "specs.camera": "48MP" }).explain("executionStats")   // IXSCAN
```

---

## 14. Partial Index

Indexes **only the documents that match a condition**, so the index is smaller.

```js
db.book.createIndex(
  { pageNo: 1 },
  { partialFilterExpression: { chapter: { $gte: 5 } } }
)
```

Only pages from chapter 5 onwards are in this index.

```js
db.book.find({ pageNo: 8 }).explain("executionStats")
```

This gives **`COLLSCAN`**. Why? The query does not say `chapter >= 5`, so MongoDB can't be sure the result is inside the index, and it doesn't use it.

To use the partial index, the query must include the same condition:

```js
db.book.find({ pageNo: 10, chapter: { $gte: 5 } }).explain("executionStats")   // IXSCAN
```

---

## 15. Sparse Index

Indexes **only the documents that have the field**. Documents without the field are skipped.

```js
db.students.insertOne({ rollNo: 5, name: "Hamza", email: "hamza@gmail.com" })

db.students.createIndex({ email: 1 }, { sparse: true })
```

Only Hamza has `email`, so only Hamza's document goes into this index.

> Without `{ sparse: true }` it is a normal index, and documents without `email` are stored in it as `null`.
>
> **Common use:** `{ unique: true, sparse: true }` together — "email must be unique, but students without an email are allowed."

---

## 16. TTL Index (Auto-Delete)

**TTL = Time To Live.** MongoDB **deletes documents automatically** after a set time. Perfect for OTP codes, login sessions, and temporary logs.

```js
db.otp.insertOne({ code: 57551, createdAt: new Date() })

db.otp.createIndex({ createdAt: 1 }, { expireAfterSeconds: 15 })
```

```js
db.otp.find()   // run now: the OTP is there
                // run again after about a minute: it is gone
```

- The field must hold a **Date** value.
- MongoDB's clean-up job runs **once every 60 seconds**, so a document may stay a little longer than 15 seconds.

---

## 17. Hidden Index

Hides an index from the query planner **without deleting it**. Useful to test "what happens if I drop this index?" safely.

```js
db.book.hideIndex("topic_1")      // queries stop using it
db.book.unhideIndex("topic_1")    // back in use
```

A hidden index is still **updated** on every write, so it can be turned back on instantly — no rebuilding needed.

---

## 18. Dropping Indexes

```js
db.book.getIndexes()            // see all index names

db.book.dropIndex("topic_1")    // drop one index by name

db.book.dropIndexes()           // drop ALL indexes (except _id)
```

---

## 19. Things to Remember

| Rule | Detail |
|---|---|
| Every collection has an `_id` index | Created automatically; cannot be dropped |
| `COLLSCAN` = slow, `IXSCAN` = fast | Check with `.explain("executionStats")` |
| Compound index follows the **prefix rule** | Query must use fields from the left |
| Indexes slow down writes | Don't index every field |
| One text index per collection | It can cover multiple fields |
| GeoJSON is `[longitude, latitude]` | Longitude first |
| `$maxDistance` is in metres | 5000 = 5 km |
| Partial index needs the filter in the query | Otherwise `COLLSCAN` |
| `sparse` must be written as an option | `{ sparse: true }` |
| TTL deletes are not instant | Background job runs every 60 seconds |

---

## 20. Quick Reference Cheat Sheet

| Task | Command |
|---|---|
| List indexes | `db.col.getIndexes()` |
| Check if an index was used | `db.col.find({...}).explain("executionStats")` |
| Single field index | `db.col.createIndex({ field: 1 })` |
| Compound index | `db.col.createIndex({ a: 1, b: 1 })` |
| Unique index | `db.col.createIndex({ field: 1 }, { unique: true })` |
| Multikey index | `db.col.createIndex({ arrayField: 1 })` (automatic) |
| Text index | `db.col.createIndex({ title: "text", body: "text" })` |
| Text search | `db.col.find({ $text: { $search: "word" } })` |
| Geospatial index | `db.col.createIndex({ location: "2dsphere" })` |
| Nearby search | `{ location: { $near: { $geometry: {...}, $maxDistance: 5000 } } }` |
| Wildcard index | `db.col.createIndex({ "obj.$**": 1 })` |
| Partial index | `db.col.createIndex({ f: 1 }, { partialFilterExpression: { ... } })` |
| Sparse index | `db.col.createIndex({ f: 1 }, { sparse: true })` |
| TTL index | `db.col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 })` |
| Hide / unhide | `db.col.hideIndex("name")` / `db.col.unhideIndex("name")` |
| Drop one / all | `db.col.dropIndex("name")` / `db.col.dropIndexes()` |

---

*Recorded via a VS Code MongoDB Playground for student reference — MongoDB Indexing.*
