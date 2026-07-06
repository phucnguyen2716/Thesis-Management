const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'eThesisProjectDb_dev',
  user: 'postgres',
  password: '1',
});

client.connect()
  .then(async () => {
    console.log('Querying Database for SV0971090 or files...');
    
    // 1. Find User Id for SV0971090
    const userRes = await client.query('SELECT "Id", "FullName" FROM "Users" WHERE "StudentId" = \'SV0971090\'');
    console.log('User:', userRes.rows);

    let queryStr = 'SELECT "Id", "Title", "FilePath", "StudentId" FROM "Theses" WHERE "FilePath" IS NOT NULL';
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].Id;
      queryStr += ` OR "StudentId" = ${userId}`;
    }

    const thesesRes = await client.query(queryStr);
    console.log('Theses results:', thesesRes.rows);

    client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
