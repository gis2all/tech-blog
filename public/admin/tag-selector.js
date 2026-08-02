var TagSelector = createClass({
  getInitialState: function () {
    return {
      allTags: [],
      query: "",
      loading: true,
      loadError: false,
      activeIndex: 0,
    };
  },

  componentDidMount: function () {
    this.isMountedForTags = true;
    this.loadTagLibrary();
  },

  componentWillUnmount: function () {
    this.isMountedForTags = false;
  },

  loadTagLibrary: function () {
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
          if (self.isMountedForTags) {
            self.setState({ loading: false, loadError: true });
          }
          return;
        }

        var hits = (result.payload && result.payload.hits) || [];
        var allTags = DecapTagDomain.uniqueTags(
          hits.reduce(function (tags, hit) {
            var values = hit.data && hit.data.tags;
            return Array.isArray(values) ? tags.concat(values) : tags;
          }, []),
        ).sort(function (left, right) {
          return left.localeCompare(right, "zh-Hans-CN", {
            sensitivity: "base",
          });
        });

        if (self.isMountedForTags) {
          self.setState({
            allTags: allTags,
            loading: false,
            loadError: false,
          });
        }
      })
      .catch(function () {
        if (self.isMountedForTags) {
          self.setState({ loading: false, loadError: true });
        }
      });
  },

  getSelectedTags: function () {
    var value = this.props.value;

    if (value && typeof value.toJS === "function") {
      value = value.toJS();
    }

    return DecapTagDomain.uniqueTags(value);
  },

  getSuggestions: function () {
    if (this.state.loading || this.state.loadError) return [];

    var selectedTags = this.getSelectedTags();
    var normalizedQuery = DecapTagDomain.normalizeTag(this.state.query);
    var term = normalizedQuery.toLocaleLowerCase();
    var canCreate =
      normalizedQuery &&
      this.state.allTags.indexOf(normalizedQuery) === -1 &&
      selectedTags.indexOf(normalizedQuery) === -1;
    var limit = canCreate ? 11 : 12;
    var suggestions = this.state.allTags
      .filter(function (tag) {
        return selectedTags.indexOf(tag) === -1;
      })
      .filter(function (tag) {
        return !term || tag.toLocaleLowerCase().includes(term);
      })
      .slice(0, limit)
      .map(function (tag) {
        return { type: "existing", tag: tag, label: tag };
      });

    if (canCreate) {
      suggestions.push({
        type: "create",
        tag: normalizedQuery,
        label: "创建“" + normalizedQuery + "”",
      });
    }

    return suggestions;
  },

  handleInput: function (event) {
    this.setState({ query: event.target.value, activeIndex: 0 });
  },

  handleKeyDown: function (event) {
    var suggestions = this.getSuggestions();

    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      this.setState({
        activeIndex: Math.min(this.state.activeIndex + 1, suggestions.length - 1),
      });
    }

    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      this.setState({ activeIndex: Math.max(this.state.activeIndex - 1, 0) });
    }

    if (event.key === "Enter" && suggestions.length > 0) {
      event.preventDefault();
      this.activateSuggestion(
        suggestions[this.state.activeIndex] || suggestions[0],
      );
    }

    if (event.key === "Escape") {
      this.setState({ query: "", activeIndex: 0 });
    }
  },

  activateSuggestion: function (suggestion) {
    if (!suggestion) return;
    this.selectTag(suggestion.tag);
  },

  selectTag: function (tag) {
    var normalizedTag = DecapTagDomain.normalizeTag(tag);
    var selectedTags = this.getSelectedTags();

    if (normalizedTag && selectedTags.indexOf(normalizedTag) === -1) {
      this.props.onChange(
        DecapTagDomain.uniqueTags(selectedTags.concat([normalizedTag])),
      );
    }

    this.setState({ query: "", activeIndex: 0 });
  },

  removeTag: function (tag) {
    this.props.onChange(
      this.getSelectedTags().filter(function (selectedTag) {
        return selectedTag !== tag;
      }),
    );
  },

  render: function () {
    var self = this;
    var selectedTags = this.getSelectedTags();
    var hasPendingTags =
      !this.state.loading &&
      !this.state.loadError &&
      selectedTags.some(function (tag) {
        return self.state.allTags.indexOf(tag) === -1;
      });
    var suggestions = this.getSuggestions();
    var suggestionListId = this.props.forID + "-suggestions";
    var activeIndex = suggestions.length
      ? Math.min(this.state.activeIndex, suggestions.length - 1)
      : -1;

    return h(
      "div",
      { className: "cms-tag-selector" },
      selectedTags.length > 0
        ? h(
            "ul",
            { className: "cms-tag-selector__selected", "aria-label": "已选标签" },
            selectedTags.map(function (tag) {
              return h(
                "li",
                { className: "cms-tag-selector__tag", key: tag },
                h("span", null, tag),
                h(
                  "button",
                  {
                    type: "button",
                    className: "cms-tag-selector__remove",
                    "aria-label": "移除标签 " + tag,
                    onClick: function () {
                      self.removeTag(tag);
                    },
                  },
                  "x",
                ),
              );
            }),
          )
        : null,
      hasPendingTags
        ? h(
            "p",
            { className: "cms-tag-selector__pending" },
            "保存文章后加入标签库",
          )
        : null,
      h("input", {
        id: this.props.forID,
        type: "search",
        className: this.props.classNameWidget,
        value: this.state.query,
        placeholder: "搜索标签",
        autoComplete: "off",
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-controls": suggestionListId,
        "aria-expanded": suggestions.length > 0,
        "aria-activedescendant":
          activeIndex >= 0 ? suggestionListId + "-" + activeIndex : undefined,
        onChange: this.handleInput,
        onKeyDown: this.handleKeyDown,
      }),
      this.state.loading
        ? h("p", { className: "cms-tag-selector__status" }, "正在加载标签库...")
        : null,
      !this.state.loading && suggestions.length > 0
        ? h(
            "ul",
            {
              id: suggestionListId,
              className: "cms-tag-selector__suggestions",
              role: "listbox",
            },
            suggestions.map(function (suggestion, index) {
              var isActive = index === activeIndex;

              return h(
                "li",
                {
                  id: suggestionListId + "-" + index,
                  key: suggestion.type + ":" + suggestion.tag,
                  role: "option",
                  className:
                    "cms-tag-selector__suggestion" +
                    (suggestion.type === "create"
                      ? " cms-tag-selector__suggestion--create"
                      : "") +
                    (isActive ? " cms-tag-selector__suggestion--active" : ""),
                  "aria-selected": isActive,
                  onMouseDown: function (event) {
                    event.preventDefault();
                  },
                  onClick: function () {
                    self.activateSuggestion(suggestion);
                  },
                },
                suggestion.label,
              );
            }),
          )
        : null,
    );
  },
});

CMS.registerWidget("tag_selector", TagSelector);
