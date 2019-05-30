<script>

<<<<<<< HEAD
	const ENTER_KEY = 13;
  const ESCAPE_KEY = 27;

  let beforeEditCache = '';
	let currentFilter = 'all';
	let newTodo = '';
	let tempId = 4;
	let todos = [
    {
      id: 1,
      completed: false,
      title: 'Go to Store',
      editing: false,
    },
    {
      id: 2,
      completed: false,
      title: 'Finish Svelte Screencast',
      editing: false,
    },
    {
      id: 3,
      completed: false,
      title: 'Take over world',
      editing: false,
    },
	];

	function addTodo(event) {
		if (event.key === 'Enter') {
			// todos = [...todos, {
      //   id: tempId,
      //   completed: false,
      //   title: newTodo
      // }];

			todos.push({
				id: tempId,
				completed: false,
				title: newTodo,
				editing: false
			})

			todos = todos;
			tempId = tempId + 1;
			newTodo = '';
		}
	}

	function editTodo(todo) {
    beforeEditCache = todo.title;
		todo.editing = true;
		todos = todos;
	}

	function doneEdit(todo) {
		if (todo.title.trim() === '') {
      todo.title = beforeEditCache
    }
    todo.editing = false;
    todos = todos;
	}

	function doneEditKeydown(todo, event) {
		if (event.key === 'Enter') {
      doneEdit(todo);
    }

    if (event.key === 'Escape') {
      todo.title = beforeEditCache;
      todo.editing = false;
      todos = todos;
    }
	}

	function deleteTodo(id) {
		todos = todos.filter(todo => todo.id !== id);
	}

	function clearCompleted() {
		todos = todos.filter(todo => !todo.completed);
	}

	function checkAllTodos(event) {
		todos.forEach(todo => todo.completed = event.target.checked);
		todos = todos;
	}

	function updateFilter(filter) {
		currentFilter = filter;
	}

	onMount(async () => {
		const res = await fetch('https://api.kanye.rest');
		const response = await res.json();
		console.log(response.quote);
	});

	$: todosRemaining = filteredTodos.filter(todo => !todo.completed).length;

	$: filteredTodos = currentFilter === 'all'
		? todos
		: currentFilter === 'completed'
			? todos.filter(todo => todo.completed)
			: todos.filter(todo => !todo.completed);
||||||| 28e8aa6... Finish todo app
	const ENTER_KEY = 13;
  const ESCAPE_KEY = 27;

  let beforeEditCache = '';
	let currentFilter = 'all';
	let newTodo = '';
	let tempId = 4;
	let todos = [
    {
      id: 1,
      completed: false,
      title: 'Go to Store',
      editing: false,
    },
    {
      id: 2,
      completed: false,
      title: 'Finish Svelte Screencast',
      editing: false,
    },
    {
      id: 3,
      completed: false,
      title: 'Take over world',
      editing: false,
    },
	];

	function addTodo(event) {
		if (event.which === ENTER_KEY) {
			// todos = [...todos, {
      //   id: tempId,
      //   completed: false,
      //   title: newTodo
      // }];

			todos.push({
				id: tempId,
				completed: false,
				title: newTodo,
				editing: false
			})

			todos = todos;
			tempId = tempId + 1;
			newTodo = '';
		}
	}

	function editTodo(todo) {
    beforeEditCache = todo.title;
		todo.editing = true;
		todos = todos;
	}

	function doneEdit(todo) {
		if (todo.title.trim() === '') {
      todo.title = beforeEditCache
    }
    todo.editing = false;
    todos = todos;
	}

	function doneEditKeydown(todo, event) {
		if (event.which === ENTER_KEY) {
      doneEdit(todo);
    }

    if (event.which === ESCAPE_KEY) {
      todo.title = beforeEditCache;
      todo.editing = false;
      todos = todos;
    }
	}

	function deleteTodo(id) {
		todos = todos.filter(todo => todo.id !== id);
	}

	function clearCompleted() {
		todos = todos.filter(todo => !todo.completed);
	}

	function checkAllTodos(event) {
		todos.forEach(todo => todo.completed = event.target.checked);
		todos = todos;
	}

	function updateFilter(filter) {
		currentFilter = filter;
	}

	onMount(async () => {
		const res = await fetch('https://api.kanye.rest');
		const response = await res.json();
		console.log(response.quote);
	});

	$: todosRemaining = filteredTodos.filter(todo => !todo.completed).length;

	$: filteredTodos = currentFilter === 'all'
		? todos
		: currentFilter === 'completed'
			? todos.filter(todo => todo.completed)
			: todos.filter(todo => !todo.completed);
=======
>>>>>>> parent of 28e8aa6... Finish todo app
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
  .todo-item-left { // later
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
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
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
  <img src={'/img/svelte-logo-horizontal.svg'} alt="svelte logo" class="logo">

  <input type="text" class="todo-input" placeholder="What needs to be done">

  <div class="todo-item">
    <div class="todo-item-left">
      <input type="checkbox">
      <div class="todo-item-label">Todo Title</div>
    </div>
    <div class="remove-item">
      &times;
    </div>
  </div>
  <div class="todo-item">
    <div class="todo-item-left">
      <input type="checkbox" v-model="todo.completed">
      <div class="todo-item-label">Todo Title</div>
    </div>
    <div class="remove-item">
      &times;
    </div>
  </div>
  <div class="todo-item">
    <div class="todo-item-left">
      <input type="checkbox" v-model="todo.completed">
      <div class="todo-item-label">Todo Title</div>
    </div>
    <div class="remove-item">
      &times;
    </div>
  </div>


  <div class="extra-container">
    <div><label><input type="checkbox">Check All</label></div>
    <div>3 items left</div>
  </div>

  <div class="extra-container">
    <div>
      <button>All</button>
      <button>Active</button>
      <button>Completed</button>
    </div>

    <div>
      <button>Clear Completed</button>
    </div>
  </div>
</div>
