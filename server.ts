import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect().then(()=> { //making sure the connection is successful

  // app.get("/", async (req, res) => {
  // });

  //GET /users
  app.get("/users", async (req, res) => {
    const dbres = await client.query('select * from users');
    const listOfUsers = dbres.rows;
    res.json({
      result: "success",
      data: listOfUsers
    });
  });

  //GET /favourites
  app.get("/favourites", async (req, res) => {
    const dbres = await client.query('select * from favourites');
    const listOfFavourites = dbres.rows;
    res.json({
      result: "success",
      data: listOfFavourites
    });
  });

    //GET /favourites/:userId
    app.get<{userId: number}, {}, {}>("/favourites/:userId", async (req, res) => {
      const { userId } = req.params;
      const dbres = await client.query('select * from favourites where user_id = $1', [userId]);
      const listOfFavourites = dbres.rows;
      if (dbres.rows.length===0) {
        res.json({
          result: "failed",
          data: `user ID: ${userId} does not exist`
        });
      } else {
        res.json({
          result: "success",
          data: listOfFavourites
        });
      }
    });
    
  //POST /favourites/:userId
  app.post<{userId: number}, {}, {photo_id: number, alt: string, url: string}>("/favourites/:userId", async (req, res) => {
    const {photo_id, alt, url} = req.body;
    const {userId} = req.params;


    //to ckeck for duplicate photos
    const dbres1 = await client.query(`select * from favourites where user_id = $1 and photo_id = $2`, [userId, photo_id]);
    if (dbres1.rows.length===0){
      const dbres2 = await client.query(`insert into favourites (user_id, photo_id, alt, url) values ($1,$2,$3,$4) returning *`, [userId, photo_id, alt, url]);
      const photoInserted = dbres2.rows;

      res.json({
        result: "success",
        data: photoInserted
      });
    } else {
      res.status(405).json({
        result: "failed",
        data: `photo_id ${photo_id} for user id ${userId} is already in favourites table`
      });
    }
  });

    //DELETE /favourites/:userId/:photoId
    app.delete<{userId: number, photoId: number}, {}, {}>("/favourites/:userId/:photoId", async (req, res) => {
      const {userId,photoId} = req.params;
  
      //checking if user id exists
      const dbres1 = await client.query(`select * from favourites where user_id = $1 `, [userId]);
      if (dbres1.rows.length===0) {
        res.status(404).json({
          result: "failed",
          data: `user ID: ${userId} does not exist`
        });
      }
      //checking if photo exists
      const dbres2 = await client.query(`select * from favourites where photo_id = $1 `, [photoId]);
      if (dbres2.rows.length===0) {
        res.status(404).json({
          result: "failed",
          data: `Could not find a photo with this id`
        });
      }

      const dbres = await client.query(`delete from favourites where user_id = $1 and photo_id = $2 returning *`, [userId, photoId]);
      const photoDeleted = dbres.rows;

      res.json({
        result: "success",
        data: photoDeleted
      });
    });

  //Start the server on the given port
  const port = process.env.PORT;
  if (!port) {
    throw 'Missing PORT environment variable.  Set it in .env file.';
  }
  app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
  });
})

