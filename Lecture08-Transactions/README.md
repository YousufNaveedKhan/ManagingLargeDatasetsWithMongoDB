# MongoDB Lecture 08 — Transactions

What a **transaction** is, why a bank transfer needs one, the **ACID** properties, **sessions**, and how to **commit** and **abort** a transaction in MongoDB. We also turn our local MongoDB into a **single-node replica set** (connecting back to Lecture 07), because transactions need one.

> **Environment:** MongoDB 6.0.13 · `mongosh` (PowerShell) or the MongoDB Shell inside Compass · Local instance (`mongodb://127.0.0.1:27017`)
>
> **Commands file:** [`lecture08-commands.js`](./lecture08-commands.js) · **Database:** `lecture08_transactions`
>
> Use `mongosh`, **not a Playground**, for this lecture — a session must stay alive across several commands in one shell connection.

---

## Table of Contents

**Part 1 — Concept**
- [1. The Problem: Half-Done Work](#1-the-problem-half-done-work)
- [2. What Is a Transaction?](#2-what-is-a-transaction)
- [3. ACID Properties](#3-acid-properties)
- [4. Do We Always Need Transactions?](#4-do-we-always-need-transactions)
- [5. Sessions](#5-sessions)

**Part 2 — Practical**
- [6. Setup — Single-Node Replica Set](#6-setup--single-node-replica-set)
- [7. Sample Data](#7-sample-data)
- [8. Transaction with Commit](#8-transaction-with-commit)
- [9. Transaction with Abort (and Isolation)](#9-transaction-with-abort-and-isolation)
- [10. Write Conflict](#10-write-conflict)

**Part 3 — Transaction APIs and Errors**
- [11. Core API vs Callback API](#11-core-api-vs-callback-api)
- [12. Error Labels](#12-error-labels)
- [13. Limits and Best Practices](#13-limits-and-best-practices)

**Reference**
- [14. Things to Remember](#14-things-to-remember)
- [15. Quick Reference Cheat Sheet](#15-quick-reference-cheat-sheet)

---

# Part 1 — Concept

## 1. The Problem: Half-Done Work

Ali sends **Rs. 500** to Hamza. That is **two** updates:

```
Step 1:  Ali   balance  -500
Step 2:  Hamza balance  +500
```

What if the server crashes **after Step 1 but before Step 2**?

```
Ali:   5000 → 4500   ✅ money left Ali's account
Hamza: 2000 → 2000   ❌ money never arrived
Rs. 500 has disappeared!
```

We need a way to say: **"Either both steps happen, or neither does."**

---

## 2. What Is a Transaction?

A **transaction** is a group of operations treated as **one single unit of work**:

- If **all** operations succeed → **COMMIT** (save everything permanently).
- If **any** operation fails, or we cancel → **ABORT** (undo everything, as if nothing happened).

> **Analogy:** Buying something at a shop. You give the money **and** the shopkeeper gives you the item. If the item is out of stock, you get your money back. It's never "money taken, no item".

---

## 3. ACID Properties

Every transaction follows four rules, called **ACID**:

| Letter | Property | Meaning | In our bank example |
|---|---|---|---|
| **A** | **Atomicity** | All or nothing | Both balances change, or neither does |
| **C** | **Consistency** | Data moves from one valid state to another valid state | Total money stays **7000** before and after |
| **I** | **Isolation** | Others can't see a transaction's changes until it commits | Nobody sees Ali's money "in the middle" of the transfer |
| **D** | **Durability** | Once committed, the change is saved permanently, even after a crash | After commit, the transfer survives a restart |

---

## 4. Do We Always Need Transactions?

**No.** In MongoDB, an operation on a **single document** is **always atomic** — even if it changes many fields or array items in that document.

```js
// One document, many changes — already all-or-nothing, no transaction needed
db.orders.updateOne(
  { _id: 1 },
  { $set: { status: "paid" }, $push: { history: "paid at 5pm" }, $inc: { total: 100 } }
)
```

You need a transaction only when **several documents** (or several collections) must change **together** — like two different account documents in a transfer.

> Good schema design (embedding related data in one document) often avoids the need for transactions.

---

## 5. Sessions

A transaction always runs **inside a session**.

- A **session** is like a **conversation** between your shell and the server.
- The server uses the session to know which operations belong to which transaction.

```js
var session = db.getMongo().startSession()                          // open the conversation
var accounts = session.getDatabase("lecture08_transactions").accounts  // collection THROUGH the session
```

> ⚠️ Only operations done through **`accounts`** (the session's collection) are part of the transaction. Anything done through **`db.accounts`** is **outside** it.
>
> `var` is needed here only to hold the session — this is the one place in the course where we store something in a shell variable.

| Command | Meaning |
|---|---|
| `db.getMongo().startSession()` | Start a session |
| `session.startTransaction()` | Begin a transaction |
| `session.commitTransaction()` | Save all changes |
| `session.abortTransaction()` | Cancel all changes |
| `session.endSession()` | Close the session |

---

# Part 2 — Practical

## 6. Setup — Single-Node Replica Set

Transactions **only work on a replica set** (or a sharded cluster). On a plain standalone server you get:

```
MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
```

We don't need three servers — we turn **our one server** into a replica set with **one member**.

### Step 1 — Edit the config file

Open **Notepad as Administrator** and open:

```
C:\Program Files\MongoDB\Server\6.0\bin\mongod.cfg
```

Find the line `#replication:` and change it to:

```yaml
replication:
  replSetName: rs0
```

> YAML is strict: **no `#`** in front of `replication:`, and **exactly 2 spaces** before `replSetName`. Don't use tabs.

### Step 2 — Restart the MongoDB service

**PowerShell as Administrator:**

```powershell
net stop MongoDB
net start MongoDB
```

### Step 3 — Initiate the replica set (only once)

Open `mongosh` again:

```js
rs.initiate()
```

If it gives a hostname error, use:

```js
rs.initiate({ _id: "rs0", members: [ { _id: 0, host: "127.0.0.1:27017" } ] })
```

### Step 4 — Check

The prompt changes to:

```
rs0 [direct: primary] test>
```

```js
rs.status().members    // one member, stateStr: 'PRIMARY'
db.hello()             // isWritablePrimary: true, setName: 'rs0'
```

All your old databases are still there — nothing is deleted.

---

## 7. Sample Data

```js
use lecture08_transactions

db.accounts.insertMany([
  { name: "Ali",   balance: 5000 },
  { name: "Hamza", balance: 2000 }
])
```

Total money in the bank: **7000**.

---

## 8. Transaction with Commit

Ali sends **500** to Hamza:

```js
var session = db.getMongo().startSession()
var accounts = session.getDatabase("lecture08_transactions").accounts

session.startTransaction()

accounts.updateOne({ name: "Ali" },   { $inc: { balance: -500 } })
accounts.updateOne({ name: "Hamza" }, { $inc: { balance: 500 } })

session.commitTransaction()
session.endSession()
```

```js
db.accounts.find()
```

| name | balance |
|---|---|
| Ali | 4500 |
| Hamza | 2500 |

Total is still **7000** — **Consistency**. ✅

---

## 9. Transaction with Abort (and Isolation)

Start a transfer of **1000**, then cancel it:

```js
var session = db.getMongo().startSession()
var accounts = session.getDatabase("lecture08_transactions").accounts

session.startTransaction()

accounts.updateOne({ name: "Ali" },   { $inc: { balance: -1000 } })
accounts.updateOne({ name: "Hamza" }, { $inc: { balance: 1000 } })
```

Now look at the data from **inside** and **outside** the transaction:

```js
accounts.find()       // inside:  Ali 3500, Hamza 3500
db.accounts.find()    // outside: Ali 4500, Hamza 2500
```

The outside world still sees the **old** values — this is **Isolation**. Uncommitted changes are invisible to everyone else.

Now cancel:

```js
session.abortTransaction()
session.endSession()

db.accounts.find()    // Ali 4500, Hamza 2500 — nothing changed
```

Both updates were undone — this is **Atomicity**. ✅

---

## 10. Write Conflict

What if **two transactions** try to change the **same document** at the same time?

```js
var s1 = db.getMongo().startSession()
var s2 = db.getMongo().startSession()
var acc1 = s1.getDatabase("lecture08_transactions").accounts
var acc2 = s2.getDatabase("lecture08_transactions").accounts

s1.startTransaction()
s2.startTransaction()

acc1.updateOne({ name: "Ali" }, { $inc: { balance: -100 } })   // ✅ OK
acc2.updateOne({ name: "Ali" }, { $inc: { balance: -200 } })   // ❌ error
```

```
MongoServerError: WriteConflict error: this operation conflicted with another operation.
Please retry your operation or multi-document transaction.
errorLabels: [ 'TransientTransactionError' ]
```

MongoDB does **not** let the second transaction overwrite the first one's uncommitted change. The second transaction is aborted.

```js
s1.commitTransaction()
s1.endSession()
s2.endSession()

db.accounts.find()    // Ali 4400, Hamza 2500 — only s1's change was saved
```

---

# Part 3 — Transaction APIs and Errors

## 11. Core API vs Callback API

MongoDB gives two ways (APIs) to write transactions:

| | **Core API** | **Callback API** |
|---|---|---|
| How | You call `startTransaction`, `commitTransaction`, `abortTransaction` yourself | You give MongoDB a function; it starts, commits and **retries automatically** |
| Error handling | You must handle retries yourself | Built-in retry for temporary errors |
| Used in | This lecture (shell) | Real apps — we'll use it in **NodeJS** |

What we did above is the **Core API**. The Callback API looks like this (preview for NodeJS):

```js
session.withTransaction(() => {
  accounts.updateOne({ name: "Ali" },   { $inc: { balance: -500 } })
  accounts.updateOne({ name: "Hamza" }, { $inc: { balance: 500 } })
})
```

---

## 12. Error Labels

When a transaction fails, MongoDB attaches an **error label** that tells the app **what to do next**:

| Error Label | Meaning | What to do |
|---|---|---|
| `TransientTransactionError` | A **temporary** problem — e.g. a write conflict, or the primary changed | **Retry the whole transaction** |
| `UnknownTransactionCommitResult` | The commit was sent, but the reply was lost (e.g. network blip), so we **don't know** if it was saved | **Retry the commit** only |

The **Callback API** handles both of these automatically — that is why real apps use it.

---

## 13. Limits and Best Practices

| Point | Detail |
|---|---|
| Needs a replica set or sharded cluster | Not supported on a standalone server |
| Default time limit: **60 seconds** | A transaction running longer is aborted automatically |
| Keep transactions **short** | They hold locks on the documents they change |
| Don't put everything in a transaction | Single-document writes are already atomic |
| Always `endSession()` | Frees the session on the server |

---

## 14. Things to Remember

| Rule | Detail |
|---|---|
| Transaction = all or nothing | Commit saves all, abort undoes all |
| ACID = Atomicity, Consistency, Isolation, Durability | |
| Single-document operations are already atomic | Transactions are for multiple documents |
| Transactions run inside a **session** | `db.getMongo().startSession()` |
| Use the session's collection | `session.getDatabase("db").col`, not `db.col` |
| Others can't see uncommitted changes | Isolation |
| Same document in two transactions = WriteConflict | Error label `TransientTransactionError` |
| Needs a replica set | Single-node replica set is enough for practice |

---

## 15. Quick Reference Cheat Sheet

| Task | Command |
|---|---|
| Enable replica set (mongod.cfg) | `replication:` → `  replSetName: rs0` |
| Restart service (Admin PowerShell) | `net stop MongoDB` then `net start MongoDB` |
| Initiate replica set (once) | `rs.initiate()` |
| Check replica set | `rs.status().members` / `db.hello()` |
| Start a session | `var session = db.getMongo().startSession()` |
| Collection through the session | `var col = session.getDatabase("db").col` |
| Begin transaction | `session.startTransaction()` |
| Save | `session.commitTransaction()` |
| Cancel | `session.abortTransaction()` |
| Close session | `session.endSession()` |

---

*Lecture notes for student reference — MongoDB Transactions.*
