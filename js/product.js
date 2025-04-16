function checkSession() {
    const token = localStorage.getItem("token");
    if (!token) {
        Swal.fire({
            title: "Session Expired",
            text: "Please log in again.",
            icon: "warning",
            confirmButtonText: "OK"
        }).then(() => window.location.href = "index.html");
    }
}

$(document).ready(() => {
    checkSession();
    fetchProducts();
    loadCategories();

    $("#add-product-form").submit((e) => {
        e.preventDefault();
        addProduct();
    });
});

function fetchProducts() {
    $.ajax({
        url: "http://localhost:8080/api/v1/products",
        type: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        success: (res) => {
            const products = res.data || res.products || res;
            const tbody = $("#product-table-body").empty();

            products.forEach(p => {
                tbody.append(`
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.title}</td>
                        <td>${p.price}</td>
                        <td>${p.quantity}</td>
                        <td>${p.categoryName || 'N/A'}</td>
                        <td>${p.imageData ? `<img src="http://localhost:8080/api/v1/products/${p.id}/image" width="50">` : 'No Image'}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editProduct(${p.id})">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button>
                        </td>
                    </tr>
                `);
            });
        },
        error: () => Swal.fire("Error", "Failed to fetch products.", "error")
    });
}

function loadCategories() {
    $.ajax({
        url: "http://localhost:8080/api/v1/category/getAll",
        type: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        success: (res) => {
            const categories = res.data || res.categories || res;
            const addCat = $("#product-category").empty().append(`<option disabled selected>Select Category</option>`);
            const editCat = $("#edit-product-category").empty();
            categories.forEach(c => {
                const opt = `<option value="${c.id}">${c.name}</option>`;
                addCat.append(opt);
                editCat.append(opt);
            });
        },
        error: () => Swal.fire("Error", "Failed to load categories.", "error")
    });
}

function addProduct() {
    const formData = new FormData();
    formData.append('title', $("#product-title").val());
    formData.append('price', $("#product-price").val());
    formData.append('quantity', $("#product-quantity").val());
    formData.append('categoryId', $("#product-category").val());
    const image = $("#product-image")[0].files[0];
    if (image) formData.append('image', image);

    Swal.fire({ title: "Adding...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    $.ajax({
        url: "http://localhost:8080/api/v1/products/add",
        type: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        processData: false,
        contentType: false,
        data: formData,
        success: () => {
            Swal.fire("Success", "Product added.", "success").then(() => {
                $("#add-product-form")[0].reset();
                $("#addProductModal").modal("hide");
                fetchProducts();
            });
        },
        error: () => Swal.fire("Error", "Failed to add product.", "error")
    });
}

function editProduct(id) {
    $.ajax({
        url: `http://localhost:8080/api/v1/products/${id}`,
        type: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        success: (p) => {
            $("#edit-product-id").val(p.id);
            $("#edit-product-title").val(p.title);
            $("#edit-product-price").val(p.price);
            $("#edit-product-quantity").val(p.quantity);
            $("#edit-product-category").val(p.categoryId);
            $("#editProductModal").modal("show");
        },
        error: () => Swal.fire("Error", "Failed to load product.", "error")
    });
}

function updateProduct() {
    const formData = new FormData();
    formData.append('id', $("#edit-product-id").val());
    formData.append('title', $("#edit-product-title").val());
    formData.append('price', $("#edit-product-price").val());
    formData.append('quantity', $("#edit-product-quantity").val());
    formData.append('categoryId', $("#edit-product-category").val());
    const image = $("#edit-product-image")[0].files[0];
    if (image) formData.append('image', image);

    Swal.fire({ title: "Updating...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    $.ajax({
        url: "http://localhost:8080/api/v1/products/update",
        type: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        processData: false,
        contentType: false,
        data: formData,
        success: () => {
            Swal.fire("Updated", "Product updated successfully.", "success").then(() => {
                $("#edit-product-form")[0].reset();
                $("#editProductModal").modal("hide");
                fetchProducts();
            });
        },
        error: () => Swal.fire("Error", "Failed to update product.", "error")
    });
}

function deleteProduct(id) {
    Swal.fire({
        title: "Are you sure?",
        text: "You can't undo this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete"
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `http://localhost:8080/api/v1/products/${id}`,
                type: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                success: () => {
                    Swal.fire("Deleted", "Product has been deleted.", "success");
                    fetchProducts();
                },
                error: () => Swal.fire("Error", "Failed to delete product.", "error")
            });
        }
    });
}
