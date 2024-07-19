const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const app = express();
app.use(express.json());

let initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http:3001/");
      console.log("Database Connected Successfully");
    });
  } catch (error) {
    console.log(error);
  }
};

initializeDbAndServer();

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
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;
  const queryParams = [`%${search_q}%`];
  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE ?
    AND status =?
    AND priority = ?;`;
      queryParams.push(status, priority);
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE ?
    AND priority = ?;`;
      queryParams.push(priority);
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE ?
    AND status = ?;`;
      queryParams.push(status);
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE ?;`;
  }

  let data = await db.all(getTodosQuery, queryParams);
  response.send(data);
});

//Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const todoQuery = `select * from todo where id=?`;
  const data = await db.get(todoQuery, todoId);
  res.send(data);
});

//Create a todo in the todo table,

app.post("/todos/", async (req, res) => {
  const details = req.body;
  const { id, todo, priority, status } = details;
  const todoQuery = `insert into todo(id,todo,priority,status) values(?,?,?,?)`;
  await db.run(todoQuery, [id, todo, priority, status]);
  res.send("Todo Successfully Added");
});

//Updates the details of a specific todo based on the todo ID

app.put("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  let updateColumn = "";
  let reqBody = req.body;
  switch (true) {
    case reqBody.status !== undefined:
      updateColumn = "Status";
      break;
    case reqBody.priority !== undefined:
      updateColumn = "Priority";
      break;

    default:
      updateColumn = "Todo";
      break;
  }
  let getPreviousTodo = `select * from todo where id=?`;
  const previousTodo = await db.get(getPreviousTodo, todoId);
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = req.body;

  const updateQuery = `update todo set todo=?,priority=?,status=? where id=?`;
  await db.run(updateQuery, [todo, priority, status, todoId]);
  res.send(`${updateColumn} Updated`);
});

//Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const deleteQuery = `delete from todo where id=?`;
  await db.run(deleteQuery, todoId);
  res.send("Todo Deleted");
});

module.exports = app;
