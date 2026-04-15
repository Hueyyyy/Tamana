import { Client, Databases, Storage, Account } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT!;

export const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
