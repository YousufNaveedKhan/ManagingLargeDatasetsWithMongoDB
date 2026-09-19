// ============================================================
// MongoDB Lecture 03 — Query & Update Operators (Parts 1, 2 & 3 — COMPLETE)
// Run these commands inside `mongosh`, one at a time (or in blocks)
// Environment: MongoDB 6.0.13 | Mongosh 2.10.0
// ============================================================


// ============================================================
// PART 1
// ============================================================

// ------------------------------------------------------------
// 1. SETUP — DATABASE & COLLECTION
// ------------------------------------------------------------

use lecture03

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


// ============================================================
// PART 3 — UPDATE OPERATORS
// ============================================================

// ------------------------------------------------------------
// 16. find() SECOND ARGUMENT vs updateOne() — DON'T CONFUSE THEM
// ------------------------------------------------------------

// find()'s 2nd argument is a PROJECTION — it can never change data
db.emp.find({ name: "Hammad" }, { city: "Lahore" })
// → [ { _id: 'emp_002', city: 'Lahore' } ]  (just returns _id + city)

// ❌ WRONG — trying to use $set inside find()'s projection
// db.emp.find({ name: "Hammad" }, { $set: { city: "Lahore" } })
// → MongoServerError: FieldPath field names may not start with '$'

// ❌ WRONG — same mistake, different shape
// db.emp.find({ name: "Hammad" }, { city: { $set: "Lahore" } })
// → MongoServerError: Unknown expression $set

// ❌ WRONG — updateOne() needs an ATOMIC OPERATOR, not a plain object
// db.emp.updateOne({ name: "Hammad" }, { city: "Lahore" })
// → MongoInvalidArgumentError: Update document requires atomic operators

// ✅ CORRECT
db.emp.updateOne({ name: "Hammad" }, { $set: { city: "Lahore" } })

db.emp.find({ name: "Hammad" })

// Add more employees
db.emp.insertMany([
  {
    name: "Irfan",
    email: "irfan@gmail.com",
    department: "Marketing",
    salary: 84000,
    city: "Peshawar"
  },
  {
    name: "Owais",
    email: "owais@gmail.com",
    department: "sales",
    salary: 25000,
    city: "Karachi"
  }
])

// updateMany() — updates ALL matching documents
db.emp.updateMany({ department: "sales" }, { $set: { department: "Sales" } })

db.emp.find()

// NOTE: updateOne() only touches the FIRST match — with two "Sales" employees
// now, this only updates one of them
db.emp.updateOne({ department: "Sales" }, { $set: { city: "Lahore" } })

db.emp.find()


// ------------------------------------------------------------
// 17. RENAMING A FIELD — $rename
// ------------------------------------------------------------

db.emp.updateOne({ name: "Owais" }, { $set: { designation: "Manager" } })

db.emp.find({ name: "Owais" })

// Rename "designation" to "role"
db.emp.updateOne({ name: "Owais" }, { $rename: { designation: "role" } })

db.emp.find({ name: "Owais" })


// ------------------------------------------------------------
// 18. MULTIPLYING A FIELD — $mul
// ------------------------------------------------------------

// ❌ WRONG — $mul is an UPDATE operator, cannot be used inside find()
// db.emp.find({ department: "Sales" }, { $mul: { salary: 12 } })
// → MongoServerError: FieldPath field names may not start with '$'
// db.emp.find({ department: "Sales" }, { salary: { $mul: 12 } })
// → MongoServerError: Unknown expression $mul
// db.emp.updateOne({ department: "Sales" }, { salary: { $mul: 12 } })
// → MongoInvalidArgumentError: Update document requires atomic operators

// ✅ CORRECT
db.emp.updateOne({ department: "Sales" }, { $mul: { salary: 12 } })

db.students.find()   // (unrelated collection check — empty)

db.emp.find()

db.createCollection("products")

db.products.insertMany([
  { name: "Laptop", quantity: 12, unitPrice: 35000 },
  { name: "Mobile", quantity: 3, unitPrice: 15000 }
])

// Reduce salary to 10% (i.e. a big cut) then increase by 10%
db.emp.updateOne({ name: "Jawwad" }, { $mul: { salary: 0.1 } })
db.emp.find()

db.emp.updateOne({ name: "Jawwad" }, { $mul: { salary: 1.1 } })
// NOTE: result may show floating-point noise, e.g. 6050.000000000001 — normal behavior
db.emp.find()

db.products.find()

db.products.updateOne({ name: "Mobile" }, { $mul: { quantity: 3 } })
db.products.find()

// Multiplying with a shell variable
// ❌ WRONG — referencing an undeclared variable
// db.products.updateOne({ name: "Mobile" }, { $mul: { unitPrice: quantity } })
// → ReferenceError: quantity is not defined

let unitPrice = 300
let quantityy = 3

// ✅ CORRECT
db.products.updateOne({ name: "Mobile" }, { $mul: { unitPrice: quantityy } })
db.products.find()


// ------------------------------------------------------------
// 19. SETTING A BOUND — $max / $min
// ------------------------------------------------------------

// $max — only updates if the new value is GREATER than the current value
db.emp.updateOne({ name: "Irfan" }, { $max: { salary: 8300 } })    // → modifiedCount: 0
db.emp.find()

db.emp.updateOne({ name: "Irfan" }, { $max: { salary: 85000 } })   // → modifiedCount: 1
db.emp.find()

// $min — only updates if the new value is LESS than the current value
db.emp.updateOne({ name: "Irfan" }, { $min: { salary: 86000 } })   // → modifiedCount: 0
db.emp.find()

db.emp.updateOne({ name: "Irfan" }, { $min: { salary: 84000 } })   // → modifiedCount: 1
db.emp.find()


// ------------------------------------------------------------
// 20. INCREMENTING A FIELD — $inc
// ------------------------------------------------------------

db.products.updateOne({ name: "Mobile" }, { $inc: { quantity: 3 } })
db.products.find()

db.products.updateOne({ name: "Mobile" }, { $inc: { quantity: -1 } })
db.products.find()

db.emp.find()


// ------------------------------------------------------------
// 21. UPDATING A NESTED OBJECT FIELD — DOT NOTATION
// ------------------------------------------------------------

db.emp.updateOne(
  { name: "Owais" },
  { $set: { attendance: { jan: "45%", feb: "98%", mar: "79" } } }
)
db.emp.find()

// ❌ WRONG — unquoted dot notation is invalid object-key syntax
// db.emp.updateOne({ name: "Owais" }, { $set: { attendance.feb: "95%" } })
// → SyntaxError: Unexpected token, expected ","

// ✅ CORRECT — quote the whole dotted path as ONE key
db.emp.updateOne({ name: "Owais" }, { $set: { "attendance.feb": "95%" } })
db.emp.find()

db.emp.updateOne({ name: "Owais" }, { $set: { "attendance.feb": "98%" } })
db.emp.find()


// ------------------------------------------------------------
// 22. INSERT-IF-NOT-FOUND — upsert
// ------------------------------------------------------------

// ❌ WRONG — emp_008 must be a quoted string, not a bare identifier
// db.emp.updateOne({ _id: emp_008 }, { name: "Hamza", ... })
// → ReferenceError: emp_008 is not defined

// ❌ WRONG — mixing $set object with a stray 4th positional object
// db.emp.updateOne({ _id: emp_008 }, { $set: { ... } } { $upsert: true } })
// → SyntaxError

// ❌ WRONG — "$upsert" as a field inside the update document does nothing useful
// db.emp.updateOne({ name: "Hamza" }, { $set: { ... } }, { $upsert: true } )
// → runs but matchedCount: 0, upsertedCount: 0 (option key must be "upsert", no "$")

// ✅ CORRECT — third argument is { upsert: true }
db.emp.updateOne(
  { name: "Hamza" },
  {
    $set: {
      name: "Hamza",
      email: "hamza@gmail.com",
      department: "Production",
      salary: 97000,
      role: "Senior Developer",
      city: "Karachi"
    }
  },
  { upsert: true }
)

db.emp.find()

db.emp.updateOne(
  { name: "Abu Hurerah" },
  {
    $set: {
      name: "Abu Hurerah",
      email: "abh@gmail.com",
      department: "Production",
      salary: 75000,
      role: "Senior Developer",
      city: "Karachi"
    }
  },
  { upsert: true }
)

db.emp.find()


// ------------------------------------------------------------
// 23. ARRAY UPDATE OPERATORS — $push / $pop / $pull / $pullAll / $addToSet / $unset
// ------------------------------------------------------------

// $push — adds ONE element to the end of the array
// ⚠️ Passing an array pushes it as a single NESTED element, not separate items
db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: ["HTML", "CSS"] } })
db.emp.find()   // skills now has a nested ['HTML','CSS'] inside it — probably not what you want

// $unset — removes a field entirely
db.emp.updateOne({ name: "Jawwad" }, { $unset: { skills: "" } })
db.emp.find()

// Reset skills cleanly
db.emp.updateOne({ name: "Jawwad" }, { $set: { skills: ["JS", "Bootstrap"] } })
db.emp.find()

// ❌ WRONG — $push only accepts ONE value per call this way
// db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "HTML", "CSS" } })
// → SyntaxError

// ✅ CORRECT — push one at a time
db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "HTML" } })
db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "CSS" } })
db.emp.find()

db.emp.updateOne({ name: "Jawwad" }, { $set: { skills: ["GIT", "GITHUB"] } })
db.emp.find()

db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "CSS" } })
db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "HTML" } })
db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "FLUTTER" } })
db.emp.find()

// $pull — removes ALL matching elements
db.emp.updateOne({ name: "Jawwad" }, { $pull: { skills: "FLUTTER" } })
db.emp.find()

// $push does NOT de-duplicate — pushing the same value twice adds it twice
db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "FLUTTER" } })
db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "FLUTTER" } })
db.emp.find()   // "FLUTTER" appears twice

db.emp.updateOne({ name: "Jawwad" }, { $pull: { skills: "FLUTTER" } })
db.emp.find()   // $pull removes ALL matching occurrences at once

// $addToSet — adds only if not already present (no duplicates)
db.emp.updateOne({ name: "Jawwad" }, { $addToSet: { skills: "FLUTTER" } })
db.emp.find()

db.emp.updateOne({ name: "Jawwad" }, { $addToSet: { skills: "FLUTTER" } })
// → modifiedCount: 0, already present

// $pop — removes first (-1) or last (1) array element
// ❌ WRONG — needs to be wrapped in an object
// db.emp.updateOne({ name: "Jawwad" }, { $pop: skills })
// → ReferenceError: skills is not defined

// ✅ CORRECT
db.emp.updateOne({ name: "Jawwad" }, { $pop: { skills: 1 } })    // remove LAST
db.emp.find()

db.emp.updateOne({ name: "Jawwad" }, { $pop: { skills: -1 } })   // remove FIRST
db.emp.find()

// $pullAll — removes several EXACT values at once (array required)
// ❌ WRONG — a single value instead of an array
// db.emp.updateOne({ name: "Jawwad" }, { $pullAll: { skills: 1 } })
// → MongoServerError: $pullAll requires an array argument but was given a int

// ❌ WRONG — modifier value must name the field, not be a bare number
// db.emp.updateOne({ name: "Jawwad" }, { $pullAll: 1 })
// → MongoServerError: Modifiers operate on fields but we found type int instead

// ✅ CORRECT
db.emp.updateOne({ name: "Jawwad" }, { $pullAll: { skills: ["CSS", "GITHUB"] } })
db.emp.find()

// Rebuild skills, then pull all again to demonstrate
db.emp.updateOne({ name: "Jawwad" }, { $addToSet: { skills: "FLUTTER" } })
db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "HTML" } })
db.emp.updateOne({ name: "Jawwad" }, { $push: { skills: "CSS" } })
db.emp.find()

db.emp.updateOne({ name: "Jawwad" }, { $pullAll: { skills: ["HTML", "CSS"] } })
db.emp.find()

exit
