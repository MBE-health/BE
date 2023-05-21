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
// const {body, validationResult} = require("express-validator");

// get all user Data
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


// get Certain user data with userId
userApp.get("/:id", async (req, res) => {
  const snapshot = await db.collection("users").doc(req.params.id).get();

  const userId = snapshot.id;
  const userData = snapshot.data();

  res.status(200).send(JSON.stringify({id: userId, ...userData}));
});


// post user - join
userApp.post("/", async (req, res) => {
  const user = req.body;
  await db.collection("users").doc(user.userId).set({
    name: user.name,
    nickname: user.nickname,
    age: user.age,
    sex: user.sex,
  });
  res.status(201).send();
});

// post user - plan
userApp.post("/plan", async (req, res) => {
  const {userId, ...rest} = req.body;
  console.log("userId", userId);
  console.log(rest);
  await db.collection("users").doc(`${userId}`).collection("plan").add(rest);
  res.status(201).send();
});

// post user - isDone
userApp.post("/done", async (req, res) => {
  const {userId, ...rest} = req.body;
  console.log("userId", userId);
  console.log(rest);
  await db.collection("users").doc(`${userId}`).collection("done").add(rest);
  res.status(201).send();
});

// post user - comments
userApp.post("/comment", async (req, res) => {
  const {userId, ...rest} = req.body;
  console.log("userId", userId);
  console.log(rest);
  await db.collection("users").doc(`${userId}`).collection("comment").add(rest);
  res.status(201).send();
});

// put user - health Condition
userApp.put("/", async (req, res) => {
  const {userId, ...rest} = req.body;
  await db.collection("users").doc(userId)
      .collection("health").add({...rest.healthCondition});
  res.status(201).send();
});

// put user - health grade
userApp.put("/grade", async (req, res) => {
  const {userId, grade} = req.body;
  const data = {"grade": grade};
  console.log(data, grade);
  await db.collection("users").doc(userId).update(data);
  res.status(201).send();
});


userApp.get("/plan/:id", async (req, res)=>{
  const userId = req.params.id;
  const recentPlan = await db
      .collection(`/users/${userId}/plan`)
      .orderBy("createdAt")
      .limit(1)
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          res.send("NO SERVERS AVAILABLE");
        } else {
          const docs = querySnapshot.docs.map((doc) => doc.data());
          console.log("Document data:", docs);
          res.end(
              JSON.stringify(
                  docs,
              ),
          );
        }
      });
  console.log(recentPlan);

  res.status(200).send(JSON.stringify(recentPlan.data()));
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
