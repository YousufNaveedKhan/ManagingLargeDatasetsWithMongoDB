# Assignment 02 — Logic Building with MongoDB Aggregation

**Based on:** Lecture 04 (Aggregation Pipeline), with the CRUD, query operator and update operator topics from Lectures 01 to 03
**Deadline:** Saturday, 10th October 2026
**Submission:** GitHub (see the instructions at the bottom)

---

## Objective

This assignment is about **logic building**. You will solve four classic programming problems (Even/Odd, Leap Year, Marksheet, Inventory Management) using only **MongoDB**, by writing aggregation pipelines in a **VS Code Playground**.

You are not given the queries. For every requirement you have to decide which stages and operators solve it, and in which order they must be placed. Remember that **stage order matters** and that the output of each stage becomes the input of the next one.

---

## General Rules

1. Create a new database called `assignment02` and use one collection per task: `numbers`, `years`, `marksheet`, `inventory`.
2. Write everything in a **single Playground file** named `assignment02.mongodb.js`. Put a comment above every query, for example `// TASK 1 - Part B`.
3. Insert your own sample data with `insertMany()`. The data must be **varied on purpose** so that every condition in the task is actually tested (details are given in each task). Run `insertMany()` only once, then comment it out, so the data is not duplicated.
4. The result of `aggregate()` is **temporary** and never changes the stored documents. Use update commands only where a task asks for them.
5. Use a different sample data set from your classmates. Copying someone else's file will not be accepted.

### Operators you are expected to use

| Topic | Operators / stages |
|---|---|
| Filtering and shaping | `$match`, `$project`, `$sort`, `$limit`, `$skip` |
| Grouping | `$group` with `$sum`, `$avg`, `$max`, `$min` |
| Calculated fields | `$set` with `$add`, `$subtract`, `$multiply`, `$divide`, `$mod`, `$round` |
| Query operators (Lecture 02) | `$or`, `$and`, `$in`, `$gt`, `$gte`, `$lt`, `$lte`, `$ne` |
| Update operators (Lecture 02) | `$inc`, `$mul`, `$set`, `upsert` |

Some tasks have a **Challenge** part that needs a conditional operator which has not been covered in class yet. Research `$cond` and `$switch` in the MongoDB documentation for these. Challenge parts are optional, but they are the best practice for logic building.

---

## TASK 1: Even Odd Program

### Problem

Given a collection of numbers, find out which numbers are **even** and which are **odd**.

### Collection: `numbers`

```js
{ number: 12 }
```

### Sample data requirements

Insert **at least 12 numbers** that include:

- Even and odd numbers
- The number `0`
- At least 2 **negative** numbers (one even, one odd)
- At least 1 large number (5 digits or more)

### Requirements

**Part A.** Add a new field `remainder` to every number, which holds the remainder when the number is divided by 2. Show only `number` and `remainder` (without `_id`).

Expected shape of the output:

```js
{ number: 12, remainder: 0 }
{ number: 7, remainder: 1 }
```

**Part B.** Show only the **even** numbers, sorted from smallest to largest.

**Part C.** Show only the **odd** numbers, sorted from largest to smallest.

**Part D.** Show the **total count** of even numbers and the **total count** of odd numbers.

**Part E.** Show the **three largest even numbers** in the collection.

### Think about this

Run Part A on your negative numbers and look at the remainder carefully. In MongoDB, `$mod` returns a remainder with the **same sign as the number being divided**. This means an odd negative number does not give `1`. Your Part C and Part D must still work correctly for negative odd numbers. Write a short comment in your Playground explaining how you handled this.

### Challenge

Add a field `type` with the text `"Even"` or `"Odd"` for each number, so the output looks like `{ number: 12, type: "Even" }`. Hint: `$cond` has the shape `{ $cond: [ <condition>, <value if true>, <value if false> ] }`, and inside `$set` the equality check is written as `{ $eq: ["$remainder", 0] }`.

---

## TASK 2: Leap Year Program

### Problem

Given a collection of years, find out which of them are **leap years**.

A year is a leap year if:

- it is divisible by **400**, **or**
- it is divisible by **4** but **not** divisible by 100.

### Collection: `years`

```js
{ year: 2024 }
```

### Sample data requirements

Insert **at least 12 years** that include the tricky cases:

- A normal leap year (such as 2024)
- A normal non-leap year (such as 2023)
- A century year that is **not** a leap year (such as 1900 or 2100)
- A century year that **is** a leap year (such as 2000 or 2400)

### Requirements

**Part A.** Add three new fields to every document: the remainder of the year when divided by `4`, by `100`, and by `400`. Show `year` and these three fields (without `_id`).

**Part B.** Using the fields from Part A, show only the **leap years**. Your logic must follow the rule above exactly. Years like 1900 and 2100 must **not** appear in the result.

**Part C.** Show only the **non-leap years**.

**Part D.** Show how many leap years and how many non-leap years are in the collection.

**Part E.** Show the **latest leap year** and the **oldest leap year** in the collection.

### Think about this

The rule has a combination of conditions. Think about which query operator from Lecture 02 expresses "this **or** that", and which expresses "this **and** that" inside a single `$match`. Write the logic in a comment above your query before you code it.

### Challenge

Add a field `daysInYear` with the value `366` for leap years and `365` for other years.

---

## TASK 3: Marksheet (7 Subjects)

### Problem

Build a result sheet for students who have appeared in **7 subjects**, each out of 100 marks (total 700).

### Collection: `marksheet`

```js
{
  rollNo: 101,
  name: "Ayesha",
  course: "ADSE",
  urdu: 78,
  english: 85,
  mathematics: 92,
  physics: 70,
  chemistry: 66,
  computer: 95,
  islamiat: 88
}
```

You may choose your own 7 subject names, but there must be exactly 7 subjects.

### Sample data requirements

Insert **at least 10 students** from **at least 3 different courses**, and include:

- One student with very high marks (90 or above in most subjects)
- At least 2 students who have **failed in at least one subject** (below 40 in that subject)
- At least 2 students with the **same total marks** (a tie)
- One student with low marks in all subjects

### Requirements

**Part A. Total and percentage.** Calculate `totalMarks` (sum of the 7 subjects) and `percentage` (out of 700, rounded to 2 decimal places) for every student. Show `rollNo`, `name`, `totalMarks` and `percentage` (without `_id`).

**Part B. Position list.** Show the students sorted by `totalMarks` from highest to lowest.

**Part C. Top 3.** Show the top 3 students.

**Part D. Students who failed in at least one subject.** A student fails a subject if the marks in it are below 40. Show the name, roll number and course of every student who failed in **any** subject.

**Part E. Passing students.** Show the students who passed **all** 7 subjects **and** have an overall percentage of 50 or more.

**Part F. Class statistics.** Show one single result with the total number of students, the average total marks, the highest total marks and the lowest total marks of the whole class. Hint: grouping with `_id: null` puts all documents into one group.

**Part G. Course-wise report.** For every course, show the number of students, the average percentage and the highest total marks. Sort the courses by average percentage, highest first.

**Part H. Pagination.** Show the **second page** of the position list from Part B, with **4 students per page**.

### Think about this

Part D and Part E look similar but are not the same. In Part D a single failed subject is enough, while in Part E every subject must be passed. Think about how your `$match` conditions change between the two, and explain it in a comment.

### Challenge

Add a `grade` field using this scale:

| Percentage | Grade |
|---|---|
| 80 and above | A-1 |
| 70 to 79.99 | A |
| 60 to 69.99 | B |
| 50 to 59.99 | C |
| 40 to 49.99 | D |
| Below 40 | F |

Hint: for more than two outcomes, use `$switch` with `branches` and a `default`.

---

## TASK 4: Inventory Management System

### Problem

Build the data layer of a small **inventory management system** for a shop. This task has two parts: day-to-day **operations** (insert, update, delete) and **reports** (aggregation).

### Collection: `inventory`

```js
{
  itemCode: "ITM-001",
  itemName: "Wireless Mouse",
  category: "Accessories",
  quantity: 45,
  unitPrice: 1200,
  reorderLevel: 20,
  supplier: "TechSource"
}
```

`reorderLevel` is the minimum stock the shop wants to keep. When `quantity` falls to this level or below, the item must be reordered.

### Sample data requirements

Insert **at least 12 items** from **at least 4 categories**, and include:

- At least 2 items that are **out of stock** (`quantity: 0`)
- At least 2 items where `quantity` is **at or below** `reorderLevel`
- At least 1 category with only a single item
- A wide price range (cheap and expensive items)

### Part 1: Operations

1. **Add a new item** with `insertOne()`.
2. **Record a sale.** A customer buys 3 units of one item. Reduce its `quantity` by 3.
3. **Restock.** Add 50 units to one of your low-stock items.
4. **Price increase.** Increase the `unitPrice` of **every item in one category** by 5% using a single command.
5. **Add-or-update a supplier item.** Write one `updateOne()` command with `upsert` that updates an item if its `itemCode` exists, and inserts it as a new item if it does not. Run it once with an existing code and once with a new code.
6. **Remove a discontinued item** from the collection.

### Part 2: Reports

**Report A. Stock value per item.** Add a field `stockValue` (quantity multiplied by unit price) to every item. Show `itemName`, `quantity`, `unitPrice` and `stockValue` (without `_id`).

**Report B. Total inventory value.** Show a single result containing the **total value of the whole inventory**. Hint: the `$sum` accumulator can also add up a calculated value, for example `$sum: { $multiply: [ ... ] }`.

**Report C. Category-wise summary.** For every category, show:

- the number of items
- the total quantity in stock
- the average unit price
- the highest and the lowest unit price
- the total stock value

Sort the result by total stock value, highest first.

**Report D. Reorder list.** Show the items whose `quantity` is **at or below** their `reorderLevel`, along with a field `shortage` that shows how many units are needed to reach the reorder level. Hint: calculate the difference first, then filter on it.

**Report E. Out-of-stock items.** Show only the names and item codes of items with zero quantity.

**Report F. Five most valuable items.** Show the 5 items with the highest `stockValue`.

**Report G. Discount preview.** Show every item with a new field `discountedPrice` that is the `unitPrice` after a 10% discount, rounded to 0 decimal places. Then answer in a comment: **has this changed the prices stored in the collection?** Run `find()` afterwards to prove your answer.

**Report H. Pagination.** The shop's screen shows 5 items per page. Show **page 2**, with the items sorted alphabetically by `itemName`.

### Think about this

Compare Part 1 (step 4) and Report G. Both change a price, but one changes the stored data and the other does not. Explain in a comment which tool is used for which purpose and why.

### Challenge

Show the **category that holds the highest total stock value** as a single result (only one document in the output).

---

## Submission Instructions

1. Complete all four tasks in your VS Code Playground file `assignment02.mongodb.js`, with a comment above every query naming the task and part.
2. Run every query and check its output in the Results panel.
3. Create a **formatted `README.md`** (in the same style as the lecture notes shared in class) which has, for every task and part: the requirement, your query in a code block, and the **actual output** copied from the Results panel.
4. Create a new GitHub repository (for example `mongodb-assignment-02`) and push both files: `assignment02.mongodb.js` and `README.md`.
5. Submit your **GitHub repository link** on or before the deadline: **Saturday, 10th October 2026**.

Late submissions will not be accepted for full marks.

### Checklist before you submit

- [ ] All four tasks are attempted (Challenge parts are optional)
- [ ] Every query has a comment naming its task and part
- [ ] The `insertMany()` commands are commented out after the first run
- [ ] The comments asked for in the "Think about this" sections are written
- [ ] The README shows the real output for every query
- [ ] The repository link opens without logging in (the repository is public)

---

*Assignment based on Lecture 04 (Aggregation Pipeline) of Managing Large Datasets With MongoDB.*
