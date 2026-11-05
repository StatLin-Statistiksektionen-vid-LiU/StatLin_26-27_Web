/** JSON-svar från rutterna under /api/admin. De svarar en inloggad användare, så inget får sparas på vägen. */
export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
