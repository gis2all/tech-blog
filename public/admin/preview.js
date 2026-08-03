var PostPreview = createClass({
  getInitialState: function () {
    return { seriesTitle: "" };
  },

  componentDidMount: function () {
    this.loadSeriesTitle();
  },

  componentDidUpdate: function (previousProps) {
    var previous = previousProps.entry.getIn(["data", "series"]);
    var current = this.props.entry.getIn(["data", "series"]);
    if (previous !== current) this.loadSeriesTitle();
  },

  loadSeriesTitle: function () {
    var self = this;
    var series = this.props.entry.getIn(["data", "series"]);
    if (!series || typeof this.props.getCollection !== "function") {
      this.setState({ seriesTitle: series || "" });
      return;
    }
    Promise.resolve(this.props.getCollection("series", series))
      .then(function (entries) {
        var matched = (entries || []).find(function (item) {
          return item.getIn(["data", "slug"]) === series || item.get("slug") === series;
        });
        self.setState({
          seriesTitle: matched ? matched.getIn(["data", "title"]) || series : series,
        });
      })
      .catch(function () {
        self.setState({ seriesTitle: series });
      });
  },

  render: function () {
    var entry = this.props.entry;
    var title = entry.getIn(["data", "title"]) || "未命名文章";
    var description = entry.getIn(["data", "description"]);
    var category = entry.getIn(["data", "category"]);
    var publishedAt = entry.getIn(["data", "publishedAt"]);
    var updatedAt = entry.getIn(["data", "updatedAt"]);
    var tags = entry.getIn(["data", "tags"]);
    var series = entry.getIn(["data", "series"]);
    var references = entry.getIn(["data", "references"]);
    var cover = entry.getIn(["data", "cover"]);
    var coverAlt = entry.getIn(["data", "coverAlt"]) || "";
    var coverUrl = cover ? this.props.getAsset(cover).toString() : "";
    if (tags && typeof tags.toJS === "function") tags = tags.toJS();
    if (references && typeof references.toJS === "function") references = references.toJS();
    tags = Array.isArray(tags) ? tags : [];
    references = Array.isArray(references) ? references : [];
    var metadata = [
      category,
      publishedAt ? "发布 " + publishedAt : "",
      updatedAt ? "更新 " + updatedAt : "",
      series ? "专题 " + (this.state.seriesTitle || series) : "",
    ].filter(Boolean).join(" · ");
    var publicArticlePath = DecapEditorialDomain.publicArticlePath(title);
    var mediaFolder = DecapEditorialDomain.mediaFolder(title) + "/";

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
        tags.length
          ? h(
              "ul",
              { className: "cms-post-preview__tags", "aria-label": "标签" },
              tags.map(function (tag) {
                return h("li", { key: tag }, tag);
              }),
            )
          : null,
        description
          ? h(
              "p",
              { className: "cms-post-preview__description" },
              description,
            )
          : null,
        h(
          "dl",
          { className: "cms-post-preview__destinations" },
          h("dt", null, "公开地址"),
          h("dd", null, publicArticlePath),
          h("dt", null, "媒体目录"),
          h("dd", null, mediaFolder),
        ),
      ),
      h(
        "div",
        { className: "cms-post-preview__body" },
        this.props.widgetFor("body"),
      ),
      references.length
        ? h(
            "section",
            { className: "cms-post-preview__references" },
            h("h2", null, "参考资料"),
            h(
              "ol",
              null,
              references.map(function (reference, index) {
                return h(
                  "li",
                  { key: reference.url || index },
                  h(
                    "a",
                    { href: reference.url, target: "_blank", rel: "noreferrer" },
                    reference.title || reference.url,
                  ),
                );
              }),
            ),
          )
        : null,
    );
  },
});

CMS.registerPreviewStyle("/admin/preview.css");
CMS.registerPreviewTemplate("posts", PostPreview);
