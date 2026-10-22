# MongoDB Lecture 06 — Database Commands

What a **database command** is, how it differs from the shell methods we've used so far, and the four groups of commands from the course book: **user management**, **authentication**, **write operations** and **aggregation commands**.

> **Environment:** MongoDB 6.0.13 · VS Code + MongoDB for VS Code extension (Playground) · Local instance (`mongodb://127.0.0.1:27017`)
>
> **Playground files:** [`lec06-commands.mongodb.js`](./lec06-commands.mongodb.js) (written in class) · [`lecture06-complete.mongodb.js`](./lecture06-complete.mongodb.js) (all commands from this README) · **Database:** `lecture06_dbcommands`

---

## Table of Contents

**Part 1 — Concept**
- [1. What Is a Database Command?](#1-what-is-a-database-command)
- [2. Helper vs Command](#2-helper-vs-command)
- [3. Why Are Database Commands Important?](#3-why-are-database-commands-important)
- [4. Types of Database Commands](#4-types-of-database-commands)

**Part 2 — Practical**
- [5. User Management Commands](#5-user-management-commands)
- [6. Authentication Commands](#6-authentication-commands)
- [7. Write Operation Commands](#7-write-operation-commands)
- [8. Aggregation Commands](#8-aggregation-commands)

**Reference**
- [9. Things to Remember](#9-things-to-remember)
- [10. Quick Reference Cheat Sheet](#10-quick-reference-cheat-sheet)

---

## 1. What Is a Database Command?

A **database command** is a request sent **directly to the MongoDB server**, written as a document, using:

```js
db.runCommand({ <commandName>: <value>, <option>: <value>, ... })
```

- The **first key** is always the command name (`find`, `insert`, `count`, `createUser` ...).
- Every reply contains **`ok: 1`** (success) or **`ok: 0`** (failure).

The simplest command — "is the server alive?":

```js
db.runCommand({ ping: 1 })
```

```js
{ ok: 1 }
```

---

## 2. Helper vs Command

Everything we've done so far (`find()`, `insertMany()`, `aggregate()` ...) are **helpers**: easy shell methods. Behind the scenes, every helper **sends a database command** to the server.

| Helper (easy shell method) | Command (what really goes to the server) |
|---|---|
| `db.students.find({ city: "Karachi" })` | `db.runCommand({ find: "students", filter: { city: "Karachi" } })` |
| `db.students.insertMany([...])` | `db.runCommand({ insert: "students", documents: [...] })` |
| `db.students.countDocuments()` | `db.runCommand({ count: "students" })` |
| `db.students.distinct("city")` | `db.runCommand({ distinct: "students", key: "city" })` |

> **Analogy:** A helper is like ordering from a restaurant menu ("one biryani"). A command is the exact written order the waiter hands to the kitchen. Same food — one is just more detailed.

---

## 3. Why Are Database Commands Important?

1. **Some tasks have no simple helper** — server checks, user management, and admin tasks are done through commands.
2. **Same everywhere** — the same command document works from `mongosh`, Compass, Node.js, Python or any driver.
3. **More control** — commands often accept options the helpers hide.
4. **Detailed replies** — you see exactly what the server did (`n`, `nModified`, `ok`).

---

## 4. Types of Database Commands

| Type | Purpose | Examples |
|---|---|---|
| **User Management** | Create, view, change and delete users | `createUser`, `usersInfo`, `grantRolesToUser`, `revokeRolesFromUser`, `dropUser` |
| **Authentication** | Log in and check who is logged in | `db.auth()`, `connectionStatus`, `getnonce` (old) |
| **Write Operations** | Change data | `insert`, `update`, `delete`, `findAndModify` |
| **Aggregation** | Count and summarise data | `count`, `distinct`, `aggregate` |

---

## 5. User Management Commands

### Create a user

```js
use('lecture06_dbcommands');

db.runCommand({
  createUser: "ali",
  pwd: "ali123",
  roles: [ { role: "read", db: "lecture06_dbcommands" } ]
})
```

A **role** decides what a user is allowed to do:

| Role | Allowed |
|---|---|
| `read` | Only read data (`find`) |
| `readWrite` | Read and change data |
| `dbAdmin` | Admin tasks like indexes and stats |
| `userAdmin` | Create and manage users |

### View users

```js
db.runCommand({ usersInfo: "ali" })   // one user
db.runCommand({ usersInfo: 1 })       // all users of this database
```

### Give more rights — `grantRolesToUser`

```js
db.runCommand({
  grantRolesToUser: "ali",
  roles: [ { role: "readWrite", db: "lecture06_dbcommands" } ]
})
```

Running `usersInfo` again now shows **two** roles: `read` and `readWrite`.

### Take rights back — `revokeRolesFromUser`

```js
db.runCommand({
  revokeRolesFromUser: "ali",
  roles: [ { role: "read", db: "lecture06_dbcommands" } ]
})
```

### Delete a user — `dropUser`

```js
db.runCommand({ createUser: "temp", pwd: "temp123", roles: [] })
db.runCommand({ dropUser: "temp" })
```

---

## 6. Authentication Commands

**Authentication** = proving who you are (username + password).

```js
db.auth("ali", "ali123")     // { ok: 1 }
db.auth("ali", "wrong123")   // MongoServerError: Authentication failed.
```

### Who am I logged in as?

```js
db.runCommand({ connectionStatus: 1 })
```

```js
{
  authInfo: {
    authenticatedUsers: [ { user: 'ali', db: 'lecture06_dbcommands' } ],
    authenticatedUserRoles: [ ... ]
  },
  ok: 1
}
```

### `getnonce` — an old command

The book mentions `getnonce`. It was used by the old login method and was **removed in MongoDB 4.0**:

```js
db.runCommand({ getnonce: 1 })
// MongoServerError: no such command: 'getnonce'
```

> ⚠️ **Important:** A fresh local MongoDB install runs **without access control**. Users and passwords work, but roles are **not enforced** — anyone connecting can still read and write everything. To enforce roles, `security: authorization: enabled` must be turned on in `mongod.cfg`. On **MongoDB Atlas** (cloud) it is always on.

---

## 7. Write Operation Commands

### `insert`

```js
db.runCommand({
  insert: "students",
  documents: [
    { name: "Ali",    city: "Karachi", marks: 75 },
    { name: "Hamza",  city: "Lahore",  marks: 60 },
    { name: "Sara",   city: "Karachi", marks: 88 },
    { name: "Irfan",  city: "Quetta",  marks: 45 },
    { name: "Hammad", city: "Karachi", marks: 92 }
  ]
})
```

```js
{ n: 5, ok: 1 }      // n = documents inserted
```

### `find`

```js
db.runCommand({ find: "students", filter: { city: "Karachi" } })
```

The reply comes inside a **cursor**, under `firstBatch`:

```js
{
  cursor: {
    firstBatch: [ { name: 'Ali', ... }, { name: 'Sara', ... }, { name: 'Hammad', ... } ],
    id: 0,
    ns: 'lecture06_dbcommands.students'
  },
  ok: 1
}
```

### `update` — one document

```js
db.runCommand({
  update: "students",
  updates: [
    { q: { name: "Irfan" }, u: { $set: { marks: 50 } } }
  ]
})
```

| Key | Meaning |
|---|---|
| `q` | **query** — which document |
| `u` | **update** — what to change |

```js
{ n: 1, nModified: 1, ok: 1 }
```

### `update` — many documents (`multi: true`)

```js
db.runCommand({
  update: "students",
  updates: [
    { q: { city: "Karachi" }, u: { $inc: { marks: 5 } }, multi: true }
  ]
})
```

```js
{ n: 3, nModified: 3, ok: 1 }   // Ali 80, Sara 93, Hammad 97
```

Without `multi: true`, only the **first** matching document is updated.

### `findAndModify` — update and get the document back

```js
db.runCommand({
  findAndModify: "students",
  query: { name: "Hamza" },
  update: { $inc: { marks: 10 } },
  new: true
})
```

```js
{
  lastErrorObject: { n: 1, updatedExisting: true },
  value: { _id: ObjectId('...'), name: 'Hamza', city: 'Lahore', marks: 70 },
  ok: 1
}
```

- `new: true` → returns the document **after** the update (70).
- `new: false` (default) → returns it **before** the update (60).

### `delete`

```js
db.runCommand({
  delete: "students",
  deletes: [ { q: { name: "Irfan" }, limit: 1 } ]
})
```

```js
{ n: 1, ok: 1 }
```

`limit: 1` deletes one matching document; `limit: 0` deletes **all** matching documents.

### Final data

```js
db.runCommand({ find: "students" })
```

| name | city | marks |
|---|---|---|
| Ali | Karachi | 80 |
| Hamza | Lahore | 70 |
| Sara | Karachi | 93 |
| Hammad | Karachi | 97 |

---

## 8. Aggregation Commands

### `count`

```js
db.runCommand({ count: "students" })                               // { n: 4, ok: 1 }
db.runCommand({ count: "students", query: { city: "Karachi" } })   // { n: 3, ok: 1 }
```

### `distinct` — unique values of a field

```js
db.runCommand({ distinct: "students", key: "city" })
```

```js
{ values: [ 'Karachi', 'Lahore' ], ok: 1 }
```

### `aggregate` — the pipeline as a command

```js
db.runCommand({
  aggregate: "students",
  pipeline: [
    { $group: { _id: "$city", total: { $sum: 1 }, avgMarks: { $avg: "$marks" } } }
  ],
  cursor: {}
})
```

```js
firstBatch: [
  { _id: 'Karachi', total: 3, avgMarks: 90 },
  { _id: 'Lahore',  total: 1, avgMarks: 70 }
]
```

> `cursor: {}` is **required** with the `aggregate` command — it tells the server to send results back as a cursor.

---

## 9. Things to Remember

| Rule | Detail |
|---|---|
| Every command uses `db.runCommand({...})` | The first key is the command name |
| Every reply has `ok` | `1` = success, `0` = failure |
| Helpers call commands behind the scenes | `find()` → `find` command |
| `update` needs `q` and `u` | `multi: true` for many documents |
| `delete` needs `limit` | `1` = one, `0` = all matching |
| `findAndModify` returns the old document by default | Use `new: true` for the updated one |
| `aggregate` command needs `cursor: {}` | Otherwise it gives an error |
| `getnonce` no longer exists | Removed in MongoDB 4.0 |
| Roles are enforced only with authorization on | Local default is off |

---

## 10. Quick Reference Cheat Sheet

| Task | Command |
|---|---|
| Check server | `db.runCommand({ ping: 1 })` |
| Create user | `db.runCommand({ createUser: "u", pwd: "p", roles: [ { role: "read", db: "d" } ] })` |
| View users | `db.runCommand({ usersInfo: 1 })` |
| Add role | `db.runCommand({ grantRolesToUser: "u", roles: [ ... ] })` |
| Remove role | `db.runCommand({ revokeRolesFromUser: "u", roles: [ ... ] })` |
| Delete user | `db.runCommand({ dropUser: "u" })` |
| Log in | `db.auth("u", "p")` |
| Who am I | `db.runCommand({ connectionStatus: 1 })` |
| Insert | `db.runCommand({ insert: "col", documents: [ ... ] })` |
| Find | `db.runCommand({ find: "col", filter: { ... } })` |
| Update | `db.runCommand({ update: "col", updates: [ { q: {...}, u: {...}, multi: true } ] })` |
| Update + return | `db.runCommand({ findAndModify: "col", query: {...}, update: {...}, new: true })` |
| Delete | `db.runCommand({ delete: "col", deletes: [ { q: {...}, limit: 1 } ] })` |
| Count | `db.runCommand({ count: "col", query: { ... } })` |
| Unique values | `db.runCommand({ distinct: "col", key: "field" })` |
| Aggregate | `db.runCommand({ aggregate: "col", pipeline: [ ... ], cursor: {} })` |

---

*Recorded via a VS Code MongoDB Playground for student reference — MongoDB Database Commands.*
