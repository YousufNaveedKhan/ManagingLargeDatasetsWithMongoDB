# Managing Large Datasets with MongoDB

A complete course on **MongoDB**, from basic CRUD operations to **replication, sharding and transactions**. Each lecture folder has a `README.md` with the theory and step-by-step explanation, plus a commands file you can run in `mongosh`, MongoDB Compass, or the MongoDB for VS Code Playground.

> **Environment used throughout the course:** MongoDB 6.0.13 · `mongosh` (PowerShell) / MongoDB Compass Shell / VS Code MongoDB Playground · Local instance (`mongodb://127.0.0.1:27017`)

---

## Course Lectures

| # | Topic | Lecture Notes | Commands File |
|---|---|---|---|
| 01 | CRUD Operations (Create, Read, Update, Delete) | [`Lecture01-CRUD/README.md`](./Lecture01-CRUD/README.md) | [`lecture01-commands.js`](./Lecture01-CRUD/lecture01-commands.js) |
| 02 | Data Types | [`Lecture02-DataTypes/README.md`](./Lecture02-DataTypes/README.md) | [`lecture02-commands.js`](./Lecture02-DataTypes/lecture02-commands.js) |
| 03 | Query & Update Operators | [`Lecture03-Operators/README.md`](./Lecture03-Operators/README.md) | [`lecture03-commands.js`](./Lecture03-Operators/lecture03-commands.js) |
| 04 | Aggregation Pipeline | [`Lecture04-AggregationPipeline/README.md`](./Lecture04-AggregationPipeline/README.md) | [`lecture04-aggregation.mongodb.js`](./Lecture04-AggregationPipeline/lecture04-aggregation.mongodb.js) |
| 05 | Indexing | [`Lecture05-Indexing/README.md`](./Lecture05-Indexing/README.md) | [`lec05-commands.mongodb.js`](./Lecture05-Indexing/lec05-commands.mongodb.js) |
| 06 | Database Commands | [`Lecture06-DBCommands/README.md`](./Lecture06-DBCommands/README.md) | [`lec06-commands.mongodb.js`](./Lecture06-DBCommands/lec06-commands.mongodb.js) |
| 07 | Replication, Sharding & the CAP Theorem | [`Lecture07-ReplicationSharding/README.md`](./Lecture07-ReplicationSharding/README.md) | — |
| 08 | Transactions | [`Lecture08-Transactions/README.md`](./Lecture08-Transactions/README.md) | [`lecture08-commands.js`](./Lecture08-Transactions/lecture08-commands.js) |

## Assignments

| Assignment | File |
|---|---|
| Assignment 01 — MongoDB Bookstore | [`Assignments/Assignment01-MongoDB-Bookstore.md`](./Assignments/Assignment01-MongoDB-Bookstore.md) |
| Assignment 02 — MongoDB Aggregation | [`Assignments/Assignment02-MongoDB-Aggregation.md`](./Assignments/Assignment02-MongoDB-Aggregation.md) |

---

## Notes for Students

- **Run inserts only once.** Several commands files insert sample data. Running them again creates duplicate documents, so comment out the `insertMany()` lines after the first run.
- **Use `mongosh` (or Compass Shell) for Lecture 08.** Transactions need a session that stays alive across several commands, which a Playground does not provide. Lecture 08 also needs a single-node replica set; the setup steps are in the lecture README.
- **Lecture 04 has extra material at the end.** Part 3 of the Aggregation lecture covers operators that were **not taught in class** (such as `$cond`, `$switch`, `$unwind`, `$bucket`, `$push` and `$addToSet`). They are clearly marked, and they are included as reference for your own practice.

## Repository Structure

```
ManagingLargeDatasetsWithMongoDB/
├── Assignments/
├── Lecture01-CRUD/
├── Lecture02-DataTypes/
├── Lecture03-Operators/
├── Lecture04-AggregationPipeline/
├── Lecture05-Indexing/
├── Lecture06-DBCommands/
├── Lecture07-ReplicationSharding/
├── Lecture08-Transactions/
└── README.md
```

---

*Course material for student reference.*
