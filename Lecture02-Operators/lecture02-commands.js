// ============================================================
// MongoDB Lecture 02 — Query Operators (Parts 1 & 2)
// Run these commands inside `mongosh`, one at a time (or in blocks)
// Environment: MongoDB 6.0.13 | Mongosh 2.10.0
// ============================================================


// ============================================================
// PART 1
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

db.emp.find({ $and: [ { city: "Karachi", department: "Sales" } ] })
db.emp.find({ $or: [ { city: "Karachi", department: "Sales" } ] })
db.emp.find({ $and: [ { city: "Karachi", department: "Marketing" } ] })
db.emp.find({ $and: [ { city: "Karachi", department: "sales" } ] })

db.emp.find({ $or: [ { city: "Karachi", department: "Sales" } ] })
db.emp.find({ $or: [ { city: "Karachi" }, { department: "Sales" } ] })

// NOTE: values are case-sensitive — "Sales" != "sales"
db.emp.find({ $or: [ { city: "Lahore" }, { department: "Sales" } ] })  // no match on department
db.emp.find({ $or: [ { city: "Lahore" }, { department: "sales" } ] })  // matches correctly

db.emp.find({ $or: [ { city: "Quetta" }, { department: "Administration" } ] })  // → empty


// ------------------------------------------------------------
// 4. COMPARISON OPERATORS — $eq / $ne
// ------------------------------------------------------------

// ❌ WRONG — $eq used as a top-level operator
// db.emp.find({ $eq: { city: "Karachi" } })
// → MongoServerError: unknown top level operator: $eq

// ✅ CORRECT
db.emp.find({ city: { $eq: "Karachi" } })
db.emp.find({ city: { $ne: "Karachi" } })


// ------------------------------------------------------------
// 5. THE $not OPERATOR
// ------------------------------------------------------------

// ❌ WRONG — $not with a plain value
// db.emp.find({ city: { $not: "Karachi" } })
// → MongoServerError: $not needs a regex or a document

// ✅ CORRECT
db.emp.find({ city: { $not: { $eq: "Karachi" } } })


// ------------------------------------------------------------
// 6. ELEMENT OPERATOR — $exists
// ------------------------------------------------------------

db.emp.find({ city: { $exists: false } })
db.emp.find({ about: { $exists: false } })
db.emp.find({ skills: { $exists: false } })


// ============================================================
// PART 2
// ============================================================

// ------------------------------------------------------------
// 7. LOGICAL OPERATOR — $nor
// ------------------------------------------------------------

// Matches documents that satisfy NONE of the conditions
db.emp.find({ $nor: [ { city: "Lahore" }, { department: "sales" } ] })


// ------------------------------------------------------------
// 8. TYPE OPERATOR — $type
// ------------------------------------------------------------

// ❌ WRONG — missing "$" before "type" (no error, just returns nothing)
// db.emp.find({ salary: { type: "int" } })

// ✅ CORRECT
db.emp.find({ salary: { $type: "int" } })

// ❌ WRONG — wrong-case type alias
// db.emp.find({ salary: { $type: "String" } })
// → MongoServerError[BadValue]: Unknown type name alias: String

// ✅ CORRECT — lowercase alias
db.emp.find({ salary: { $type: "string" } })          // → empty, salary is stored as int
db.emp.find({ allowances: { $type: "string" } })      // Jawwad — allowances is ""
db.emp.find({ allowances: { $type: "double" } })      // Abdullah & Hammad — decimal allowances
db.emp.find({ allowances: { $type: "int" } })         // → empty
db.emp.find({ city: { $type: "string" } })

// $type also accepts an array of possible types
db.emp.find({ department: { $type: ["string", "int"] } })
db.emp.find({ department: { $type: ["double", "int"] } })   // → empty


// ------------------------------------------------------------
// 9. SET OPERATORS — $in / $nin
// ------------------------------------------------------------

db.emp.find({ department: { $in: ["sales", "Marketing"] } })
db.emp.find({ department: { $nin: ["sales", "Marketing"] } })


// ------------------------------------------------------------
// 10. ARRAY OPERATOR — $size
// ------------------------------------------------------------

db.emp.find({ skills: { $size: 3 } })   // Abdullah
db.emp.find({ skills: { $size: 5 } })   // → empty
db.emp.find({ skills: { $size: 4 } })   // Jawwad


// ------------------------------------------------------------
// 11. UPDATING A NESTED ARRAY FIELD (projects)
// ------------------------------------------------------------

// ❌ WRONG — colon used instead of nesting inside one object
// db.emp.updateOne({ name: "Abdullah" }, { $set: projects: { ... } })
// → SyntaxError: Unexpected token, expected ","

// ❌ WRONG — square brackets wrapping the whole $set body
// db.emp.updateOne({ _id: 'emp_001' }, { $set: [ projects: { ... } ] })
// → SyntaxError

// ✅ CORRECT
db.emp.updateOne(
  { _id: "emp_001" },
  {
    $set: {
      projects: [
        { name: "Website", status: "completed", hours: 20 },
        { name: "Application", status: "pending", hours: 40 }
      ]
    }
  }
)

db.emp.find()

db.emp.updateOne(
  { name: "Jawwad" },
  {
    $set: {
      projects: [
        { name: "Automation", status: "Ongoing", hours: 5 },
        { name: "Website", status: "Ongoing", hours: 3 }
      ]
    }
  }
)


// ------------------------------------------------------------
// 12. ARRAY OPERATOR — $elemMatch
// ------------------------------------------------------------

// ❌ WRONG — unbalanced braces
// db.emp.find({ projects: { $elemMatch: { status: 'completed', hours: { $gt: 10 } } })
// → SyntaxError: Unexpected token, expected ","

// ✅ CORRECT
db.emp.find({ projects: { $elemMatch: { status: "completed", hours: { $gt: 10 } } } })
db.emp.find({ projects: { $elemMatch: { hours: { $gt: 10 } } } })
db.emp.find({ projects: { $elemMatch: { hours: { $gt: 1 } } } })
db.emp.find({ projects: { $elemMatch: { status: "Ongoing", hours: { $gt: 1 } } } })

// ❌ WRONG — $elemMatch given an array of separate condition objects
// db.emp.find({ projects: { $elemMatch: [ { status: 'Ongoing' }, { hours: { $gt: 2 } } ] } })
// → SyntaxError / invalid usage

db.emp.find({ projects: { $elemMatch: { status: "Pending", hours: { $lt: 30 } } } })    // → empty (case-sensitive: "pending" not "Pending")
db.emp.find({ projects: { $elemMatch: { status: "pending", hours: { $lt: 50 } } } })
db.emp.find({ projects: { $elemMatch: { status: "pending", hours: { $lt: 40 } } } })    // → empty (40 is not < 40)
db.emp.find({ projects: { $elemMatch: { status: "pending", hours: { $lt: 41 } } } })

// ❌ WRONG — two separate condition objects instead of one
// db.emp.find({ projects: { $elemMatch: { status: 'Pending' }, { hours: { $lt: 41 } } } })
// → SyntaxError

// ✅ CORRECT — single object with both conditions
db.emp.find({ projects: { $elemMatch: { status: "pending", hours: { $lt: 41 } } } })


// ------------------------------------------------------------
// 13. PATTERN MATCHING — $regex
// ------------------------------------------------------------

db.emp.find({ name: { $regex: "A" } })     // contains "A"
db.emp.find({ name: { $regex: "^A" } })    // starts with "A"
db.emp.find({ name: { $regex: "^H" } })    // starts with "H"
db.emp.find({ name: { $regex: "ah" } })    // contains "ah"
db.emp.find({ name: { $regex: "ad$" } })   // ends with "ad"
db.emp.find({ name: { $regex: "ww" } })    // contains "ww"
db.emp.find({ name: { $regex: "a" } })     // contains "a"


// ------------------------------------------------------------
// 14. ARRAY OPERATOR — $all
// ------------------------------------------------------------

db.emp.find({ skills: { $all: ["html", "css"] } })     // Abdullah has both
db.emp.find({ skills: { $all: ["html", "git"] } })     // → empty
db.emp.find({ skills: { $all: ["github", "git"] } })   // → empty (case-sensitive)
db.emp.find({ skills: { $all: ["GITHUB", "GIT"] } })   // Jawwad has both

// ------------------------------------------------------------
// NOTE — $all vs $elemMatch:
// $all checks that a flat array contains ALL given values, anywhere in it
// (each value checked independently).
// $elemMatch checks that ONE SINGLE array element satisfies ALL the given
// conditions TOGETHER (used for arrays of embedded documents, e.g. projects).
// See README section 14 for the full comparison table.
// ------------------------------------------------------------

exit
