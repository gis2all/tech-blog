var ArticleTitleControl = createClass({
  getInitialState: function () {
    return { renameMode: false };
  },

  isNewRecord: function () {
    return Boolean(this.props.entry && this.props.entry.get("newRecord"));
  },

  currentTitle: function () {
    var path = (this.props.entry && this.props.entry.get("path")) || "";
    var match = String(path).match(/\/([^/]+)\.md$/);
    return match ? match[1] : "";
  },

  isDraft: function () {
    return this.props.entry && this.props.entry.getIn(["data", "draft"]) === true;
  },

  startRename: function () {
    var accepted = window.confirm(
      "进入重命名模式后，保存会更改文章文件名、公开地址和媒体目录。旧链接不会保留跳转。",
    );
    if (accepted) this.setState({ renameMode: true });
  },

  handleChange: function (event) {
    if (window.DecapUnsavedChanges) window.DecapUnsavedChanges.markDirty();
    this.props.onChange(event.target.value);
  },

  render: function () {
    var value = typeof this.props.value === "string" ? this.props.value : "";
    var errors = DecapEditorialDomain.validateTitle(value);
    var valid = value.trim() && errors.length === 0;
    var isNew = this.isNewRecord();
    var editable = isNew || this.state.renameMode;
    var currentTitle = this.currentTitle();

    return h(
      "div",
      { className: "cms-article-title" },
      h("input", {
        id: this.props.forID,
        type: "text",
        className: this.props.classNameWidget,
        "data-article-title-input": "true",
        value: value,
        disabled: !editable,
        onChange: this.handleChange,
        "aria-invalid": errors.length > 0,
      }),
      !isNew && !editable
        ? h(
            "div",
            { className: "cms-article-title__lock" },
            h(
              "span",
              null,
              this.isDraft()
                ? "标题已锁定，重命名会立即更改公开地址。"
                : "已发布文章标题已锁定，请先切换为草稿。",
            ),
            this.isDraft()
              ? h(
                  "button",
                  { type: "button", onClick: this.startRename },
                  "重命名文章",
                )
              : null,
          )
        : null,
      currentTitle && this.state.renameMode
        ? h(
            "p",
            { className: "cms-article-title__warning", role: "alert" },
            "当前标题：" + currentTitle + "。保存前会再次确认。",
          )
        : null,
      errors.length
        ? h(
            "ul",
            { className: "cms-article-title__errors", role: "alert" },
            errors.map(function (error) {
              return h("li", { key: error }, error);
            }),
          )
        : null,
      valid
        ? h(
            "dl",
            { className: "cms-article-title__destinations" },
            h("dt", null, "Markdown"),
            h("dd", null, DecapEditorialDomain.articlePath(value)),
            h("dt", null, "公开地址"),
            h("dd", null, DecapEditorialDomain.publicArticlePath(value)),
            h("dt", null, "媒体目录"),
            h("dd", null, DecapEditorialDomain.mediaFolder(value) + "/"),
          )
        : null,
    );
  },
});

CMS.registerWidget("article_title", ArticleTitleControl);
