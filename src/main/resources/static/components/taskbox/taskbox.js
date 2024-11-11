/**
 * @callback Callback
 * @param {string} title
 * @param {string} status
 * @returns {void}
 */

const template = document.createElement("template");
template.innerHTML = `
    <link rel="stylesheet" type="text/css" href="${import.meta.url.match(/.*\//)[0]}/taskbox.css"/>

    <dialog>
        <span>&times;</span>
        <div>
            <div>Title:</div><div><input type="text" size="25" maxlength="80" placeholder="Task title" autofocus/></div>
            <div>Status:</div><div><select></select></div>
        </div>
        <p><button type="submit">Add task</button></p>
     </dialog>`;

/**
 * TaskBox
 * Manage view to add a new task
 */
class TaskBox extends HTMLElement {
    #dialog
    /** @type {string[]} */
    #statusList = []
    /** @type Callback */
    #callback
    /** @type {function} */
    #previousClickListener //keep track of previous click listener
	#shadowRoot;

    constructor() {
        super();

        this.#shadowRoot = this.attachShadow({mode: "closed"})

        const clone = template.content.cloneNode(true)
        this.#dialog = clone.querySelector("dialog")

        this.#shadowRoot.appendChild(clone)
    }

    /**
     * Opens the modal box of view
     * @public
     */
    show() {
        this.#dialog.show()

        // populate the statuses
        const select = this.#shadowRoot.querySelector("select")
        select.innerText = ''; // Clear existing options
        this.#statusList.forEach(status => {
            const option = document.createElement("option")
            option.value = status
            option.textContent = status
            select.appendChild(option)
        })

        const button = this.#shadowRoot.querySelector("button")
        if (this.#previousClickListener) {
            button.removeEventListener("click", this.#previousClickListener)
        }

        const newClickListener = () => {
            const titleInput = this.#shadowRoot.querySelector("input").value.trim()

            // only allow input without an empty string
            if (this.#callback && titleInput.length > 0) {
                this.#callback(titleInput, select.value)

                this.close()
            }
        };

        button.addEventListener("click", newClickListener)

        // Save the reference to the new click listener
        this.#previousClickListener = newClickListener

        this.#shadowRoot.querySelector("span").addEventListener("click", this.close.bind(this))
    }

    /**
     * Set the list of possible task states
     * @public
     * @param{string[]} statusList
     */
    setStatusesList(statusList) {
        this.#statusList = statusList
    }

    /**
     * Add callback to run at click on the "Add task" button
     * @public
     * @param {Callback} callback
     */
    newTaskCallback(callback) {
        this.#callback = callback
    }

    /**
     * Closes the modal box
     * @public
     */
    close() {
        this.#dialog.querySelector("input").value = ""

        this.#dialog.close()
    }
}

customElements.define('task-box', TaskBox);
