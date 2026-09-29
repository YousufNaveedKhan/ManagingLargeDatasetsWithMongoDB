// ============================================================
// MongoDB Lecture 02 — Data Types (Parts 1 & 2 — COMPLETE)
// Run these commands inside `mongosh`, one at a time (or in blocks)
// Environment: MongoDB 6.0.13 | Mongosh 2.10.0
// ============================================================


// ============================================================
// PART 1
// ============================================================

// ------------------------------------------------------------
// 1. SETUP — DATABASE & COLLECTIONS
// ------------------------------------------------------------

use lecture02

db.createCollection("users")
db.createCollection("products")


// ------------------------------------------------------------
// 2. INSERTING A DOCUMENT WITH MULTIPLE DATA TYPES
// ------------------------------------------------------------

db.products.insertOne({
  name: "Laptop",                            // String
  unitPrice: 30000,                          // Int32 (default for whole numbers)
  discount: 0.10,                            // Double (default for decimals)
  quantity: NumberLong(300),                 // Int64
  // ⚠️ NOTE: passing a plain number to NumberLong() triggers a deprecation warning:
  // "NumberLong: specifying a number as argument is deprecated and may lead to
  //  loss of precision, pass a string instead" — prefer NumberLong("300")
  taxRate: Decimal128("1.22"),               // Decimal128 (value passed as a string)
  isActive: true,                            // Boolean
  image: null,                               // Null
  brand: {                                   // Object (embedded document)
    brandOne: "Lenovo",
    brandTwo: "Dell",
    brandThree: "HP"
  },
  specifications: ["8GB RAM", "128GB CORE"], // Array
  createdAt: new Date(),                     // Date
  updatedAt: new Date()                      // Date
})

db.products.find()

// Expected shape of the returned document (mongosh display wrappers):
// {
//   _id: ObjectId('...'),
//   name: 'Laptop',
//   unitPrice: 30000,
//   discount: 0.1,
//   quantity: Long('300'),
//   taxRate: Decimal128('1.22'),
//   isActive: true,
//   image: null,
//   brand: { brandOne: 'Lenovo', brandTwo: 'Dell', brandThree: 'HP' },
//   specifications: [ '8GB RAM', '128GB CORE' ],
//   createdAt: ISODate('...'),
//   updatedAt: ISODate('...')
// }


// ============================================================
// PART 2
// ============================================================

// ------------------------------------------------------------
// 3. SETUP — NEW DATABASE (dataTypesDB)
// ------------------------------------------------------------

use dataTypesDB

// ❌ NOTE — running this again after the collection already exists throws:
// db.createCollection("employees")
// → MongoServerError[NamespaceExists]: Collection dataTypesDB.employees already exists.
// (MongoDB creates a collection automatically on first insert, so this step
//  is not strictly required if you're about to insertOne/insertMany anyway)


// ------------------------------------------------------------
// 4. NumberInt() — EXPLICIT Int32
// ------------------------------------------------------------

// { age: NumberInt(20) }   // explicitly Int32, same as a plain whole number


// ------------------------------------------------------------
// 5. NumberLong() THE SAFE WAY — PASSING A STRING
// ------------------------------------------------------------

// { empCode: NumberLong("123456789") }   // no deprecation warning this way


// ------------------------------------------------------------
// 6. Timestamp
// ------------------------------------------------------------

// { timestamp: new Timestamp() }   // MongoDB's internal operation timestamp type


// ------------------------------------------------------------
// 7. EXPLICIT ObjectId()
// ------------------------------------------------------------

// { _id: ObjectId() }   // generates a new unique id, same as auto-assignment


// ------------------------------------------------------------
// 8. ISODate WITH A SPECIFIC DATE STRING
// ------------------------------------------------------------

// { joiningDate: ISODate("2026-07-09") }   // exact calendar date, vs new Date() for "now"


// ------------------------------------------------------------
// 9. FULL EXAMPLE — EMPLOYEES DOCUMENT
// ------------------------------------------------------------

db.employees.insertOne({
  name: "Anusha",
  age: NumberInt(20),                              // explicit Int32
  empCode: NumberLong("123456789"),                 // Int64, safely passed as a string
  attendance: 92.5,                                  // Double (default)
  salary: Decimal128("25000.08"),                    // Decimal128 (precise money value)
  isActive: true,                                    // Boolean
  phone: null,                                        // Null
  skills: ["HTML", "CSS", "PYTHON", "JS", "C#"],     // Array
  projects: [                                         // Array of embedded documents
    { name: "Starteq", status: "Completed" },
    { name: "Storm Digitizing", status: "In Progress" }
  ],
  address: {                                          // Object (embedded document)
    city: "Karachi",
    area: "Gulshan",
    postalCode: "75300"
  },
  joiningDate: ISODate("2026-07-09"),                 // Date — specific date
  createdAt: new Date(),                              // Date — current timestamp
  timestamp: new Timestamp(),                         // Timestamp
  _id: ObjectId()                                     // explicit ObjectId (order doesn't matter)
})

// NOTE: field order in the object literal (here _id is LAST) has no effect —
// MongoDB still recognizes and uses it correctly as the document's _id.

exit
