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
    var cover = entry.getIn(["data", "cover"]);
    var coverAlt = entry.getIn(["data", "coverAlt"]) || "";
    var coverUrl = cover ? this.props.getAsset(cover).toString() : "";
    if (tags && typeof tags.toJS === "function") tags = tags.toJS();
    tags = Array.isArray(tags) ? tags : [];
    var metadata = [
      category,
      publishedAt ? "发布 " + publishedAt : "",
      updatedAt ? "更新 " + updatedAt : "",
      series ? "专题 " + (this.state.seriesTitle || series) : "",
    ].filter(Boolean).join(" · ");
    return h(
      "article",
      { className: "cms-post-preview" },
      h(
        "header",
        { className: "cms-post-preview__header" },
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
        coverUrl
          ? h("img", {
              className: "cms-post-preview__cover",
              src: coverUrl,
              alt: coverAlt,
            })
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

function previewAsset(props, field) {
  var value = props.entry.getIn(["data", field]);
  return value ? props.getAsset(value).toString() : "";
}

function previewList(entry, field) {
  var value = entry.getIn(["data", field]);
  if (value && typeof value.toJS === "function") value = value.toJS();
  return Array.isArray(value) ? value : [];
}

var SeriesPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var title = entry.getIn(["data", "title"]) || "未命名专题";
    var description = entry.getIn(["data", "description"]) || "";
    var slug = entry.getIn(["data", "slug"]) || "";
    var order = entry.getIn(["data", "order"]);
    var draft = entry.getIn(["data", "draft"]);
    var image = previewAsset(this.props, "image");
    var imageAlt = entry.getIn(["data", "imageAlt"]) || "";

    return h(
      "article",
      { className: "cms-entity-preview" },
      image ? h("img", { className: "cms-entity-preview__image", src: image, alt: imageAlt }) : null,
      h("p", { className: "cms-entity-preview__eyebrow" }, "专题 · 排序 " + (order || "未填写")),
      h("h1", null, title),
      description ? h("p", { className: "cms-entity-preview__description" }, description) : null,
      h(
        "dl",
        { className: "cms-entity-preview__details" },
        h("dt", null, "专题地址"),
        h("dd", null, "/series/" + slug + "/"),
        h("dt", null, "状态"),
        h("dd", null, draft ? "草稿" : "已发布"),
      ),
    );
  },
});

var ProjectPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var title = entry.getIn(["data", "title"]) || "未命名项目";
    var description = entry.getIn(["data", "description"]) || "";
    var projectUrl = entry.getIn(["data", "url"]) || "";
    var repoUrl = entry.getIn(["data", "repoUrl"]) || "";
    var publishedAt = entry.getIn(["data", "publishedAt"]) || "未填写";
    var draft = entry.getIn(["data", "draft"]);
    var tech = previewList(entry, "tech");
    var image = previewAsset(this.props, "image");
    var imageAlt = entry.getIn(["data", "imageAlt"]) || "";

    return h(
      "article",
      { className: "cms-entity-preview" },
      image ? h("img", { className: "cms-entity-preview__image", src: image, alt: imageAlt }) : null,
      h(
        "p",
        { className: "cms-entity-preview__eyebrow" },
        "项目" + (tech.length ? " · " + tech.join(" / ") : ""),
      ),
      h("h1", null, title),
      description ? h("p", { className: "cms-entity-preview__description" }, description) : null,
      h(
        "dl",
        { className: "cms-entity-preview__details" },
        h("dt", null, "项目地址"),
        h("dd", null, projectUrl || "未填写"),
        h("dt", null, "仓库地址"),
        h("dd", null, repoUrl || "未填写"),
        h("dt", null, "发布日期"),
        h("dd", null, publishedAt),
        h("dt", null, "状态"),
        h("dd", null, (draft ? "草稿" : "已发布")),
      ),
    );
  },
});

CMS.registerPreviewStyle("/admin/preview.css?v=3");
CMS.registerPreviewTemplate("posts", PostPreview);
CMS.registerPreviewTemplate("series", SeriesPreview);
CMS.registerPreviewTemplate("projects", ProjectPreview);
