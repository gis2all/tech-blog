// Wrap Markdown tables in a scroll container so wide tables scroll
// horizontally on narrow screens while small tables still fill the width.
export default function createTableScrollPlugin() {
  return {
    name: "table-scroll",
    element: {
      filter: ["table"],
      visit(table, context) {
        context.replaceNode(table, {
          type: "element",
          tagName: "div",
          properties: { className: ["table-scroll"] },
          children: [table],
        });
      },
    },
  };
}
