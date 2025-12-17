import { MongoClient, Db } from 'mongodb';

const MONGO_URI = 'mongodb+srv://sarveshbhoite:%23Raj2804%23%40%25%25@sarvesh.7snafjd.mongodb.net/jisnu?retryWrites=true&w=majority&appName=sarvesh';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db('jisnu');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getDb() {
  const { db } = await connectToDatabase();
  return db;
}