UPDATE "Users" SET "Phone" = '0901234567' WHERE "Id" = 304;
UPDATE "Users" SET "Phone" = '0912345678' WHERE "Id" = 305;
UPDATE "Users" SET "Phone" = '0923456789' WHERE "Id" = 306;
UPDATE "Users" SET "Phone" = '0934567890' WHERE "Id" = 307;
UPDATE "Users" SET "Phone" = '0945678901' WHERE "Id" = 308;
UPDATE "Users" SET "Phone" = '0956789012' WHERE "Id" = 309;
UPDATE "Users" SET "Phone" = '0967890123' WHERE "Id" = 310;
UPDATE "Users" SET "Phone" = '0978901234' WHERE "Id" = 311;
SELECT "Id", "FullName", "Phone", "Department" FROM "Users" WHERE "Role" = 'Advisor' ORDER BY "Id";
