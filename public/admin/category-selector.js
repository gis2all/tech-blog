var CategorySelector = createClass({
  getInitialState: function () {
    return {
      allCategories: [],
      query: "",
      loading: true,
      loadError: false,
      activeIndex: 0,
      isOpen: false,
    };
  },

  componentDidMount: function () {
    this.isMountedForCategories = true;
    this.categoryRetryTimer = null;
    this.loadCategoryLibrary(true);
  },

  componentWillUnmount: function () {
    this.isMountedForCategories = false;
    if (this.categoryRetryTimer !== null) {
      window.clearTimeout(this.categoryRetryTimer);
      this.categoryRetryTimer = null;
    }
  },

  handleCategoryLoadFailure: function (allowAutomaticRetry) {
    var self = this;
    if (!this.isMountedForCategories) return;
    if (allowAutomaticRetry) {
      this.categoryRetryTimer = window.setTimeout(function () {
        self.categoryRetryTimer = null;
        if (self.isMountedForCategories) self.loadCategoryLibrary(false);
      }, 0);
      return;
    }
    this.setState({ loading: false, loadError: true });
  },

  loadCategoryLibrary: function (allowAutomaticRetry) {
    var self = this;
    var collection = this.props.field.get("collection");
    var searchFields = this.props.field.get("search_fields");
    var file = this.props.field.get("file");
    if (searchFields && typeof searchFields.toJS === "function") {
      searchFields = searchFields.toJS();
    }
    this.props
      .query(this.props.forID, collection, searchFields, "", file)
      .then(function (result) {
        if (result.payload && result.payload.error) {
          self.handleCategoryLoadFailure(allowAutomaticRetry);
          return;
        }
        var hits = (result.payload && result.payload.hits) || [];
        var allCategories = DecapCategoryDomain.uniqueCategories(
          hits.reduce(function (categories, hit) {
            var values = hit.data && hit.data.categories;
            return Array.isArray(values) ? categories.concat(values) : categories;
          }, []),
        ).sort(function (left, right) {
          if (left < right) return -1;
          if (left > right) return 1;
          return 0;
        });
        if (self.isMountedForCategories) {
          self.setState({ allCategories: allCategories, loading: false, loadError: false });
        }
      })
      .catch(function () {
        self.handleCategoryLoadFailure(allowAutomaticRetry);
      });
  },

  getSelectedCategory: function () {
    var value = this.props.value;
    if (value && typeof value.toJS === "function") value = value.toJS();
    if (Array.isArray(value)) value = value[0];
    return DecapCategoryDomain.normalizeCategory(value);
  },

  getSuggestions: function () {
    if (!this.state.isOpen || this.state.loading || this.state.loadError) return [];
    var selected = this.getSelectedCategory();
    var term = DecapCategoryDomain.normalizeCategory(this.state.query).toLocaleLowerCase();
    return this.state.allCategories
      .filter(function (category) { return category !== selected; })
      .filter(function (category) {
        return !term || category.toLocaleLowerCase().includes(term);
      })
      .slice(0, 12);
  },

  handleInput: function (event) {
    this.setState({ query: event.target.value, activeIndex: 0, isOpen: true });
  },

  handleFocus: function () {
    this.setState({ isOpen: true });
  },

  getActiveIndex: function (suggestions) {
    if (!suggestions.length) return -1;
    return Math.min(Math.max(this.state.activeIndex, 0), suggestions.length - 1);
  },

  handleKeyDown: function (event) {
    var suggestions = this.getSuggestions();
    var activeIndex = this.getActiveIndex(suggestions);
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      this.setState({ activeIndex: Math.min(activeIndex + 1, suggestions.length - 1) });
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      this.setState({ activeIndex: Math.max(activeIndex - 1, 0) });
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      this.activateCategory(suggestions[activeIndex]);
    } else if (event.key === "Escape" && this.state.isOpen) {
      event.preventDefault();
      event.stopPropagation();
      this.setState({ query: "", activeIndex: 0, isOpen: false });
    }
  },

  activateCategory: function (category) {
    var normalized = DecapCategoryDomain.normalizeCategory(category);
    if (normalized && this.state.allCategories.indexOf(normalized) !== -1) {
      this.props.onChange(normalized);
    }
    this.setState({ query: "", activeIndex: 0, isOpen: false });
  },

  retryLoadCategoryLibrary: function () {
    this.setState({ loading: true, loadError: false, activeIndex: 0, isOpen: true });
    this.loadCategoryLibrary(false);
  },

  render: function () {
    var self = this;
    var selected = this.getSelectedCategory();
    var suggestions = this.getSuggestions();
    var suggestionListId = this.props.forID + "-suggestions";
    var activeIndex = this.getActiveIndex(suggestions);
    return h(
      "div",
      { className: "cms-category-selector" },
      selected
        ? h("p", { className: "cms-category-selector__selected", "aria-live": "polite" }, selected)
        : null,
      h("input", {
        id: this.props.forID,
        type: "search",
        className: this.props.classNameWidget,
        value: this.state.query,
        placeholder: "搜索分类",
        autoComplete: "off",
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-controls": suggestionListId,
        "aria-expanded": suggestions.length > 0,
        "aria-activedescendant": activeIndex >= 0 ? suggestionListId + "-" + activeIndex : undefined,
        disabled: this.state.loading || this.state.loadError,
        onChange: this.handleInput,
        onFocus: this.handleFocus,
        onKeyDown: this.handleKeyDown,
      }),
      this.state.loading
        ? h("p", { className: "cms-category-selector__status" }, "正在加载分类库...")
        : null,
      this.state.loadError
        ? h(
            "div",
            { className: "cms-category-selector__error", role: "alert" },
            h("span", null, "分类库加载失败，请重试。"),
            h(
              "button",
              { type: "button", className: "cms-category-selector__retry", onClick: this.retryLoadCategoryLibrary },
              "重新加载",
            ),
          )
        : null,
      !this.state.loading && suggestions.length > 0
        ? h(
            "ul",
            { id: suggestionListId, className: "cms-category-selector__suggestions", role: "listbox" },
            suggestions.map(function (category, index) {
              var isActive = index === activeIndex;
              return h(
                "li",
                {
                  id: suggestionListId + "-" + index,
                  key: category,
                  role: "option",
                  className: "cms-category-selector__suggestion" + (isActive ? " cms-category-selector__suggestion--active" : ""),
                  "aria-selected": isActive,
                  onMouseDown: function (event) { event.preventDefault(); },
                  onClick: function () { self.activateCategory(category); },
                },
                category,
              );
            }),
          )
        : null,
    );
  },
});

CMS.registerWidget("category_selector", CategorySelector);
