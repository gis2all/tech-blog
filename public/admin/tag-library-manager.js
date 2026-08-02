var TagLibraryManager = createClass({
  getInitialState: function () {
    return {
      usage: Object.create(null),
      loading: true,
      loadError: false,
      confirmingTag: null,
      checkingTag: null,
      message: "",
    };
  },

  componentDidMount: function () {
    this.isMountedForTagManager = true;
    this.loadUsage();
  },

  componentWillUnmount: function () {
    this.isMountedForTagManager = false;
  },

  getTags: function () {
    var value = this.props.value;

    if (value && typeof value.toJS === "function") {
      value = value.toJS();
    }

    return DecapTagDomain.uniqueTags(value);
  },

  queryUsage: function () {
    var collection = this.props.field.get("posts_collection") || "posts";
    var searchFields = this.props.field.get("search_fields") || ["tags.*"];

    if (searchFields && typeof searchFields.toJS === "function") {
      searchFields = searchFields.toJS();
    }

    return this.props
      .query(this.props.forID, collection, searchFields, "")
      .then(function (result) {
        if (result.payload && result.payload.error) {
          throw new Error("Tag usage query failed");
        }

        return DecapTagDomain.countUsage(
          (result.payload && result.payload.hits) || [],
        );
      });
  },

  loadUsage: function () {
    var self = this;

    return this.queryUsage()
      .then(function (usage) {
        if (self.isMountedForTagManager) {
          self.setState({
            usage: usage,
            loading: false,
            loadError: false,
            message: "",
          });
        }
      })
      .catch(function () {
        if (self.isMountedForTagManager) {
          self.setState({
            loading: false,
            loadError: true,
            message: "无法加载文章使用情况，删除功能已停用。",
          });
        }
      });
  },

  retryLoadUsage: function () {
    this.setState({
      loading: true,
      loadError: false,
      confirmingTag: null,
      message: "",
    });
    this.loadUsage();
  },

  requestDelete: function (tag) {
    if (
      this.state.loading ||
      this.state.loadError ||
      this.state.checkingTag ||
      !DecapTagDomain.canDelete(tag, this.state.usage)
    ) {
      return;
    }

    this.setState({ confirmingTag: tag, message: "" });
  },

  cancelDelete: function () {
    if (this.state.checkingTag) return;
    this.setState({ confirmingTag: null, message: "" });
  },

  confirmDelete: function (tag) {
    var self = this;

    if (
      this.state.confirmingTag !== tag ||
      this.state.loading ||
      this.state.loadError ||
      this.state.checkingTag
    ) {
      return Promise.resolve();
    }

    this.setState({ checkingTag: tag, message: "" });

    return this.queryUsage()
      .then(function (usage) {
        if (!self.isMountedForTagManager) return;

        if (!DecapTagDomain.canDelete(tag, usage)) {
          self.setState({
            usage: usage,
            confirmingTag: null,
            checkingTag: null,
            message: "该标签已被文章使用，无法删除。",
          });
          return;
        }

        self.props.onChange(
          self.getTags().filter(function (value) {
            return value !== tag;
          }),
        );
        self.setState({
          usage: usage,
          confirmingTag: null,
          checkingTag: null,
          message: "标签已从标签库表单中移除，保存后生效。",
        });
      })
      .catch(function () {
        if (self.isMountedForTagManager) {
          self.setState({
            loadError: true,
            confirmingTag: null,
            checkingTag: null,
            message: "无法确认标签使用情况，未执行删除。",
          });
        }
      });
  },

  getUsageCount: function (tag) {
    return Object.prototype.hasOwnProperty.call(this.state.usage, tag)
      ? this.state.usage[tag]
      : 0;
  },

  render: function () {
    var self = this;
    var tags = this.getTags();

    return h(
      "div",
      { className: "cms-tag-manager" },
      this.state.loading
        ? h("p", { className: "cms-tag-manager__status" }, "正在统计标签使用情况...")
        : null,
      this.state.loadError
        ? h(
            "div",
            { className: "cms-tag-manager__error", role: "alert" },
            h("span", null, this.state.message || "标签使用情况加载失败。"),
            h(
              "button",
              {
                type: "button",
                className: "cms-tag-manager__retry",
                onClick: this.retryLoadUsage,
              },
              "重新加载",
            ),
          )
        : this.state.message
          ? h(
              "p",
              { className: "cms-tag-manager__message", role: "status" },
              this.state.message,
            )
          : null,
      h(
        "ul",
        { className: "cms-tag-manager__list", "aria-label": "全局标签" },
        tags.map(function (tag) {
          var count = self.getUsageCount(tag);
          var isUsed = count > 0;
          var isConfirming = self.state.confirmingTag === tag;
          var isChecking = self.state.checkingTag === tag;
          var deletionDisabled =
            self.state.loading || self.state.loadError || isUsed || !!self.state.checkingTag;

          return h(
            "li",
            { className: "cms-tag-manager__row", key: tag },
            h("span", { className: "cms-tag-manager__name" }, tag),
            h(
              "span",
              { className: "cms-tag-manager__usage" },
              isUsed ? count + " 篇文章" : "未使用",
            ),
            isConfirming
              ? h(
                  "div",
                  { className: "cms-tag-manager__confirm" },
                  h(
                    "button",
                    {
                      type: "button",
                      className: "cms-tag-manager__confirm-delete",
                      disabled: isChecking,
                      onClick: function () {
                        self.confirmDelete(tag);
                      },
                    },
                    isChecking ? "正在确认..." : "确认删除",
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      className: "cms-tag-manager__cancel",
                      disabled: isChecking,
                      onClick: self.cancelDelete,
                    },
                    "取消",
                  ),
                )
              : h(
                  "button",
                  {
                    type: "button",
                    className: "cms-tag-manager__delete",
                    disabled: deletionDisabled,
                    title: isUsed
                      ? count + " 篇文章正在使用"
                      : self.state.loadError
                        ? "使用情况不可用"
                        : "删除标签",
                    "aria-label": "删除标签 " + tag,
                    onClick: function () {
                      self.requestDelete(tag);
                    },
                  },
                  "x",
                ),
          );
        }),
      ),
    );
  },
});

CMS.registerWidget("tag_library_manager", TagLibraryManager);
