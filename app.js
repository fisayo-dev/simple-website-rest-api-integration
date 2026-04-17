// API Configuration
const API_BASE_URL = "http://localhost:4500";
let currentEditingId = null;

// DOM Elements
const productsList = document.getElementById("productsList");
const productModal = document.getElementById("productModal");
const productForm = document.getElementById("productForm");
const addProductBtn = document.getElementById("addProductBtn");
const emptyAddBtn = document.getElementById("emptyAddBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");
const modalTitle = document.getElementById("modalTitle");
const submitBtn = document.getElementById("submitBtn");

// Form Inputs
const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productDescription = document.getElementById("productDescription");
const productCategory = document.getElementById("productCategory");
const productColor = document.getElementById("productColor");
const productHeight = document.getElementById("productHeight");
const productWidth = document.getElementById("productWidth");

// Event Listeners
addProductBtn.addEventListener("click", openAddModal);
emptyAddBtn.addEventListener("click", openAddModal);
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
deleteAllBtn.addEventListener("click", deleteAllProducts);
productForm.addEventListener("submit", handleFormSubmit);

// Click outside modal to close
productModal.addEventListener("click", (e) => {
  if (
    e.target === productModal ||
    e.target === productModal.querySelector(".modal-overlay")
  ) {
    closeModal();
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});

/**
 * Fetch all products from the API
 */
async function fetchProducts() {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error("Failed to fetch products");

    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    showToast("Failed to load products", "error");
  } finally {
    showLoading(false);
  }
}

/**
 * Display products in the grid
 */
function displayProducts(products) {
  if (!products || products.length === 0) {
    productsList.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  productsList.innerHTML = products
    .map((product) => createProductCard(product))
    .join("");

  // Add event listeners to action buttons
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
  });
}

/**
 * Create a product card HTML
 */
function createProductCard(product) {
  const specs = [];
  if (product.color)
    specs.push(`<div><span>Color:</span> <span>${product.color}</span></div>`);
  if (product.height)
    specs.push(
      `<div><span>Height:</span> <span>${product.height} cm</span></div>`,
    );
  if (product.width)
    specs.push(
      `<div><span>Width:</span> <span>${product.width} cm</span></div>`,
    );

  return `
    <div class="product-card">
      <div class="product-header">
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
      </div>
      
      ${product.category ? `<span class="product-category">${escapeHtml(product.category)}</span>` : ""}
      
      ${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ""}
      
      ${specs.length > 0 ? `<div class="product-specs">${specs.join("")}</div>` : ""}
      
      <div class="product-actions">
        <button class="btn btn-edit" data-id="${product._id}">✏️ Edit</button>
        <button class="btn btn-delete" data-id="${product._id}">🗑️ Delete</button>
      </div>
    </div>
  `;
}

/**
 * Open modal for adding a new product
 */
function openAddModal() {
  currentEditingId = null;
  resetForm();
  modalTitle.textContent = "Add New Product";
  submitBtn.textContent = "Save Product";
  productModal.classList.remove("hidden");
  productName.focus();
}

/**
 * Open modal for editing a product
 */
async function openEditModal(productId) {
  currentEditingId = productId;

  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    if (!response.ok) throw new Error("Failed to fetch product");

    const product = await response.json();

    // Populate form with product data
    productName.value = product.name || "";
    productPrice.value = product.price || "";
    productDescription.value = product.description || "";
    productCategory.value = product.category || "";
    productColor.value = product.color || "";
    productHeight.value = product.height || "";
    productWidth.value = product.width || "";

    modalTitle.textContent = "Edit Product";
    submitBtn.textContent = "Update Product";
    productModal.classList.remove("hidden");
    productName.focus();
  } catch (error) {
    console.error("Error fetching product:", error);
    showToast("Failed to load product details", "error");
  }
}

/**
 * Close the modal
 */
function closeModal() {
  productModal.classList.add("hidden");
  resetForm();
  currentEditingId = null;
}

/**
 * Reset the form to initial state
 */
function resetForm() {
  productForm.reset();
  productName.value = "";
  productPrice.value = "";
  productDescription.value = "";
  productCategory.value = "";
  productColor.value = "";
  productHeight.value = "";
  productWidth.value = "";
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // Validate required fields
  if (!productName.value.trim() || !productPrice.value) {
    showToast("Please fill in all required fields", "warning");
    return;
  }

  const productData = {
    name: productName.value.trim(),
    price: parseFloat(productPrice.value),
    description: productDescription.value.trim() || undefined,
    category: productCategory.value.trim() || undefined,
    color: productColor.value.trim() || undefined,
    height: productHeight.value ? parseFloat(productHeight.value) : undefined,
    width: productWidth.value ? parseFloat(productWidth.value) : undefined,
  };

  // Remove undefined values
  Object.keys(productData).forEach(
    (key) => productData[key] === undefined && delete productData[key],
  );

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    let response;
    if (currentEditingId) {
      // Update existing product
      response = await fetch(`${API_BASE_URL}/products/${currentEditingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
    } else {
      // Create new product
      response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save product");
    }

    showToast(
      currentEditingId ?
        "Product updated successfully!"
      : "Product created successfully!",
      "success",
    );

    closeModal();
    await fetchProducts();
  } catch (error) {
    console.error("Error saving product:", error);
    showToast(error.message || "Failed to save product", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent =
      currentEditingId ? "Update Product" : "Save Product";
  }
}

/**
 * Delete a single product
 */
async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete product");

    showToast("Product deleted successfully!", "success");
    await fetchProducts();
  } catch (error) {
    console.error("Error deleting product:", error);
    showToast("Failed to delete product", "error");
  }
}

/**
 * Delete all products
 */
async function deleteAllProducts() {
  if (
    !confirm(
      "Are you sure you want to delete ALL products? This action cannot be undone.",
    )
  ) {
    return;
  }

  try {
    deleteAllBtn.disabled = true;
    deleteAllBtn.textContent = "Deleting...";

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete all products");

    showToast("All products deleted successfully!", "success");
    await fetchProducts();
  } catch (error) {
    console.error("Error deleting all products:", error);
    showToast("Failed to delete all products", "error");
  } finally {
    deleteAllBtn.disabled = false;
    deleteAllBtn.textContent = "🗑️ Clear All";
  }
}

/**
 * Show or hide loading spinner
 */
function showLoading(show) {
  loadingSpinner.classList.toggle("hidden", !show);
}

/**
 * Show a toast notification
 */
function showToast(message, type = "info") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
