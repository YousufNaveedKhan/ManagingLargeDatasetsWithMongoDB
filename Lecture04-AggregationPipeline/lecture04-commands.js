/* global use, db */
// MongoDB Playground
// Lecture 04 — Aggregation Pipeline (PART 1 — IN PROGRESS)
// Written and run using the "MongoDB for VS Code" extension's Playground feature.
// Make sure you are connected to enable completions and to be able to run a playground.
// The result of the last command run in a playground is shown on the results panel.
//
// NOTE: This lecture is incomplete — will be continued & this file
// updated/pushed again in a future class.

// ------------------------------------------------------------
// 1. SETUP — DATABASE & COLLECTION
// ------------------------------------------------------------

// Select the database to use.
use('lecture04');

db.createCollection('students');

// Insert a few documents into the students collection.
db.students.insertMany([
  { _id: ObjectId(), name: "Laiba", course: "ADSE", city: "Karachi", marks: 85 },
  { _id: ObjectId(), name: "Anusha", course: "DISM", city: "Quetta", marks: 99 },
  { _id: ObjectId(), name: "Abu Hurerah", course: "CPISM", city: "Lahore", marks: 78 },
  { _id: ObjectId(), name: "Abdul Rehman", course: "HDSE", city: "Peshawar", marks: 53 },
  { _id: ObjectId(), name: "Hamza Kamran", course: "ADSE", city: "Lahore", marks: 100 },
  { _id: ObjectId(), name: "Anum Akram", course: "DISM", city: "Karachi", marks: 87 },
]);

db.students.find();


// ------------------------------------------------------------
// 2. STAGE: $match — filter documents (like a find() filter)
// ------------------------------------------------------------

db.students.aggregate([
  { $match: { marks: { $gt: 90 } } }
])


// ------------------------------------------------------------
// 3. COMBINING STAGES: $match + $project + $sort + $limit
// ------------------------------------------------------------

db.students.aggregate([
  { $match: { "marks": { $gt: 40 } } },
  { $project: { name: 1, course: 1, marks: 1 } }, // reshape: include only these fields
  { $sort: { name: 1 } },                         // sort alphabetically by name
  { $limit: 3 }                                   // keep only the first 3 after sorting
])
// NOTE: order of stages matters — $sort before $limit, not after,
// otherwise you'd just get the first 3 in match order, not sorted order.


// ------------------------------------------------------------
// 4. STAGE: $group — group documents and aggregate per group
// ------------------------------------------------------------

db.students.aggregate([
  { $group: {
    _id: "$course",
    count: { $sum: 1 }
  }}
])
// Groups students by their "course" field, and counts how many students
// are in each course.


// ------------------------------------------------------------
// END OF PART 1 — to be continued in a future class
// (next up: $addFields, $unwind, $lookup, more accumulators)
// ------------------------------------------------------------
