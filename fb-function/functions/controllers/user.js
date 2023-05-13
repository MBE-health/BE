// fb settings
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// express - rest api
const express = require("express");

// middleware for auth Token
const authMiddleware = require("../middleware/auth");

// set cors all access
const cors = require("cors");
const userApp = express();
userApp.use(cors({origin: true}), authMiddleware);

// data validation
const {body, validationResult} = require("express-validator");

userApp.get("/", async (req, res) => {
  const snapshot = await db.collection("users").get();

  const users = [];
  snapshot.forEach((doc) => {
    const id = doc.id;
    const data = doc.data();

    users.push({id, ...data});
  });

  res.status(200).send(JSON.stringify(users));
});

userApp.get("/:id", async (req, res) => {
  const snapshot = await db.collection("users").doc(req.params.id).get();

  const userId = snapshot.id;
  const userData = snapshot.data();

  res.status(200).send(JSON.stringify({id: userId, ...userData}));
});

const userCreationValidators = [
  body("email").notEmpty().isEmail(),
  body("firstName").notEmpty(),
  body("lastName").notEmpty(),
  body("age").notEmpty().isInt(),
  body("password").notEmpty().isLength({min: 6}),
];

userApp.post("/", userCreationValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array()});
  }
  const user = req.body;
  await db.collection("users").add(user);
  res.status(201).send();
});
userApp.put("/:id", async (req, res) => {
  const body = req.body;

  await db.collection("users").doc(req.params.id).update(body);

  res.status(200).send();
});

userApp.delete("/:id", async (req, res) => {
  await db.collection("users").doc(req.params.id).delete();

  res.status(200).send();
});
exports.user = functions.https.onRequest(userApp);
