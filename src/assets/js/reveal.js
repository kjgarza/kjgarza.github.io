// Scroll reveal for homepage sections marked [data-reveal] (issue #33).
// Progressive enhancement: the server HTML never hides anything. This script
// adds `reveal-ready` to <html>, which applies the hidden start state from
// home.css, and only when motion is welcome and IntersectionObserver exists.
// Each section reveals once. In [data-reveal-mode="stagger"] list rows also
// get increasing delays (--reveal-delay) so they arrive one after another.
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var targets = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (!targets.length) return;

  if (document.querySelector('[data-reveal-mode="stagger"]')) {
    targets.forEach(function (section) {
      var rows = section.querySelectorAll(".home-row");
      for (var i = 0; i < rows.length; i++) {
        rows[i].style.setProperty("--reveal-delay", Math.min(i, 8) * 90 + "ms");
      }
    });
  }

  // Anything already on screen stays visible, so nothing flashes on load.
  var fold = window.innerHeight * 0.9;
  targets.forEach(function (el) {
    if (el.getBoundingClientRect().top < fold) el.classList.add("is-revealed");
  });
  document.documentElement.classList.add("reveal-ready");

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -15% 0px" }
  );
  targets.forEach(function (el) {
    if (!el.classList.contains("is-revealed")) observer.observe(el);
  });
})();
