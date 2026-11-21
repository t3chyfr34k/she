import { MongoClient, type Db } from "mongodb";

export class DbNotConfiguredError extends Error {
  constructor() {
    super("Replace the placeholder values in MONGODB_URI in your .env file with your MongoDB connection string, then restart the dev server.");
    this.name = "DbNotConfiguredError";
  }
}

function dbNameFrom(uri: string) {
  const m = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/.exec(uri);
  return m?.[1] ? decodeURIComponent(m[1]) : "birthday_site";
}

let connection: { uri: string; clientPromise: Promise<MongoClient> } | undefined;

/** Reuse a small MongoDB pool so image requests do not open a fresh TLS connection each time. */
export async function withDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const uri = process.env["MONGODB_URI"]?.trim();
  if (!uri || /<[^>]+>|replace-with|your-(?:user|password|cluster)/i.test(uri)) {
    throw new DbNotConfiguredError();
  }
  if (!connection || connection.uri !== uri) {
    const previous = connection;
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 7000,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 60_000,
    });
    const clientPromise = client.connect();
    connection = { uri, clientPromise };
    void previous?.clientPromise.then((oldClient) => oldClient.close()).catch(() => undefined);
  }
  const current = connection;
  let client: MongoClient;
  try {
    client = await current.clientPromise;
  } catch (error) {
    if (connection === current) connection = undefined;
    throw error;
  }
  return fn(client.db(dbNameFrom(uri)));
}

export const CONTENT_COLLECTION = "site_content";
export const PHOTO_COLLECTION = "photos";
export const CONTENT_DOC_ID = "site";
