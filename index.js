const express = require("express");
const app = express();
const PORT = process.env.PORT || 1003;
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Server is Running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// getting the key set guided by better auth for verify jwt token

const JWKS = createRemoteJWKSet(new URL(`${process.env.BETTER_AUTH_URL}api/auth/jwks`));

const verifyToken = async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if(!authHeader) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1]

        if (!token) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // install jose-cjs to verify
        try {
          const { payload } = await jwtVerify(token, JWKS);
          // console.log(payload)
          next();
        } catch (error) {
          return res.status(403).json({message : "Forbidden"})
        }
      }

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // comment this line for deploy
    // await client.connect();

    const db = client.db("roamly");
    const destinationCollection = db.collection("destinations");
    const bookingCollection = db.collection("bookings");

    app.post("/destination", async (req, res) => {
      const destinationData = req.body;
      console.log(destinationData);
      const result = await destinationCollection.insertOne(destinationData);
      res.json(result);
    });

    app.get('/featured', async (req,res)=> {
      const result = await destinationCollection.find().limit(4).toArray()
      res.json(result)
    })


    app.post("/booking",verifyToken, async (req, res) => {
      const bookingData = req.body
      console.log(bookingData);
      const result = await bookingCollection.insertOne(bookingData);
      res.json(result);
    });

    app.get("/booking/:id", verifyToken, async (req, res) => {
      const userId = req.params.id;
      console.log(userId);
      const result = await bookingCollection.find({ userId }).toArray();
      res.json(result);
    });

    app.delete("/booking/:id", verifyToken, async (req, res) => {
      const bookingId = req.params.id;
      const result = await bookingCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });
      res.json(result);
    });

    app.get("/destination", async (req, res) => {
      const result = await destinationCollection.find().toArray();
      res.json(result);
    });

    app.get("/destination/:id", verifyToken ,async (req, res) => {
      const id = req.params.id;
      const result = await destinationCollection.findOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    app.patch("/destination/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await destinationCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.json(result);
    });

    app.delete("/destination/:id", async (req, res) => {
      const id = req.params.id;
      const result = await destinationCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    // Send a ping to confirm a successful connection
    // comment this line for deployment
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
module.exports = app;





