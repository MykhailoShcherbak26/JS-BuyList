const state = {
  items: [
    { id: 1, name: 'Помідори', quantity: 2, bought: true },
    { id: 2, name: 'Печиво', quantity: 2, bought: false },
    { id: 3, name: 'Сир', quantity: 1, bought: false }
  ],
  editingId: null,
  pendingFocusId: null,
  nextId: 4
};

const refs = {
  form: document.getElementById('add-item-form'),
  input: document.getElementById('item-name'),
  list: document.getElementById('items-list'),
  remainingSummary: document.getElementById('remaining-summary'),
  boughtSummary: document.getElementById('bought-summary')
};

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getItem(id) {
  return state.items.find((item) => item.id === id);
}

function renderSummary() {
  const remaining = state.items.filter((item) => !item.bought);
  const bought = state.items.filter((item) => item.bought);

  refs.remainingSummary.innerHTML = remaining.length
    ? remaining.map(renderSummaryTag).join('')
    : '<li class="summary-empty">Немає товарів</li>';

  refs.boughtSummary.innerHTML = bought.length
    ? bought.map(renderSummaryTag).join('')
    : '<li class="summary-empty">Немає товарів</li>';
}

function renderSummaryTag(item) {
  return `
    <li class="item-tag ${item.bought ? 'item-tag--bought' : ''}">
      <span class="tag-name ${item.bought ? 'bought-text' : ''}">${escapeHtml(item.name)}</span>
      <span class="tag-badge">${item.quantity}</span>
    </li>
  `;
}

function renderList() {
  refs.list.innerHTML = state.items.map((item) => {
    const isEditing = state.editingId === item.id;

    return `
      <li class="item-row ${item.bought ? 'item-row--bought' : ''}" data-item-id="${item.id}">
        <span class="item-name-col">
          ${
            item.bought
              ? `<span class="item-name-text bought-text">${escapeHtml(item.name)}</span>`
              : isEditing
                ? `<input class="edit-item-input" data-edit-input="${item.id}" type="text" value="${escapeHtml(item.name)}" aria-label="Редагувати назву товару">`
                : `<button type="button" class="item-name-button" data-action="edit" data-item-id="${item.id}" aria-label="Редагувати назву товару ${escapeHtml(item.name)}">${escapeHtml(item.name)}</button>`
          }
        </span>

        ${
          item.bought
            ? ''
            : `
              <span class="item-controls-col">
                <button
                  type="button"
                  class="qty-btn btn-minus"
                  data-action="decrement"
                  data-item-id="${item.id}"
                  data-tooltip="Зменшити кількість"
                  aria-label="Зменшити кількість"
                  ${item.quantity === 1 ? 'disabled' : ''}
                >
                  -
                </button>
                <span class="qty-badge" aria-label="Кількість: ${item.quantity}">${item.quantity}</span>
                <button
                  type="button"
                  class="qty-btn btn-plus"
                  data-action="increment"
                  data-item-id="${item.id}"
                  data-tooltip="Збільшити кількість"
                  aria-label="Збільшити кількість"
                >
                  +
                </button>
              </span>
            `
        }

        <span class="item-actions-col ${item.bought ? 'item-actions-col--bought' : ''}">
          <button
            type="button"
            class="status-btn"
            data-action="toggle-status"
            data-item-id="${item.id}"
            data-tooltip="${item.bought ? 'Повернути товар до списку' : 'Позначити товар як придбаний'}"
            aria-label="${item.bought ? 'Повернути товар до списку' : 'Позначити товар як придбаний'}"
          >
            ${item.bought ? 'Не куплено' : 'Куплено'}
          </button>
          ${
            item.bought
              ? ''
              : `
                <button
                  type="button"
                  class="delete-btn"
                  data-action="delete"
                  data-item-id="${item.id}"
                  data-tooltip="Видалити товар"
                  aria-label="Видалити товар"
                >
                  ×
                </button>
              `
          }
        </span>
      </li>
    `;
  }).join('');

  if (state.pendingFocusId !== null) {
    const editInput = refs.list.querySelector(`[data-edit-input="${state.pendingFocusId}"]`);
    if (editInput) {
      editInput.focus();
      editInput.setSelectionRange(editInput.value.length, editInput.value.length);
    }
    state.pendingFocusId = null;
  }
}

function render() {
  renderList();
  renderSummary();
}

function startEditing(id) {
  const item = getItem(id);
  if (!item || item.bought) {
    return;
  }

  state.editingId = id;
  state.pendingFocusId = id;
  render();
}

function commitEditing(id, rawValue) {
  const item = getItem(id);
  if (!item) {
    return;
  }

  const value = rawValue.trim();
  if (value) {
    item.name = value;
  }

  state.editingId = null;
  render();
}

function changeQuantity(id, delta) {
  const item = getItem(id);
  if (!item || item.bought) {
    return;
  }

  item.quantity = Math.max(1, item.quantity + delta);
  render();
}

function toggleBought(id) {
  const item = getItem(id);
  if (!item) {
    return;
  }

  item.bought = !item.bought;
  if (state.editingId === id) {
    state.editingId = null;
  }

  render();
}

function deleteItem(id) {
  state.items = state.items.filter((item) => item.id !== id);
  if (state.editingId === id) {
    state.editingId = null;
  }
  render();
}

refs.form.addEventListener('submit', (event) => {
  event.preventDefault();

  const value = refs.input.value.trim();
  if (!value) {
    refs.input.focus();
    return;
  }

  state.items.push({
    id: state.nextId++,
    name: value,
    quantity: 1,
    bought: false
  });

  refs.input.value = '';
  render();
  refs.input.focus();
});

refs.list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const id = Number(button.dataset.itemId);
  const action = button.dataset.action;

  if (action === 'edit') {
    startEditing(id);
  } else if (action === 'decrement') {
    changeQuantity(id, -1);
  } else if (action === 'increment') {
    changeQuantity(id, 1);
  } else if (action === 'toggle-status') {
    toggleBought(id);
  } else if (action === 'delete') {
    deleteItem(id);
  }
});

refs.list.addEventListener('keydown', (event) => {
  const input = event.target.closest('.edit-item-input');
  if (!input) {
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    input.blur();
  }
});

refs.list.addEventListener('focusout', (event) => {
  const input = event.target.closest('.edit-item-input');
  if (!input) {
    return;
  }

  const id = Number(input.dataset.editInput);
  const draft = input.value;

  window.setTimeout(() => {
    if (state.editingId === id) {
      commitEditing(id, draft);
    }
  }, 0);
});

render();
