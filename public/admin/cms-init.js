(function () {
  var LOCAL_BACKEND_URL = "http://127.0.0.1:4322/api/v1";

  function isLocalDevelopmentHost(hostname) {
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
  }

  function initCms() {
    if (!window.CMS || typeof window.CMS.init !== "function") return;
    if (isLocalDevelopmentHost(window.location.hostname)) {
      window.CMS.init({
        config: {
          backend: {
            name: "proxy",
            proxy_url: LOCAL_BACKEND_URL,
          },
          load_config_file: true,
        },
      });
      return;
    }
    window.CMS.init();
  }

  initCms();
})();
