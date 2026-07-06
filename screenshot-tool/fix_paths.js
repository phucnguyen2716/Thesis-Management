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
    // Find all theses pointing to GROUPCHATGPT with wrong path
    const res = await client.query(`SELECT "Id", "Title", "FilePath" FROM "Theses" WHERE "FilePath" LIKE '%GROUPCHATGPT%'`);
    console.log('Found theses:', res.rows);

    // Update them to correct path
    for (const row of res.rows) {
      const correctPath = '/temporary_pdf/SV0971090_GROUPCHATGPT_KIEMTHU_FIINAL_REPORT/GROUPCHATGPT_KIEMTHU_FIINAL_REPORT.pdf';
      await client.query(`UPDATE "Theses" SET "FilePath" = $1 WHERE "Id" = $2`, [correctPath, row.Id]);
      console.log(`Updated thesis ${row.Id}: ${row.FilePath} → ${correctPath}`);
    }

    // Also check DriveFileRecords
    const driveRes = await client.query(`SELECT "Id", "FileName", "LocalPdfPath" FROM "DriveFileRecords" WHERE "FileName" LIKE '%GROUPCHATGPT%'`);
    console.log('DriveFileRecords:', driveRes.rows);
    for (const row of driveRes.rows) {
      const correctPath = '/temporary_pdf/SV0971090_GROUPCHATGPT_KIEMTHU_FIINAL_REPORT/GROUPCHATGPT_KIEMTHU_FIINAL_REPORT.pdf';
      await client.query(`UPDATE "DriveFileRecords" SET "LocalPdfPath" = $1 WHERE "Id" = $2`, [correctPath, row.Id]);
      console.log(`Updated DriveFileRecord ${row.Id}: ${row.LocalPdfPath} → ${correctPath}`);
    }

    console.log('Done!');
    client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
