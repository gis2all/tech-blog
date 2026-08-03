import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  if (
    context.url.pathname === "/admin" ||
    context.url.pathname === "/admin/"
  ) {
    return context.redirect("/admin/index.html", 302);
  }

  return next();
});
