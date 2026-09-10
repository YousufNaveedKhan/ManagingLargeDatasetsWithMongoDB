// ============================================================
// MongoDB Lecture 02 — Query Operators (PART 1 — IN PROGRESS)
// Run these commands inside `mongosh`, one at a time (or in blocks)
// Environment: MongoDB 6.0.13 | Mongosh 2.10.0
//
// NOTE: This lecture is incomplete — will be continued & this file
// updated/pushed again in the next class.
// ============================================================


// ------------------------------------------------------------
// 1. SETUP — DATABASE & COLLECTION
// ------------------------------------------------------------

use lecture02

db.createCollection("emp")

db.emp.insertMany([
  {
    _id: "emp_001",
    name: "Abdullah",
    email: "abd@gmail.com",
    department: "sales",
    salary: 50000,
    allowances: 0.15,
    skills: ["html", "css", "js"]
  },
  {
    _id: "emp_002",
    name: "Hammad",
    email: "hammad@gmail.com",
    department: "Marketing",
    salary: 80000,
    allowances: 0.1
  },
  {
    name: "Jawwad",
    email: "jwd@gmail.com",
    department: "Production",
    salary: 55000,
    allowances: "",
    attendance: { jan: "80%", feb: "90%", mar: "79%" },
    skills: ["GIT", "GITHUB", "FLUTTER", "C#"]
  }
])

db.emp.find()

// ❌ WRONG — missing comma between filter and update object
// db.emp.updateOne({ name: "Hammad" } { $set: { city: "Karachi" } })
// → SyntaxError: Unexpected token, expected ","

// ✅ CORRECT
db.emp.updateOne({ name: "Hammad" }, { $set: { city: "Karachi" } })
db.emp.updateOne({ name: "Jawwad" }, { $set: { city: "Lahore" } })
db.emp.updateOne({ name: "Abdullah" }, { $set: { city: "Karachi" } })

db.emp.find()


// ------------------------------------------------------------
// 2. PROJECTIONS IN find()
// ------------------------------------------------------------

// Second argument to find() = projection (controls which fields return)
db.emp.find({ city: "Karachi" }, { department: "Marketing" })

// ❌ WRONG — filter cannot be an array
// db.emp.find([ { city: "Karachi" }, { department: "Marketing" } ])
// → MongoInvalidArgumentError: Query filter must be a plain object or ObjectId

// ✅ CORRECT — implicit AND using a plain filter object
db.emp.find({ city: "Karachi", department: "Marketing" })

db.emp.find({ city: "Karachi", department: "Production" })


// ------------------------------------------------------------
// 3. LOGICAL OPERATORS — $and / $or
// ------------------------------------------------------------

// ❌ WRONG — missing comma inside the array
// db.emp.find({ $and: [ { city: "Karachi" }, { department: "Sales" } ] )
// → SyntaxError: Unexpected token, expected ","

// $and — all conditions must match
db.emp.find({ $and: [ { city: "Karachi", department: "Sales" } ] })
db.emp.find({ $or: [ { city: "Karachi", department: "Sales" } ] })

db.emp.find({ $and: [ { city: "Karachi", department: "Marketing" } ] })
db.emp.find({ $and: [ { city: "Karachi", department: "sales" } ] })

// $or — at least one condition must match
db.emp.find({ $or: [ { city: "Karachi", department: "Sales" } ] })
db.emp.find({ $or: [ { city: "Karachi" }, { department: "Sales" } ] })

// NOTE: values are case-sensitive — "Sales" != "sales"
db.emp.find({ $or: [ { city: "Lahore" }, { department: "Sales" } ] })  // no match on department
db.emp.find({ $or: [ { city: "Lahore" }, { department: "sales" } ] })  // matches correctly

// No matches → empty result
db.emp.find({ $or: [ { city: "Quetta" }, { department: "Administration" } ] })


// ------------------------------------------------------------
// 4. COMPARISON OPERATORS — $eq / $ne
// ------------------------------------------------------------

// ❌ WRONG — $eq used as a top-level operator
// db.emp.find({ $eq: { city: "Karachi" } })
// → MongoServerError: unknown top level operator: $eq

// ✅ CORRECT — $eq applied on the field
db.emp.find({ city: { $eq: "Karachi" } })

// $ne — not equal
db.emp.find({ city: { $ne: "Karachi" } })


// ------------------------------------------------------------
// 5. THE $not OPERATOR
// ------------------------------------------------------------

// ❌ WRONG — $not with a plain value
// db.emp.find({ city: { $not: "Karachi" } })
// → MongoServerError: $not needs a regex or a document

// ✅ CORRECT — wrap the condition
db.emp.find({ city: { $not: { $eq: "Karachi" } } })


// ------------------------------------------------------------
// 6. ELEMENT OPERATOR — $exists
// ------------------------------------------------------------

// ❌ WRONG — extra closing brace
// db.emp.find({ city:{$exists:false} } })
// → SyntaxError: Unexpected token, expected ","

// ✅ CORRECT
db.emp.find({ city: { $exists: false } })
db.emp.find({ about: { $exists: false } })
db.emp.find({ skills: { $exists: false } })


// ------------------------------------------------------------
// END OF PART 1 — to be continued in the next class
// ------------------------------------------------------------

exit
