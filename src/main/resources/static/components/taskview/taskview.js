import '../tasklist/tasklist.js';
import '../taskbox/taskbox.js';

// Define HTML template for taskview
const template = document.createElement("template");
template.innerHTML = `
    <link rel="stylesheet" type="text/css" href="${import.meta.url.match(/.*\//)[0]}/taskview.css"/>

    <h1>Tasks</h1>

    <div id="message"><p>Waiting for server data.</p></div>
    <div id="newtask"><button type="button" disabled>New task</button></div>

    <!-- The task list -->
    <task-list></task-list>
            
    <!-- The Modal -->
    <task-box></task-box>`;

/**
 * TaskView
 * The full application view
 */
class TaskView extends HTMLElement {
	#config;
	#taskList;
	#dialog;
	#message;
	#shadowRoot;

	constructor() {
		super();

		this.#config = this.getAttribute("data-serviceurl");

		if (!this.#config) {
			const error = "data-serviceurl is a required prop";
			throw new Error(error);
		}

		this.#shadowRoot = this.attachShadow({ mode: "closed" });
		const copy = template.content.cloneNode(true);
		this.#shadowRoot.appendChild(copy);

		this.#taskList = this.#shadowRoot.querySelector("task-list");
		this.#dialog = this.#shadowRoot.querySelector("task-box");
		this.#message = this.#shadowRoot.querySelector("#message p");
		this.#init();
	}
	#init() {

		this.#fetchStatuses();
		//this.#fetchTasks();

		const button = this.#shadowRoot.querySelector("#newtask button");


		button.addEventListener("click", async () => {
			this.#dialog.newTaskCallback(async (title, status) => {
				const response = await this.#fetch("/task", "POST", {
					title,
					status,
				});
				if(response.responseStatus){
					this.#taskList.showTask(response.task);
					this.#message.textContent = "Added 1 task";
				}
				
			});
			this.#dialog.show();
		});

		this.#taskList.changeStatusCallback(async (id, newStatus) => {
			const response = await this.#put(`/task/${id}`, "id", { status: newStatus });
			if (response.responseStatus) {
				this.#message.textContent = "Changed 1 task";
				this.#taskList.updateTask({ id, status: newStatus })

			}
		});

		this.#taskList.deleteTaskCallback(async (id) => {
			const response = await this.#fetch(`/task/${id}`, "DELETE");

			console.log(response)
			if (response.responseStatus) {
				this.#message.textContent = "Removed 1 task";
				// kall tasklist metode for å fjerne task
				this.#taskList.removeTask(id)
			}
		});


	}

	async #fetchStatuses() {
		try {
			const allStatuses = await this.#get("/allstatuses", "allstatuses");
			this.#taskList.setStatusesList(allStatuses);
			this.#dialog.setStatusesList(allStatuses);
			this.#fetchTasks();
			const button = this.#shadowRoot.querySelector("#newtask button");
			button.disabled = false;
		} catch (error) {
			console.error("Failed to fetch statuses:", error);
			this.#message.textContent = "Error fetching statuses.";
		}
	}

	async #fetchTasks() {
		try {
			/** @type Task[] */
			const tasks = await this.#get("/tasklist", "tasks");
			tasks.forEach((task) => this.#taskList.showTask(task));
			this.#message.textContent = `Found ${tasks.length} tasks.`;

		} catch (error) {
			console.error("Failed to fetch tasks:", error);
			this.#message.textContent = "Error fetching tasks.";
		}
	}
//fjern
	async #get(path, key) {
		const data = await this.#fetch(path, "GET");
		if (typeof data !== "object") {
			throw new SyntaxError("Unexpected response format. Expected JSON.");
		}
		return data[key];
	}

	async #delete(path, key) {
		const data = await this.#fetch(path, "DELETE");
		return data[key];
	}

	async #put(path, key, payload) {
		const data = await this.#fetch(path, "PUT", payload);
		return data;
	}

	async #post(path, key, payload) {
		const data = await this.#fetch(path, "POST", payload);
		return data;
	}

	async #fetch(path, method, payload = undefined) {
		const url = this.#config + path;
		const options = {
			method,
			headers: { "Content-Type": "application/json; charset=utf-8" },
		};

		if (method !== "GET" && payload) {
			options.body = JSON.stringify(payload);
		}

		const res = await fetch(url, options);

		if (!res.ok) {
			console.error(`HTTP error! status: ${res.status}, URL: ${url}`);
			if (res.status === 404) {
				throw new Error(`Resource not found: ${url}`);
			} else {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
		}

		const contentType = res.headers.get("content-type");
		if (contentType && contentType.includes("application/json")) {
			return await res.json();
		} else {
			throw new SyntaxError("Unexpected response format. Expected JSON.");
		}
	}
}

customElements.define('task-view', TaskView);
