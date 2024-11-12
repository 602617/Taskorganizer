/**
 * @typedef Task
 * @property {number} id
 * @property {string} [title]
 * @property {string} status
 */

/**
 *
 * @callback TaskCallback
 * @param {number} id
 * @param {string} [status]
 * @returns {void}
 */

const template = document.createElement("template");
template.innerHTML = `
    <link rel="stylesheet" type="text/css" href="${import.meta.url.match(/.*\//)[0]}/tasklist.css"/>

    <div id="tasklist"></div>`;

const taskTable = document.createElement("template");
taskTable.innerHTML = `
    <table>
        <thead><tr><th>Task</th><th>Status</th></tr></thead>
        <tbody></tbody>
    </table>`;

const taskRow = document.createElement("template");
taskRow.innerHTML = `
    <tr>
        <td class="name"></td>
        <td class="status"></td>
        <td>
            <select>
                <option value="0" selected>&lt;Modify&gt;</option>
            </select>
        </td>
        <td><button type="button">Remove</button></td>
    </tr>`;

/**
 * TaskList
 * Manage view with list of tasks
 */
class TaskList extends HTMLElement {
    /** @type {TaskCallback} */
    #changeCallback
    #deleteCallback
    /** @type {string[]} */
    #allStatuses = []
    /** @type {HTMLDivElement} */
    #container
    /** @type {HTMLTableSectionElement} */
    #tbody
    #taskCount = 0
	#shadowRoot

    constructor() {
        super();

        this.#shadowRoot = this.attachShadow({mode: "closed"})
        this.#init()
        this.#shadowRoot.appendChild(this.#container)
        this.#toggleTable()
    }

    #init() {
        const copy = template.content.cloneNode(true);
        this.#container = copy.getElementById("tasklist");
        const table = taskTable.content.cloneNode(true).querySelector("table");
        this.#tbody = table.querySelector("tbody");
        table.style.display = 'none';
        this.#container.appendChild(table);
    }

    #toggleTable() {
        const table = this.#container.querySelector("table");
        if (table) {
            if (this.getNumTasks() === 0) {
                table.style.display = 'none';
            } else {
                table.style.display = 'table';
            }
        }
    }

    /**
     * @public
     * @param {string[]} list with all possible task statuses
     */
    setStatusesList(list) {
        this.#allStatuses = list
    }

    /**
     * Add callback to run on change of status of a task, i.e. on change in the SELECT element
     * @public
     * @param {TaskCallback} callback
     */
    changeStatusCallback(callback) {
        this.#changeCallback = callback
    }

    /**
     * Add callback to run on click on delete button of a task
     * @public
     * @param {TaskCallback} callback
     */
    deleteTaskCallback(callback) {
        this.#deleteCallback = callback
    }

    /**
     * Add task at top in list of tasks in the view
     * @public
     * @param {Task} task - Object representing a task
     */
    showTask(task) {
		
        this.#taskCount++

        /**@type {HTMLTableRowElement}*/
        const trTask = taskRow.content.cloneNode(true).querySelector("tr")

        trTask.dataset.id = task.id.toString()
        trTask.querySelector(".status").textContent = task.status
        trTask.querySelector(".name").textContent = task.title

        const select = trTask.querySelector("select")
        if (select) {
            const originalStatus = select.querySelector("option").value
            this.#allStatuses.forEach(value => {
                const option = document.createElement("option")
                option.textContent = value
                option.value = value
                select.appendChild(option)
            })
            select.addEventListener("change", () => {
                const newStatus = select.value
                if (newStatus !== originalStatus) {
                    if (this.#changeCallback && confirm(`set '${task.title}' to ${newStatus}`)) {
                        this.#changeCallback(task.id, newStatus)
                    }
                }
                select.value = originalStatus
            })
        }

        const button = trTask.querySelector("button")
        if (button != null) {
            button.addEventListener("click", () => {
                if (this.#deleteCallback && confirm(`delete task '${task.title}'?`)) {
                    this.#deleteCallback(task.id)
                    
                }
            })
        }

        this.#tbody.insertBefore(trTask, this.#tbody.firstChild)
        this.#toggleTable()
    }

    /**
     * Update the status of a task in the view
     * @param {Task} task - Object with attributes {'id':taskId,'status':newStatus}
     */
    updateTask(task) {
        const td = this.#getTask(task.id)?.querySelector(".status")
        if (td) {
            td.textContent = task.status
        }
    }

    /**
     * Remove a task from the view
     * @param {number} id - ID of task to remove
     */
    removeTask(id) {
        this.#taskCount--
        const tr = this.#getTask(id)
        if (tr) {
            tr.remove()
        }
        this.#toggleTable()
    }

    /**
     * @public
     * @return {number} - Number of tasks on display in view
     */
    getNumTasks() {
        return this.#taskCount
    }

    /**
     * @private
     * @param {number} id
     * @returns {HTMLTableRowElement}
     */
    #getTask(id) {
        return this.#container.querySelector(`table tbody tr[data-id="${id}"]`)
    }
}

customElements.define('task-list', TaskList);
