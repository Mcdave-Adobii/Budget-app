
      // ---------- Storage (wrapped, because it can fail or be empty) ----------
      function load(key) {
        try {
          return JSON.parse(localStorage.getItem(key)) || [];
        } catch (e) {
          return [];
        }
      }
      function save(key, data) {
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {}
      }

      let entries = load("budget");
      let tasks = load("tasks");
      let filter = "all";

      const peso = (n) =>
        "₱" +
        n.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      const $ = (id) => document.getElementById(id);

      function emptyRow(text) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = text;
        return li;
      }

      // ---------- Tabs ----------
      function showTab(name) {
        for (const t of ["budget", "todo"]) {
          $(t).hidden = t !== name;
          $("tab-" + t).setAttribute("aria-selected", t === name);
        }
        try {
          history.replaceState(null, "", "#" + name);
        } catch (e) {}
      }

      // ---------- Budget ----------
      function drawBudget() {
        const income = entries
          .filter((e) => e.type === "income")
          .reduce((s, e) => s + e.amount, 0);
        const expenses = entries
          .filter((e) => e.type === "expense")
          .reduce((s, e) => s + e.amount, 0);
        const balance = income - expenses;

        $("income").textContent = peso(income);
        $("expenses").textContent = peso(expenses);
        $("balance").textContent =
          (balance < 0 ? "−" : "") + peso(Math.abs(balance));

        const list = $("budgetList");
        list.innerHTML = "";
        if (entries.length === 0)
          list.appendChild(
            emptyRow("No entries yet. Add your first income or expense above."),
          );

        entries.forEach((e, i) => {
          const li = document.createElement("li");

          const info = document.createElement("div");
          info.className = "grow";
          info.textContent = e.desc;
          const date = document.createElement("small");
          date.textContent = e.date;
          info.appendChild(date);

          const amt = document.createElement("span");
          amt.className = "amt " + (e.type === "income" ? "in" : "out");
          amt.textContent = (e.type === "income" ? "+" : "−") + peso(e.amount);

          const del = document.createElement("button");
          del.className = "del";
          del.textContent = "✕";
          del.setAttribute("aria-label", "Delete " + e.desc);
          del.onclick = () => {
            entries.splice(i, 1);
            save("budget", entries);
            drawBudget();
          };

          li.append(info, amt, del);
          list.appendChild(li);
        });

        $("budgetCount").textContent =
          entries.length + (entries.length === 1 ? " entry" : " entries");
      }

      $("budgetForm").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const desc = $("desc").value.trim();
        const amountText = $("amount").value.trim();
        const msg = $("budgetMsg");

        if (desc === "" || amountText === "") {
          msg.textContent = "Enter a description and an amount.";
          return;
        }
        const amount = Number(amountText);
        if (Number.isNaN(amount) || amount <= 0) {
          msg.textContent = "The amount must be greater than 0.";
          return;
        }

        msg.textContent = "";
        entries.unshift({
          desc,
          amount,
          type: $("type").value,
          date: new Date().toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        });
        save("budget", entries);
        drawBudget();
        $("desc").value = "";
        $("amount").value = "";
        $("desc").focus();
      });

      function clearBudget() {
        if (entries.length && confirm("Delete all budget entries?")) {
          entries = [];
          save("budget", entries);
          drawBudget();
        }
      }

      // ---------- To-do ----------
      function drawTodo() {
        const list = $("todoList");
        list.innerHTML = "";

        const shown = tasks.filter(
          (t) => filter === "all" || (filter === "done" ? t.done : !t.done),
        );
        if (shown.length === 0) {
          list.appendChild(
            emptyRow(
              tasks.length === 0
                ? "Nothing to do yet. Add a task above."
                : "No tasks in this view.",
            ),
          );
        }

        shown.forEach((t) => {
          const li = document.createElement("li");
          if (t.done) li.className = "done";

          const box = document.createElement("input");
          box.type = "checkbox";
          box.checked = t.done;
          box.setAttribute("aria-label", "Mark “" + t.text + "” as done");
          box.onchange = () => {
            t.done = box.checked;
            save("tasks", tasks);
            drawTodo();
          };

          const label = document.createElement("div");
          label.className = "grow";
          label.textContent = t.text;

          const del = document.createElement("button");
          del.className = "del";
          del.textContent = "✕";
          del.setAttribute("aria-label", "Delete " + t.text);
          del.onclick = () => {
            tasks = tasks.filter((x) => x !== t);
            save("tasks", tasks);
            drawTodo();
          };

          li.append(box, label, del);
          list.appendChild(li);
        });

        const left = tasks.filter((t) => !t.done).length;
        $("todoCount").textContent =
          left + (left === 1 ? " task left" : " tasks left");
      }

      $("todoForm").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const text = $("task").value.trim();
        if (text === "") {
          $("todoMsg").textContent = "Type a task first.";
          return;
        }
        $("todoMsg").textContent = "";
        tasks.unshift({ text, done: false });
        save("tasks", tasks);
        drawTodo();
        $("task").value = "";
        $("task").focus();
      });

      $("filters").addEventListener("click", (ev) => {
        const f = ev.target.dataset.f;
        if (!f) return;
        filter = f;
        for (const b of $("filters").children)
          b.setAttribute("aria-pressed", b.dataset.f === f);
        drawTodo();
      });

      function clearDone() {
        tasks = tasks.filter((t) => !t.done);
        save("tasks", tasks);
        drawTodo();
      }

      // ---------- Start ----------
      drawBudget();
      drawTodo();
      showTab(location.hash === "#todo" ? "todo" : "budget");
      window.addEventListener("hashchange", () =>
        showTab(location.hash === "#todo" ? "todo" : "budget"),
      );
  
      // ---------- Offline support ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}