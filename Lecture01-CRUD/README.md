# MongoDB Lecture 01 — CRUD Operations

A hands-on walkthrough of core MongoDB commands using `mongosh`, covering database/collection creation, inserting documents, querying with comparison operators, updating (including aggregation-pipeline updates), deleting, and dropping a database.

> **Environment:** MongoDB 6.0.13 · Mongosh 2.10.0 · Local instance (`mongodb://127.0.0.1:27017`)

---

## Table of Contents

- [1. Connecting & Viewing Databases](#1-connecting--viewing-databases)
- [2. Creating a Database & Collection](#2-creating-a-database--collection)
- [3. Inserting Documents](#3-inserting-documents)
- [4. Querying Documents](#4-querying-documents)
- [5. Comparison Query Operators](#5-comparison-query-operators)
- [6. Updating Documents](#6-updating-documents)
- [7. Updating with Aggregation Pipelines](#7-updating-with-aggregation-pipelines)
- [8. Deleting Documents](#8-deleting-documents)
- [9. Dropping Collections & Databases](#9-dropping-collections--databases)
- [10. Quick Reference Cheat Sheet](#10-quick-reference-cheat-sheet)

---

## 1. Connecting & Viewing Databases

Start the shell and connect to the local server:

```js
mongosh
```

List all databases on the server:

```js
show dbs
```

Switch to (or create) a database — MongoDB only actually creates it once you insert data:

```js
use lecture01
```

---

## 2. Creating a Database & Collection

```js
db.createCollection("students")
```

Once a collection is created (or a document is inserted), the database becomes visible in `show dbs`.

---

## 3. Inserting Documents

### `insertOne()` — insert a single document

```js
db.students.insertOne({
  name: "Laiba",
  email: "laiba@gmail.com",
  course: "HDSE",
  marks: 91
})
```

### `insertMany()` — insert multiple documents at once

```js
db.students.insertMany([
  {
    name: "Anusha",
    email: "anusha@gmail.com",
    course: "ADSE",
    marks: 90
  },
  {
    name: "Abu Hurerah",
    email: "abuhurerah@gmail.com",
    course: "DISM",
    marks: 80
  }
])
```

**Custom `_id`:** By default MongoDB auto-generates an `ObjectId`, but you can set your own:

```js
db.employees.insertOne({
  _id: 6001,
  name: "Owais",
  email: "owais@gmail.com",
  department: "Marketing",
  salary: 85000,
  skills: ["HTML", "CSS", "JS"]
})
```

> ⚠️ If you provide a custom `_id` that already exists in the collection, MongoDB will throw a duplicate key error.

---

## 4. Querying Documents

### `find()` — return all documents

```js
db.students.find()
```

### `find({ field: value })` — filter by an exact match

```js
db.students.find({ course: "DISM" })
```

---

## 5. Comparison Query Operators

| Operator | Meaning              | Example                                    |
|----------|----------------------|---------------------------------------------|
| `$gt`    | greater than          | `db.employees.find({ salary: { $gt: 90000 } })`  |
| `$gte`   | greater than or equal | `db.employees.find({ salary: { $gte: 90000 } })` |
| `$lt`    | less than             | `db.employees.find({ salary: { $lt: 75000 } })`  |
| `$lte`   | less than or equal    | `db.employees.find({ salary: { $lte: 75000 } })` |
| `$ne`    | not equal             | `db.employees.find({ salary: { $ne: 75000 } })`  |

Example — employees earning more than 80,000:

```js
db.employees.find({ salary: { $gt: 80000 } })
```

---

## 6. Updating Documents

### `updateOne()` — update the first matching document

Rename a field's value using `$set`:

```js
db.employees.updateOne(
  { name: "John" },
  { $set: { name: "Hammad" } }
)
```

Update multiple fields in one call — all fields go **inside a single `$set` object**:

```js
db.employees.updateOne(
  { name: "Hammad" },
  { $set: { email: "hammad@gmail.com", city: "Lahore" } }
)
```

> 🚫 **Common mistake:** writing `{ $set: {...}, {...} }` or `{ $set: [{...}, {...}] }` will throw a syntax/server error. Every field you want to update must live inside **one** `$set` object:
> ```js
> // ❌ Wrong
> { $set: [{ email: "..." }, { city: "..." }] }
>
> // ✅ Correct
> { $set: { email: "...", city: "..." } }
> ```

`updateOne()` on a document with a custom `_id`:

```js
db.employees.updateOne(
  { _id: 6001 },
  { $set: { name: "Saad", email: "saad@gmail.com", city: "Karachi" } }
)
```

---

## 7. Updating with Aggregation Pipelines

`updateMany()` can take a **pipeline** (an array of stages) instead of a plain update document — useful for more advanced transformations.

Update every student in the `"ADSE"` course to `"AI"`:

```js
db.students.updateMany(
  { course: "ADSE" },
  [ { $set: { course: "AI" } } ]
)
```

Add new fields to every matched document:

```js
db.students.updateMany(
  { course: "AI" },
  [ { $set: { city: "Karachi", country: "Pakistan" } } ]
)
```

> 💡 Note the square brackets `[ ]` around the `$set` stage — that's what makes this a pipeline-style update instead of a regular one.

---

## 8. Deleting Documents

### `deleteOne()` — delete the first matching document

```js
db.employees.deleteOne({ name: "John" })
```

### `deleteMany()` — delete all matching documents

```js
db.students.deleteMany({ course: "AI" })
```

---

## 9. Dropping Collections & Databases

List collections and their metadata in the current database:

```js
show collections
db.getCollectionInfos()
```

Drop a single collection:

```js
db.student.drop()
```

Drop the **entire current database**:

```js
db.dropDatabase()
```

> ⚠️ `dropDatabase()` is irreversible — double-check `db` (current database) before running it, since it deletes everything in that database.

Exit the shell:

```js
exit
```

---

## 10. Quick Reference Cheat Sheet

| Task                          | Command                                                            |
|--------------------------------|---------------------------------------------------------------------|
| Show all databases             | `show dbs`                                                          |
| Switch/create database         | `use <dbName>`                                                      |
| Create a collection            | `db.createCollection("<name>")`                                     |
| Show collections in current DB | `show collections`                                                   |
| Insert one document            | `db.<coll>.insertOne({ ... })`                                      |
| Insert many documents          | `db.<coll>.insertMany([{ ... }, { ... }])`                          |
| Find all documents             | `db.<coll>.find()`                                                  |
| Find with filter               | `db.<coll>.find({ field: value })`                                  |
| Update one document            | `db.<coll>.updateOne({ filter }, { $set: { ... } })`                |
| Update many (pipeline)         | `db.<coll>.updateMany({ filter }, [ { $set: { ... } } ])`           |
| Delete one document            | `db.<coll>.deleteOne({ filter })`                                   |
| Delete many documents          | `db.<coll>.deleteMany({ filter })`                                  |
| Drop a collection              | `db.<coll>.drop()`                                                  |
| Drop current database          | `db.dropDatabase()`                                                 |

---

## 📁 Collections Used in This Lecture

- **`students`** — `name`, `email`, `course`, `marks`
- **`employees`** — `name`, `email`, `department`, `city`, `salary`, `skills[]`
- **`fitness_tracker` (pre-existing DB)** — `nutritions`, `workouts`, `notifications`, `progresses`, `reminders`, `users`, `feedbacks`

---

*Recorded via `Start-Transcript` in PowerShell for student reference — MongoDB CRUD basics.*
