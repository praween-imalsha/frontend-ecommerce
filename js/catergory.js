const API_URL = "http://localhost:8080/api/v1/category";
const token = localStorage.getItem("token");

// Redirect if token is missing
if (!token) {
    Swal.fire({
        title: "Session Expired",
        text: "Please log in again.",
        icon: "warning",
        confirmButtonText: "OK"
    }).then(() => {
        window.location.href = "index.html";
    });
}

// General function for API requests
async function apiRequest(url, method = "GET", data = null) {
    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    const options = {
        method,
        headers
    };

    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            localStorage.removeItem("token");
            Swal.fire("Session Expired", "Please log in again.", "error").then(() => {
                window.location.href = "login.html";
            });
        }
        return response.json();
    } catch (error) {
        console.error("API Request Error:", error);
        Swal.fire("Error", "An error occurred while processing your request.", "error");
    }
}

// Fetch and display categories
async function fetchCategories() {
    const response = await apiRequest(`${API_URL}/getAll`);
    const tableBody = $("#category-table-body");
    tableBody.empty();

    if (response.code === 200 && response.data.length > 0) {
        response.data.forEach((category) => {
            tableBody.append(`
                <tr>
                    <td>${category.id}</td>
                    <td class="category-name">${category.name}</td>
                    <td>
                        <button class="btn btn-warning btn-sm edit-category" data-id="${category.id}">Edit</button>
                        <button class="btn btn-danger btn-sm delete-category" data-id="${category.id}">Delete</button>
                    </td>
                </tr>
            `);
        });
    } else {
        tableBody.append(`<tr><td colspan="3" class="text-center">No categories found</td></tr>`);
    }
}

// Add category
$("#add-category-form").submit(async function (e) {
    e.preventDefault();
    const categoryName = $("#category-name").val().trim();
    if (!categoryName) return Swal.fire("Warning", "Category name cannot be empty.", "warning");

    await apiRequest(`${API_URL}/save`, "POST", { name: categoryName });
    Swal.fire("Success", "Category added successfully!", "success");
    $("#add-category-form")[0].reset();
    fetchCategories();
});

// Open edit modal
$(document).on("click", ".edit-category", async function () {
    const id = $(this).data("id");
    const response = await apiRequest(`${API_URL}/get/${id}`);

    if (response.code === 200) {
        $("#edit-category-id").val(response.data.id);
        $("#edit-category-name").val(response.data.name);
        $("#editCategoryModal").modal("show");
    }
});

// Update category
$("#edit-category-form").submit(async function (e) {
    e.preventDefault();
    const id = $("#edit-category-id").val();
    const name = $("#edit-category-name").val().trim();
    if (!name) return Swal.fire("Warning", "Category name cannot be empty.", "warning");

    await apiRequest(`${API_URL}/${id}`, "PUT", { name });
    Swal.fire("Success", "Category updated successfully!", "success");
    $("#editCategoryModal").modal("hide");
    fetchCategories();
});

// Delete category
$(document).on("click", ".delete-category", async function () {
    const id = $(this).data("id");
    if (await Swal.fire({ title: "Confirm Delete?", icon: "warning", showCancelButton: true })) {
        await apiRequest(`${API_URL}/${id}`, "DELETE");
        Swal.fire("Deleted!", "Category has been deleted.", "success");
        fetchCategories();
    }
});

// Search categories
$("#search-category").on("input", function () {
    const searchText = $(this).val().toLowerCase();
    $("#category-table-body tr").each(function () {
        $(this).toggle($(this).find(".category-name").text().toLowerCase().includes(searchText));
    });
});

// Load categories
fetchCategories();
