// ============================================================
// MongoDB Lecture 02 — Data Types (PART 1 — IN PROGRESS)
// Run these commands inside `mongosh`, one at a time (or in blocks)
// Environment: MongoDB 6.0.13 | Mongosh 2.10.0
//
// NOTE: This lecture is incomplete — will be continued & this file
// updated/pushed again in a future class.
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


// ------------------------------------------------------------
// END OF PART 1 — to be continued in a future class
// ------------------------------------------------------------

exit
