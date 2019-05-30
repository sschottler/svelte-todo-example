
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
	'use strict';

	function noop() {}

	const identity = x => x;

	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	const tasks = new Set();
	let running = false;

	function run_tasks() {
		tasks.forEach(task => {
			if (!task[0](window.performance.now())) {
				tasks.delete(task);
				task[1]();
			}
		});

		running = tasks.size > 0;
		if (running) requestAnimationFrame(run_tasks);
	}

	function loop(fn) {
		let task;

		if (!running) {
			running = true;
			requestAnimationFrame(run_tasks);
		}

		return {
			promise: new Promise(fulfil => {
				tasks.add(task = [fn, fulfil]);
			}),
			abort() {
				tasks.delete(task);
			}
		};
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
	}

	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	function element(name) {
		return document.createElement(name);
	}

	function text(data) {
		return document.createTextNode(data);
	}

	function space() {
		return text(' ');
	}

	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	function toggle_class(element, name, toggle) {
		element.classList[toggle ? 'add' : 'remove'](name);
	}

	function custom_event(type, detail) {
		const e = document.createEvent('CustomEvent');
		e.initCustomEvent(type, false, false, detail);
		return e;
	}

	let stylesheet;
	let active = 0;
	let current_rules = {};

	// https://github.com/darkskyapp/string-hash/blob/master/index.js
	function hash(str) {
		let hash = 5381;
		let i = str.length;

		while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
		return hash >>> 0;
	}

	function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
		const step = 16.666 / duration;
		let keyframes = '{\n';

		for (let p = 0; p <= 1; p += step) {
			const t = a + (b - a) * ease(p);
			keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
		}

		const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
		const name = `__svelte_${hash(rule)}_${uid}`;

		if (!current_rules[name]) {
			if (!stylesheet) {
				const style = element('style');
				document.head.appendChild(style);
				stylesheet = style.sheet;
			}

			current_rules[name] = true;
			stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
		}

		const animation = node.style.animation || '';
		node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;

		active += 1;
		return name;
	}

	function delete_rule(node, name) {
		node.style.animation = (node.style.animation || '')
			.split(', ')
			.filter(name
				? anim => anim.indexOf(name) < 0 // remove specific animation
				: anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
			)
			.join(', ');

		if (name && !--active) clear_rules();
	}

	function clear_rules() {
		requestAnimationFrame(() => {
			if (active) return;
			let i = stylesheet.cssRules.length;
			while (i--) stylesheet.deleteRule(i);
			current_rules = {};
		});
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error(`Function called outside component initialization`);
		return current_component;
	}

	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	const dirty_components = [];

	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_scheduled = false;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	let promise;

	function wait() {
		if (!promise) {
			promise = Promise.resolve();
			promise.then(() => {
				promise = null;
			});
		}

		return promise;
	}

	function dispatch(node, direction, kind) {
		node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
	}

	let outros;

	function group_outros() {
		outros = {
			remaining: 0,
			callbacks: []
		};
	}

	function check_outros() {
		if (!outros.remaining) {
			run_all(outros.callbacks);
		}
	}

	function on_outro(callback) {
		outros.callbacks.push(callback);
	}

	function create_bidirectional_transition(node, fn, params, intro) {
		let config = fn(node, params);

		let t = intro ? 0 : 1;

		let running_program = null;
		let pending_program = null;
		let animation_name = null;

		function clear_animation() {
			if (animation_name) delete_rule(node, animation_name);
		}

		function init(program, duration) {
			const d = program.b - t;
			duration *= Math.abs(d);

			return {
				a: t,
				b: program.b,
				d,
				duration,
				start: program.start,
				end: program.start + duration,
				group: program.group
			};
		}

		function go(b) {
			const {
				delay = 0,
				duration = 300,
				easing = identity,
				tick: tick$$1 = noop,
				css
			} = config;

			const program = {
				start: window.performance.now() + delay,
				b
			};

			if (!b) {
				program.group = outros;
				outros.remaining += 1;
			}

			if (running_program) {
				pending_program = program;
			} else {
				// if this is an intro, and there's a delay, we need to do
				// an initial tick and/or apply CSS animation immediately
				if (css) {
					clear_animation();
					animation_name = create_rule(node, t, b, duration, delay, easing, css);
				}

				if (b) tick$$1(0, 1);

				running_program = init(program, duration);
				add_render_callback(() => dispatch(node, b, 'start'));

				loop(now => {
					if (pending_program && now > pending_program.start) {
						running_program = init(pending_program, duration);
						pending_program = null;

						dispatch(node, running_program.b, 'start');

						if (css) {
							clear_animation();
							animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
						}
					}

					if (running_program) {
						if (now >= running_program.end) {
							tick$$1(t = running_program.b, 1 - t);
							dispatch(node, running_program.b, 'end');

							if (!pending_program) {
								// we're done
								if (running_program.b) {
									// intro — we can tidy up immediately
									clear_animation();
								} else {
									// outro — needs to be coordinated
									if (!--running_program.group.remaining) run_all(running_program.group.callbacks);
								}
							}

							running_program = null;
						}

						else if (now >= running_program.start) {
							const p = now - running_program.start;
							t = running_program.a + running_program.d * easing(p / running_program.duration);
							tick$$1(t, 1 - t);
						}
					}

					return !!(running_program || pending_program);
				});
			}
		}

		return {
			run(b) {
				if (typeof config === 'function') {
					wait().then(() => {
						config = config();
						go(b);
					});
				} else {
					go(b);
				}
			},

			end() {
				clear_animation();
				running_program = pending_program = null;
			}
		};
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = {};
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	class SvelteComponentDev extends SvelteComponent {
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error(`'target' is a required option`);
			}

			super();
		}

		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn(`Component was already destroyed`); // eslint-disable-line no-console
			};
		}
	}

	/*
	Adapted from https://github.com/mattdesl
	Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
	*/

	function cubicOut(t) {
		var f = t - 1.0;
		return f * f * f + 1.0;
	}

	function fly(node, {
		delay = 0,
		duration = 400,
		easing = cubicOut,
		x = 0,
		y = 0,
		opacity = 0
	}) {
		const style = getComputedStyle(node);
		const target_opacity = +style.opacity;
		const transform = style.transform === 'none' ? '' : style.transform;

		const od = target_opacity * (1 - opacity);

		return {
			delay,
			duration,
			easing,
			css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
		};
	}

	/* src/App.svelte generated by Svelte v3.1.0 */

	const file = "src/App.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.todo = list[i];
		child_ctx.each_value = list;
		child_ctx.todo_index = i;
		return child_ctx;
	}

	// (194:8) {:else}
	function create_else_block(ctx) {
		var input, dispose;

		function input_input_handler() {
			ctx.input_input_handler.call(input, ctx);
		}

		function blur_handler() {
			return ctx.blur_handler(ctx);
		}

		function keydown_handler() {
			return ctx.keydown_handler(ctx);
		}

		return {
			c: function create() {
				input = element("input");
				attr(input, "type", "text");
				input.className = "todo-item-edit svelte-1x9yfxh";
				input.autofocus = true;
				add_location(input, file, 194, 10, 3965);

				dispose = [
					listen(input, "input", input_input_handler),
					listen(input, "blur", blur_handler),
					listen(input, "keydown", keydown_handler)
				];
			},

			m: function mount(target, anchor) {
				insert(target, input, anchor);

				input.value = ctx.todo.title;

				input.focus();
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				if (changed.filteredTodos && (input.value !== ctx.todo.title)) input.value = ctx.todo.title;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(input);
				}

				run_all(dispose);
			}
		};
	}

	// (187:8) {#if !todo.editing}
	function create_if_block(ctx) {
		var div, t_value = ctx.todo.title, t, dispose;

		function dblclick_handler() {
			return ctx.dblclick_handler(ctx);
		}

		return {
			c: function create() {
				div = element("div");
				t = text(t_value);
				div.className = "todo-item-label svelte-1x9yfxh";
				toggle_class(div, "completed", ctx.todo.completed);
				add_location(div, file, 187, 10, 3762);
				dispose = listen(div, "dblclick", dblclick_handler);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, t);
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				if ((changed.filteredTodos) && t_value !== (t_value = ctx.todo.title)) {
					set_data(t, t_value);
				}

				if (changed.filteredTodos) {
					toggle_class(div, "completed", ctx.todo.completed);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				dispose();
			}
		};
	}

	// (183:2) {#each filteredTodos as todo}
	function create_each_block(ctx) {
		var div2, div0, input, t0, div0_transition, t1, div1, current, dispose;

		function input_change_handler() {
			ctx.input_change_handler.call(input, ctx);
		}

		function select_block_type(ctx) {
			if (!ctx.todo.editing) return create_if_block;
			return create_else_block;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(ctx);

		function click_handler() {
			return ctx.click_handler(ctx);
		}

		return {
			c: function create() {
				div2 = element("div");
				div0 = element("div");
				input = element("input");
				t0 = space();
				if_block.c();
				t1 = space();
				div1 = element("div");
				div1.textContent = "×";
				attr(input, "type", "checkbox");
				add_location(input, file, 185, 8, 3668);
				div0.className = "todo-item-left svelte-1x9yfxh";
				add_location(div0, file, 184, 6, 3589);
				div1.className = "remove-item svelte-1x9yfxh";
				add_location(div1, file, 203, 6, 4228);
				div2.className = "todo-item svelte-1x9yfxh";
				add_location(div2, file, 183, 4, 3559);

				dispose = [
					listen(input, "change", input_change_handler),
					listen(div1, "click", click_handler)
				];
			},

			m: function mount(target, anchor) {
				insert(target, div2, anchor);
				append(div2, div0);
				append(div0, input);

				input.checked = ctx.todo.completed;

				append(div0, t0);
				if_block.m(div0, null);
				append(div2, t1);
				append(div2, div1);
				current = true;
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				if (changed.filteredTodos) input.checked = ctx.todo.completed;

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(div0, null);
					}
				}
			},

			i: function intro(local) {
				if (current) return;
				add_render_callback(() => {
					if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fly, { y: 20, duration: 300 }, true);
					div0_transition.run(1);
				});

				current = true;
			},

			o: function outro(local) {
				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fly, { y: 20, duration: 300 }, false);
				div0_transition.run(0);

				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div2);
				}

				if_block.d();

				if (detaching) {
					if (div0_transition) div0_transition.end();
				}

				run_all(dispose);
			}
		};
	}

	function create_fragment(ctx) {
		var div6, img, t0, input0, t1, t2, div2, div0, label, input1, t3, t4, div1, t5, t6, t7, div5, div3, button0, t9, button1, t11, button2, t13, div4, button3, current, dispose;

		var each_value = ctx.filteredTodos;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		function outro_block(i, detaching, local) {
			if (each_blocks[i]) {
				if (detaching) {
					on_outro(() => {
						each_blocks[i].d(detaching);
						each_blocks[i] = null;
					});
				}

				each_blocks[i].o(local);
			}
		}

		return {
			c: function create() {
				div6 = element("div");
				img = element("img");
				t0 = space();
				input0 = element("input");
				t1 = space();

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t2 = space();
				div2 = element("div");
				div0 = element("div");
				label = element("label");
				input1 = element("input");
				t3 = text("\n        Check All");
				t4 = space();
				div1 = element("div");
				t5 = text(ctx.todosRemaining);
				t6 = text(" items left");
				t7 = space();
				div5 = element("div");
				div3 = element("div");
				button0 = element("button");
				button0.textContent = "All";
				t9 = space();
				button1 = element("button");
				button1.textContent = "Active";
				t11 = space();
				button2 = element("button");
				button2.textContent = "Completed";
				t13 = space();
				div4 = element("div");
				button3 = element("button");
				button3.textContent = "Clear Completed";
				img.src = 'img/svelte-logo-horizontal.svg';
				img.alt = "svelte logo";
				img.className = "logo svelte-1x9yfxh";
				add_location(img, file, 173, 2, 3302);
				attr(input0, "type", "text");
				input0.className = "todo-input svelte-1x9yfxh";
				input0.placeholder = "What needs to be done";
				add_location(input0, file, 175, 2, 3383);
				attr(input1, "type", "checkbox");
				input1.className = "svelte-1x9yfxh";
				add_location(input1, file, 210, 8, 4384);
				add_location(label, file, 209, 6, 4368);
				add_location(div0, file, 208, 4, 4356);
				add_location(div1, file, 214, 4, 4484);
				div2.className = "extra-container svelte-1x9yfxh";
				add_location(div2, file, 207, 2, 4322);
				button0.className = "svelte-1x9yfxh";
				toggle_class(button0, "active", ctx.currentFilter === 'all');
				add_location(button0, file, 219, 6, 4581);
				button1.className = "svelte-1x9yfxh";
				toggle_class(button1, "active", ctx.currentFilter === 'active');
				add_location(button1, file, 224, 6, 4716);
				button2.className = "svelte-1x9yfxh";
				toggle_class(button2, "active", ctx.currentFilter === 'completed');
				add_location(button2, file, 229, 6, 4860);
				add_location(div3, file, 218, 4, 4569);
				button3.className = "svelte-1x9yfxh";
				add_location(button3, file, 237, 6, 5035);
				add_location(div4, file, 236, 4, 5023);
				div5.className = "extra-container svelte-1x9yfxh";
				add_location(div5, file, 217, 2, 4535);
				div6.className = "container svelte-1x9yfxh";
				add_location(div6, file, 172, 0, 3276);

				dispose = [
					listen(input0, "input", ctx.input0_input_handler),
					listen(input0, "keydown", ctx.addTodo),
					listen(input1, "change", ctx.checkAllTodos),
					listen(button0, "click", ctx.click_handler_1),
					listen(button1, "click", ctx.click_handler_2),
					listen(button2, "click", ctx.click_handler_3),
					listen(button3, "click", ctx.clearCompleted)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div6, anchor);
				append(div6, img);
				append(div6, t0);
				append(div6, input0);

				input0.value = ctx.newTodo;

				append(div6, t1);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div6, null);
				}

				append(div6, t2);
				append(div6, div2);
				append(div2, div0);
				append(div0, label);
				append(label, input1);
				append(label, t3);
				append(div2, t4);
				append(div2, div1);
				append(div1, t5);
				append(div1, t6);
				append(div6, t7);
				append(div6, div5);
				append(div5, div3);
				append(div3, button0);
				append(div3, t9);
				append(div3, button1);
				append(div3, t11);
				append(div3, button2);
				append(div5, t13);
				append(div5, div4);
				append(div4, button3);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.newTodo && (input0.value !== ctx.newTodo)) input0.value = ctx.newTodo;

				if (changed.filteredTodos) {
					each_value = ctx.filteredTodos;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
							each_blocks[i].i(1);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].i(1);
							each_blocks[i].m(div6, t2);
						}
					}

					group_outros();
					for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
					check_outros();
				}

				if (!current || changed.todosRemaining) {
					set_data(t5, ctx.todosRemaining);
				}

				if (changed.currentFilter) {
					toggle_class(button0, "active", ctx.currentFilter === 'all');
					toggle_class(button1, "active", ctx.currentFilter === 'active');
					toggle_class(button2, "active", ctx.currentFilter === 'completed');
				}
			},

			i: function intro(local) {
				if (current) return;
				for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

				current = true;
			},

			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);
				for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0);

				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div6);
				}

				destroy_each(each_blocks, detaching);

				run_all(dispose);
			}
		};
	}

	const ENTER_KEY = 13;

	function instance($$self, $$props, $$invalidate) {
		

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
	      $$invalidate('todos', todos = [
	        ...todos,
	        {
	          title: newTodo,
	          id: tempId,
	          completed: false,
	          editing: false
	        }
	      ]);

	      tempId++; $$invalidate('tempId', tempId);
	      $$invalidate('newTodo', newTodo = "");
	    }
	  }

	  function editTodo(todo) {
	    todo.editing = true;
	    $$invalidate('todos', todos);
	  }

	  function doneEdit(todo) {
	    todo.editing = false;
	    $$invalidate('todos', todos);
	  }

	  function doneEditKeydown(todo, event) {
	    if (event.which === ENTER_KEY) {
	      doneEdit(todo);
	    }
	  }

	  function deleteTodo(id) {
	    $$invalidate('todos', todos = todos.filter(todo => todo.id !== id));
	  }

	  function checkAllTodos(event) {
	    todos.forEach(todo => (todo.completed = event.target.checked));
	    $$invalidate('todos', todos);
	  }

	  function clearCompleted(event) {
	    $$invalidate('todos', todos = todos.filter(todo => !todo.completed));
	  }

	  function updateFilter(filter) {
	    $$invalidate('currentFilter', currentFilter = filter);
	  }

	  onMount(async () => {
	    const res = await fetch("https://api.kanye.rest");
	    const response = await res.json();
	    console.log(response.quote);
	  });

		function input0_input_handler() {
			newTodo = this.value;
			$$invalidate('newTodo', newTodo);
		}

		function input_change_handler({ todo, each_value, todo_index }) {
			each_value[todo_index].completed = this.checked;
			$$invalidate('filteredTodos', filteredTodos);
		}

		function dblclick_handler({ todo }) {
			return editTodo(todo);
		}

		function input_input_handler({ todo, each_value, todo_index }) {
			each_value[todo_index].title = this.value;
			$$invalidate('filteredTodos', filteredTodos);
		}

		function blur_handler({ todo }) {
			return doneEdit(todo);
		}

		function keydown_handler({ todo }) {
			return doneEditKeydown(todo, event);
		}

		function click_handler({ todo }) {
			return deleteTodo(todo.id);
		}

		function click_handler_1() {
			return updateFilter('all');
		}

		function click_handler_2() {
			return updateFilter('active');
		}

		function click_handler_3() {
			return updateFilter('completed');
		}

		let todosRemaining, filteredTodos;
		$$self.$$.update = ($$dirty = { todos: 1, currentFilter: 1 }) => {
			if ($$dirty.todos) { $$invalidate('todosRemaining', todosRemaining = todos.filter(todo => !todo.completed).length); }
			if ($$dirty.currentFilter || $$dirty.todos) { $$invalidate('filteredTodos', filteredTodos =
	        currentFilter === "all"
	          ? todos
	          : currentFilter === "completed"
	          ? todos.filter(todo => todo.completed)
	          : todos.filter(todo => !todo.completed)); }
		};

		return {
			currentFilter,
			newTodo,
			addTodo,
			editTodo,
			doneEdit,
			doneEditKeydown,
			deleteTodo,
			checkAllTodos,
			clearCompleted,
			updateFilter,
			todosRemaining,
			filteredTodos,
			input0_input_handler,
			input_change_handler,
			dblclick_handler,
			input_input_handler,
			blur_handler,
			keydown_handler,
			click_handler,
			click_handler_1,
			click_handler_2,
			click_handler_3
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, []);
		}
	}

	const app = new App({
		target: document.body,
		props: {
			name: 'world'
		}
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
