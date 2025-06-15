-- MongoDB Collections Setup
-- This is a reference for the collections structure

-- Users Collection
{
  "_id": ObjectId,
  "auth0Id": String,
  "email": String,
  "name": String,
  "plan": String, // "free" or "pro"
  "stripeCustomerId": String,
  "createdAt": Date,
  "updatedAt": Date
}

-- Projects Collection
{
  "_id": ObjectId,
  "name": String,
  "description": String,
  "userId": String, // Auth0 user ID
  "scormFile": {
    "filename": String,
    "publicUrl": String,
    "uploadedAt": Date
  },
  "createdAt": Date,
  "updatedAt": Date
}

-- Indexes to create:
-- db.users.createIndex({ "auth0Id": 1 }, { unique: true })
-- db.users.createIndex({ "stripeCustomerId": 1 })
-- db.projects.createIndex({ "userId": 1 })
-- db.projects.createIndex({ "createdAt": -1 })
