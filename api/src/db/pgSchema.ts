/** Allowed PostgreSQL schema names for SET search_path / migrations (no quotes inside). */
export function assertSafePgSchema(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid DB_SCHEMA "${name}": use only letters, digits, underscore; must start with letter or _.`);
  }
  return name;
}

export function sqlSetSearchPath(schema: string) {
  const s = assertSafePgSchema(schema);
  return `SET search_path TO "${s}", public`;
}
