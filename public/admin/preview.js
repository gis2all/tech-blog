var PostPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var title = entry.getIn(["data", "title"]) || "未命名文章";
    var description = entry.getIn(["data", "description"]);
    var category = entry.getIn(["data", "category"]);
    var publishedAt = entry.getIn(["data", "publishedAt"]);
    var cover = entry.getIn(["data", "cover"]);
    var coverAlt = entry.getIn(["data", "coverAlt"]) || "";
    var coverUrl = cover ? this.props.getAsset(cover).toString() : "";
    var metadata = [category, publishedAt].filter(Boolean).join(" · ");

    return h(
      "article",
      { className: "cms-post-preview" },
      h(
        "header",
        { className: "cms-post-preview__header" },
        coverUrl
          ? h("img", {
              className: "cms-post-preview__cover",
              src: coverUrl,
              alt: coverAlt,
            })
          : null,
        metadata
          ? h("p", { className: "cms-post-preview__meta" }, metadata)
          : null,
        h("h1", { className: "cms-post-preview__title" }, title),
        description
          ? h(
              "p",
              { className: "cms-post-preview__description" },
              description,
            )
          : null,
      ),
      h(
        "div",
        { className: "cms-post-preview__body" },
        this.props.widgetFor("body"),
      ),
    );
  },
});

CMS.registerPreviewStyle("/admin/preview.css");
CMS.registerPreviewTemplate("posts", PostPreview);
