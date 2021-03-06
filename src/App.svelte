<script>
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";

  const ENTER_KEY = 13;
  const ESCAPE_KEY = 27;

  let currentFilter = "all";
  let newTodo = "";
  let tempId = 4;
  let todos = [
    {
      id: 1,
      completed: true,
      title: "Build Svelte Todo List",
      editing: false
    },
    {
      id: 2,
      completed: false,
      title: "Take Svelte Udemy course",
      editing: false
    },
    {
      id: 3,
      completed: false,
      title: "Read Svelte docs",
      editing: false
    }
  ];

  function addTodo(event) {
    if (event.which === ENTER_KEY) {
      todos = [
        ...todos,
        {
          title: newTodo,
          id: tempId,
          completed: false,
          editing: false
        }
      ];

      tempId++;
      newTodo = "";
    }
  }

  function editTodo(todo) {
    todo.editing = true;
    todos = todos;
  }

  function doneEdit(todo) {
    todo.editing = false;
    todos = todos;
  }

  function doneEditKeydown(todo, event) {
    if (event.which === ENTER_KEY) {
      doneEdit(todo);
    }
  }

  function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
  }

  function checkAllTodos(event) {
    todos.forEach(todo => (todo.completed = event.target.checked));
    todos = todos;
  }

  function clearCompleted(event) {
    todos = todos.filter(todo => !todo.completed);
  }

  function updateFilter(filter) {
    currentFilter = filter;
  }

  onMount(async () => {
    const res = await fetch("https://api.kanye.rest");
    const response = await res.json();
    newTodo = response.quote;
  });

  $: todosRemaining = todos.filter(todo => !todo.completed).length;
  $: filteredTodos =
    currentFilter === "all"
      ? todos
      : currentFilter === "completed"
      ? todos.filter(todo => todo.completed)
      : todos.filter(todo => !todo.completed);
</script>

<style lang="scss">
  .container {
    max-width: 600px;
    margin: 0 auto;
  }
  .logo {
    display: block;
    margin: 20px auto;
    height: 75px;
  }

  .todo-input {
    width: 100%;
    padding: 10px 18px;
    font-size: 18px;
    margin-bottom: 16px;
  }
  .todo-item {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation-duration: 0.3s;
  }
  .remove-item {
    cursor: pointer;
    margin-left: 14px;
    &:hover {
      color: black;
    }
  }
  .todo-item-left {
    // later
    display: flex;
    align-items: center;
  }
  .todo-item-label {
    padding: 10px;
    border: 1px solid white;
    margin-left: 12px;
  }
  .todo-item-edit {
    font-size: 24px;
    color: #2c3e50;
    margin-left: 12px;
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc; //override defaults
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    &:focus {
      outline: none;
    }
  }
  .completed {
    text-decoration: line-through;
    color: grey;
  }
  .extra-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    border-top: 1px solid lightgrey;
    padding-top: 14px;
    margin-bottom: 14px;

    input {
      margin-right: 8px;
    }
  }
  button {
    font-size: 14px;
    background-color: white;
    appearance: none;
    &:hover {
      background: salmon;
    }
    &:focus {
      outline: none;
    }
  }
  .active {
    background: salmon;
  }
</style>

<div class="container">
  <img src={'img/svelte-logo-horizontal.svg'} alt="svelte logo" class="logo" />

  <input
    type="text"
    class="todo-input"
    bind:value={newTodo}
    on:keydown={addTodo}
    placeholder="What needs to be done" />

  {#each filteredTodos as todo}
    <div class="todo-item">
      <div class="todo-item-left" transition:fly={{ y: 20, duration: 300 }}>
        <input type="checkbox" bind:checked={todo.completed} />
        {#if !todo.editing}
          <div
            class="todo-item-label"
            class:completed={todo.completed}
            on:dblclick={() => editTodo(todo)}>
             {todo.title}
          </div>
        {:else}
          <input
            type="text"
            bind:value={todo.title}
            on:blur={() => doneEdit(todo)}
            on:keydown={() => doneEditKeydown(todo, event)}
            class="todo-item-edit"
            autofocus />
        {/if}
      </div>
      <div class="remove-item" on:click={() => deleteTodo(todo.id)}>×</div>
    </div>
  {/each}

  <div class="extra-container">
    <div>
      <label>
        <input type="checkbox" on:change={checkAllTodos} />
        Check All
      </label>
    </div>
    <div>{todosRemaining} items left</div>
  </div>

  <div class="extra-container">
    <div>
      <button
        on:click={() => updateFilter('all')}
        class:active={currentFilter === 'all'}>
        All
      </button>
      <button
        on:click={() => updateFilter('active')}
        class:active={currentFilter === 'active'}>
        Active
      </button>
      <button
        on:click={() => updateFilter('completed')}
        class:active={currentFilter === 'completed'}>
        Completed
      </button>
    </div>

    <div>
      <button on:click={clearCompleted}>Clear Completed</button>
    </div>
  </div>
</div>
