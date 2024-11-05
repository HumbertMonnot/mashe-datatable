import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = [
    "header",
    "arrow",
    "rows",
    "tag",
    "searchInput",
    "paginationControls",
    "paginationPages",
    "perPageSelect",
    "bulkActionButton",
    "rowsSelectedCount",
    "modal"
  ];

  connect() {
    this.perPage = this.hasPerPageSelectTarget ? parseInt(this.perPageSelectTarget.value) : 1000;

    this.sortColumn = null;
    this.sortDirection = 'asc'; // 'asc' ou 'desc'
    this.activeTags = []; // Liste des tags actifs
    this.searchQuery = ''; // Chaîne de recherche
    this.searchTimeout = null; // Timeout pour le délai de recherche

    // Pagination
    this.currentPage = 1;
    this.perPage = parseInt(this.hasPerPageSelectTarget ? this.perPageSelectTarget.value : 1000);
    this.totalRows = 0;
    this.totalPages = 1;

    // Initialiser les styles des lignes et la pagination
    this.updateRowStyles();
    this.updatePagination();
    this.showPage();

    this.initializeGridColumns();

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  disconnect() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    const width = window.innerWidth;
    this.element.dataset.viewportSize =
      width <= 480 ? 'mobile' :
      width <= 768 ? 'tablet' :
      'desktop';

    this.initializeGridColumns();
  }

  initializeGridColumns() {
    const header = this.element.querySelector('.grid-header');
    if (!header) return;

    const columns = Array.from(header.children);
    const templateColumns = columns
      .map(col => col.style.width || '1fr')
      .join(' ');

    this.element.style.setProperty('--grid-template-columns', templateColumns);
  }

  // Méthode de tri
  sort(event) {
    console.log("sort");
    const header = event.currentTarget;
    const columnKey = header.dataset.columnKey;
    const columnType = header.dataset.columnType;

    // Déterminer la direction du tri
    if (this.sortColumn === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortDirection = 'asc';
    }

    this.sortColumn = columnKey;

    // Mettre à jour l'affichage des flèches
    this.updateArrows();

    const container = this.element.querySelector(".data-table");
    if (!container) return;

    const rows = Array.from(container.querySelectorAll(".row.g-0.data-row"));
    const sortedRows = rows.sort((a, b) => {
      const aCell = a.querySelector(`[data-key='${columnKey}']`);
      const bCell = b.querySelector(`[data-key='${columnKey}']`);

      const aValue = aCell ? aCell.dataset.value : '';
      const bValue = bCell ? bCell.dataset.value : '';

      let comparison = 0;

      if (columnType === 'date') {
        comparison = new Date(aValue) - new Date(bValue);
      } else if (columnType === 'number') {
        comparison = parseFloat(aValue) - parseFloat(bValue);
      } else {
        comparison = aValue.localeCompare(bValue, 'fr', { sensitivity: 'base' });
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    // Réinsérer les lignes triées
    sortedRows.forEach(row => {
      container.appendChild(row);
    });

    this.updateRowStyles();
    this.showPage();
  }

  // Méthode de recherche
  search(event) {
    const query = event.target.value.toLowerCase();
    clearTimeout(this.searchTimeout);

    // Afficher ou masquer la croix selon le contenu
    const clearSearchIcon = this.element.querySelector('.clear-search');
    if (clearSearchIcon) {
      clearSearchIcon.style.display = query ? 'inline' : 'none';
    }

    this.searchTimeout = setTimeout(() => {
      this.searchQuery = query;
      this.filterRows();
    }, 400);
  }

  // Méthode pour effacer la recherche
  clearSearch() {
    this.searchInputTarget.value = '';
    this.searchQuery = '';
    this.filterRows();
    // Masquer la croix
    const clearSearchIcon = this.element.querySelector('.clear-search');
    clearSearchIcon.style.display = 'none';
  }

  // Méthode pour basculer l'état d'un tag
  toggleTag(event) {
    const button = event.currentTarget;
    const tag = button.dataset.tag;

    console.log('Toggle tag:', tag);
    console.log('Before:', this.activeTags);

    if (this.activeTags.includes(tag)) {
      this.activeTags = this.activeTags.filter(t => t !== tag);
      button.classList.remove('active');
    } else {
      this.activeTags.push(tag);
      button.classList.add('active');
    }

    console.log('After:', this.activeTags);
    this.filterRows();
  }

  // Méthode pour filtrer les lignes
  filterRows() {
    const rows = this.element.querySelectorAll(".data-row");
    let visibleRowCount = 0;

    rows.forEach(row => {
      let shouldShow = true;

      // Filtrage par tags
      if (this.activeTags.length > 0) {
        const rowTags = (row.dataset.tags || '').split(',').filter(tag => tag.length > 0);
        shouldShow = this.activeTags.every(tag => rowTags.includes(tag));
      }

      // Filtrage par recherche
      if (shouldShow && this.searchQuery) {
        const cells = row.querySelectorAll(".cell");
        const rowText = Array.from(cells)
          .map(cell => cell.textContent?.trim().toLowerCase() || '')
          .join(' ');
        shouldShow = rowText.includes(this.searchQuery.toLowerCase());
      }

      // Debug plus détaillé
      console.log({
        row: row,
        rowTags: row.dataset.tags?.split(',') || [],
        activeTags: this.activeTags,
        searchQuery: this.searchQuery,
        shouldShow: shouldShow,
        hasTagMatch: this.activeTags.length === 0 || this.activeTags.every(tag => (row.dataset.tags || '').split(',').includes(tag)),
        hasSearchMatch: !this.searchQuery || row.textContent.toLowerCase().includes(this.searchQuery.toLowerCase())
      });

      if (shouldShow) {
        row.classList.remove('filtered-out');
        visibleRowCount++;
      } else {
        row.classList.add('filtered-out');
      }
    });

    // Afficher ou masquer le message "Aucun résultat"
    const noResults = this.element.querySelector("#no-results");
    if (noResults) {
      noResults.style.display = visibleRowCount === 0 ? '' : 'none';
    }

    this.currentPage = 1;
    this.updatePagination();
    this.showPage();
  }

  // Méthode pour mettre à jour les styles des lignes
  updateRowStyles() {
    const rows = Array.from(this.element.querySelectorAll(".data-row"));
    let visibleIndex = 0;

    rows.forEach(row => {
      if (!row.classList.contains('filtered-out') && row.style.display !== 'none') {
        row.classList.remove('even', 'odd');
        row.classList.add(visibleIndex % 2 === 0 ? 'even' : 'odd');
        visibleIndex++;
      }
    });
  }

  // Méthodes de pagination
  changePerPage(event) {
    this.perPage = parseInt(event.target.value);
    this.currentPage = 1;
    this.showPage();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.showPage();
    }
  }

  goToPage(event) {
    const page = parseInt(event.currentTarget.dataset.page);
    if (page !== this.currentPage) {
      this.currentPage = page;
      this.showPage();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.showPage();
    }
  }

  showPage() {
    console.log("showPage");
    console.log(this.perPage);
    const rows = Array.from(this.element.querySelectorAll(".data-row"));
    const visibleRows = rows.filter(
      (row) => !row.classList.contains("filtered-out")
    );
    this.totalRows = visibleRows.length;
    this.totalPages = Math.ceil(this.totalRows / this.perPage) || 1;

    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;

    visibleRows.forEach((row, index) => {
      if (index >= start && index < end) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });

    this.updatePaginationControls();
    this.updateRowStyles();
  }

  updatePagination() {
    const rows = Array.from(this.element.querySelectorAll(".data-row"));
    const visibleRows = rows.filter(
      (row) => !row.classList.contains("filtered-out")
    );
    this.totalRows = visibleRows.length;
    this.totalPages = Math.ceil(this.totalRows / this.perPage) || 1;

    // Générer les numéros de page
    this.generatePageNumbers();
  }

  generatePageNumbers() {
    if (!this.hasPaginationPagesTarget) return;

    this.paginationPagesTarget.innerHTML = "";

    // Limiter le nombre de pages affichées
    const maxPagesToShow = 5;
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxPagesToShow / 2)
    );
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement("button");
      pageButton.textContent = i;
      pageButton.classList.add("pagination-page");
      if (i === this.currentPage) {
        pageButton.classList.add("active");
      }
      pageButton.dataset.page = i;
      pageButton.addEventListener("click", this.goToPage.bind(this));
      this.paginationPagesTarget.appendChild(pageButton);
    }
  }

  updatePaginationControls() {
    // Activer/désactiver les boutons
    if (this.hasPaginationControlsTarget) {
      const prevButton = this.paginationControlsTarget.querySelector(
        '.pagination-button[data-action="click->datatable#prevPage"]'
      );
      const nextButton = this.paginationControlsTarget.querySelector(
        '.pagination-button[data-action="click->datatable#nextPage"]'
      );

      prevButton.disabled = this.currentPage === 1;
      nextButton.disabled = this.currentPage === this.totalPages;
    }

    // Mettre à jour les numéros de page
    this.generatePageNumbers();
  }

  // Méthode pour mettre à jour les flèches de tri
  updateArrows() {
    // Réinitialiser toutes les flèches
    this.headerTargets.forEach(header => {
      const arrow = header.querySelector('.sort-arrow');
      if (arrow) {
        arrow.classList.remove('active', 'asc', 'desc');
      }
    });

    // Mettre à jour la flèche de la colonne triée
    const activeHeader = this.headerTargets.find(header => header.dataset.columnKey === this.sortColumn);
    if (activeHeader) {
      const arrow = activeHeader.querySelector('.sort-arrow');
      if (arrow) {
        arrow.classList.add('active', this.sortDirection);
      }
    }
  }

  toggleSelectAll(event) {
    const checked = event.target.checked;
    const visibleRows = this.element.querySelectorAll(".grid-row:not(.grid-header):not(.filtered-out)");
    const checkboxes = Array.from(visibleRows).map((row) =>
      row.querySelector(".row-checkbox")
    );

    checkboxes.forEach((checkbox) => {
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = checked;
      }
    });

    this.updateBulkActionButtons();
    this.toggleRowSelection();
  }

  toggleRowSelection() {
    const visibleCheckboxes = this.element.querySelectorAll(
      ".data-row:not(.filtered-out) .row-checkbox"
    );
    const checkedVisibleCheckboxes = this.element.querySelectorAll(
      ".data-row:not(.filtered-out) .row-checkbox:checked"
    );
    const selectAllCheckbox = this.element.querySelector("#select-all");

    // Ne mettre à jour le checkbox "select-all" que s'il existe
    if (selectAllCheckbox) {
      if (visibleCheckboxes.length === checkedVisibleCheckboxes.length && visibleCheckboxes.length > 0) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else if (checkedVisibleCheckboxes.length > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      }
    }

    const checkedCheckboxes = this.element.querySelectorAll(
      ".row-checkbox:checked"
    );

    if (this.hasRowsSelectedCountTarget && checkedCheckboxes.length > 0) {
      this.rowsSelectedCountTarget.textContent = `${checkedCheckboxes.length} sélectionné(s)`;
    } else if (this.hasRowsSelectedCountTarget) {
      this.rowsSelectedCountTarget.textContent = '';
    }

    this.updateBulkActionButtons();
  }


  updateBulkActionButtons() {
    const checkedCheckboxes = this.element.querySelectorAll(
      ".grid-row:not(.grid-header):not(.filtered-out) .row-checkbox:checked"
    );

    if (this.hasBulkActionButtonTarget) {
      this.bulkActionButtonTargets.forEach((button) => {
        button.disabled = checkedCheckboxes.length === 0;
      });
    }
  }



  performBulkAction(event) {
    const actionType = event.target.dataset.actionType;
    const target = event.target.dataset.target;
    const modalId = event.target.dataset.modalId;
    const method = event.target.dataset.method || "post";
    const checkedCheckboxes = this.element.querySelectorAll(
      ".grid-row:not(.grid-header):not(.filtered-out) .row-checkbox:checked"
    );
    const ids = Array.from(checkedCheckboxes).map((checkbox) => checkbox.value);

    if (ids.length === 0) {
      return;
    }

    if (actionType === "modal") {
      // Ouvrir la modal et passer les IDs
      const modal = document.getElementById(modalId);
      if (modal) {
        // Vous pouvez utiliser un événement personnalisé ou une bibliothèque de modal
        // Par exemple, en utilisant Bootstrap Modal :
        const idsInput = modal.querySelector('input[name="ids_list"]');
        if (idsInput) {
          idsInput.value = ids.join(",");
        }
        $(modal).modal("show");
      }
    } else if (actionType === "method") {
      // Appeler la méthode avec les IDs
      fetch(target, {
        method: method.toUpperCase(),
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content"),
        },
        body: JSON.stringify({ ids_list: ids }),
      })
        .then((response) => response.json())
        .then((data) => {
          // Traiter la réponse
          console.log(data);
          // Rafraîchir le tableau ou afficher un message de succès
        })
        .catch((error) => {
          console.error("Erreur:", error);
          // Afficher un message d'erreur
        });
    }
  }

  openModal(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const url = target.dataset.url;
    // Fetch the content from the URL
    fetch(url, {
      headers: {
      // 'Accept': "text/vnd.turbo-stream.html"
      'Accept': "text/html"
      },
    })
    .then(response => response.text())
    .then(html => {
      // Trouve l'élément de la modal
      const modalElement = document.getElementById('modal');
      if (modalElement) {
        // Insère le HTML dans la zone de contenu de la modal
        const modalContent = modalElement.querySelector('[data-modal-target="content"]');
        modalContent.innerHTML = html;
        // Affiche la modal (en utilisant Bootstrap)
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        }
      })
      .catch(error => {
        console.error('Erreur lors du chargement du contenu de la modal :', error);
      });
  }

  toggleDropdown(event) {
    event.preventDefault();
    event.stopPropagation();

    const currentButton = event.currentTarget;
    const currentDropdown = currentButton.nextElementSibling;

    // Ferme tous les autres dropdowns
    this.element.querySelectorAll('.dropdown-menu').forEach(dropdown => {
      if (dropdown !== currentDropdown) {
        dropdown.classList.remove('show');
      }
    });

    // Toggle le dropdown actuel
    currentDropdown.classList.toggle('show');

    // Gestionnaire pour fermer le dropdown lors d'un clic à l'extérieur
    const closeDropdown = (e) => {
      if (!currentButton.contains(e.target) && !currentDropdown.contains(e.target)) {
        currentDropdown.classList.remove('show');
        document.removeEventListener('click', closeDropdown);
      }
    };

    // Ajoute le gestionnaire seulement si le dropdown est ouvert
    if (currentDropdown.classList.contains('show')) {
      // Petit délai pour éviter que l'événement actuel ne déclenche immédiatement la fermeture
      setTimeout(() => {
        document.addEventListener('click', closeDropdown);
      }, 0);
    }
  }
}
