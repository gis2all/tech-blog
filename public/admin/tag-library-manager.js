var TagLibraryManager = createClass({
  getInitialState: function () {
    return {
      usage: Object.create(null),
      loading: true,
      loadError: false,
      confirmingTag: null,
      checkingTag: null,
      message: "",
      query: "",
      filter: "all",
      sort: "name",
      mergingSource: null,
      mergeTarget: "",
      mergePlan: null,
      merging: false,
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

  getVisibleTags: function () {
    var stats = DecapTagDomain.tagStats(this.getTags(), this.state.usage);
    return DecapTagDomain.filterTagStats(
      stats,
      this.state.query,
      this.state.filter,
      this.state.sort,
    ).map(function (item) { return item.name; });
  },

  startMerge: function (tag) {
    if (this.state.loading || this.state.loadError || this.state.merging) return;
    this.setState({
      mergingSource: tag,
      mergeTarget: "",
      mergePlan: null,
      message: "",
    });
  },

  cancelMerge: function () {
    if (this.state.merging) return;
    this.setState({
      mergingSource: null,
      mergeTarget: "",
      mergePlan: null,
      message: "",
    });
  },

  prepareMerge: function () {
    var self = this;
    if (!this.state.mergingSource || !this.state.mergeTarget.trim()) {
      this.setState({ message: "请输入目标标签。" });
      return Promise.resolve();
    }
    this.setState({ merging: true, message: "" });
    return window.DecapTagOperations
      .plan(this.state.mergingSource, this.state.mergeTarget)
      .then(function (plan) {
        if (self.isMountedForTagManager) {
          self.setState({ mergePlan: plan, merging: false });
        }
      })
      .catch(function (error) {
        if (self.isMountedForTagManager) {
          self.setState({
            merging: false,
            mergePlan: null,
            message: error.message || "无法生成标签合并计划。",
          });
        }
      });
  },

  confirmMerge: function () {
    var self = this;
    var plan = this.state.mergePlan;
    if (!plan || this.state.merging) return Promise.resolve();
    var accepted = window.confirm(
      "确认将“" + plan.source + "”合并为“" + plan.target + "”？将更新 " +
      plan.affectedCount + " 篇文章，此操作会在一个 Git 提交中完成。",
    );
    if (!accepted) return Promise.resolve();
    this.setState({ merging: true, message: "" });
    return window.DecapTagOperations.merge(plan)
      .then(function () {
        if (!self.isMountedForTagManager) return;
        self.setState({ merging: false, message: "标签合并完成，正在刷新..." });
        window.setTimeout(function () { window.location.reload(); }, 300);
      })
      .catch(function (error) {
        if (self.isMountedForTagManager) {
          self.setState({
            merging: false,
            message: error.message || "标签合并失败，未写入任何修改。",
          });
        }
      });
  },

  render: function () {
    var self = this;
    var allTags = this.getTags();
    var tags = this.getVisibleTags();
    var unusedCount = allTags.filter(function (tag) {
      return self.getUsageCount(tag) === 0;
    }).length;

    return h(
      "div",
      { className: "cms-tag-manager" },
      h(
        "div",
        { className: "cms-tag-manager__toolbar" },
        h("input", {
          type: "search",
          value: this.state.query,
          placeholder: "搜索标签",
          "aria-label": "搜索标签",
          onChange: function (event) { self.setState({ query: event.target.value }); },
        }),
        h(
          "select",
          {
            value: this.state.filter,
            "aria-label": "筛选标签",
            onChange: function (event) { self.setState({ filter: event.target.value }); },
          },
          h("option", { value: "all" }, "全部"),
          !this.state.loading && !this.state.loadError
            ? h("option", { value: "used" }, "已使用")
            : null,
          !this.state.loading && !this.state.loadError
            ? h("option", { value: "unused" }, "未使用")
            : null,
        ),
        h(
          "select",
          {
            value: this.state.sort,
            "aria-label": "标签排序",
            onChange: function (event) { self.setState({ sort: event.target.value }); },
          },
          h("option", { value: "name" }, "按名称"),
          h("option", { value: "usage" }, "按使用量"),
        ),
        h(
          "span",
          { className: "cms-tag-manager__summary" },
          "共 " + allTags.length + " 个" +
            (!this.state.loading && !this.state.loadError
              ? "，未使用 " + unusedCount + " 个"
              : ""),
        ),
      ),
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
      this.state.mergingSource
        ? h(
            "section",
            { className: "cms-tag-manager__merge", "aria-label": "标签重命名和合并" },
            h(
              "p",
              null,
              "将“" + this.state.mergingSource + "”重命名或合并到：",
            ),
            h("input", {
              type: "text",
              value: this.state.mergeTarget,
              placeholder: "已有或新标签名称",
              disabled: this.state.merging,
              onChange: function (event) {
                self.setState({ mergeTarget: event.target.value, mergePlan: null });
              },
            }),
            this.state.mergePlan
              ? h(
                  "p",
                  { className: "cms-tag-manager__merge-plan", role: "status" },
                  "将更新 " + this.state.mergePlan.affectedCount +
                    " 篇文章，并从全局标签中移除源标签。",
                )
              : null,
            h(
              "div",
              { className: "cms-tag-manager__merge-actions" },
              this.state.mergePlan
                ? h(
                    "button",
                    {
                      type: "button",
                      disabled: this.state.merging,
                      onClick: this.confirmMerge,
                    },
                    this.state.merging ? "正在合并..." : "确认合并",
                  )
                : h(
                    "button",
                    {
                      type: "button",
                      disabled: this.state.merging,
                      onClick: this.prepareMerge,
                    },
                    this.state.merging ? "正在检查..." : "检查影响",
                  ),
              h(
                "button",
                {
                  type: "button",
                  disabled: this.state.merging,
                  onClick: this.cancelMerge,
                },
                "取消",
              ),
            ),
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
          var usageLabel = self.state.loading
            ? "统计中..."
            : self.state.loadError
              ? "统计失败"
              : isUsed
                ? count + " 篇文章"
                : "未使用";
          var deletionDisabled =
            self.state.loading || self.state.loadError || isUsed || !!self.state.checkingTag;

          return h(
            "li",
            { className: "cms-tag-manager__row", key: tag },
            h("span", { className: "cms-tag-manager__name" }, tag),
            h(
              "span",
              { className: "cms-tag-manager__usage" },
              usageLabel,
            ),
            h(
              "button",
              {
                type: "button",
                className: "cms-tag-manager__rename",
                disabled: self.state.loading || self.state.loadError || !!self.state.checkingTag,
                "aria-label": "重命名或合并标签 " + tag,
                onClick: function () { self.startMerge(tag); },
              },
              "重命名/合并",
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
