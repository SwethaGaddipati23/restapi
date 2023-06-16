const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "" } = request.query;
  let getTodosQuery = "";
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  const dbResponse = await db.all(getTodosQuery);
  response.send(dbResponse);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `
SELECT *
FROM todo
WHERE id=${todoId};
`;
  const dbResponse = await db.get(todoQuery);
  response.send(dbResponse);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { todo, priority, status } = todoDetails;
  const todoQuery = `
    INSERT INTO todo(todo,priority,status)
    VALUES('${todo}','${priority}','${status}');
    `;
  const dbResponse = await db.run(todoQuery);
  response.send("Todo Successfully Added");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const queryDel = `DELETE FROM todo WHERE id=${todoId}`;
  await db.run(queryDel);
  response.send("Todo Deleted");
});

const gotOnlystatus = (requestQuery) => {
  return status !== undefined && priority == undefined && todo == undefined;
};
const gotOnlypriority = (requestQuery) => {
  return status == undefined && priority !== undefined && todo == undefined;
};
const gotOnlytodo = (requestQuery) => {
  return status == undefined && priority == undefined && todo !== undefined;
};

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const updateQuery = "";
  const message = "";
  switch (true) {
    case gotOnlypriority(request.query):
      updateQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
      message = "Priority Updated";
      break;
    case gotOnlystatus(request.query):
      updateQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
      message = "Status Updated";
      break;
    case gotOnlytodo(request.query):
      updateQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
      message = "Todo Updated";
      break;
  }
  await db.run(updateQuery);
  response.send(message);
});

module.exports = app;
