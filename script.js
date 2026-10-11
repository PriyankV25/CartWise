(function () {
  "use strict";

  const STORAGE_KEY = "cartwise-data";
  const DEFAULT_CURRENCY = "INR";

  const SAMPLE_ITEMS = [
    { name: "Basmati rice (1 kg)", unitPrice: 118, quantity: 2, purchased: false },
    { name: "Toned milk (1 L)", unitPrice: 56, quantity: 4, purchased: false },
    { name: "Whole wheat bread", unitPrice: 45, quantity: 2, purchased: false },
    { name: "Tomatoes (1 kg)", unitPrice: 42, quantity: 1, purchased: false },
    { name: "Dishwashing liquid", unitPrice: 99, quantity: 1, purchased: true },
  ];

  const elements = {
    statusRegion: document.getElementById("status-region"),
    summaryBudget: document.getElementById("summary-budget"),
    summaryEstimated: document.getElementById("summary-estimated"),
    summaryRemaining: document.getElementById("summary-remaining"),
    remainingCard: document.querySelector(".remaining-card"),
    summaryCount: document.getElementById("summary-count"),
    budgetStatusText: document.getElementById("budget-status-text"),
    budgetProgress: document.getElementById("budget-progress"),
    budgetProgressFill: document.getElementById("budget-progress-fill"),
    completionText: document.getElementById("completion-text"),
    completionPercent: document.getElementById("completion-percent"),
    completionProgress: document.getElementById("completion-progress"),
    completionProgressFill: document.getElementById("completion-progress-fill"),
    budgetForm: document.getElementById("budget-form"),
    budgetInput: document.getElementById("budget-input"),
    currencySelect: document.getElementById("currency-select"),
    itemForm: document.getElementById("item-form"),
    itemId: document.getElementById("item-id"),
    itemName: document.getElementById("item-name"),
    itemPrice: document.getElementById("item-price"),
    itemQuantity: document.getElementById("item-quantity"),
    itemSubmit: document.getElementById("item-submit"),
    itemCancel: document.getElementById("item-cancel"),
    emptyState: document.getElementById("empty-state"),
    listGroups: document.getElementById("list-groups"),
    todoList: document.getElementById("todo-list"),
    doneList: document.getElementById("done-list"),
    loadSample: document.getElementById("load-sample"),
    clearList: document.getElementById("clear-list"),
    clearConfirm: document.getElementById("clear-confirm"),
    confirmClear: document.getElementById("confirm-clear"),
    cancelClear: document.getElementById("cancel-clear"),
  };

  let state = createDefaultState();
  let statusTimer = null;

  function createDefaultState() {
    return {
      budget: 0,
      currency: DEFAULT_CURRENCY,
      items: [],
    };
  }

  function createId() {
    return "item-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function formatCurrency(amount, currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || DEFAULT_CURRENCY,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return roundMoney(amount).toFixed(2) + " " + (currency || DEFAULT_CURRENCY);
    }
  }

  function getItemTotal(item) {
    return roundMoney(item.unitPrice * item.quantity);
  }

  function calculateTotals(currentState) {
    const estimated = roundMoney(
      currentState.items.reduce(function (sum, item) {
        return sum + getItemTotal(item);
      }, 0)
    );
    const remaining = roundMoney(currentState.budget - estimated);
    const purchasedCount = currentState.items.filter(function (item) {
      return item.purchased;
    }).length;

    return {
      estimated: estimated,
      remaining: remaining,
      itemCount: currentState.items.length,
      purchasedCount: purchasedCount,
      overBudget: remaining < 0,
    };
  }

  function sanitizeItem(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const unitPrice = roundMoney(raw.unitPrice);
    const quantity = Number(raw.quantity);

    if (!name || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return null;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return null;
    }

    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : createId(),
      name: name.slice(0, 80),
      unitPrice: unitPrice,
      quantity: quantity,
      purchased: Boolean(raw.purchased),
    };
  }

  function sanitizeState(raw) {
    const next = createDefaultState();

    if (!raw || typeof raw !== "object") {
      return next;
    }

    const budget = roundMoney(raw.budget);
    next.budget = Number.isFinite(budget) && budget >= 0 ? budget : 0;

    const allowedCurrencies = ["INR", "USD", "EUR", "GBP", "JPY"];
    next.currency = allowedCurrencies.indexOf(raw.currency) >= 0 ? raw.currency : DEFAULT_CURRENCY;

    if (Array.isArray(raw.items)) {
      next.items = raw.items.map(sanitizeItem).filter(Boolean);
    }

    return next;
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return createDefaultState();
      }
      return sanitizeState(JSON.parse(saved));
    } catch (error) {
      return createDefaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      showMessage("Your list could not be saved in this browser.", "error");
    }
  }

  function showMessage(text, type) {
    elements.statusRegion.replaceChildren();
    const message = document.createElement("p");
    message.className = "status-message " + (type || "success");
    message.textContent = text;
    elements.statusRegion.appendChild(message);

    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(function () {
      elements.statusRegion.replaceChildren();
    }, 4200);
  }

  function validateBudget(value) {
    if (value === "" || value === null) {
      return "Enter a shopping budget.";
    }

    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      return "Budget must be a number that is zero or greater.";
    }

    return "";
  }

  function validateItem(name, price, quantity) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return "Product name cannot be empty.";
    }

    const unitPrice = Number(price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return "Unit price must be zero or a positive number.";
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return "Quantity must be a positive whole number.";
    }

    return "";
  }

  function resetItemForm() {
    elements.itemForm.reset();
    elements.itemId.value = "";
    elements.itemQuantity.value = "1";
    elements.itemSubmit.textContent = "Add item";
    elements.itemCancel.hidden = true;
  }

  function fillItemForm(item) {
    elements.itemId.value = item.id;
    elements.itemName.value = item.name;
    elements.itemPrice.value = item.unitPrice.toFixed(2);
    elements.itemQuantity.value = String(item.quantity);
    elements.itemSubmit.textContent = "Save changes";
    elements.itemCancel.hidden = false;
    elements.itemName.focus();
  }

  function createItemCard(item) {
    const li = document.createElement("li");
    li.className = "item-card" + (item.purchased ? " purchased" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "item-check";
    checkbox.checked = item.purchased;
    checkbox.dataset.action = "toggle";
    checkbox.dataset.id = item.id;
    checkbox.setAttribute("aria-label", "Mark " + item.name + " as purchased");

    const details = document.createElement("div");
    const name = document.createElement("p");
    name.className = "item-name";
    name.textContent = item.name;

    const meta = document.createElement("p");
    meta.className = "item-meta";
    meta.textContent =
      formatCurrency(item.unitPrice, state.currency) +
      " × " +
      item.quantity;

    details.appendChild(name);
    details.appendChild(meta);

    const side = document.createElement("div");
    side.className = "item-side";

    const total = document.createElement("p");
    total.className = "item-total";
    total.textContent = formatCurrency(getItemTotal(item), state.currency);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn btn-ghost btn-tiny";
    editButton.dataset.action = "edit";
    editButton.dataset.id = item.id;
    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-danger btn-tiny";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = item.id;
    deleteButton.textContent = "Delete";

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    side.appendChild(total);
    side.appendChild(actions);

    li.appendChild(checkbox);
    li.appendChild(details);
    li.appendChild(side);
    return li;
  }

  function renderListGroup(listElement, items, emptyText) {
    listElement.replaceChildren();

    if (items.length === 0) {
      const empty = document.createElement("li");
      empty.className = "group-empty";
      empty.textContent = emptyText;
      listElement.appendChild(empty);
      return;
    }

    items.forEach(function (item) {
      listElement.appendChild(createItemCard(item));
    });
  }

  function render() {
    const totals = calculateTotals(state);
    const money = function (value) {
      return formatCurrency(value, state.currency);
    };

    elements.summaryBudget.textContent = money(state.budget);
    elements.summaryEstimated.textContent = money(totals.estimated);
    elements.summaryRemaining.textContent = money(totals.remaining);
    elements.summaryCount.textContent = String(totals.itemCount);
    elements.remainingCard.classList.toggle("is-over", totals.overBudget);

    elements.budgetInput.value = state.budget ? String(state.budget) : "";
    elements.currencySelect.value = state.currency;

    const budgetPercent =
      state.budget > 0 ? Math.min((totals.estimated / state.budget) * 100, 100) : 0;
    const rawPercent = state.budget > 0 ? (totals.estimated / state.budget) * 100 : 0;

    elements.budgetProgressFill.style.width = budgetPercent + "%";
    elements.budgetProgressFill.classList.remove("warn", "over");
    if (totals.overBudget) {
      elements.budgetProgressFill.classList.add("over");
      elements.budgetStatusText.textContent =
        "This list is over budget by " + money(Math.abs(totals.remaining)) + ".";
    } else if (rawPercent >= 85 && state.budget > 0) {
      elements.budgetProgressFill.classList.add("warn");
      elements.budgetStatusText.textContent =
        "You have used " + Math.round(rawPercent) + "% of your budget. " +
        money(totals.remaining) + " remaining.";
    } else if (state.budget > 0) {
      elements.budgetStatusText.textContent =
        money(totals.estimated) + " of " + money(state.budget) + " planned.";
    } else {
      elements.budgetStatusText.textContent = "Set a budget to start tracking.";
    }

    elements.budgetProgress.setAttribute("aria-valuenow", String(Math.round(budgetPercent)));

    const completionPercent =
      totals.itemCount === 0 ? 0 : Math.round((totals.purchasedCount / totals.itemCount) * 100);
    elements.completionProgressFill.style.width = completionPercent + "%";
    elements.completionPercent.textContent = completionPercent + "%";
    elements.completionProgress.setAttribute("aria-valuenow", String(completionPercent));

    if (totals.itemCount === 0) {
      elements.completionText.textContent = "No items yet.";
    } else {
      elements.completionText.textContent =
        totals.purchasedCount +
        " of " +
        totals.itemCount +
        " items purchased.";
    }

    const hasItems = state.items.length > 0;
    elements.emptyState.hidden = hasItems;
    elements.listGroups.hidden = !hasItems;
    elements.clearList.disabled = !hasItems;

    if (hasItems) {
      const todoItems = state.items.filter(function (item) {
        return !item.purchased;
      });
      const doneItems = state.items.filter(function (item) {
        return item.purchased;
      });
      renderListGroup(elements.todoList, todoItems, "Nothing left to buy.");
      renderListGroup(elements.doneList, doneItems, "No purchased items yet.");
    }

    if (!elements.clearConfirm.hidden && !hasItems) {
      elements.clearConfirm.hidden = true;
    }
  }

  function persistAndRender() {
    saveState();
    render();
  }

  function handleBudgetSubmit(event) {
    event.preventDefault();
    const error = validateBudget(elements.budgetInput.value);
    if (error) {
      showMessage(error, "error");
      elements.budgetInput.focus();
      return;
    }

    state.budget = roundMoney(elements.budgetInput.value);
    persistAndRender();
    showMessage("Budget updated to " + formatCurrency(state.budget, state.currency) + ".", "success");
  }

  function handleCurrencyChange() {
    state.currency = elements.currencySelect.value || DEFAULT_CURRENCY;
    persistAndRender();
    showMessage("Currency set to " + state.currency + ".", "success");
  }

  function handleItemSubmit(event) {
    event.preventDefault();
    const error = validateItem(
      elements.itemName.value,
      elements.itemPrice.value,
      elements.itemQuantity.value
    );

    if (error) {
      showMessage(error, "error");
      return;
    }

    const nextItem = {
      id: elements.itemId.value || createId(),
      name: elements.itemName.value.trim(),
      unitPrice: roundMoney(elements.itemPrice.value),
      quantity: Number(elements.itemQuantity.value),
      purchased: false,
    };

    const existingIndex = state.items.findIndex(function (item) {
      return item.id === nextItem.id;
    });

    if (existingIndex >= 0) {
      nextItem.purchased = state.items[existingIndex].purchased;
      state.items[existingIndex] = nextItem;
      showMessage("Updated “" + nextItem.name + "”.", "success");
    } else {
      state.items.push(nextItem);
      showMessage("Added “" + nextItem.name + "” to your list.", "success");
    }

    resetItemForm();
    persistAndRender();
  }

  function handleListClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) {
      return;
    }

    const item = state.items.find(function (entry) {
      return entry.id === id;
    });
    if (!item) {
      return;
    }

    if (action === "edit") {
      fillItemForm(item);
      return;
    }

    if (action === "delete") {
      state.items = state.items.filter(function (entry) {
        return entry.id !== id;
      });
      if (elements.itemId.value === id) {
        resetItemForm();
      }
      persistAndRender();
      showMessage("Removed “" + item.name + "”.", "success");
    }
  }

  function handleListChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.dataset.action !== "toggle") {
      return;
    }

    const item = state.items.find(function (entry) {
      return entry.id === target.dataset.id;
    });
    if (!item) {
      return;
    }

    item.purchased = target.checked;
    persistAndRender();
    showMessage(
      item.purchased
        ? "Marked “" + item.name + "” as purchased."
        : "Moved “" + item.name + "” back to your shopping list.",
      "success"
    );
  }

  function handleLoadSample() {
    state.items = SAMPLE_ITEMS.map(function (item) {
      return {
        id: createId(),
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        purchased: item.purchased,
      };
    });

    if (!state.budget) {
      state.budget = 1500;
    }

    resetItemForm();
    persistAndRender();
    showMessage("Loaded a sample shopping list.", "success");
  }

  function handleClearRequest() {
    if (state.items.length === 0) {
      return;
    }
    elements.clearConfirm.hidden = false;
    elements.confirmClear.focus();
  }

  function handleConfirmClear() {
    state.items = [];
    elements.clearConfirm.hidden = true;
    resetItemForm();
    persistAndRender();
    showMessage("Shopping list cleared.", "success");
  }

  function bindEvents() {
    elements.budgetForm.addEventListener("submit", handleBudgetSubmit);
    elements.currencySelect.addEventListener("change", handleCurrencyChange);
    elements.itemForm.addEventListener("submit", handleItemSubmit);
    elements.itemCancel.addEventListener("click", function () {
      resetItemForm();
      showMessage("Edit cancelled.", "success");
    });
    elements.listGroups.addEventListener("click", handleListClick);
    elements.listGroups.addEventListener("change", handleListChange);
    elements.loadSample.addEventListener("click", handleLoadSample);
    elements.clearList.addEventListener("click", handleClearRequest);
    elements.confirmClear.addEventListener("click", handleConfirmClear);
    elements.cancelClear.addEventListener("click", function () {
      elements.clearConfirm.hidden = true;
    });
  }

  function init() {
    state = loadState();
    bindEvents();
    resetItemForm();
    render();
  }

  init();
})();
