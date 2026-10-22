/* global use, db */
// MongoDB Playground
// Lecture 04 — Aggregation Pipeline (PARTS 1, 2 & 3 — COMPLETE)
// Written and run using the "MongoDB for VS Code" extension's Playground feature.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
//
// TIP: To run just ONE command from this file, select it first, then run the selection.
// NOTE: Parts 1 & 2 were covered in class. Part 3 (sections 15 onwards, at the
// end of this file) lists operators that were NOT covered in class and were
// added afterwards for reference.

// ------------------------------------------------------------
// 1. SETUP — DATABASE & COLLECTION
// ------------------------------------------------------------

// Select the database to use.
use('lecfour');

// db.createCollection('students');

// // Insert a few documents into the students collection.
// // ⚠️ Run this ONCE only — running the playground again would insert duplicates.
// // After the first run, comment these lines out.
// db.students.insertMany([
//   { 'name': 'Anusha', 'course': 'Web Development', 'marks': 245, 'city': 'Karachi' },
//   { 'name': 'Laiba', 'course': 'Web Development', 'marks': 248, 'city': 'Karachi' },
//   { 'name': 'Fatima', 'course': 'Web Development', 'marks': 149, 'city': 'Lahore' },
//   { 'name': 'Zainab', 'course': 'Data Science', 'marks': 111, 'city': 'Islamabad' },
//   { 'name': 'Amna', 'course': 'Graphic Designing', 'marks': 199, 'city': 'Peshawar' },
//   { 'name': 'Ayesha', 'course': 'Data Science', 'marks': 210, 'city': 'Karachi' },
//   { 'name': 'Khadijah', 'course': 'Web Designing', 'marks': 89, 'city': 'Lahore' },
// ]);

db.students.find();

db.students.find({ city: "Karachi" })

// Output of aggregate() => Temporary (it never changes the stored documents)


// ------------------------------------------------------------
// 2. STAGE: $match — filter documents (like a find() filter)
// ------------------------------------------------------------

db.students.aggregate([
  {
    $match: {
      city: "Karachi"
    }
  }
])


// ------------------------------------------------------------
// 3. STAGE: $project — choose which fields to show
// ------------------------------------------------------------

// Stage $project ( with _id — _id is included by default )
db.students.aggregate([
  {
    $project: {
      name: 1
    }
  }
])

// Stage $project ( without _id )
db.students.aggregate([
  {
    $project: {
      _id: 0,
      name: 1
    }
  }
])


// ------------------------------------------------------------
// 4. CHAINING STAGES — Stage 1: Output => Stage 2: Input
// ------------------------------------------------------------

// $match + $project
db.students.aggregate([
  {
    $match: {
      city: "Karachi"
    }
  },
  {
    $project: {
      _id: 0,
      name: 1,
      marks: 1
    }
  }
])


// ------------------------------------------------------------
// 5. STAGE: $sort — -1 = descending, 1 = ascending
// ------------------------------------------------------------

// Descending
db.students.aggregate([
  {
    $sort: {
      marks: -1
    }
  }
])

// Ascending
db.students.aggregate([
  {
    $sort: {
      marks: 1
    }
  }
])


// ------------------------------------------------------------
// 6. STAGE: $limit
// ------------------------------------------------------------

db.students.aggregate([
  {
    $limit: 3
  }
])

// $sort + $limit  => Top 3 students by marks
db.students.aggregate([
  {
    $sort: {
      marks: -1
    }
  },
  {
    $limit: 3
  }
])


// ------------------------------------------------------------
// 7. STAGE: $skip — and Pagination
// ------------------------------------------------------------

// Pagination
// 44 Entries ( per page 10 )

// As shown in class: $limit first keeps 10 documents, then $skip drops the first 5 of them
db.students.aggregate([
  {
    $limit: 10
  },
  {
    $skip: 5
  }
])

// Usual pagination pattern: $skip first, then $limit
// Page 3, 10 entries per page => skip (3 - 1) * 10 = 20, then take 10
db.students.aggregate([
  { $skip: 20 },
  { $limit: 10 }
])


// ------------------------------------------------------------
// 8. STAGE: $group
// ------------------------------------------------------------

// $group ( distinct values of "course" )
db.students.aggregate([
  {
    $group: {
      _id: "$course"
    }
  }
])

// $group + $sum ( $sum => Count )
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      totalStudents: {
        $sum: 1
      }
    }
  }
])

// $group + $avg
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      averageMarks: {
        $avg: "$marks"
      }
    }
  }
])

// $group ( $sum + $avg + $max + $min ) + $sort
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      totalStudents: {
        $sum: 1
      },
      averageMarks: {
        $avg: "$marks"
      },
      highestMarks: {
        $max: "$marks"
      },
      lowestMarks: {
        $min: "$marks"
      }
    }
  },
  {
    $sort: {
      averageMarks: -1
    }
  }
])


// ------------------------------------------------------------
// 9. STAGE: $set — add calculated fields ($set is an alias of $addFields)
// ------------------------------------------------------------

// $set ( with $add )
db.students.aggregate([
  {
    $set: {
      addMarks: {
        $add: ["$marks", 5]
      }
    }
  }
])

// $set ( with $subtract )
db.students.aggregate([
  {
    $set: {
      subMarks: {
        $subtract: ["$marks", 5]
      }
    }
  }
])

// $set ( with $multiply / $divide / $round ) — percentage out of 300, rounded to 1 decimal
db.students.aggregate([
  {
    $set: {
      percentage: {
        $round: [
          { $multiply: [{ $divide: ["$marks", 300] }, 100] },
          1
        ]
      }
    }
  }
])

// $set + $project
db.students.aggregate([
  {
    $set: {
      percentage: {
        $round: [
          { $multiply: [{ $divide: ["$marks", 300] }, 100] },
          1
        ]
      }
    }
  },
  {
    $project: {
      _id: 0,
      name: 1,
      marks: 1,
      percentage: 1
    }
  }
])

// $set => $mod ( remainder of marks / 3 )
db.students.aggregate([
  {
    $set: {
      remainder: {
        $mod: ["$marks", 3]
      }
    }
  }
])


// ============================================================
// PART 2
// ============================================================

// ------------------------------------------------------------
// 10. STAGE: $unset — remove fields from the output
// ------------------------------------------------------------

// $unset => ( $project )
// NOTE: this is the aggregation STAGE — it only hides fields in the output.
// It is not the $unset UPDATE operator (Lecture 02), which permanently removes
// a field from the stored documents.
db.students.aggregate([
  {
    $unset: ["city", "course"]
  }
])


// ------------------------------------------------------------
// 11. ROUNDING — $round, $ceil, $floor
// ------------------------------------------------------------

// Round off ( using $round with 0 )
db.students.aggregate([
  {
    $set: {
      percentage: {
        $round: [
          { $multiply: [{ $divide: ["$marks", 300] }, 100] },
          0
        ]
      }
    }
  }
])

// $ceil — always rounds UP to the next whole number
db.students.aggregate([
  {
    $set: {
      percentage: {
        $ceil: [
          { $multiply: [{ $divide: ["$marks", 300] }, 100] }
        ]
      }
    }
  }
])

// $floor — always rounds DOWN to the whole number below
db.students.aggregate([
  {
    $set: {
      percentage: {
        $floor: [
          { $multiply: [{ $divide: ["$marks", 300] }, 100] }
        ]
      }
    }
  }
])


// ------------------------------------------------------------
// 12. STAGE: $count
// ------------------------------------------------------------

// Returns ONE document: { totalStudentsCount: <number> }
db.students.aggregate([
  {
    $count: 'totalStudentsCount'
  }
])


// ------------------------------------------------------------
// 13. STRING EXPRESSIONS
// ------------------------------------------------------------

// $concat — join strings (returns null if any value is null/missing)
db.students.aggregate([
  {
    $set: {
      studentInfo: {
        $concat: ["$name", " - ", "$course"]
      }
    }
  }
])

// $toUpper
db.students.aggregate([
  {
    $set: {
      nameUpper: {
        $toUpper: "$name"
      }
    }
  }
])

// $toLower
db.students.aggregate([
  {
    $set: {
      courseLower: {
        $toLower: "$course"
      }
    }
  }
])

// $trim — removes spaces from both ends
db.students.aggregate([
  {
    $set: {
      cleanName: {
        $trim: {
          input: "$name"
        }
      }
    }
  }
])

// $split — string to array
db.students.aggregate([
  {
    $set: {
      courseWords: {
        $split: ["$course", " "]
      }
    }
  }
])


// ------------------------------------------------------------
// 14. DATE EXPRESSIONS
// ------------------------------------------------------------

// SETUP — the date examples need an "enrollmentDate" field, stored as a real Date
// (ISODate), not a string. The dates below are only examples — use your own.
// Safe to run more than once: it only sets a field, it does not insert documents.
db.students.updateOne({ name: "Anusha" },   { $set: { enrollmentDate: ISODate("2026-01-15") } })
db.students.updateOne({ name: "Laiba" },    { $set: { enrollmentDate: ISODate("2026-02-03") } })
db.students.updateOne({ name: "Fatima" },   { $set: { enrollmentDate: ISODate("2026-03-10") } })
db.students.updateOne({ name: "Zainab" },   { $set: { enrollmentDate: ISODate("2025-11-20") } })
db.students.updateOne({ name: "Amna" },     { $set: { enrollmentDate: ISODate("2025-12-05") } })
db.students.updateOne({ name: "Ayesha" },   { $set: { enrollmentDate: ISODate("2026-01-28") } })
db.students.updateOne({ name: "Khadijah" }, { $set: { enrollmentDate: ISODate("2025-09-12") } })

// Fetch Year
db.students.aggregate([
  {
    $set: {
      enrollmentYear: {
        $year: "$enrollmentDate"
      }
    }
  }
])

// Fetch Month ( 1 to 12, January = 1 )
db.students.aggregate([
  {
    $set: {
      enrollmentMonth: {
        $month: "$enrollmentDate"
      }
    }
  }
])

// Fetch Day of the week ( 1 to 7, Sunday = 1, Saturday = 7 )
// NOTE: for the day of the MONTH (1 to 31) use $dayOfMonth instead
db.students.aggregate([
  {
    $set: {
      enrollmentDay: {
        $dayOfWeek: "$enrollmentDate"
      }
    }
  }
])


// ------------------------------------------------------------
// ------------------------------------------------------------
// PART 3 — ADDITIONAL OPERATORS (NOT COVERED IN CLASS — added for reference)
// ------------------------------------------------------------
// The sections below (14 onwards) were not taught in class. They are kept
// here so students can see them. All of them use the same "students" data.
// ------------------------------------------------------------
// 14. ACCUMULATORS in $group — $top, $bottom, $topN, $bottomN, $first, $last
// ------------------------------------------------------------

// $top & $bottom
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      topStudent: {
        $top: {
          sortBy: { marks: -1 }, 
          output: { name: "$name", marks: "$marks" }
        }
      },
      bottomStudent: {
        $bottom: {
          sortBy: { marks: -1 }, 
          output: { name: "$name", marks: "$marks" }
        },
      }
    }
  }
]);

// $topN, $bottomN, $maxN, $minN || n => Number
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      topTwo: {
        $topN: {
          n: 2,
          sortBy: { marks: -1 }, 
          output: { name: "$name", marks: "$marks" }
        }
      },
      bottomTwo: {
        $bottomN: {
          n: 2,
          sortBy: { marks: -1 }, 
          output: { name: "$name", marks: "$marks" }
        },
      }
    }
  }
]);

db.students.aggregate([
  {
    $group: {
      _id: "$course", 
      firstStudent: {
        $first: "$name"
      },
      lastStudent: {
        $last: "$name"
      }
    }
  }
]);

// ------------------------------------------------------------
// 15. MATH — $abs, $pow, $sqrt
// ------------------------------------------------------------

// $abs, $pow, $sqrt
db.students.aggregate([
  {
    $project: { name: 1, marks: 1, difference: { $abs: { $subtract: ["$marks", 200] } }}
  }
])

db.students.aggregate([
  {
    $project: { name: 1, marks: 1, square: { $pow: ["$marks", 2] } }
  }
])

db.students.aggregate([
  {
    $project: { name: 1, marks: 1, squareRoot: { $sqrt: "$marks" }  }
  }
]);

// ------------------------------------------------------------
// 16. CONDITIONAL EXPRESSIONS — $cond, $switch, $ifNull
// ------------------------------------------------------------

// $cond — long form: if / then / else
db.students.aggregate([
  {
    $set: {
      level: {
        $cond: {
          if: { $gte: ["$marks", 200] },
          then: "High",
          else: "Low"
        }
      }
    }
  }
]);

// $cond — short array form: [ condition, valueIfTrue, valueIfFalse ]
db.students.aggregate([
  {
    $set: {
      passStatus: { $cond: [{ $gte: ["$marks", 150] }, "Pass", "Fail"] }
    }
  }
]);

// $switch — several conditions, checked in order; first match wins
db.students.aggregate([
  {
    $set: {
      grade: {
        $switch: {
          branches: [
            { case: { $gte: ["$marks", 240] }, then: "A" },
            { case: { $gte: ["$marks", 200] }, then: "B" },
            { case: { $gte: ["$marks", 150] }, then: "C" }
          ],
          default: "D"
        }
      }
    }
  }
]);

// $ifNull — use a fallback value when a field is null OR missing
db.students.aggregate([
  {
    $set: {
      enrollmentDateSafe: { $ifNull: ["$enrollmentDate", "Not set"] }
    }
  }
]);

// ------------------------------------------------------------
// 17. COMPARISON & LOGICAL EXPRESSIONS — $eq, $ne, $gt, $gte, $lt, $lte, $and, $or
// ------------------------------------------------------------
// Inside an expression these return true / false.

db.students.aggregate([
  {
    $set: {
      isKarachiTopper: {
        $and: [{ $eq: ["$city", "Karachi"] }, { $gt: ["$marks", 200] }]
      },
      isLahoreOrIslamabad: {
        $or: [{ $eq: ["$city", "Lahore"] }, { $eq: ["$city", "Islamabad"] }]
      },
      notWebDev: { $ne: ["$course", "Web Development"] },
      lowMarks: { $lt: ["$marks", 100] }
    }
  }
]);

// ------------------------------------------------------------
// 18. STAGES — $unwind, $replaceWith, $sample, $bucket, $addFields
// ------------------------------------------------------------

// $unwind — one output document per array item (courseWords has 2 words for "Web Development")
db.students.aggregate([
  { $set: { courseWords: { $split: ["$course", " "] } } },
  { $unwind: "$courseWords" },
  { $project: { _id: 0, name: 1, courseWords: 1 } }
]);

// $replaceWith — replace the whole document with a new shape (alias: $replaceRoot)
db.students.aggregate([
  {
    $replaceWith: {
      studentName: "$name",
      location: "$city"
    }
  }
]);

// $sample — random documents (size = how many)
db.students.aggregate([
  { $sample: { size: 3 } }
]);

// $bucket — group documents into ranges of marks
// boundaries must be sorted; values outside the ranges go to "default"
db.students.aggregate([
  {
    $bucket: {
      groupBy: "$marks",
      boundaries: [0, 100, 200, 300],
      default: "Other",
      output: {
        totalStudents: { $sum: 1 },
        names: { $push: "$name" }
      }
    }
  }
]);

// $addFields — same as $set (adds a field to every document)
db.students.aggregate([
  { $addFields: { totalMarksOutOf: 300 } }
]);

// ------------------------------------------------------------
// 19. MORE ACCUMULATORS (inside $group) — $push, $addToSet, $stdDevPop, $stdDevSamp
// ------------------------------------------------------------

// $push — list ALL values in the group (duplicates kept)
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      names: { $push: "$name" }
    }
  }
]);

// $addToSet — list UNIQUE values in the group (no duplicates)
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      uniqueCities: { $addToSet: "$city" }
    }
  }
]);

// $stdDevPop / $stdDevSamp — how spread out the marks are inside each course
// (a group with only 1 student gives null for $stdDevSamp)
db.students.aggregate([
  {
    $group: {
      _id: "$course",
      marksStdDevPop: { $stdDevPop: "$marks" },
      marksStdDevSamp: { $stdDevSamp: "$marks" }
    }
  }
]);

