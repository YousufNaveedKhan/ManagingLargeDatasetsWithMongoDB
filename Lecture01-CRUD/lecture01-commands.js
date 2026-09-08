// ============================================================
// MongoDB Lecture 01 — Complete Command File
// Run these commands inside `mongosh`, one at a time (or in blocks)
// Environment: MongoDB 6.0.13 | Mongosh 2.10.0
// ============================================================


// ------------------------------------------------------------
// 1. CONNECT & VIEW DATABASES
// ------------------------------------------------------------

show dbs

use lecture01


// ------------------------------------------------------------
// 2. CREATE A COLLECTION
// ------------------------------------------------------------

db.createCollection("students")

show dbs


// ------------------------------------------------------------
// 3. INSERT DOCUMENTS
// ------------------------------------------------------------

// insertOne()
db.students.insertOne({
  name: "Laiba",
  email: "laiba@gmail.com",
  course: "HDSE",
  marks: 91
})

db.students.find()

// insertMany()
db.students.insertMany([
  {
    name: "Anusha",
    email: "anusha@gmail.com",
    course: "ADSE",
    marks: 90
  },
  {
    name: "Abu Hurerah",
    email: "abuhurerah@gmail.com",
    course: "DISM",
    marks: 80
  }
])

db.students.find()

// Query by exact field match
db.students.find({ course: "DISM" })
db.students.find({ course: "ADSE" })
db.students.find({ course: "HDSE" })

// One more insert
db.students.insertOne({
  name: "Abdul Rehman",
  email: "abd@gmail.com",
  course: "ADSE",
  marks: 80
})

db.students.find()

db.students.find({ course: "ADSE" })


// ------------------------------------------------------------
// 4. EMPLOYEES COLLECTION — INSERT & COMPARISON OPERATORS
// ------------------------------------------------------------

db.createCollection("employees")

db.employees.insertMany([
  {
    name: "John",
    email: "john@gmail.com",
    department: "Sales",
    city: "Karachi",
    salary: 98000,
    skills: ["GIT", "JAVA", "C#", "PYTHON"]
  },
  {
    name: "Abdullah",
    email: "abdullah@gmail.com",
    department: "Production",
    city: "Peshawar",
    salary: 75000
  },
  {
    name: "Irfan",
    email: "irfan@gmail.com",
    department: "",
    salary: 25000
  }
])

db.employees.find()

// $gt — greater than
db.employees.find({ salary: { $gt: 90000 } })

// $gte — greater than or equal
db.employees.find({ salary: { $gte: 90000 } })
db.employees.find({ salary: { $gte: 75000 } })

// $lt — less than
db.employees.find({ salary: { $lt: 75000 } })

// $lte — less than or equal
db.employees.find({ salary: { $lte: 75000 } })

db.employees.find({ salary: { $gt: 80000 } })

// $ne — not equal
db.employees.find({ salary: { $ne: 75000 } })


// ------------------------------------------------------------
// 5. UPDATE DOCUMENTS — updateOne()
// ------------------------------------------------------------

// Update a single field
db.employees.updateOne(
  { name: "John" },
  { $set: { name: "Hammad" } }
)

db.employees.find()

// ❌ WRONG — multiple objects passed to $set as an array (throws error)
// db.employees.updateOne(
//   { name: "Hammad" },
//   { $set: [{ email: "hammad@gmail.com" }, { city: "Lahore" }] }
// )

// ❌ WRONG — two separate objects after $set (syntax error)
// db.employees.updateOne(
//   { name: "Hammad" },
//   { $set: { email: "hammad@gmail.com" }, { city: "Lahore" } }
// )

// ✅ CORRECT — all fields inside ONE $set object
db.employees.updateOne(
  { name: "Hammad" },
  { $set: { email: "hammad@gmail.com", city: "Lahore" } }
)

// Revert back to original values
db.employees.updateOne(
  { name: "Hammad" },
  { $set: { name: "John", email: "john@gmail.com", city: "Karachi" } }
)

db.employees.find()

// Insert a document with a custom _id
db.employees.insertOne({
  _id: 6001,
  name: "Owais",
  email: "owais@gmail.com",
  department: "Marketing",
  salary: 85000,
  skills: ["HTML", "CSS", "JS"]
})

db.employees.find()

// Update the document that has a custom _id
db.employees.updateOne(
  { _id: 6001 },
  { $set: { name: "Saad", email: "saad@gmail.com", city: "Karachi" } }
)

db.employees.find()


// ------------------------------------------------------------
// 6. UPDATE WITH AGGREGATION PIPELINE — updateMany()
// ------------------------------------------------------------

// Note the [ ] around $set — this makes it a pipeline-style update
db.students.updateMany(
  { course: "ADSE" },
  [ { $set: { course: "AI" } } ]
)

db.students.find()

db.students.updateMany(
  { course: "AI" },
  [ { $set: { city: "Karachi", country: "Pakistan" } } ]
)

db.students.find()


// ------------------------------------------------------------
// 7. DELETE DOCUMENTS
// ------------------------------------------------------------

// deleteOne()
db.employees.deleteOne({ name: "John" })

db.employees.find()

// deleteMany()
db.students.deleteMany({ course: "AI" })

db.students.find()

show dbs


// ------------------------------------------------------------
// 8. EXPLORE AN EXISTING DATABASE (fitness_tracker)
// ------------------------------------------------------------

use fitness_tracker

db.getCollectionInfos()
show collections


// ------------------------------------------------------------
// 9. DROP A COLLECTION / DATABASE
// ------------------------------------------------------------

use school

db.createCollection("student")
show collections

// Drop a single collection
db.student.drop()
show collections

// Drop the ENTIRE current database (irreversible!)
db.dropDatabase()

show dbs

exit
