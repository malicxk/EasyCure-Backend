import mongoose from 'mongoose';
import dotenv from 'dotenv'

dotenv.config()


const MONGO_URI = process.env.MONGO_URI;
const dbName = 'Easy-Cure';


export async function connectDatabase() {
    try {
      if(MONGO_URI){
          await mongoose.connect(MONGO_URI, {
            dbName, 
          });
          console.log(`Connected to MongoDB database: ${dbName}!`);
      }
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      process.exit(1); 
    }
  }
  