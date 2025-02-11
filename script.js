$(document).ready(function () {
  const TAG_DATA = {
    "📌 General": {
      tags: [
        "work",
        "personal",
        "shopping",
        "finance",
        "health",
        "education",
        "travel",
      ],
      color: "primary",
    },
    "🕒 Time-Sensitive": {
      tags: ["urgent", "today", "thisweek", "deadline", "later"],
      color: "danger",
    },
    "🎯 Productivity": {
      tags: ["priority", "inprogress", "completed", "pending", "habit"],
      color: "success",
    },
    "🏋️‍♂️ Health & Fitness": {
      tags: ["workout", "meditation", "diet", "hydration", "sleep", "calories"],
      color: "warning",
    },
    "🎉 Fun & Leisure": {
      tags: ["movies", "music", "books", "hobby", "games", "party", "event"],
      color: "info",
    },
  };
  const STORAGE_KEY = "tasks";
  let selectedFilterTags = [];
  $("#startDate").attr("min", new Date().toISOString().split("T")[0]);
  $("#endDate").prop("disabled", true);
  let lastShownDate = localStorage.getItem("toastShownDate");
  let today = new Date().toDateString();

  function getStoredTasks() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function generateRandomAlphabeticId(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  $(".offcanvas").on("show.bs.offcanvas hidden.bs.offcanvas", function (e) {
    let method = e.type === "show" ? "fadeOut" : "fadeIn";
    $("#toggleTagsBtn, #toggleFilterBtn")[method](e.type === "show" ? 0 : 200);
  });

  $.each(Object.entries(TAG_DATA), function (index, [category, data]) {
    let section = $("<div>").append(
      $("<h6>").addClass("fw-bold mb-3 mt-0").text(category)
    );
    let tagWrapper = $("<div>").addClass("d-flex flex-wrap gap-2");

    $.each(data.tags, function (_, tag) {
      let badge = $("<span style='cursor: pointer;'>")
        .addClass(`badge rounded-pill text-bg-light tag-filter border border-2`)
        .attr("data-tag", tag)
        .text(`#${tag}`);
      tagWrapper.append(badge);
    });

    section.append(tagWrapper);

    if (index !== Object.keys(TAG_DATA).length - 1) {
      section.append($("<hr>").addClass("my-3 border-2 border-success"));
    }

    $("#tagsContainer").append(section);
  });

  $(".tag-filter").on("click", function () {
    let tag = $(this).data("tag");

    if (selectedFilterTags.includes(tag)) {
      selectedFilterTags = selectedFilterTags.filter((t) => t !== tag);
      $(this).removeClass("bg-success text-light");
    } else {
      selectedFilterTags.push(tag);
      $(this).addClass("bg-success text-light");
    }

    filterTasksByTags();
  });

  function extractDateFromText(text) {
    let match = text.match(/Due on (.+)/);
    return match ? new Date(match[1].trim()) : null;
  }

  $("#startDate").on("change", function () {
    let startDate = $(this).val();
    let endDateInput = $("#endDate");

    if (startDate) {
      endDateInput.prop("disabled", false);

      endDateInput.attr("min", startDate);

      let endDate = new Date(endDateInput.val());
      let startDateObj = new Date(startDate);
      if (endDate < startDateObj) {
        endDateInput.val(startDate);
      }

      $("#endDateError").addClass("d-none");
      endDateInput.removeClass("is-invalid");
    } else {
      endDateInput.prop("disabled", true).val("");
    }
  });

  function filterTasksByDate() {
    let startDate = $("#startDate").val();
    let endDate = $("#endDate").val();
    let noTasksMessage = $("#noTasksMessage");
    let tasksVisible = false;

    $("#startDateError").addClass("d-none");
    $("#endDateError").addClass("d-none");

    $("#startDate").removeClass("is-invalid");
    $("#endDate").removeClass("is-invalid");

    if (startDate && new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
      $("#startDate").addClass("is-invalid");
      $("#startDateError").removeClass("d-none");
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      $("#endDate").addClass("is-invalid");
      $("#endDateError").removeClass("d-none");
    }

    noTasksMessage.addClass("d-none");

    $(".task-item").each(function () {
      let task = $(this);
      let taskDateText = task.find(".task-date").text().trim();
      let taskDateObj = extractDateFromText(taskDateText);
      let show = true;

      if (startDate && endDate && taskDateObj) {
        let start = new Date(startDate);
        let end = new Date(endDate);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (start.getTime() === end.getTime()) {
          show = taskDateObj.toDateString() === start.toDateString();
        } else {
          show = taskDateObj >= start && taskDateObj <= end;
        }
      }

      task.toggle(show);

      if (show) {
        tasksVisible = true;
      }
    });

    if (!tasksVisible) {
      if ($("#taskContainer .no-tasks-message").length === 0) {
        $("#taskContainer").append(`
        <div class="col-12 d-flex flex-column justify-content-center align-items-center no-tasks-message">
            <h4 class="text-muted text-center mb-1">No tasks between these dates.</h4>
            <p class="text-muted text-center mb-0">Clear your filters to see all tasks.</p>
        </div>`);
      }
    } else {
      $("#taskContainer .no-tasks-message").remove();
    }
  }

  $("#startDate, #endDate").on("change", function () {
    filterTasksByDate();
  });

  function filterTasksByStatus() {
    let selectedButton = $(".filter-status.active");
    let selectedStatus = $(".filter-status.active").data("status");

    if (selectedButton.length === 0) {
      $(".task-item").show();
      $("#taskContainer .no-tasks-message").remove();
    } else {
      let tasksVisible = false;

      $(".task-item").each(function () {
        let task = $(this);
        let taskStatus = task.data("status");
        let showSelected = selectedStatus
          ? taskStatus === selectedStatus
          : true;

        task.toggle(showSelected);

        if (showSelected) {
          tasksVisible = true;
        }
      });

      if (!tasksVisible) {
        if ($("#taskContainer .no-tasks-message").length === 0) {
          $("#taskContainer").append(`
          <div class="col-12 d-flex flex-column justify-content-center align-items-center no-tasks-message">
            <h4 class="text-muted text-center mb-1">No tasks with status "${selectedStatus}".</h4>
            <p class="text-muted text-center mb-0">Clear your filters to see all tasks.</p>
          </div>`);
        }
      } else {
        $("#taskContainer .no-tasks-message").remove();
      }
    }
  }

  $(".filter-status").on("click", function () {
    let isActive = $(this).hasClass("active");
    $(".filter-status").removeClass("active text-light bg-success fw-medium");
    if (!isActive) $(this).addClass("active text-light bg-success fw-medium");
    filterTasksByStatus();
  });

  let availableTags = Object.values(TAG_DATA).flatMap((data) => data.tags);
  let selectedTags = [];

  $("#tagInput").on("input", function () {
    let inputVal = $(this).val().toLowerCase();
    let suggestions = availableTags.filter(
      (tag) => tag.includes(inputVal) && !selectedTags.includes(tag)
    );

    let suggestionList = $("#tagSuggestions").empty().show();

    if (inputVal && suggestions.length) {
      suggestions.forEach((tag) => {
        $("<div>")
          .addClass("list-group-item list-group-item-action tag-suggestion")
          .text(tag)
          .on("click", function () {
            addTag(tag);
            $("#tagInput").val("");
            suggestionList.empty().hide();
          })
          .appendTo(suggestionList);
      });
    } else {
      suggestionList.hide();
    }
  });

  $(document).on("click", function (e) {
    if (!$(e.target).closest("#tagInput, #tagSuggestions").length) {
      $("#tagSuggestions").hide();
    }
  });

  function addTag(tag) {
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
      renderTags();
      validateTags();
    }
  }

  $("#taskTitle").on("input", function () {
    this.setCustomValidity(
      this.value.length >= 3 && this.value.length <= 50
        ? ""
        : "Title must be between 3 and 50 characters long."
    );
  });

  $("#taskDescription").on("input", function () {
    validateDescription();
  });

  function validateDescription() {
    let desc = $("#taskDescription");
    let isValid =
      desc.val().trim().length >= 10 && desc.val().trim().length <= 1000;
    desc[0].setCustomValidity(
      isValid ? "" : "Description must be between 10 and 1000 characters long."
    );
  }

  // validate due date
  $("#taskDueDate").on("input", function () {
    let today = new Date().toISOString().split("T")[0];
    this.setCustomValidity(
      this.value >= today ? "" : "Please select a valid due date."
    );
  });

  // validate tags
  function validateTags() {
    let isValid = selectedTags.length > 0;
    let tagInput = $("#tagInput");
    tagInput[0].setCustomValidity(
      isValid ? "" : "At least one tag is required."
    );
    tagInput.toggleClass("is-invalid", !isValid);
  }

  // save or update task
  $("#saveTaskBtn").on("click", function (event) {
    event.preventDefault();

    validateTags();
    validateDescription();

    if (!$("#taskForm")[0].checkValidity()) {
      $("#taskForm").addClass("was-validated");
      return;
    }

    let taskId = $("#editTaskId").val();
    let tasks = getStoredTasks();

    if (taskId) {
      let taskIndex = tasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return;

      tasks[taskIndex] = {
        id: taskId,
        title: $("#taskTitle").val(),
        description: $("#taskDescription").val(),
        dueDate: $("#taskDueDate").val(),
        status: $("#taskStatus").val(),
        tags: selectedTags,
      };
    } else {
      tasks.push({
        id: generateRandomAlphabeticId(),
        title: $("#taskTitle").val(),
        description: $("#taskDescription").val(),
        dueDate: $("#taskDueDate").val(),
        status: $("#taskStatus").val(),
        tags: selectedTags,
      });
    }

    saveTasks(tasks);
    $("#taskModal").modal("hide");
    renderTasks();
  });

  function getStatusClass(status) {
    switch (status) {
      case "active":
        return "bg-success";
      case "pending":
        return "bg-warning text-dark";
      case "completed":
        return "bg-primary";
      case "cancelled":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  }

  function renderTasks() {
    let container = $("#taskContainer").empty();
    let tasks = getStoredTasks();

    if (tasks.length === 0) {
      container.append(
        `<div class="col-12 d-flex flex-column justify-content-center align-items-center">
            <h4 class="text-title-muted text-center mb-1">Wow, you're all caught up!</h4>
            <p class="text-msg-muted text-center mb-0">Tap 'Create Task' to create new.</p>
            </div>`
      );
      return;
    }

    tasks.forEach((task, index) => {
      let dueDate = new Date(task.dueDate);
      if (task.status !== "cancelled") {
        let card = $(`
          <div class="col-lg-4 col-md-6 col-12 mb-3 task-item" data-tags="${task.tags.join(
            ","
          )}" data-status="${task.status}">
                    <div class="card shadow-sm position-relative">
                    <span class="badge ${getStatusClass(
                      task.status
                    )} position-absolute top-0 end-0 m-2 py-1">${
          task.status
        }</span>
                        <div class="card-body">
                            <h5 class="card-title text-truncate w-75 h-auto" data-bs-placement="left" data-bs-toggle="tooltip" data-bs-title="${
                              task.title
                            }">${task.title}</h5>
                            <p class="card-text">${task.description}</p>
                            <small class="task-date text-muted d-block">Due on ${dueDate.toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}</small>
                            <div class="mt-2">
                                ${task.tags
                                  .map(
                                    (tag) =>
                                      `<span class="badge bg-light text-dark border border-2 me-1">#${tag}</span>`
                                  )
                                  .join("")}
                            </div>
                            <div class="mt-2 d-flex justify-content-end gap-2">
                                <button class="btn btn-sm btn-light border border-2 edit-task-btn" data-id="${
                                  task.id
                                }" data-bs-toggle="modal" data-bs-target="#editTaskModal"><i class="bi bi-pencil-fill fw-bold text-success fs-6"></i></button>
                                <button class="btn btn-sm btn-light border border-2 delete-task-btn" data-id="${
                                  task.id
                                }"><i class="bi bi-trash-fill fw-bold text-success fs-6"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        container.append(card);
      }
    });

    $(".edit-task-btn").on("click", function () {
      let taskId = $(this).data("id");
      console.log(taskId);
      openTaskModal(taskId);
    });

    $(".delete-task-btn").on("click", function () {
      let taskId = $(this).data("id");
      confirmDeleteTask(taskId);
    });
  }

  function filterTasksByTags() {
    let tasksVisible = false;

    $(".task-item").each(function () {
      let taskTags = $(this).data("tags").split(",");

      if (selectedFilterTags.length === 0) {
        $(this).show();
      } else {
        let hasAllTags = selectedFilterTags.every((tag) =>
          taskTags.includes(tag)
        );

        $(this).toggle(hasAllTags);

        if (hasAllTags) {
          tasksVisible = true;
        }
      }
    });

    if (!tasksVisible && selectedFilterTags.length > 0) {
      if ($("#taskContainer .no-tasks-message").length === 0) {
        $("#taskContainer").append(`
        <div class="col-12 d-flex flex-column justify-content-center align-items-center no-tasks-message">
          <h4 class="text-muted text-center mb-1">No tasks found for the selected tags.</h4>
          <p class="text-muted text-center mb-0">Clear your filters to see all tasks.</p>
        </div>`);
      }
    } else {
      $("#taskContainer .no-tasks-message").remove();
    }
  }

  function searchTasks() {
    let query = $("#searchTasks").val().toLowerCase();
    let tasksVisible = false;

    if (query.length === 0) {
      $(".task-item").show();
      $("#taskContainer .no-tasks-message").remove();
      return;
    }

    $(".task-item").each(function () {
      let title = $(this).find(".card-title").text().toLowerCase();
      let description = $(this).find(".card-text").text().toLowerCase();
      let status = $(this).find(".badge").text().toLowerCase();
      let dueDate = $(this).find(".text-muted").text().toLowerCase();
      let tags = $(this).data("tags").toLowerCase();

      let match =
        title.includes(query) ||
        description.includes(query) ||
        status.includes(query) ||
        dueDate.includes(query) ||
        tags.includes(query);

      $(this).toggle(match);

      if (match) {
        tasksVisible = true;
      }
    });

    if (!tasksVisible && query.length > 0) {
      if ($("#taskContainer .no-tasks-message").length === 0) {
        $("#taskContainer").append(`
        <div class="col-12 d-flex flex-column justify-content-center align-items-center no-tasks-message">
          <h4 class="text-muted text-center mb-1">No tasks found for your search.</h4>
          <p class="text-muted text-center mb-0">Please adjust your search query.</p>
        </div>`);
      }
    } else {
      $("#taskContainer .no-tasks-message").remove();
    }
  }

  $("#searchTasks").on("input", searchTasks);

  renderTasks();

  function clearFilters() {
    $("#startDate, #endDate").val("");
    $(".filter-status").removeClass("active text-light bg-success fw-medium");
    $("#startDate, #endDate").removeClass("is-invalid");
    $("#dateErrorMessage").addClass("d-none");
    $(".task-item").show();
  }

  $("#clearFilters").on("click", clearFilters);

  function openTaskModal(taskId = null) {
    $("#taskForm")[0].reset();
    $("#taskForm").removeClass("was-validated");
    $("#selectedTags").empty();
    selectedTags = [];

    if (taskId) {
      let tasks = getStoredTasks();
      let task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      $("#editTaskId").val(taskId);
      $("#taskTitle").val(task.title);
      $("#taskDescription").val(task.description);
      $("#taskDueDate").val(task.dueDate);
      $("#taskStatus").val(task.status);
      selectedTags = [...task.tags];
      $("#taskModalLabel").text("Edit Task");
    } else {
      $("#editTaskId").val("");
      $("#taskModalLabel").text("Create a New Task");
    }

    renderTags();
    $("#taskModal").modal("show");
  }

  function renderTags() {
    let container = $("#selectedTags").empty();
    selectedTags.forEach((tag) => {
      let badge = $(
        `<span data-bs-toggle='tooltip' data-bs-title='click to remove this tag' data-bs-placement='top' style='cursor: pointer;'>`
      )
        .addClass(
          "badge rounded-pill text-bg-success tag-filter border border-2"
        )
        .text(`#${tag}`);

      badge.on("click", function () {
        selectedTags = selectedTags.filter((t) => t !== tag);
        renderTags();
      });

      container.append(badge);
    });
  }

  function confirmDeleteTask(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
      let tasks = getStoredTasks();
      tasks = tasks.filter((task) => task.id !== taskId);
      saveTasks(tasks);
      renderTasks();
    }
  }

  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      document.getElementById("searchTasks").focus();
    }
  });

  function showDueTasksToast() {
    let today = new Date();
    let threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    let tasksDueSoon = [];

    $(".task-item").each(function () {
      let taskTitle = $(this).find(".card-title").text().trim();
      let taskDateText = $(this).find(".task-date").text().trim();
      let taskDateObj = extractDateFromText(taskDateText);

      if (taskDateObj) {
        taskDateObj.setHours(0, 0, 0, 0);

        if (taskDateObj > today && taskDateObj <= threeDaysLater) {
          tasksDueSoon.push(taskTitle);
        }
      }
    });

    if (tasksDueSoon.length > 0) {
      let toastHtml = `
      <div class="toast align-items-center text-bg-light border-2 position-fixed bottom-0 start-0 p-1 rounded-3 shadow" role="alert" aria-live="assertive" aria-atomic="true" style="z-index: 9999; margin-left: 10px; margin-bottom: 10px;">
      <div class="toast-header">
            <i class="bi bi-bell-fill me-1"></i><strong class="me-auto fs-6">Reminder</strong>
            <small>Due in 3 days</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          <strong><i class="bi bi-arrow-right me-1"></i> Tasks due in 3 days:<br></strong>
          <ul class="mb-0">
              ${tasksDueSoon.map((task) => `<li>${task}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;

      $("body").append(toastHtml);

      let toastElement = $(".toast");
      let toast = new bootstrap.Toast(toastElement[0], {
        autohide: false,
        animation: true,
        delay: 50000,
      });
      toast.show();

      localStorage.setItem("toastShownDate", today.toDateString());
    }
  }

  if (lastShownDate !== today) {
    showDueTasksToast();
    lastShownDate = today;
  }

  window.openTaskModal = openTaskModal;
});
