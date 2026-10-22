/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// Select the database to use.
use('lecture05_indexing');

// db.book.insertMany([
//   { pageNo: 1,  chapter: 1, topic: "Introduction",   tags: ["mongodb"] },
//   { pageNo: 2,  chapter: 1, topic: "Installation",   tags: ["mongodb"] },
//   { pageNo: 3,  chapter: 2, topic: "CRUD",           tags: ["insert", "find"] },
//   { pageNo: 4,  chapter: 2, topic: "Update",         tags: ["update"] },
//   { pageNo: 5,  chapter: 3, topic: "Operators",      tags: ["query", "operators"] },
//   { pageNo: 6,  chapter: 3, topic: "Projection",     tags: ["query"] },
//   { pageNo: 7,  chapter: 4, topic: "Aggregation",    tags: ["pipeline", "group"] },
//   { pageNo: 8,  chapter: 4, topic: "Lookup",         tags: ["pipeline", "join"] },
//   { pageNo: 9,  chapter: 5, topic: "Indexing",       tags: ["index", "performance"] },
//   { pageNo: 10, chapter: 5, topic: "Unique Index",   tags: ["index"] },
//   { pageNo: 11, chapter: 6, topic: "Replication",    tags: ["replica", "backup"] },
//   { pageNo: 12, chapter: 6, topic: "Sharding",       tags: ["shard", "scaling"] }
// ])

db.book.find()


db.book.getIndexes()

// Single Key Index
// db.book.createIndex({
//   topic: 1
// })

// stage, docsExamine, nReturned
db.book.find({ chapter: 2 }).explain("executionStats")



db.book.find({ topic: "Introduction" }).explain("executionStats")


// // Compound Index [ PREFIX RULE ]
// db.book.createIndex({ chapter: 1, topic: 1 })

db.book.getIndexes();

db.book.find({
  chapter: 2
}).explain("executionStats")

db.book.find({
  chapter: 2, topic: "CRUD"
}).explain("executionStats")


// Unique Index
// db.students.insertMany([
//   { rollNo: 1, name: "Ali", city: "Karachi", marks: 85 },
//   { rollNo: 2, name: "Hammad", city: "Lahore", marks: 89 },
//   { rollNo: 3, name: "", city: "Peshawar", marks: 81 },
// ])

// db.students.createIndex({ rollNo: 1 }, { unique: true })

// db.students.insertOne({
//   rollNo: 3, 
//   name: "Irfan", 
//   city: "Quetta", 
//   marks: 100
// })

// MultiKey Index
// db.book.createIndex({ tags: 1 })

// db.book.find({ tags: "mongodb" }).explain("executionStats")


// TEXT INDEX
// db.articles.insertMany([
//   { title: "MongoDB Basics", body: "MongoDB is a nosql database" },
//   { title: "Indexing Guide", body: "INDEXES MAKE SEARCH FAST" },
//   { title: "NoSQL Basics", body: "SQL uses tables and rows" }
// ])

// db.articles.createIndex({
//   title: "text", body: "text"
// })

db.articles.find({
  $text: {
    $search: "mongodb"
  }
})
db.articles.find({
  $text: {
    $search: "fast"
  }
})

// Geospatial Index
// db.branches.insertMany([
//   { name: "Gulshan Branch", location: { type: "Point", coordinates: [67.09, 24.92] } },
//   { name: "Saddar Branch", location: { type: "Point", coordinates: [67.03, 24.86] } },
//   { name: "Clifton Branch", location: { type: "Point", coordinates: [67.03, 24.81] } },
// ])

db.branches.find()

// db.branches.createIndex({ location: "2dsphere" })

db.branches.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [67.08, 24.89] }, 
      $maxDistance: 5000
    }
  }
})

// WILDCARD INDEX
// db.products.insertMany([
//   { name: "Laptop", specs: { ram: "16GB", cpu: "i7" } },
//   { name: "Phone", specs: { camera: "48MP", battery: "5000mAh" } },
// ])
// db.products.createIndex({ "specs.$**": 1 })

db.products.find({ "specs.camera": "48MP" }).explain("executionStats")

// PARTIAL INDEX
// db.book.createIndex({ pageNo: 1 }, { partialFilterExpression: { chapter: { $gte: 5 }} })

db.book.getIndexes()

db.book.find({
  pageNo: 8
}).explain("executionStats")

// SPARSE INDEX
// db.students.insertOne({
//   rollNo: 5, name: "Hamza", email: "hamza@gmail.com"
// })

// db.students.createIndex({ email: 1 })

// TTL INDEX
// db.otp.insertOne({ code: 57551, createdAt: new Date() })

db.otp.createIndex({ createdAt: 1 }, { expireAfterSeconds: 15 })

db.otp.find()

// HIDDEN INDEX
// db.book.hideIndex("topic_1")
// db.book.unhideIndex("topic_1")

// Dropping Index
db.book.getIndexes()

// db.book.dropIndex("topic_1")

// db.book.dropIndexes()

db.otp.find()
