# MongoDB Lecture 07 — Replication, Sharding & the CAP Theorem

How MongoDB keeps data **safe** when a server dies (**Replication**), how it handles data that is **too big for one server** (**Sharding**), and the **CAP Theorem** that explains the trade-off every distributed database makes — including **CP** and **AP** systems.

> **Environment:** MongoDB 6.0.13 · Theory lecture
>
> The setup commands in sections 7 and 13 are for **reference only** — they were not run in class. A real replica set or sharded cluster needs several servers. In **Lecture 08 (Transactions)** we turn our own MongoDB into a **single-node replica set**.

---

## Table of Contents

**Part 1 — Replication**
- [1. The Problem: One Server = One Point of Failure](#1-the-problem-one-server--one-point-of-failure)
- [2. What Is Replication?](#2-what-is-replication)
- [3. Replica Set — Primary, Secondary, Arbiter](#3-replica-set--primary-secondary-arbiter)
- [4. How Data Is Copied — The Oplog](#4-how-data-is-copied--the-oplog)
- [5. Automatic Failover and Elections](#5-automatic-failover-and-elections)
- [6. Master-Slave vs Replica Set](#6-master-slave-vs-replica-set)
- [7. Implementing Replication (Reference)](#7-implementing-replication-reference)
- [8. Read Preference and Write Concern](#8-read-preference-and-write-concern)

**Part 2 — Sharding**
- [9. Vertical vs Horizontal Scaling](#9-vertical-vs-horizontal-scaling)
- [10. What Is Sharding?](#10-what-is-sharding)
- [11. Sharded Cluster Components](#11-sharded-cluster-components)
- [12. Shard Key and Sharding Strategies](#12-shard-key-and-sharding-strategies)
- [13. Implementing Sharding (Reference)](#13-implementing-sharding-reference)
- [14. Replication vs Sharding](#14-replication-vs-sharding)

**Part 3 — CAP Theorem**
- [15. The Three Letters: C, A, P](#15-the-three-letters-c-a-p)
- [16. Why You Can Only Pick Two](#16-why-you-can-only-pick-two)
- [17. CP Systems vs AP Systems](#17-cp-systems-vs-ap-systems)
- [18. Where Does MongoDB Fit?](#18-where-does-mongodb-fit)

**Reference**
- [19. Things to Remember](#19-things-to-remember)
- [20. Quick Reference Cheat Sheet](#20-quick-reference-cheat-sheet)

---

# Part 1 — Replication

## 1. The Problem: One Server = One Point of Failure

So far our whole database runs on **one** MongoDB server. If that server:

- has a hard-disk crash,
- loses power, or
- is down for maintenance,

then the app stops working, and data may be lost. This is called a **Single Point of Failure**.

---

## 2. What Is Replication?

**Replication** means keeping **copies of the same data on more than one server**.

> **Analogy:** You keep your important documents in your house **and** a photocopy at a relative's house. If one copy is lost, the other is still there.

**Benefits:**

| Benefit | Meaning |
|---|---|
| **High Availability** | If one server dies, another takes over — the app keeps running |
| **Data Safety (Redundancy)** | Data exists on several machines |
| **Read Scaling** | Read requests can be spread over several servers |
| **Disaster Recovery** | Servers can be in different cities/data centres |

> ⚠️ Replication is **not a backup**. If someone runs `deleteMany({})` by mistake, the delete is copied to every server too. Backups are still needed.

---

## 3. Replica Set — Primary, Secondary, Arbiter

In MongoDB, a group of servers holding the same data is called a **Replica Set**.

```
              App (reads + writes)
                     │
                     ▼
              ┌─────────────┐
              │   PRIMARY   │   ← all WRITES go here
              └─────────────┘
               │           │     copies data
               ▼           ▼
       ┌───────────┐  ┌───────────┐
       │ SECONDARY │  │ SECONDARY │
       └───────────┘  └───────────┘
```

| Member | Role |
|---|---|
| **Primary** | Only **one** per replica set. Receives **all writes** (and reads by default). |
| **Secondary** | Keeps a **copy** of the primary's data. Can become primary if the primary fails. |
| **Arbiter** | Holds **no data**. Only **votes** in elections, to break ties. Cheap to run. |

- Recommended minimum: **3 members** (e.g. 1 primary + 2 secondaries).
- A replica set can have up to **50 members**, but only **7** of them can vote.

---

## 4. How Data Is Copied — The Oplog

1. The app writes to the **primary**.
2. The primary records the change in a special collection called the **oplog** (operations log), inside the `local` database.
3. Each secondary **reads the oplog** and **repeats the same operations** on its own copy.

```
Primary oplog:  insert Ali → update Sara → delete Irfan
                        ↓ secondaries replay the same list
Secondary:      insert Ali → update Sara → delete Irfan
```

This copying is **asynchronous** — secondaries may be a fraction of a second behind. That delay is called **replication lag**.

---

## 5. Automatic Failover and Elections

- Members send each other a **heartbeat** every **2 seconds** ("are you alive?").
- If the primary doesn't reply for about **10 seconds**, the secondaries hold an **election**.
- A secondary that gets the votes of a **majority** of members becomes the **new primary**.
- When the old primary comes back, it rejoins as a **secondary**.

```
Before:   PRIMARY(A)   SECONDARY(B)   SECONDARY(C)
A dies:   ✗            election...
After:    ✗            PRIMARY(B)     SECONDARY(C)
A back:   SECONDARY(A) PRIMARY(B)     SECONDARY(C)
```

This happens **automatically**, without anyone changing the app — this is **automatic failover**.

> **Why a majority?** With 3 members, 2 votes are needed. This prevents two primaries existing at the same time ("split brain"). That is also why an **odd number** of voting members is recommended.

---

## 6. Master-Slave vs Replica Set

Older MongoDB versions used **Master-Slave** replication. It was **removed in MongoDB 4.0**.

| Master-Slave (old) | Replica Set (current) |
|---|---|
| One master, one or more slaves | One primary, one or more secondaries |
| If the master dies, a human must switch manually | **Automatic** election and failover |
| No voting | Members vote |
| Removed in 4.0 | The standard today |

---

## 7. Implementing Replication (Reference)

**Step 1 — Start three `mongod` servers** with the same replica set name (here on one machine, different ports and folders):

```powershell
mongod --replSet rs0 --port 27017 --dbpath C:\data\rs1
mongod --replSet rs0 --port 27018 --dbpath C:\data\rs2
mongod --replSet rs0 --port 27019 --dbpath C:\data\rs3
```

Or, in `mongod.cfg`:

```yaml
replication:
  replSetName: rs0
```

**Step 2 — Connect to one of them with `mongosh` and initiate:**

```js
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})
```

**Step 3 — Check and manage:**

| Command | What it does |
|---|---|
| `rs.status()` | Shows every member and who is PRIMARY / SECONDARY |
| `rs.conf()` | Shows the replica set configuration |
| `rs.add("host:port")` | Adds a new member |
| `rs.addArb("host:port")` | Adds an arbiter |
| `rs.remove("host:port")` | Removes a member |
| `rs.stepDown()` | Makes the current primary step down (forces an election) |
| `db.hello()` | Shows whether *this* server is primary (`isWritablePrimary`) |

Connection string for an app:

```
mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0
```

---

## 8. Read Preference and Write Concern

### Read Preference — *where* reads go

| Read Preference | Reads from |
|---|---|
| `primary` (default) | Only the primary — always latest data |
| `primaryPreferred` | Primary; secondary if primary is down |
| `secondary` | Only secondaries — may be slightly old data |
| `secondaryPreferred` | Secondaries; primary if none available |
| `nearest` | Whichever member responds fastest |

### Write Concern — *when* a write counts as "done"

| Write Concern | Write is confirmed when... |
|---|---|
| `w: 1` | The primary has saved it |
| `w: "majority"` (default since MongoDB 5.0) | A majority of members have saved it — safest |
| `w: 0` | No confirmation at all — fastest, risky |

```js
db.orders.insertOne({ item: "Laptop" }, { writeConcern: { w: "majority" } })
```

---

# Part 2 — Sharding

## 9. Vertical vs Horizontal Scaling

When data grows too big, there are two ways to grow:

| Vertical Scaling (Scale Up) | Horizontal Scaling (Scale Out) |
|---|---|
| Buy a **bigger** server (more RAM, CPU, disk) | Add **more** servers |
| Simple | More complex to set up |
| Has a limit — machines can only get so big, and become very expensive | Almost no limit |
| Still one point of failure | Load is spread out |

> **Analogy:** A restaurant is full. **Vertical** = make the one kitchen bigger. **Horizontal** = open more branches.

**Sharding is MongoDB's way of horizontal scaling.**

---

## 10. What Is Sharding?

**Sharding** means **splitting one big collection into parts** and storing each part on a **different server**. Each part is called a **shard**.

```
          orders collection (1 crore documents)
                       │ split by shard key
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
   Shard A          Shard B          Shard C
 customers A–H    customers I–Q    customers R–Z
```

> **Analogy:** One school register for 3,000 students is too thick. So it's split: Class 1–4 register, Class 5–8 register, Class 9–10 register. Each register is a shard.

**Replication** = same data, many copies. **Sharding** = different data, split into parts.

---

## 11. Sharded Cluster Components

```
                    App
                     │
                     ▼
              ┌────────────┐        ┌──────────────────┐
              │   mongos   │ ─────► │  Config Servers  │
              │  (router)  │        │ (which data is   │
              └────────────┘        │  on which shard) │
            /       │       \       └──────────────────┘
           ▼        ▼        ▼
       Shard A   Shard B   Shard C
     (replica  (replica  (replica
        set)      set)      set)
```

| Component | Job |
|---|---|
| **Shard** | Stores part of the data. In production, each shard is itself a **replica set**. |
| **mongos** | The **router**. The app connects to `mongos`, not the shards. It sends each query to the right shard. |
| **Config Servers** | Store the **metadata**: which range of data lives on which shard. Run as a replica set. |

- Data is divided into **chunks** (ranges of shard key values).
- A background process called the **balancer** moves chunks between shards to keep them even.

---

## 12. Shard Key and Sharding Strategies

The **shard key** is the field MongoDB uses to decide **which shard** a document goes to. Choosing it is the most important decision in sharding.

### Strategies

| Strategy | How it splits | Good for | Problem |
|---|---|---|---|
| **Ranged** | By ranges of values (A–H, I–Q ...) | Range queries (`$gte`, `$lt`) | Can create a **hotspot** if values always increase (e.g. dates) |
| **Hashed** | By a hash of the value — spreads randomly | **Even** distribution of writes | Range queries must check all shards |
| **Zone** | You assign ranges to specific shards (e.g. by country) | Keeping Pakistani users' data on Pakistani servers | Needs planning |

### A good shard key has:

- **High cardinality** — many different values (`customerId` ✅, `gender` ❌).
- **Even frequency** — no single value is extremely common.
- **Non-increasing values**, or use a hashed key — otherwise all new writes go to the same last shard.

---

## 13. Implementing Sharding (Reference)

Connected to **`mongos`**:

```js
sh.addShard("shardA/localhost:27020")             // add a shard (a replica set)
sh.enableSharding("shop")                         // allow sharding on a database
sh.shardCollection("shop.orders", { customerId: "hashed" })   // choose the shard key
sh.status()                                       // see shards, chunks, balancer
```

| Command | What it does |
|---|---|
| `sh.addShard()` | Adds a shard to the cluster |
| `sh.enableSharding("db")` | Enables sharding for a database |
| `sh.shardCollection("db.col", { key: 1 })` | Shards a collection (ranged key) |
| `sh.shardCollection("db.col", { key: "hashed" })` | Shards a collection (hashed key) |
| `sh.status()` | Shows the whole cluster |

---

## 14. Replication vs Sharding

| | Replication | Sharding |
|---|---|---|
| **Purpose** | Safety and availability | Handling huge data and heavy load |
| **Data on each server** | **Same** (full copy) | **Different** (one part each) |
| **Solves** | "What if a server dies?" | "What if data is too big for one server?" |
| **Main parts** | Primary, secondaries, arbiter | Shards, mongos, config servers |
| **Used together?** | Yes — in production, **every shard is a replica set** | |

---

# Part 3 — CAP Theorem

## 15. The Three Letters: C, A, P

The **CAP Theorem** (by Eric Brewer) applies to **distributed databases** — data spread across several servers.

| Letter | Name | Meaning |
|---|---|---|
| **C** | **Consistency** | Every read gets the **latest** write. All servers show the same data. |
| **A** | **Availability** | Every request gets a **response** (not an error), even if some servers are down. |
| **P** | **Partition Tolerance** | The system keeps working even when the **network between servers breaks** (servers can't talk to each other). |

---

## 16. Why You Can Only Pick Two

The theorem says a distributed system **cannot guarantee all three at the same time**.

In real networks, **cables break and connections drop**, so **P is not optional** — every distributed database must handle partitions. So the real choice is:

> **When the network breaks, do we choose Consistency or Availability?**

**Example — two bank branches, network between them is down:**

```
 Karachi server  ✗─── network broken ───✗  Lahore server
 balance: 5000                              balance: 5000
```

A customer withdraws 3000 in Karachi. Now someone checks the balance in Lahore. The Lahore server **cannot know** about the withdrawal. It has two options:

| Option | Result | Choice |
|---|---|---|
| Refuse to answer: "Service unavailable, try later" | Never shows wrong data, but **not available** | **CP** |
| Answer with 5000 | Always answers, but the data is **old / wrong** | **AP** |

---

## 17. CP Systems vs AP Systems

| | **CP — Consistency + Partition Tolerance** | **AP — Availability + Partition Tolerance** |
|---|---|---|
| During a network split | Some requests **fail or wait**, rather than give wrong data | Always answers, data **may be old** for a while |
| After the split is fixed | — | Servers sync up ("**eventual consistency**") |
| Good for | Banking, payments, stock/inventory, bookings | Social media likes and views, comments, product catalogues, shopping-cart counters |
| Examples | **MongoDB** (default), HBase, Zookeeper | **Cassandra**, CouchDB, Amazon DynamoDB, Riak |

**What about CA?** Consistency + Availability **without** partition tolerance is only possible when there is **no network between servers** — i.e. a **single server** (like a single MySQL or PostgreSQL machine). That is not a distributed system, so in practice CA isn't a real option for distributed databases.

> **Easy way to remember:**
> **CP** = "I'd rather say *nothing* than say something *wrong*." (bank)
> **AP** = "I'll always answer, even if it's a bit *old*." (Instagram like count)

---

## 18. Where Does MongoDB Fit?

**MongoDB is a CP system by default.**

- All writes go to the **primary**, and by default all reads do too.
- If a network split cuts the primary off from the majority, that primary **steps down** — it stops accepting writes until a new primary is elected on the majority side. Writes are briefly **unavailable**, but data stays **consistent**.

**MongoDB is tunable:** using read preference `secondary` or `nearest`, reads can still be served during problems — but they **may be old** (behaving more like AP for reads).

| Setting | Behaviour |
|---|---|
| `readPreference: primary` + `w: "majority"` | Strong consistency (CP) |
| `readPreference: secondary` / `nearest` | Higher read availability, possibly old data |

---

## 19. Things to Remember

| Point | Detail |
|---|---|
| Replication = copies of the **same** data | For safety and availability |
| Sharding = data **split** across servers | For size and performance |
| Replica set has **one** primary | All writes go there |
| Arbiter holds no data | Only votes |
| Election needs a **majority** | Use an odd number of voting members |
| Master-slave was removed in 4.0 | Replaced by replica sets |
| Replication is not a backup | Mistakes replicate too |
| Sharded cluster = shards + mongos + config servers | The app connects to `mongos` |
| Shard key choice is critical | High cardinality, even spread |
| CAP: during a partition choose **C or A** | P is not optional |
| MongoDB is **CP** by default | Cassandra / DynamoDB are **AP** |

---

## 20. Quick Reference Cheat Sheet

| Task | Command |
|---|---|
| Start with a replica set name | `mongod --replSet rs0 --port 27017 --dbpath <folder>` |
| Initiate a replica set | `rs.initiate({ _id: "rs0", members: [ ... ] })` |
| Replica set status | `rs.status()` |
| Replica set config | `rs.conf()` |
| Add / remove member | `rs.add("host:port")` / `rs.remove("host:port")` |
| Add arbiter | `rs.addArb("host:port")` |
| Force an election | `rs.stepDown()` |
| Am I primary? | `db.hello()` |
| Add a shard | `sh.addShard("rsName/host:port")` |
| Enable sharding | `sh.enableSharding("db")` |
| Shard a collection | `sh.shardCollection("db.col", { key: "hashed" })` |
| Cluster status | `sh.status()` |

---

*Theory lecture notes for student reference — MongoDB Replication, Sharding & CAP Theorem.*
