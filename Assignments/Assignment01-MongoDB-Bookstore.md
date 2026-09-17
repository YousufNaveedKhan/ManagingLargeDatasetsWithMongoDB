# Assignment 01 — MongoDB CRUD & Operators (Bookstore Database)

**Based on:** Lecture 01 (CRUD Basics) + Lecture 02 (Query & Update Operators)
**Deadline:** Saturday, 19th September
**Submission:** GitHub (see instructions at the bottom)

---

## 🎯 Objective

You're going to build and query a small **Online Bookstore** database from scratch. This isn't a copy-paste exercise — each task describes a *real* requirement, and you have to figure out **which command and which operator(s)** solve it. Some tasks need more than one operator combined. Read carefully before writing your query.

---

## 📦 Setup

Create a new database called `bookstore` and three collections: `books`, `customers`, and `orders`.

```js
use bookstore

db.createCollection("books")
db.createCollection("customers")
db.createCollection("orders")
```

### Seed the `books` collection

Insert **at least 6 books** using `insertMany()`. Each book document must include:

- `title` (string)
- `author` (string)
- `genre` (string — e.g. "Fiction", "Self-Help", "Programming", "History")
- `price` (number)
- `stock` (number — how many copies are in stock)
- `tags` (array of strings — e.g. `["bestseller", "paperback"]`)
- `rating` (number, out of 5)

Make sure your data is **varied on purpose**:
- At least 2 books should share the same `genre`
- At least 1 book should have `stock: 0`
- At least 1 book should have more than 3 `tags`
- Prices should range from cheap to expensive so `$gt`/`$lt` tasks are meaningful

### Seed the `customers` collection

Insert **at least 4 customers**, each with:

- `name`
- `email`
- `city`
- `membership` (string — `"Regular"` or `"Premium"`)

### Seed the `orders` collection

Insert **at least 5 orders**, each with:

- `customerName` (matching a name from `customers`)
- `items` (array of embedded objects — each with `bookTitle`, `quantity`, `unitPrice`)
- `status` (string — `"Pending"`, `"Shipped"`, or `"Delivered"`)
- `orderDate` (string, e.g. `"2026-09-10"`)

> 💡 Tip: an `orders` document with an `items` array of embedded objects is exactly like the `projects` array from Lecture 02 — you'll need `$elemMatch` for some tasks below.

---

## 📝 Tasks

Attempt **every** task. Write the actual command you ran AND show the real output in your final file (that's the whole point of using `Start-Transcript`).

### A. Basic CRUD (Lecture 01)

1. Insert one more book of your choice using `insertOne()`.
2. Fetch all documents from `books`.
3. Fetch only the books belonging to one specific `genre`.
4. Update one customer's `city` using `updateOne()`.
5. Delete any one order using `deleteOne()`.

### B. Comparison & Logical Operators (Lecture 02 – Part 1 & 2)

6. Find all books priced **greater than** a value of your choice (`$gt`).
7. Find all books priced **between** two values (hint: combine `$gt` and `$lt` on the same field in one filter).
8. Find books that are **either** out of stock **or** rated below 3 (`$or`).
9. Find books that are **neither** in a specific genre **nor** above a specific price (`$nor`).
10. Find all customers whose `membership` is `"Premium"` **and** whose `city` is a specific city (`$and`).
11. Find all books whose `genre` is `$in` a list of at least 2 genres you choose.
12. Find all customers whose `city` is `$nin` a list of 2 cities.

### C. Element, Type & Array Operators (Lecture 02 – Part 2)

13. Find any book document where the `tags` field `$exists`.
14. Find books using `$size` — books with exactly 2 tags.
15. Find books using `$type` — confirm `price` is stored as a numeric type.
16. Find books whose `tags` array contains **all** of two specific tags together (`$all`).
17. Find any order where **at least one item** in `items` has `quantity` greater than 2 **and** `unitPrice` above a value of your choice — this must use `$elemMatch` since both conditions must be true on the *same* item.
18. Find books whose `title` starts with a specific letter, using `$regex`.

### D. Update Operators (Lecture 02 – Part 3)

19. Increase the `price` of one book by a percentage using `$mul` (e.g. a 10% price hike).
20. Use `$inc` to reduce a book's `stock` by 1 (simulate a sale).
21. Use `$max` to only raise a book's `rating` if the new value is actually higher.
22. Rename a field in one `customers` document using `$rename` (e.g. rename `membership` to `tier`).
23. Update a nested field using **dot notation** — e.g. change one item's `quantity` inside an order's `items` array (if your MongoDB version allows positional dot notation, use `"items.0.quantity"`; otherwise just demonstrate dot notation on any nested object field you have).
24. Use `upsert: true` on an `updateOne()` call that inserts a brand-new customer if no matching customer is found.
25. Add a new tag to a book's `tags` array using `$push`, then add the same tag again using `$addToSet` and observe that it does **not** duplicate.
26. Remove one tag from a book using `$pull`.
27. Remove two tags from a book at once using `$pullAll`.
28. Use `$pop` to remove the last tag from a book's `tags` array.

### E. Bonus (Optional — for extra credit / logic practice)

29. Use `updateMany()` with a filter to apply a `$mul` price increase to **every** book in one specific genre at once.
30. Write **one** query that combines at least 3 different operators from this assignment (your choice) to answer a realistic question, e.g. *"Find all Premium customers in Karachi whose orders are still Pending."* (This will likely require you to query across two collections manually — that's fine, just show both queries and explain the logic in a comment.)

---

## 📤 Submission Instructions

1. Open PowerShell in your working folder and start recording your **entire** session:
   ```powershell
   Start-Transcript -Path .\output.txt
   ```
2. Run `mongosh` and complete **all** tasks above, in order, inside that same recorded session.
3. When done, stop the recording:
   ```powershell
   Stop-Transcript
   ```
4. Take your `output.txt` transcript and turn it into a clean, **properly formatted** file — same style as the Lecture 01 & Lecture 02 files shared in class (clear sections, code blocks, task numbers, and your actual output shown under each command). Don't submit the raw unformatted transcript.
5. Create a new GitHub repository (e.g. `mongodb-assignment-01`) and push your formatted file(s).
6. Submit your **GitHub repository link** before the deadline.

> ⚠️ **Deadline: Saturday, 19th September.** Late or unformatted (raw transcript) submissions will not be accepted for full marks.

---

*Assignment based on Lecture 01 (CRUD Basics) and Lecture 02 (Query & Update Operators) — Managing Large Datasets With MongoDB.*
