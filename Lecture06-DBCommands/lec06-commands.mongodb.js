/* global use, db */
// ============================================================
// MongoDB Lecture 06 — Database Commands (complete playground)
// Environment: MongoDB 6.0.13 | VS Code + MongoDB for VS Code
// Select ONE block at a time and run the selection.
// ============================================================

use('lecture06_dbcommands');


// ------------------------------------------------------------
// 1. HELPER vs COMMAND — same result, two ways
// ------------------------------------------------------------

// Helper (shell method)
db.students.find({ city: "Karachi" });

// Command (what the helper sends to the server)
db.runCommand({ find: "students", filter: { city: "Karachi" } });

// Is the server alive?
db.runCommand({ ping: 1 });


// ------------------------------------------------------------
// 2. USER MANAGEMENT COMMANDS
// ------------------------------------------------------------

// Create a user with READ-only access
db.runCommand({
  createUser: "ali",
  pwd: "ali123",
  roles: [ { role: "read", db: "lecture06_dbcommands" } ]
});

// See one user / all users of this database
db.runCommand({ usersInfo: "ali" });
db.runCommand({ usersInfo: 1 });

// Give more rights
db.runCommand({
  grantRolesToUser: "ali",
  roles: [ { role: "readWrite", db: "lecture06_dbcommands" } ]
});

db.runCommand({ usersInfo: "ali" });

// Take a right back
db.runCommand({
  revokeRolesFromUser: "ali",
  roles: [ { role: "read", db: "lecture06_dbcommands" } ]
});

// Create and delete a temporary user
db.runCommand({ createUser: "temp", pwd: "temp123", roles: [] });
db.runCommand({ dropUser: "temp" });


// ------------------------------------------------------------
// 3. AUTHENTICATION COMMANDS
// ------------------------------------------------------------

db.auth("ali", "ali123");        // { ok: 1 }
db.auth("ali", "wrong123");      // MongoServerError: Authentication failed

// Who am I logged in as?
db.runCommand({ connectionStatus: 1 });

// Old command from the book — removed in MongoDB 4.0+
db.runCommand({ getnonce: 1 });  // no such command: 'getnonce'


// ------------------------------------------------------------
// 4. WRITE OPERATION COMMANDS
// ------------------------------------------------------------

// insert
db.runCommand({
  insert: "students",
  documents: [
    { name: "Ali",    city: "Karachi", marks: 75 },
    { name: "Hamza",  city: "Lahore",  marks: 60 },
    { name: "Sara",   city: "Karachi", marks: 88 },
    { name: "Irfan",  city: "Quetta",  marks: 45 },
    { name: "Hammad", city: "Karachi", marks: 92 }
  ]
});

// find
db.runCommand({ find: "students", filter: { city: "Karachi" } });

// update — one document
db.runCommand({
  update: "students",
  updates: [
    { q: { name: "Irfan" }, u: { $set: { marks: 50 } } }
  ]
});

// update — many documents
db.runCommand({
  update: "students",
  updates: [
    { q: { city: "Karachi" }, u: { $inc: { marks: 5 } }, multi: true }
  ]
});

// findAndModify — update AND get the document back
db.runCommand({
  findAndModify: "students",
  query: { name: "Hamza" },
  update: { $inc: { marks: 10 } },
  new: true
});

// delete
db.runCommand({
  delete: "students",
  deletes: [ { q: { name: "Irfan" }, limit: 1 } ]
});

db.runCommand({ find: "students" });


// ------------------------------------------------------------
// 5. AGGREGATION COMMANDS
// ------------------------------------------------------------

db.runCommand({ count: "students" });
db.runCommand({ count: "students", query: { city: "Karachi" } });

db.runCommand({ distinct: "students", key: "city" });

db.runCommand({
  aggregate: "students",
  pipeline: [
    { $group: { _id: "$city", total: { $sum: 1 }, avgMarks: { $avg: "$marks" } } }
  ],
  cursor: {}
});
