import { toKebabCase } from "@std/text";
import { Database } from "jsr:@db/sqlite";

const db = new Database("thoughts.db");

db.exec(`
  DROP TABLE IF EXISTS thoughts;
  CREATE TABLE thoughts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    permalink TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

Deno.serve(async (req) => {
  console.log("Hi from Deno!");
  const url = new URL(req.url);
  const path = url.pathname;

  // Checking if the path starts with /api/thought
  if (!path.startsWith("/api/thought")) {
    return new Response("Not Found", { status: 404 });
  }

  if (path === "/api/thoughts") {
    // GET /api/thoughts - Get all thoughts
    if (req.method === "GET") {
      const thoughts = db.prepare("SELECT * FROM thoughts").all();
      console.log("\n\nthoughts:", thoughts);
      return new Response(JSON.stringify(thoughts), {
        headers: { "Content-Type": "application/json" },
        status: thoughts.length ? 200 : 404,
      });
    }

    // POST /api/thoughts - Create a new thought
    if (req.method === "POST") {
      const body = await req.json();
      const { title, content } = body;
      const permalink = "shareyourthoughtswithme.dev/" + toKebabCase(title);

      const thought = db
        .prepare(
          "INSERT INTO thoughts (title, content, permalink) VALUES (?, ?, ?) RETURNING *"
        )
        .get([title, content, permalink]);
      return new Response(JSON.stringify(thought), { status: 201 });
    }
  }

  if (path.startsWith("/api/thought")) {
    const id = path.split("/")[3];

    // GET /api/thought/:id - Get a single thought
    if (req.method === "GET" && id) {
      const thought = db
        .prepare("SELECT * FROM thoughts WHERE id = :id")
        .get({ id });
      console.log("\n\nthought:", thought);
      return new Response(JSON.stringify(thought), {
        headers: { "Content-Type": "application/json" },
        status: thought ? 200 : 404,
      });
    }

    // PUT /api/thought/:id - Update a thought
    if (req.method === "PUT" && id) {
      const body = await req.json();
      const { title, content } = body;
      const permalink = "shareyourthoughtswithme.dev/" + toKebabCase(title);

      const thought = db
        .prepare(
          "UPDATE thoughts SET title = ?, content = ?, permalink =?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
        )
        .get([title, content, permalink, id]);
      return new Response(
        JSON.stringify({ thought, message: "Thought Updated" }),
        { status: 201 }
      );
    }

    // DELETE /api/thought/:id - Delete a thought
    if (req.method === "DELETE" && id) {
      db.prepare("DELETE FROM thoughts WHERE id = ?").get([id]);
      return new Response(JSON.stringify({ message: "Thought Deleted" }), {
        status: 200,
      });
    }
  }

  return new Response("Hi from Deno!");
});
