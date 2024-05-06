const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const app = express();
const port = process.env.PORT || 5000 ;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// -------------------------middleware---------------------------------

app.use(cors(
    {
        origin: ["http://localhost:5173"],
        credentials: true,
    }
));
app.use(express.json());
app.use(cookieParser())


// ---------------- create won middleware ---------------
const logger = async (req, res, next) => {
    console.log("called", req.host , req.originalUrl);
    next();
}
const verifyToken =async (req, res, next) => {
    const token = req.cookies?.token;
    console.log("middleware token", token);
    if(!token){
        return res.status(401).send("Access Denied");
    }
    jwt.verify(token, "Sojib@123" , (err, decoded) => {
        console.log(err);
        if(err){
            return res.status(401).send({message : "Access Denied"});
        }
        console.log("middleware token" , decoded);
        req.user = decoded;
        next();
    })

}


// ----------------------------------------------------------------


const uri = "mongodb+srv://itzmesojib:HX5XNybNAwZUEb5t@sajadur-rahman.ikstdv2.mongodb.net/?retryWrites=true&w=majority&appName=Sajadur-Rahman";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


// ------------------ database collections ----------------

const carServiceCollection = client.db("Car-Doctor").collection("CarServices");
const bookingCollections = client.db("Car-Doctor").collection("Bookings");

// ------------auth related methods ----------------
app.post("/jwt", logger, async (req, res) => {
    const user = req.body;
    console.log(user);
    const token = jwt.sign(user , "Sojib@123" , {expiresIn: "1h"})
    res
    .cookie("token", token , {
        httpOnly: true,
        secure: false,
        sameSite:"strict"
    })
    .send({success: true});
})

// ------------------all services get --------------------------------
app.get("/services", logger, async (req, res) => {
    const services = await carServiceCollection.find({}).toArray();
    res.send(services);
  });

//   -------------------------- single service get --------------------------------

app.get("/services/:id", logger, async (req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const service = await carServiceCollection.findOne(query);
    res.send(service);
  });

//   ------------------------- check out service-------------------------
app.get("/service/check-out/:id", logger, async (req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const options = {
        projection: { title: 1, price: 1 , img: 1},
      };
    const CheckOutService = await carServiceCollection.findOne(query,options);
    res.send(CheckOutService);
  });
  


// ------------------------ add bookings ------------------------
app.post("/bookings", logger, async (req, res) => {
    const newBooking = req.body;
    const result = await bookingCollections.insertOne(newBooking);
    res.send(result);
})

  // ----------------------------- get bookings ------------------------
  app.get("/bookings",verifyToken, logger, async (req, res) => {
    // console.log("Token" , req?.cookies?.token);
    if(req.query.email !== req.user.email){
        return res.status(401).send({message : "Access Denied"});
    }
    let query = {};
    if (req?.query?.email) {
      query = { email: req?.query?.email};
    }
    const bookings = await bookingCollections.find(query).toArray();
    res.send(bookings);
})


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// ----------------------------------------------------------------

app.get("/", (req, res) => {
    res.send("Server Is Running")
})





app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})