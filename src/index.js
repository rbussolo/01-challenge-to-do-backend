const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  // Tenta localizar o usuário na lista de usuários pelo USERNAME
  const user = users.find((user) => user.username === username);

  if(!user){
    // Retorna mensagem de erro, pois não foi localizado o usuário
    return response.status(404).json({ error: "User not found!"});
  }

  // Adiciona na requisição o usuário localizado
  request.user = user;

  // Passa para frente
  return next();
}

function checksExistsTodo(request, response, next){
  const { id } = request.params;
  const { user } = request;

  // Tenta localizar todo
  const todo = user.todos.find((todo) => todo.id === id);

  if(!todo){
    return response.status(404).json({ error: 'Todo not found!' });
  }

  // Adiciona a tarefa no request
  request.todo = todo;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  // Verifica se existe este usuário
  const userAlreadyExists = users.some((user) => user.username === username);

  if(userAlreadyExists){
    return response.status(400).json({ error: 'User already exists!' });
  }
  
  // Cria um usuário novo
  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  // Adiciona o usuário a lista de usuários
  users.push(user);

  // Retorna sucesso referente a operação
  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  // Carrega o usuário da requisição
  const { user } = request;

  // Retorna todas as tarefas
  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  // Carrega o usuário da requisição
  const { user } = request;

  // Carrega do corpo informações da tarefa
  const { title, deadline } = request.body;

  // Realiza a criação de uma nova tarefa
  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  // Adiciona na lista de tarefas
  user.todos.push(todo);

  // Retorna sucesso
  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  // Carrega a tarefa
  const { todo } = request;

  // Carrega do corpo informações para realizar a atualização
  const { title, deadline } = request.body;

  // Atualiza a tarefa
  todo.title = title;
  todo.deadline = new Date(deadline);

  // Retorna sucesso
  return response.status(201).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  // Carrega a tarefa
  const { todo } = request;

  // Marca como feito a tarefa
  todo.done = true;

  // Retorna sucesso
  return response.status(201).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  // Carrega dados da requisição
  const { user, todo } = request;

  // Remove a tarefa da lista de tarefas
  user.todos.splice(todo, 1);

  // Retorna sucesso
  return response.status(204).json(user);
});

module.exports = app;