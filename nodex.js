const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://hydraduplustourna:FajM0sO0QK6VftKu@cluster0.6wak8z8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function dropAllDatabases() {
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();

    const systemDbs = ['admin', 'local', 'config'];

    for (const dbInfo of dbs.databases) {
      const dbName = dbInfo.name;
      if (systemDbs.includes(dbName)) {
        console.log(`Skipping system database: ${dbName}`);
        continue;
      }

      const db = client.db(dbName);
      await db.dropDatabase();
      console.log(`🚮 Dropped database: ${dbName}`);
    }

    console.log('✅ All user-created databases dropped successfully.');
  } catch (error) {
    console.error('❌ Error dropping databases:', error);
  } finally {
    await client.close();
  }
}

dropAllDatabases();
