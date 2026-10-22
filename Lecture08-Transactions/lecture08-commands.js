// ============================================================
// MongoDB Lecture 08 — Transactions
// Run in mongosh (PowerShell) or the MongoDB Shell inside Compass.
// A session lives in ONE shell connection, so don't use a Playground here.
// Environment: MongoDB 6.0.13 | Mongosh 2.x
// ============================================================


// ------------------------------------------------------------
// 1. SETUP — SINGLE-NODE REPLICA SET  (outside mongosh, ONE time)
// ------------------------------------------------------------
// Transactions only work on a replica set (or sharded cluster).
//
// a) Open Notepad as Administrator and open:
//      C:\Program Files\MongoDB\Server\6.0\bin\mongod.cfg
//
// b) Find the line  #replication:  and change it to (2 spaces before replSetName):
//
//      replication:
//        replSetName: rs0
//
// c) PowerShell as Administrator:
//      net stop MongoDB
//      net start MongoDB
//
// d) Open mongosh again and run:

rs.initiate()          // run only ONCE

// If rs.initiate() gives a hostname error, use this instead:
// rs.initiate({ _id: "rs0", members: [ { _id: 0, host: "127.0.0.1:27017" } ] })

// Check — the prompt should now show:  rs0 [direct: primary] test>
rs.status().members
db.hello()             // isWritablePrimary: true, setName: 'rs0'


// ------------------------------------------------------------
// 2. DATA
// ------------------------------------------------------------

use lecture08_transactions

db.accounts.insertMany([
  { name: "Ali",   balance: 5000 },
  { name: "Hamza", balance: 2000 }
])

db.accounts.find()


// ------------------------------------------------------------
// 3. TRANSACTION WITH COMMIT  — Ali sends 500 to Hamza
// ------------------------------------------------------------

var session = db.getMongo().startSession()
var accounts = session.getDatabase("lecture08_transactions").accounts

session.startTransaction()

accounts.updateOne({ name: "Ali" },   { $inc: { balance: -500 } })
accounts.updateOne({ name: "Hamza" }, { $inc: { balance: 500 } })

session.commitTransaction()
session.endSession()

db.accounts.find()     // Ali: 4500, Hamza: 2500


// ------------------------------------------------------------
// 4. TRANSACTION WITH ABORT  — cancel a transfer
// ------------------------------------------------------------

var session = db.getMongo().startSession()
var accounts = session.getDatabase("lecture08_transactions").accounts

session.startTransaction()

accounts.updateOne({ name: "Ali" },   { $inc: { balance: -1000 } })
accounts.updateOne({ name: "Hamza" }, { $inc: { balance: 1000 } })

accounts.find()        // INSIDE the transaction:  Ali 3500, Hamza 3500
db.accounts.find()     // OUTSIDE the transaction: Ali 4500, Hamza 2500  (isolation)

session.abortTransaction()
session.endSession()

db.accounts.find()     // still Ali: 4500, Hamza: 2500


// ------------------------------------------------------------
// 5. WRITE CONFLICT — two transactions change the same document
// ------------------------------------------------------------

var s1 = db.getMongo().startSession()
var s2 = db.getMongo().startSession()
var acc1 = s1.getDatabase("lecture08_transactions").accounts
var acc2 = s2.getDatabase("lecture08_transactions").accounts

s1.startTransaction()
s2.startTransaction()

acc1.updateOne({ name: "Ali" }, { $inc: { balance: -100 } })   // OK
acc2.updateOne({ name: "Ali" }, { $inc: { balance: -200 } })   // ERROR: WriteConflict
                                                               // errorLabels: [ 'TransientTransactionError' ]

s1.commitTransaction()
s1.endSession()
s2.endSession()

db.accounts.find()     // Ali: 4400, Hamza: 2500  (only s1's change was saved)


// ------------------------------------------------------------
// 6. CLEAN UP (optional)
// ------------------------------------------------------------

db.accounts.drop()
