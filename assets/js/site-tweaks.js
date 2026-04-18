(function ($) {
  function syncLayoutMetrics() {
    var masthead = document.querySelector(".masthead");
    if (!masthead) {
      return;
    }

    if (document.body.classList.contains("home-classic")) {
      document.documentElement.style.setProperty("--masthead-height", "0px");
      document.body.style.paddingTop = "0px";
      $(".sidebar").css("padding-top", "");
      return;
    }

    var mastheadHeight = masthead.offsetHeight || 0;
    document.documentElement.style.setProperty("--masthead-height", mastheadHeight + "px");
    document.body.style.paddingTop = mastheadHeight + "px";
    $(".sidebar").css("padding-top", "");
  }

  function bindAuthorMenu() {
    var $button = $(".author__urls-wrapper button");
    var $menu = $(".author__urls");

    if (!$button.length) {
      return;
    }

    $button.off("click").on("click.codexFix", function () {
      $menu.stop(true, true).slideToggle(180);
      $button.toggleClass("open");
    });
  }

  $(function () {
    syncLayoutMetrics();
    bindAuthorMenu();

    $(window).on("resize.codexFix orientationchange.codexFix", function () {
      syncLayoutMetrics();
    });

    $("#site-nav button, #theme-toggle").on("click.codexFix", function () {
      window.requestAnimationFrame(syncLayoutMetrics);
      window.setTimeout(syncLayoutMetrics, 220);
    });

    if (window.ResizeObserver) {
      var observer = new ResizeObserver(function () {
        syncLayoutMetrics();
      });
      var masthead = document.querySelector(".masthead");

      if (masthead) {
        observer.observe(masthead);
      }
    }
  });

  window.addEventListener("pageshow", function () {
    syncLayoutMetrics();
    bindAuthorMenu();

    if (typeof updateNav === "function") {
      updateNav();
    }
  });
})(jQuery);
