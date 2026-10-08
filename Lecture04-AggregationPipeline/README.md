# MongoDB Lecture 04 — Aggregation Pipeline

> **Status: Parts 1 & 2 — Work in Progress**
> One more part of this lecture is still to come. This file (and the accompanying playground file) will be updated and pushed again once more of the lecture is recorded.

An introduction to MongoDB's **Aggregation Pipeline**: filtering, reshaping, sorting, paginating, grouping, calculating new fields, counting, and working with string and date expressions. This lecture was worked on using **MongoDB for VS Code**'s Playground feature instead of `mongosh` in PowerShell — see the setup notes below.

> **Environment:** MongoDB 6.0.13 · VS Code + MongoDB for VS Code extension · Local instance (`mongodb://127.0.0.1:27017`)

---

## Table of Contents

**Part 1 — Playground setup and core stages**
- [1. Two Ways to Work with MongoDB](#1-two-ways-to-work-with-mongodb)
- [2. What Is a Playground, and How to Use One](#2-what-is-a-playground-and-how-to-use-one)
- [3. Setup — Database & Collection](#3-setup--database--collection)
- [4. What Is the Aggregation Pipeline?](#4-what-is-the-aggregation-pipeline)
- [5. Stage — $match](#5-stage--match)
- [6. Stage — $project](#6-stage--project)
- [7. Chaining Stages — $match + $project](#7-chaining-stages--match--project)
- [8. Stage — $sort](#8-stage--sort)
- [9. Stage — $limit](#9-stage--limit)
- [10. Stage — $skip and Pagination](#10-stage--skip-and-pagination)
- [11. Stage — $group](#11-stage--group)
- [12. Stage — $set and Arithmetic Operators](#12-stage--set-and-arithmetic-operators)

**Part 2 — Removing fields, rounding, counting, string and date expressions**
- [13. Stage — $unset](#13-stage--unset)
- [14. Rounding Numbers — $round, $ceil, $floor](#14-rounding-numbers--round-ceil-floor)
- [15. Stage — $count](#15-stage--count)
- [16. String Expressions](#16-string-expressions)
- [17. Date Expressions](#17-date-expressions)

**Reference**
- [18. Things to Remember](#18-things-to-remember)
- [19. Quick Reference Cheat Sheet](#19-quick-reference-cheat-sheet)
- [20. Still To Come](#20-still-to-come)

---

## 1. Two Ways to Work with MongoDB

So far in this course, most work has been done via `mongosh` in PowerShell. There are two common ways to work with MongoDB day-to-day, and you're free to use either:

### Option A — MongoDB Compass (built-in Shell)

[MongoDB Compass](https://www.mongodb.com/products/compass) is MongoDB's official GUI application. Besides browsing databases/collections visually, it has a built-in **MongoDB Shell** where you can run the exact same `mongosh`-style commands you've been using in PowerShell, just inside the Compass window instead of a separate terminal.

### Option B — VS Code + "MongoDB for VS Code" Extension (Playgrounds)

Alternatively, you can work entirely inside **Visual Studio Code**:

1. Install the **MongoDB for VS Code** extension from the VS Code Extensions marketplace.
2. Connect it to your local (or remote) MongoDB instance using a connection string (e.g. `mongodb://127.0.0.1:27017`).
3. Create a **Playground** — a special `.mongodb.js` file where you write and run MongoDB commands directly inside VS Code, with IntelliSense/autocomplete support.

This lecture's work was done using **Option B — a VS Code Playground**.

---

## 2. What Is a Playground, and How to Use One

A **Playground** is a JavaScript file (extension `.mongodb.js`) that VS Code's MongoDB extension understands. It lets you write a whole sequence of MongoDB commands (database selection, collection creation, inserts, queries, aggregations, etc.) in one file, run them with a single click, and see the results inside VS Code — instead of typing commands one at a time into a terminal shell.

### How to create and use one

1. In VS Code, open the **Command Palette** (`Ctrl+Shift+P`) and run **"MongoDB: Create New Playground"** (or use the "Create Playground" button in the MongoDB extension's sidebar after connecting).
2. VS Code opens a new file with a default template (shown below) — this is your Playground.
3. Write your commands in the file. Use `use('<dbName>')` at the top to select which database you're working in.
4. Run the whole file (or only the lines you've selected) using the **"Run Playground"** button at the top-right of the editor.
5. The result of the **last command** run appears in a **Results panel** inside VS Code.
6. **Save the file** (`Ctrl+S`) like any normal file, with a meaningful name (e.g. `lecture04-aggregation.mongodb.js`) so you can reopen and rerun it later, or commit it to GitHub just like the command files from earlier lectures.

### Default Playground template (for reference)

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

> Key differences from `mongosh` in PowerShell: you write the **entire script** in a file instead of typing one command at a time, and only the output of the **last** command (or the last command in your current selection) shows in the Results panel. To run just one command from a long file, select it first and then run the selection. Use `console.log()` to print something mid-script.

---

## 3. Setup — Database & Collection

```js
// Select the database to use.
use('lecfour');

db.createCollection('students');
```

Insert sample student documents:

```js
db.students.insertMany([
  { 'name': 'Anusha',   'course': 'Web Development',   'marks': 245, 'city': 'Karachi' },
  { 'name': 'Laiba',    'course': 'Web Development',   'marks': 248, 'city': 'Karachi' },
  { 'name': 'Fatima',   'course': 'Web Development',   'marks': 149, 'city': 'Lahore' },
  { 'name': 'Zainab',   'course': 'Data Science',      'marks': 111, 'city': 'Islamabad' },
  { 'name': 'Amna',     'course': 'Graphic Designing', 'marks': 199, 'city': 'Peshawar' },
  { 'name': 'Ayesha',   'course': 'Data Science',      'marks': 210, 'city': 'Karachi' },
  { 'name': 'Khadijah', 'course': 'Web Designing',     'marks': 89,  'city': 'Lahore' }
]);
```

> Run the `insertMany()` **only once** — running a Playground file again re-executes every line, so the same students would be inserted a second time. After the first run, comment these lines out.

Check the data, and a normal `find()` filter for comparison with the aggregation examples below:

```js
db.students.find();

db.students.find({ city: "Karachi" })
```

All the aggregation examples below use `marks` out of a total of **300**.

---

## 4. What Is the Aggregation Pipeline?

`db.collection.aggregate([ ... ])` runs a **pipeline** — a sequence of processing **stages**, each written as `{ $stageName: { ... } }`. Documents flow through the stages in order. Each stage's **output becomes the next stage's input**:

```
Stage 1: Output  =>  Stage 2: Input
```

Each stage transforms the data in some way (filtering, reshaping, sorting, grouping, adding fields), and the final stage's output is what you get back.

> The output of an aggregation is **temporary** — it is only returned to you as a result. It does **not** change the documents stored in the collection.

---

## 5. Stage — `$match`

`$match` **filters** documents — the same filter you'd pass to `find()`, but written as a pipeline stage. Only documents that satisfy the condition continue to the next stage.

```js
db.students.aggregate([
  {
    $match: {
      city: "Karachi"
    }
  }
])
```

Returns only the students from Karachi (Anusha, Laiba, Ayesha).

---

## 6. Stage — `$project`

`$project` **reshapes** each document — you choose which fields to include (`1`) or exclude (`0`).

### With `_id` (the default)

```js
db.students.aggregate([
  {
    $project: {
      name: 1
    }
  }
])
```

`_id` is **always included by default**, even if you didn't ask for it — so each result has `_id` and `name`.

### Without `_id`

```js
db.students.aggregate([
  {
    $project: {
      _id: 0,
      name: 1
    }
  }
])
```

Setting `_id: 0` explicitly removes it, so each result contains only `name`.

---

## 7. Chaining Stages — `$match` + `$project`

Stages run **in sequence** — the output of `$match` is the input of `$project`:

```js
db.students.aggregate([
  {
    $match: {
      city: "Karachi"
    }
  },
  {
    $project: {
      _id: 0,
      name: 1,
      marks: 1
    }
  }
])
```

1. **`$match`** keeps only the Karachi students.
2. **`$project`** shows only `name` and `marks` for those students (no `_id`).

---

## 8. Stage — `$sort`

`$sort` orders the documents by a field: `-1` for **descending**, `1` for **ascending**.

### Descending (highest marks first)

```js
db.students.aggregate([
  {
    $sort: {
      marks: -1
    }
  }
])
```

### Ascending (lowest marks first)

```js
db.students.aggregate([
  {
    $sort: {
      marks: 1
    }
  }
])
```

---

## 9. Stage — `$limit`

`$limit` keeps only the first *n* documents that reach it.

```js
db.students.aggregate([
  {
    $limit: 3
  }
])
```

### `$sort` + `$limit` — Top 3 students

Combining the two gives a "top N" query — sort first, then limit:

```js
db.students.aggregate([
  {
    $sort: {
      marks: -1
    }
  },
  {
    $limit: 3
  }
])
```

Returns the three students with the highest marks (Laiba, Anusha, Ayesha).

---

## 10. Stage — `$skip` and Pagination

`$skip` skips the first *n* documents that reach it. It is the basis of **pagination** (showing results page by page).

Example scenario from class: **44 entries, 10 entries per page.**

```js
db.students.aggregate([
  {
    $limit: 10
  },
  {
    $skip: 5
  }
])
```

Here `$limit: 10` passes only the first 10 documents on, and then `$skip: 5` drops the first 5 of those — so you get documents 6 to 10.

> Stage order changes the result. For real pagination, the usual pattern is **`$skip` first, then `$limit`**:
> ```js
> // Page 3 with 10 entries per page → skip (3 - 1) * 10 = 20, then take 10
> db.students.aggregate([
>   { $skip: 20 },
>   { $limit: 10 }
> ])
> ```
> The formula is `$skip: (pageNumber - 1) * pageSize`, then `$limit: pageSize`. Pagination is usually combined with a `$sort` stage placed **before** `$skip` so the page order stays consistent.

---

## 11. Stage — `$group`

`$group` groups documents by a key (like `GROUP BY` in SQL) and can calculate values for each group. The `$` prefix in `"$course"` means "the value of the `course` field of each document".

### Group only (distinct values)

```js
db.students.aggregate([
  {
    $group: {
      _id: "$course"
    }
  }
])
```

Returns one document per distinct `course` value — essentially a list of unique courses.

### `$group` + `$sum` (count)

```js
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      totalStudents: {
        $sum: 1
      }
    }
  }
])
```

`$sum: 1` adds 1 for every document in the group, so it works as a **count** of the students in each course.

### `$group` + `$avg`

```js
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      averageMarks: {
        $avg: "$marks"
      }
    }
  }
])
```

`$avg: "$marks"` calculates the average of the `marks` field in each group.

### `$group` with `$sum`, `$avg`, `$max`, `$min` + `$sort`

Several accumulators can be used in a single `$group`, and the grouped result can then be sorted by a stage that follows it:

```js
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      totalStudents: {
        $sum: 1
      },
      averageMarks: {
        $avg: "$marks"
      },
      highestMarks: {
        $max: "$marks"
      },
      lowestMarks: {
        $min: "$marks"
      }
    }
  },
  {
    $sort: {
      averageMarks: -1
    }
  }
])
```

| Accumulator | Meaning |
|---|---|
| `$sum: 1` | Count of documents in the group |
| `$sum: "$field"` | Total of a field in the group |
| `$avg: "$field"` | Average of a field in the group |
| `$max: "$field"` | Highest value of a field in the group |
| `$min: "$field"` | Lowest value of a field in the group |

The final `$sort` orders the courses by `averageMarks`, highest first. Note that `$sort` can use `averageMarks` because it comes **after** `$group` — it sorts the grouped output, not the original documents.

---

## 12. Stage — `$set` and Arithmetic Operators

`$set` **adds new fields** (or overwrites existing ones) in the output documents, usually calculated from other fields. `$set` is an alias of `$addFields` — they do exactly the same thing. The calculation is done with **arithmetic operators**, each taking its values as an array.

### `$add`

```js
db.students.aggregate([
  {
    $set: {
      addMarks: {
        $add: ["$marks", 5]
      }
    }
  }
])
```

Adds a new field `addMarks` equal to `marks + 5`.

### `$subtract`

```js
db.students.aggregate([
  {
    $set: {
      subMarks: {
        $subtract: ["$marks", 5]
      }
    }
  }
])
```

Adds a new field `subMarks` equal to `marks - 5`.

### `$multiply` / `$divide` / `$round` — calculating a percentage

Operators can be **nested** inside each other, working from the inside out:

```js
db.students.aggregate([
  {
    $set: {
      percentage: {
        $round: [
          { $multiply: [{ $divide: ["$marks", 300] }, 100] },
          1
        ]
      }
    }
  }
])
```

Step by step, for a student with 245 marks:

1. `$divide: ["$marks", 300]` → 245 / 300 = 0.81666...
2. `$multiply: [ ..., 100 ]` → 81.666...
3. `$round: [ ..., 1 ]` → rounded to **1 decimal place** → 81.7

So the new `percentage` field is 81.7.

### `$set` + `$project`

Since `$set` adds the new field to the full document, you can follow it with `$project` to show only the fields you want in the final result:

```js
db.students.aggregate([
  {
    $set: {
      percentage: {
        $round: [
          { $multiply: [{ $divide: ["$marks", 300] }, 100] },
          1
        ]
      }
    }
  },
  {
    $project: {
      _id: 0,
      name: 1,
      marks: 1,
      percentage: 1
    }
  }
])
```

The `$project` stage can include `percentage` because the `$set` stage before it created that field.

### `$mod` — remainder

```js
db.students.aggregate([
  {
    $set: {
      remainder: {
        $mod: ["$marks", 3]
      }
    }
  }
])
```

Adds a new field `remainder` containing the remainder of `marks` divided by 3.

| Operator | Meaning | Example |
|---|---|---|
| `$add` | Addition | `{ $add: ["$marks", 5] }` |
| `$subtract` | Subtraction | `{ $subtract: ["$marks", 5] }` |
| `$multiply` | Multiplication | `{ $multiply: ["$price", 2] }` |
| `$divide` | Division | `{ $divide: ["$marks", 300] }` |
| `$mod` | Remainder after division | `{ $mod: ["$marks", 3] }` |
| `$round` | Round to *n* decimal places | `{ $round: [ <value>, 1 ] }` |

---

## 13. Stage — `$unset`

`$unset` **removes** the listed fields from every document in the output. It is the opposite way of thinking from `$project` with `1`: instead of choosing the fields you want to keep, you list the fields you want to drop.

```js
db.students.aggregate([
  {
    $unset: ["city", "course"]
  }
])
```

Every student is returned with all of their fields **except** `city` and `course`.

| Goal | Use |
|---|---|
| Keep only a few fields | `$project` with `1` |
| Drop a few fields and keep everything else | `$unset` (same result as `$project` with `0` on those fields) |

> For a single field you can pass a plain string instead of an array: `{ $unset: "city" }`.

> This is **not** the same as the `$unset` update operator from Lecture 02. That operator permanently removes a field from the stored documents when used with `updateOne()`. This `$unset` stage only hides the fields in the output of the pipeline, and the stored documents stay untouched.

---

## 14. Rounding Numbers — `$round`, `$ceil`, `$floor`

In Part 1 the percentage was rounded to 1 decimal place. The same calculation can be turned into a whole number in three different ways.

### `$round` with 0 places

```js
db.students.aggregate([
  {
    $set: {
      percentage: {
        $round: [
          { $multiply: [{ $divide: ["$marks", 300] }, 100] },
          0
        ]
      }
    }
  }
])
```

The second value in `$round` is the number of **decimal places**. With `0` the result is rounded to the nearest whole number (81.67 becomes 82).

> If a value is exactly halfway, `$round` rounds it to the nearest **even** number: 2.5 becomes 2 and 3.5 becomes 4. This is different from the "always round up at .5" rule used in school maths.

### `$ceil` — always round up

```js
db.students.aggregate([
  {
    $set: {
      percentage: {
        $ceil: [
          { $multiply: [{ $divide: ["$marks", 300] }, 100] }
        ]
      }
    }
  }
])
```

`$ceil` always moves to the **next whole number above** (81.2 becomes 82).

### `$floor` — always round down

```js
db.students.aggregate([
  {
    $set: {
      percentage: {
        $floor: [
          { $multiply: [{ $divide: ["$marks", 300] }, 100] }
        ]
      }
    }
  }
])
```

`$floor` always moves to the **whole number below** (81.9 becomes 81).

### Comparing the three

| Student | Exact percentage | `$round` (0) | `$ceil` | `$floor` |
|---|---|---|---|---|
| Anusha (245 marks) | about 81.67 | 82 | 82 | 81 |
| Amna (199 marks) | about 66.33 | 66 | 67 | 66 |

If the value is already a whole number, all three return it unchanged. `$ceil` and `$floor` always give whole numbers, so they take no "places" value.

---

## 15. Stage — `$count`

`$count` counts how many documents reach it and returns a **single document** containing that number. The text you give it is the **name of the output field**.

```js
db.students.aggregate([
  {
    $count: 'totalStudentsCount'
  }
])
```

Result (with the 7 students from the setup):

```js
{ totalStudentsCount: 7 }
```

- If you put a `$match` stage **before** `$count`, only the matching documents are counted.
- It does the same job as grouping everything into one group and adding 1 for each document: `{ $group: { _id: null, totalStudentsCount: { $sum: 1 } } }` (the `$group` version also returns an `_id: null` field).
- If **no** documents reach `$count`, it returns nothing at all, not a document with `0`.

---

## 16. String Expressions

String operators work on text fields. They are usually used inside `$set` to create a new field from existing ones.

### `$concat` — join strings together

```js
db.students.aggregate([
  {
    $set: {
      studentInfo: {
        $concat: ["$name", " - ", "$course"]
      }
    }
  }
])
```

Adds `studentInfo`, for example `"Anusha - Web Development"`. Fields and fixed text can be mixed freely in the array.

> If any value inside `$concat` is `null` or the field is missing, the whole result becomes `null`.

### `$toUpper` — convert to capital letters

```js
db.students.aggregate([
  {
    $set: {
      nameUpper: {
        $toUpper: "$name"
      }
    }
  }
])
```

`"Anusha"` becomes `"ANUSHA"`.

### `$toLower` — convert to small letters

```js
db.students.aggregate([
  {
    $set: {
      courseLower: {
        $toLower: "$course"
      }
    }
  }
])
```

`"Web Development"` becomes `"web development"`.

### `$trim` — remove extra spaces

```js
db.students.aggregate([
  {
    $set: {
      cleanName: {
        $trim: {
          input: "$name"
        }
      }
    }
  }
])
```

`$trim` removes whitespace from **both ends** of the text (`"  Anusha  "` becomes `"Anusha"`). The names in this sample data have no extra spaces, so `cleanName` looks the same as `name`; it is useful for messy data entered by users.

> `$trim` also accepts a `chars` option to remove specific characters instead of spaces, and `$ltrim` / `$rtrim` trim only the left or only the right side.

### `$split` — break a string into an array

```js
db.students.aggregate([
  {
    $set: {
      courseWords: {
        $split: ["$course", " "]
      }
    }
  }
])
```

The first value is the text, the second is the **separator**. `"Web Development"` split on a space becomes `["Web", "Development"]`.

| Operator | What it does | Example |
|---|---|---|
| `$concat` | Joins strings | `{ $concat: ["$name", " - ", "$course"] }` |
| `$toUpper` | Capital letters | `{ $toUpper: "$name" }` |
| `$toLower` | Small letters | `{ $toLower: "$course" }` |
| `$trim` | Removes spaces from both ends | `{ $trim: { input: "$name" } }` |
| `$split` | String to array | `{ $split: ["$course", " "] }` |

---

## 17. Date Expressions

Date operators pull a single part (year, month, day) out of a date field.

### Setup — the `enrollmentDate` field

The date examples need a date field, and the students created in Part 1 do not have one yet. Add it first. The dates below are only examples, and the same command is repeated for every student (the full set is in the playground file):

```js
db.students.updateOne({ name: "Anusha" }, { $set: { enrollmentDate: ISODate("2026-01-15") } })
db.students.updateOne({ name: "Laiba" },  { $set: { enrollmentDate: ISODate("2026-02-03") } })
// ... and so on for the remaining students
```

> The field must be stored as a real **Date** (`ISODate(...)`, see Lecture 03 on data types). If it is stored as a plain string such as `"2026-01-15"`, the date operators will fail with an error.

### Fetch the year — `$year`

```js
db.students.aggregate([
  {
    $set: {
      enrollmentYear: {
        $year: "$enrollmentDate"
      }
    }
  }
])
```

### Fetch the month — `$month`

```js
db.students.aggregate([
  {
    $set: {
      enrollmentMonth: {
        $month: "$enrollmentDate"
      }
    }
  }
])
```

### Fetch the day of the week — `$dayOfWeek`

```js
db.students.aggregate([
  {
    $set: {
      enrollmentDay: {
        $dayOfWeek: "$enrollmentDate"
      }
    }
  }
])
```

For a student enrolled on 15 January 2026:

| Operator | Returns | Result |
|---|---|---|
| `$year` | The 4-digit year | `2026` |
| `$month` | The month number, 1 to 12 (January = 1) | `1` |
| `$dayOfWeek` | The weekday number, 1 to 7 (Sunday = 1, Saturday = 7) | `5` (Thursday) |

> `$dayOfWeek` gives the **weekday**, not the day of the month. To get the day of the month (1 to 31) use `$dayOfMonth`. Dates are read in UTC unless a timezone is specified.

---

## 18. Things to Remember

| Point | Detail |
|---|---|
| Output of `aggregate()` is temporary | It never modifies the stored documents |
| Stage order matters | `$sort` before `$limit` gives "top N"; `$skip` before `$limit` gives pagination |
| `_id` is included by default in `$project` | Use `_id: 0` to remove it |
| `$group`'s `_id` is the grouping key | Reference a field inside an aggregation with the `$` prefix, e.g. `"$course"` |
| New fields from `$group` / `$set` can be used by later stages | e.g. `$sort` by `averageMarks` after `$group` |
| `$set` = `$addFields` | Same stage, two names |
| Playground re-runs every line | Comment out `insertMany()` after the first run to avoid duplicate documents |
| `$unset` stage is not the `$unset` update operator | The stage only hides fields in the output; the update operator permanently removes them from stored documents |
| `$round` rounds halfway values to the nearest even number | 2.5 becomes 2, 3.5 becomes 4 |
| `$count` returns nothing when no documents reach it | It does not return `0` |
| `$concat` returns `null` if any value is `null` or missing | Check your fields before joining them |
| Date operators need a real Date value | Store dates with `ISODate(...)`, not as strings |

---

## 19. Quick Reference Cheat Sheet

| Task | Command |
|---|---|
| Run an aggregation pipeline | `db.collection.aggregate([ { $stage1: {...} }, { $stage2: {...} } ])` |
| Filter documents | `{ $match: { field: condition } }` |
| Show only some fields | `{ $project: { field1: 1, field2: 1 } }` |
| Hide `_id` in the output | `{ $project: { _id: 0, field1: 1 } }` |
| Sort descending / ascending | `{ $sort: { field: -1 } }` / `{ $sort: { field: 1 } }` |
| Keep only the first *n* documents | `{ $limit: n }` |
| Skip the first *n* documents | `{ $skip: n }` |
| Group and count | `{ $group: { _id: "$field", total: { $sum: 1 } } }` |
| Group and average | `{ $group: { _id: "$field", avg: { $avg: "$other" } } }` |
| Group and get highest / lowest | `{ $group: { _id: "$field", hi: { $max: "$other" }, lo: { $min: "$other" } } }` |
| Add a calculated field | `{ $set: { newField: { $add: ["$a", "$b"] } } }` |
| Percentage rounded to 1 decimal | `{ $set: { pct: { $round: [ { $multiply: [ { $divide: ["$marks", 300] }, 100 ] }, 1 ] } } }` |
| Remainder of a division | `{ $set: { rem: { $mod: ["$marks", 3] } } }` |
| Remove fields from the output | `{ $unset: ["field1", "field2"] }` |
| Round to a whole number | `{ $round: [ <value>, 0 ] }` |
| Round up / round down | `{ $ceil: <value> }` / `{ $floor: <value> }` |
| Count the documents | `{ $count: "fieldName" }` |
| Join strings | `{ $set: { full: { $concat: ["$a", " - ", "$b"] } } }` |
| Capital / small letters | `{ $toUpper: "$field" }` / `{ $toLower: "$field" }` |
| Remove spaces from both ends | `{ $trim: { input: "$field" } }` |
| Split a string into an array | `{ $split: ["$field", " "] }` |
| Get year / month / weekday of a date | `{ $year: "$dateField" }`, `{ $month: "$dateField" }`, `{ $dayOfWeek: "$dateField" }` |

---

## 20. Still To Come

One more part of this lecture is still to come — more aggregation stages and operators will be added and pushed to this same file. Check back for updates.

---

*Recorded via a VS Code MongoDB Playground for student reference — MongoDB Aggregation Pipeline (Parts 1 & 2, in progress).*
