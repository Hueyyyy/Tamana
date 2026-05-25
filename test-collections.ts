
import { Client, Databases } from 'node-appwrite';

async function test() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.NEXT_APPWRITE_KEY!);

  const databases = new Databases(client);
  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

  try {
    const collections = await databases.listCollections(DATABASE_ID);
    console.log('---COLLECTIONS---');
    console.log(JSON.stringify(collections, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
