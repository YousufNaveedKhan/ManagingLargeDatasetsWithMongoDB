# MongoDB Lecture 04 — Aggregation Pipeline (Intro)

> **Status: Partial / Work in Progress**
> This is Part 1 of this lecture — it will be continued in a future class. This file (and the accompanying commands file) will be updated and pushed again once more of the lecture is recorded.

An introduction to MongoDB's **Aggregation Pipeline**, starting with `$match`, `$project`, `$sort`, `$limit`, and `$group`. This lecture was worked on using **MongoDB for VS Code**'s Playground feature instead of `mongosh` directly in PowerShell — see the setup notes below.

> **Environment:** MongoDB 6.0.13 · VS Code + MongoDB for VS Code extension · Local instance (`mongodb://127.0.0.1:27017`)

---

## Table of Contents

- [1. Two Ways to Work with MongoDB](#1-two-ways-to-work-with-mongodb)
- [2. What Is a Playground, and How to Use One](#2-what-is-a-playground-and-how-to-use-one)
- [3. Setup — Database & Collection](#3-setup--database--collection)
- [4. What Is the Aggregation Pipeline?](#4-what-is-the-aggregation-pipeline)
- [5. Stage — $match](#5-stage--match)
- [6. Combining Stages — $match + $project + $sort + $limit](#6-combining-stages--match--project--sort--limit)
- [7. Stage — $group](#7-stage--group)
- [8. Quick Reference Cheat Sheet](#8-quick-reference-cheat-sheet)
- [9. Still To Come](#9-still-to-come)

---

## 1. Two Ways to Work with MongoDB

So far in this course, all work has been done via `mongosh` in PowerShell. There are two common ways to work with MongoDB day-to-day, and you're free to use either:

### Option A — MongoDB Compass (built-in Shell)

[MongoDB Compass](https://www.mongodb.com/products/compass) is MongoDB's official GUI application. Besides browsing databases/collections visually, it has a built-in **Shell** tab where you can run the exact same `mongosh`-style commands you've been using in PowerShell, just inside the Compass window instead of a separate terminal.

### Option B — VS Code + "MongoDB for VS Code" Extension (Playgrounds)

Alternatively, you can work entirely inside **Visual Studio Code**:

1. Install the **MongoDB for VS Code** extension from the VS Code Extensions marketplace.
2. Connect it to your local (or remote) MongoDB instance using a connection string (e.g. `mongodb://127.0.0.1:27017`).
3. Create a **Playground** — a special `.mongodb.js` file where you write and run MongoDB commands directly inside VS Code, with IntelliSense/autocomplete support.

This lecture's work was done using **Option B — a VS Code Playground**.

---

## 2. What Is a Playground, and How to Use One

A **Playground** is just a JavaScript file (extension `.mongodb.js`) that VS Code's MongoDB extension understands. It lets you write a whole sequence of MongoDB commands (database selection, collection creation, inserts, queries, aggregations, etc.) in one file, run them with a single click/shortcut, and see results inside VS Code — instead of typing commands one at a time into a terminal shell.

### How to create and use one:

1. In VS Code, open the **Command Palette** (`Ctrl+Shift+P`) and run **"MongoDB: Create New Playground"** (or click the "Create Playground" button after connecting in the MongoDB extension's sidebar).
2. VS Code opens a new file with a default template (shown below) — this is your Playground.
3. Write your commands in the file. Use `use('<dbName>')` at the top to select which database you're working in.
4. Run the whole file (or just the currently selected lines) using the **"Run Playground"** button in the top-right of the editor, or the keyboard shortcut VS Code shows for it.
5. Results of the **last command** run appear in a **Results panel** inside VS Code.
6. **Save the file** (`Ctrl+S`) like any normal file — give it a meaningful name (e.g. `lecture04-aggregation.mongodb.js`) so you can reopen and rerun it later, or commit it to GitHub just like the `.js` command files from earlier lectures.

### Default Playground template (for reference):

```js
/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/
```

> 💡 Key differences from `mongosh` in PowerShell: you don't retype `db.collection.find()` style commands one at a time into a prompt — you write the **entire script** in the file, and only the output of the **last** command in the file (or the last command in your current selection) shows in the Results panel. Use `console.log()` if you want to print something mid-script without it being the "last" result.

---

## 3. Setup — Database & Collection

```js
// Select the database to use.
use('lecture04');

db.createCollection('students');
```

Insert several student documents, explicitly generating a new `ObjectId()` for each `_id`:

```js
db.students.insertMany([
  { _id: ObjectId(), name: "Laiba", course: "ADSE", city: "Karachi", marks: 85 },
  { _id: ObjectId(), name: "Anusha", course: "DISM", city: "Quetta", marks: 99 },
  { _id: ObjectId(), name: "Abu Hurerah", course: "CPISM", city: "Lahore", marks: 78 },
  { _id: ObjectId(), name: "Abdul Rehman", course: "HDSE", city: "Peshawar", marks: 53 },
  { _id: ObjectId(), name: "Hamza Kamran", course: "ADSE", city: "Lahore", marks: 100 },
  { _id: ObjectId(), name: "Anum Akram", course: "DISM", city: "Karachi", marks: 87 }
]);

db.students.find();
```

---

## 4. What Is the Aggregation Pipeline?

`db.collection.aggregate([ ... ])` runs a **pipeline** — a sequence of processing **stages**, each written as `{ $stageName: { ... } }`. Documents flow through the stages in order: each stage takes the output of the previous stage as its input, transforms it in some way (filtering, reshaping, sorting, grouping, etc.), and passes the result to the next stage. The final stage's output is what you get back.

Think of it like a pipe (hence "pipeline") — data goes in one end, passes through each stage one at a time, and comes out the other end transformed.

---

## 5. Stage — `$match`

`$match` **filters** documents — exactly like the filter you'd pass to `find()`, but as the first (or any) stage of a pipeline. Only documents that satisfy the condition continue on to the next stage.

```js
db.students.aggregate([
  { $match: { marks: { $gt: 90 } } }
])
```

This returns only students with `marks` greater than 90 — same filtering logic you already know from `find()`, just wrapped as a pipeline stage.

---

## 6. Combining Stages — `$match` + `$project` + `$sort` + `$limit`

Multiple stages run **in sequence**, each one working on the result of the one before it:

```js
db.students.aggregate([
  { $match: { "marks": { $gt: 40 } } },
  { $project: { name: 1, course: 1, marks: 1 } },
  { $sort: { name: 1 } },
  { $limit: 3 }
])
```

What each stage does, in order:

1. **`$match`** — keep only students with `marks` greater than 40.
2. **`$project`** — reshape each remaining document to show only `name`, `course`, and `marks` (same idea as a `find()` projection, `1` means "include this field").
3. **`$sort`** — sort the remaining documents alphabetically by `name` (`1` = ascending, `-1` would be descending).
4. **`$limit`** — only keep the first 3 documents after sorting.

> 💡 Order matters — if you put `$limit` *before* `$sort`, you'd get the first 3 documents in whatever order they happened to come out of `$match`, not the first 3 alphabetically. Stages run strictly top-to-bottom.

---

## 7. Stage — `$group`

`$group` groups documents together by a given key (like a `GROUP BY` in SQL) and lets you compute aggregated values — such as a count — per group.

```js
db.students.aggregate([
  { $group: {
    _id: "$course",
    count: { $sum: 1 }
  }}
])
```

- `_id: "$course"` — group documents by the value of their `course` field. (The `$` prefix on `"$course"` means "the value of the `course` field from each document" — this is how you reference fields inside aggregation expressions.)
- `count: { $sum: 1 }` — for each group, add `1` for every document in that group, producing a count of how many students are in each course.

Result shape: one document per distinct `course` value, each showing how many students are enrolled in it.

---

## 8. Quick Reference Cheat Sheet

| Task | Command |
|---|---|
| Run an aggregation pipeline | `db.collection.aggregate([ { $stage1: {...} }, { $stage2: {...} } ])` |
| Filter documents (like `find()`'s filter) | `{ $match: { field: condition } }` |
| Reshape output — include only certain fields | `{ $project: { field1: 1, field2: 1 } }` |
| Sort results | `{ $sort: { field: 1 } }` *(1 = ascending, -1 = descending)* |
| Limit the number of results | `{ $limit: n }` |
| Group documents and aggregate per group | `{ $group: { _id: "$field", result: { $sum: 1 } } }` |
| Reference a document field inside an aggregation expression | `"$fieldName"` |

---

## 9. Still To Come

This lecture will be **continued in a future class** — more aggregation stages (e.g. `$addFields`, `$unwind`, `$lookup`, more accumulator operators like `$avg`/`$max`/`$min`) will be added and pushed to this same file. Check back for updates.

---

*Recorded via a VS Code MongoDB Playground for student reference — MongoDB Aggregation Pipeline (Part 1, in progress).*
