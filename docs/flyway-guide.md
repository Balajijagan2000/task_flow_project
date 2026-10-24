# Flyway Database Migrations Guide

Flyway is an open-source database migration tool that provides version control for your relational database schemas.

---

## 1. Why Flyway instead of Hibernate `ddl-auto=update`?

In learning tutorials, developers often use `spring.jpa.hibernate.ddl-auto=update`. **In real-world production environments, this is strongly discouraged**:
1. **Unpredictability**: Hibernate auto-generation may drop constraints, alter types incorrectly, or lock tables unexpectedly.
2. **No Version History**: There is no audit trail of who changed what, when, or why.
3. **No Rollback Strategy**: You cannot reliably reproduce a specific schema state across environments.
4. **Irreversible Production Data Loss**: Dropping or renaming columns without careful multi-phase migrations can corrupt production data.

**The TaskFlow Pattern**:
- **Flyway** owns all DDL (tables, columns, indexes, constraints).
- **Hibernate** is set to `spring.jpa.hibernate.ddl-auto=validate`. Hibernate only verifies that JPA entity classes match the existing database schema created by Flyway.

---

## 2. Migration Script Naming Convention

Flyway discovers SQL files in `src/main/resources/db/migration/`.

File naming pattern:
```text
V<Version>__<Description>.sql
```
*Note the double underscore (`__`) between version and description!*

Examples:
- `V1__create_users_table.sql`
- `V2__add_phone_number_to_users.sql`
- `V3__create_roles_lookup_table.sql`

Flyway sorts migrations numerically: `V1` -> `V2` -> `V3` etc.

---

## 3. How Flyway Tracks History: `flyway_schema_history`

When Flyway runs against an empty database, it creates a special table named `flyway_schema_history`.

Columns include:
- `installed_rank`: Order of execution.
- `version`: The script version (e.g. `1`).
- `description`: The human-readable name extracted from the filename.
- `type`: `SQL`.
- `script`: The script filename.
- `checksum`: CRC32 hash of the script content at execution time.
- `installed_by`: Database user.
- `installed_on`: Timestamp.
- `execution_time`: Execution time in milliseconds.
- `success`: Boolean (`true` / `false`).

---

## 4. Checksums & Immutability Rule

> [!CAUTION]
> **Once a migration script has been executed against any database, NEVER modify its contents!**

When Flyway starts, it recalculates the checksum of every script on the classpath and compares it with the checksum stored in `flyway_schema_history`.
If you edit `V1__create_users_table.sql` after it has run:
- Flyway throws `FlywayException: Validate failed: Migration checksum mismatch for migration version 1`.
- The application will abort startup to prevent schema corruption.

**Correct Way to Change Schema**: Always create a new versioned migration script:
- E.g., `V2__add_status_column_to_tasks.sql`.

---

## 5. Hands-on Learning Exercises

### Exercise 1: Observe Schema Creation
1. Ensure `auth_db` is created in PostgreSQL:
   ```sql
   CREATE DATABASE auth_db;
   ```
2. Run `auth-service`:
   ```powershell
   cd TaskFlow/backend/auth-service
   mvn spring-boot:run
   ```
3. Check the database in `psql` or pgAdmin:
   ```sql
   \c auth_db
   \dt
   SELECT * FROM flyway_schema_history;
   SELECT * FROM users;
   ```
   *Expected Result*: You will see both `flyway_schema_history` and `users` tables created.

---

### Exercise 2: Add a New Migration Column
1. Create a new file `V2__add_avatar_url_to_users.sql` in `auth-service/src/main/resources/db/migration/`:
   ```sql
   ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);
   ```
2. Restart `auth-service`:
   ```powershell
   mvn spring-boot:run
   ```
3. Inspect `flyway_schema_history`:
   ```sql
   SELECT version, description, checksum, success FROM flyway_schema_history;
   ```
   *Expected Result*: Version 2 appears as applied successfully without altering existing user records.

---

### Exercise 3: Simulating and Troubleshooting Checksum Mismatch
1. Deliberately add a comment to `V1__create_users_table.sql`.
2. Restart `auth-service`.
3. Notice the failure message:
   ```text
   org.flywaydb.core.api.exception.FlywayValidateException: Migration checksum mismatch for migration version 1
   ```
4. **Fix**: Revert the change to `V1__create_users_table.sql` to restore its original checksum, and restart.
