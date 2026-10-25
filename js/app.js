(function () {
  "use strict";

  const STORAGE_KEY = "stockOficinaDataV1";
  const VIEW_TITLES = {
    inicio: "Resumen general",
    inventario: "Inventario",
    movimientos: "Movimientos"
  };
  const state = { products: [], movements: [] };
  let storageReady = true;
  let toastTimer;

  const elements = {
    totalProducts: document.getElementById("total-products"),
    totalUnits: document.getElementById("total-units"),
    lowStockCount: document.getElementById("low-stock-count"),
    lowStockList: document.getElementById("low-stock-list"),
    alertsEmpty: document.getElementById("alerts-empty"),
    inventoryBody: document.getElementById("inventory-body"),
    emptyState: document.getElementById("empty-state"),
    emptyTitle: document.getElementById("empty-title"),
    emptyDescription: document.getElementById("empty-description"),
    searchInput: document.getElementById("search-input"),
    categoryFilter: document.getElementById("category-filter"),
    productDialog: document.getElementById("product-dialog"),
    productForm: document.getElementById("product-form"),
    productId: document.getElementById("product-id"),
    productName: document.getElementById("product-name"),
    productCategory: document.getElementById("product-category"),
    productQuantity: document.getElementById("product-quantity"),
    productMinimum: document.getElementById("product-minimum"),
    productDescription: document.getElementById("product-description"),
    productDialogTitle: document.getElementById("product-dialog-title"),
    productError: document.getElementById("product-error"),
    movementDialog: document.getElementById("movement-dialog"),
    movementForm: document.getElementById("movement-form"),
    movementProduct: document.getElementById("movement-product"),
    movementType: document.getElementById("movement-type"),
    movementQuantity: document.getElementById("movement-quantity"),
    movementError: document.getElementById("movement-error"),
    movementList: document.getElementById("movement-list"),
    movementEmpty: document.getElementById("movement-empty"),
    storageStatus: document.getElementById("storage-status"),
    pageTitle: document.getElementById("page-title"),
    topbarProductAction: document.querySelector("[data-action-in-view='inventario']"),
    toast: document.getElementById("toast")
  };

  function isNonNegativeInteger(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function isValidProduct(product) {
    return product && typeof product.id === "string" &&
      typeof product.name === "string" && typeof product.category === "string" &&
      typeof product.description === "string" &&
      isNonNegativeInteger(product.quantity) && isNonNegativeInteger(product.minimum);
  }

  function isValidMovement(movement) {
    return movement && typeof movement.id === "string" &&
      typeof movement.productId === "string" && typeof movement.productName === "string" &&
      (movement.type === "entrada" || movement.type === "salida" || movement.type === "inventario-inicial") &&
      Number.isSafeInteger(movement.quantity) && movement.quantity > 0 &&
      typeof movement.date === "string" && !Number.isNaN(Date.parse(movement.date));
  }

  function loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) return;
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.products) || !Array.isArray(parsed.movements) ||
          !parsed.products.every(isValidProduct) || !parsed.movements.every(isValidMovement)) {
        throw new Error("El formato de los datos guardados no es válido.");
      }
      state.products = parsed.products;
      state.movements = parsed.movements;
    } catch (error) {
      storageReady = false;
      elements.storageStatus.textContent = "No se pudieron cargar los datos guardados. No se modificarán para evitar perder información.";
      showToast(error instanceof SyntaxError ? "Los datos guardados están dañados; se conservaron sin cambios." : "No se pudieron leer los datos guardados.", true);
    }
  }

  function saveData(products, movements) {
    if (!storageReady) {
      showToast("No se puede guardar: revisa el almacenamiento local antes de continuar.", true);
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, movements }));
      state.products = products;
      state.movements = movements;
      return true;
    } catch (error) {
      elements.storageStatus.textContent = "No se pudo guardar en este navegador. Comprueba su espacio y permisos de almacenamiento.";
      showToast("No se guardaron los cambios en el navegador.", true);
      return false;
    }
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function showToast(message, isError) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.toggle("error", Boolean(isError));
    elements.toast.classList.add("visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 3500);
  }

  function addTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function renderDashboard() {
    elements.totalProducts.textContent = String(state.products.length);
    elements.totalUnits.textContent = String(state.products.reduce((total, product) => total + product.quantity, 0));
    const lowStockProducts = state.products.filter(product => product.quantity <= product.minimum);
    elements.lowStockCount.textContent = String(lowStockProducts.length);
    elements.lowStockList.replaceChildren();
    elements.alertsEmpty.hidden = lowStockProducts.length > 0;
    lowStockProducts.forEach(product => {
      const alert = document.createElement("a");
      alert.className = "low-stock-item";
      alert.href = "#inventario";
      alert.dataset.viewLink = "inventario";
      alert.dataset.alertProduct = product.id;
      const details = document.createElement("span");
      details.className = "low-stock-details";
      addTextElement(details, "span", "low-stock-name", product.name);
      addTextElement(details, "span", "low-stock-category", product.category);
      alert.append(details);
      addTextElement(alert, "span", "low-stock-quantity", `${product.quantity} / mínimo ${product.minimum}`);
      elements.lowStockList.append(alert);
    });
  }

  function renderCategoryFilter() {
    const selectedCategory = elements.categoryFilter.value;
    const categories = [...new Set(state.products.map(product => product.category))].sort((a, b) => a.localeCompare(b, "es"));
    elements.categoryFilter.replaceChildren(new Option("Todas las categorías", ""));
    categories.forEach(category => elements.categoryFilter.add(new Option(category, category)));
    if (categories.includes(selectedCategory)) elements.categoryFilter.value = selectedCategory;
  }

  function renderInventory() {
    const query = elements.searchInput.value.trim().toLocaleLowerCase("es");
    const category = elements.categoryFilter.value;
    const products = state.products.filter(product =>
      product.name.toLocaleLowerCase("es").includes(query) &&
      (!category || product.category === category)
    );
    elements.inventoryBody.replaceChildren();
    products.forEach(product => {
      const row = document.createElement("tr");
      const productCell = document.createElement("td");
      const productDetails = document.createElement("div");
      productDetails.className = "product-cell";
      const avatar = addTextElement(productDetails, "span", "product-avatar", product.name.trim().charAt(0).toLocaleUpperCase("es"));
      avatar.setAttribute("aria-hidden", "true");
      const text = document.createElement("div");
      addTextElement(text, "div", "product-name", product.name);
      if (product.description) addTextElement(text, "div", "product-description", product.description);
      productDetails.append(text);
      productCell.append(productDetails);
      row.append(productCell);

      const categoryCell = document.createElement("td");
      addTextElement(categoryCell, "span", "category-pill", product.category);
      row.append(categoryCell);

      const quantityCell = addTextElement(row, "td", "quantity-cell", String(product.quantity));
      const minimum = document.createElement("small");
      minimum.textContent = ` / mínimo ${product.minimum}`;
      quantityCell.append(minimum);

      const statusCell = document.createElement("td");
      const isLow = product.quantity <= product.minimum;
      const status = addTextElement(statusCell, "span", `status-pill ${isLow ? "status-low" : "status-ok"}`, isLow ? "Stock bajo" : "Disponible");
      if (isLow) status.setAttribute("aria-label", `Stock bajo: ${product.quantity} unidades, mínimo ${product.minimum}`);
      row.append(statusCell);

      const actionsCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "action-group";
      const movementButton = makeActionButton("＋", `Registrar movimiento para ${product.name}`, "movement", product.id);
      const editButton = makeActionButton("✎", `Editar ${product.name}`, "edit", product.id);
      const deleteButton = makeActionButton("×", `Eliminar ${product.name}`, "delete", product.id);
      deleteButton.classList.add("delete");
      actions.append(movementButton, editButton, deleteButton);
      actionsCell.append(actions);
      row.append(actionsCell);
      elements.inventoryBody.append(row);
    });

    const noProducts = state.products.length === 0;
    const noMatches = !noProducts && products.length === 0;
    elements.emptyState.classList.toggle("visible", products.length === 0);
    elements.emptyTitle.textContent = noMatches ? "No se encontraron productos" : "Aún no hay productos";
    elements.emptyDescription.textContent = noMatches
      ? "Prueba con otro nombre o cambia el filtro de categoría."
      : "Agrega tu primer producto para comenzar a organizar el inventario.";
    elements.emptyState.querySelector("button").hidden = noMatches;
  }

  function makeActionButton(label, accessibleName, action, productId) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button";
    button.textContent = label;
    button.setAttribute("aria-label", accessibleName);
    button.dataset.action = action;
    button.dataset.id = productId;
    return button;
  }

  function renderMovements() {
    elements.movementList.replaceChildren();
    const movements = [...state.movements].reverse();
    elements.movementEmpty.hidden = movements.length > 0;
    movements.forEach(movement => {
      const item = document.createElement("div");
      item.className = "movement-item";
      const isEntry = movement.type === "entrada";
      const isInitial = movement.type === "inventario-inicial";
      const icon = addTextElement(item, "span", `movement-icon ${isEntry || isInitial ? "in" : "out"}`, isEntry || isInitial ? "↓" : "↑");
      icon.setAttribute("aria-hidden", "true");
      const details = document.createElement("div");
      details.className = "movement-details";
      addTextElement(details, "div", "movement-name", movement.productName);
      const date = new Date(movement.date);
      const movementLabel = isInitial ? "Inventario inicial" : isEntry ? "Entrada" : "Salida";
      addTextElement(details, "div", "movement-meta", `${movementLabel} · ${date.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}`);
      item.append(details);
      addTextElement(item, "span", `movement-amount ${isEntry || isInitial ? "in" : "out"}`, `${isEntry || isInitial ? "+" : "−"}${movement.quantity}`);
      elements.movementList.append(item);
    });
  }

  function render() {
    renderDashboard();
    renderCategoryFilter();
    renderInventory();
    renderMovements();
  }

  function showView(viewName, updateHistory) {
    const view = Object.prototype.hasOwnProperty.call(VIEW_TITLES, viewName) ? viewName : "inicio";
    document.querySelectorAll("[data-view]").forEach(section => {
      section.hidden = section.dataset.view !== view;
    });
    document.querySelectorAll("[data-view-link]").forEach(link => {
      const isActive = link.dataset.viewLink === view && link.classList.contains("nav-link");
      link.classList.toggle("active", isActive);
      if (link.classList.contains("nav-link")) {
        if (isActive) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
    });
    elements.pageTitle.textContent = VIEW_TITLES[view];
    elements.topbarProductAction.hidden = view !== "inventario";
    if (updateHistory && window.location.hash !== `#${view}`) {
      window.history.pushState({ view }, "", `#${view}`);
    }
  }

  function openProductDialog(product) {
    elements.productForm.reset();
    elements.productError.textContent = "";
    elements.productId.value = product ? product.id : "";
    elements.productDialogTitle.textContent = product ? "Editar producto" : "Nuevo producto";
    if (product) {
      if (![...elements.productCategory.options].some(option => option.value === product.category)) {
        elements.productCategory.add(new Option(product.category, product.category));
      }
      elements.productName.value = product.name;
      elements.productCategory.value = product.category;
      elements.productQuantity.value = String(product.quantity);
      elements.productMinimum.value = String(product.minimum);
      elements.productDescription.value = product.description;
    } else {
      elements.productQuantity.value = "0";
      elements.productMinimum.value = "0";
    }
    elements.productDialog.showModal();
    elements.productName.focus();
  }

  function parseIntegerField(input, allowZero) {
    const value = input.value.trim();
    if (!/^\d+$/.test(value)) return null;
    const number = Number(value);
    if (!Number.isSafeInteger(number) || (!allowZero && number === 0)) return null;
    return number;
  }

  function handleProductSubmit(event) {
    event.preventDefault();
    elements.productError.textContent = "";
    if (!elements.productForm.reportValidity()) return;
    const name = elements.productName.value.trim();
    const category = elements.productCategory.value;
    const quantity = parseIntegerField(elements.productQuantity, true);
    const minimum = parseIntegerField(elements.productMinimum, true);
    if (!name || !category || quantity === null || minimum === null) {
      elements.productError.textContent = "Completa los campos y usa cantidades enteras iguales o mayores que cero.";
      return;
    }

    const id = elements.productId.value;
    const existing = state.products.find(product => product.id === id);
    const product = {
      id: existing ? existing.id : createId(),
      name,
      category,
      quantity,
      minimum,
      description: elements.productDescription.value.trim()
    };
    const products = existing
      ? state.products.map(item => item.id === id ? product : item)
      : [...state.products, product];
    let movements = state.movements;
    if (!existing && quantity > 0) {
      movements = [...movements, {
        id: createId(),
        productId: product.id,
        productName: product.name,
        type: "inventario-inicial",
        quantity,
        date: new Date().toISOString()
      }];
    }
    if (!saveData(products, movements)) return;
    elements.productDialog.close();
    render();
    showToast(existing ? "Producto actualizado correctamente." : "Producto registrado correctamente.");
  }

  function handleInventoryAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const product = state.products.find(item => item.id === button.dataset.id);
    if (!product) {
      showToast("No se encontró el producto seleccionado.", true);
      return;
    }
    if (button.dataset.action === "edit") {
      openProductDialog(product);
    } else if (button.dataset.action === "movement") {
      openMovementDialog(product.id);
    } else if (button.dataset.action === "delete") {
      if (!window.confirm(`¿Eliminar "${product.name}" del inventario? El historial de movimientos se conservará.`)) return;
      const products = state.products.filter(item => item.id !== product.id);
      if (!saveData(products, state.movements)) return;
      render();
      showToast("Producto eliminado. Su historial de movimientos se conservó.");
    }
  }

  function openMovementDialog(productId) {
    elements.movementForm.reset();
    elements.movementError.textContent = "";
    elements.movementProduct.replaceChildren();
    state.products.forEach(product => elements.movementProduct.add(new Option(product.name, product.id)));
    if (productId) elements.movementProduct.value = productId;
    elements.movementDialog.showModal();
  }

  function handleMovementSubmit(event) {
    event.preventDefault();
    elements.movementError.textContent = "";
    if (!elements.movementForm.reportValidity()) return;
    const product = state.products.find(item => item.id === elements.movementProduct.value);
    const quantity = parseIntegerField(elements.movementQuantity, false);
    const type = elements.movementType.value;
    if (!product || quantity === null || (type !== "entrada" && type !== "salida")) {
      elements.movementError.textContent = "Selecciona un producto, un tipo de movimiento y una cantidad entera mayor que cero.";
      return;
    }
    if (type === "entrada" && !Number.isSafeInteger(product.quantity + quantity)) {
      elements.movementError.textContent = "La cantidad supera el máximo admitido.";
      return;
    }
    if (type === "salida" && quantity > product.quantity) {
      elements.movementError.textContent = `No hay unidades suficientes. Disponibles: ${product.quantity}.`;
      return;
    }

    const updatedProduct = {
      ...product,
      quantity: product.quantity + (type === "entrada" ? quantity : -quantity)
    };
    const movement = {
      id: createId(),
      productId: product.id,
      productName: product.name,
      type,
      quantity,
      date: new Date().toISOString()
    };
    const products = state.products.map(item => item.id === product.id ? updatedProduct : item);
    const movements = [...state.movements, movement];
    if (!saveData(products, movements)) return;
    elements.movementDialog.close();
    render();
    showToast(`Movimiento de ${type} registrado correctamente.`);
  }

  function handleDialogClose(event) {
    const button = event.target.closest("[data-close-dialog]");
    if (!button) return;
    const dialog = button.closest("dialog");
    if (dialog && dialog.open) dialog.close();
  }

  function initNavigation() {
    document.querySelectorAll("[data-view-link]").forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();
        const targetView = link.dataset.viewLink;
        showView(targetView, true);
        if (link.dataset.alertProduct) {
          const product = state.products.find(item => item.id === link.dataset.alertProduct);
          elements.categoryFilter.value = "";
          elements.searchInput.value = product ? product.name : "";
          renderInventory();
        }
      });
    });
    window.addEventListener("popstate", () => showView(window.location.hash.slice(1), false));
    window.addEventListener("hashchange", () => showView(window.location.hash.slice(1), false));
  }

  function init() {
    loadData();
    render();
    showView(window.location.hash.slice(1), false);
    document.querySelectorAll("[data-open-product]").forEach(button => {
      button.addEventListener("click", () => openProductDialog(null));
    });
    document.getElementById("open-movement").addEventListener("click", () => {
      if (state.products.length === 0) {
        showToast("Registra un producto antes de agregar movimientos.", true);
        return;
      }
      openMovementDialog(null);
    });
    document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", handleDialogClose));
    elements.productForm.addEventListener("submit", handleProductSubmit);
    elements.movementForm.addEventListener("submit", handleMovementSubmit);
    elements.inventoryBody.addEventListener("click", handleInventoryAction);
    elements.searchInput.addEventListener("input", renderInventory);
    elements.categoryFilter.addEventListener("change", renderInventory);
    initNavigation();
  }

  init();
}());
