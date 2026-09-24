(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Always start from the home section ---------- */
  function forceScrollTop() {
    var html = document.documentElement;
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    html.scrollTop = 0;
    document.body.scrollTop = 0;
    html.style.scrollBehavior = prev;
  }
  try {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  } catch (e) {}
  forceScrollTop();

  /* ---------- Theme ---------- */
  var themeRoot = document.documentElement;
  var themeMeta = document.querySelector("meta[name='theme-color']");

  function currentTheme() {
    return themeRoot.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function syncThemeUI(t) {
    document.querySelectorAll(".js-theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-pressed", t === "dark" ? "false" : "true");
      var label = btn.querySelector(".theme-label");
      if (label) label.textContent = t === "dark" ? "Light theme" : "Dark theme";
    });
  }
  function setTheme(t) {
    themeRoot.setAttribute("data-theme", t === "light" ? "light" : "dark");
    try {
      localStorage.setItem("theme", currentTheme());
    } catch (e) {}
    if (themeMeta) themeMeta.setAttribute("content", currentTheme() === "light" ? "#f4f6f8" : "#050505");
    syncThemeUI(currentTheme());
  }
  setTheme(currentTheme());
  document.querySelectorAll(".js-theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTheme(currentTheme() === "light" ? "dark" : "light");
    });
  });

  /* ---------- Hero-only cursor glow ---------- */
  var heroGlow = document.getElementById("heroGlow");
  var heroSection = document.getElementById("home");
  var glowPointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (heroGlow && heroSection && glowPointer && !prefersReduced) {
    var hgX = window.innerWidth / 2, hgY = window.innerHeight / 2, hgTX = hgX, hgTY = hgY;

    window.addEventListener("mousemove", function (e) {
      hgTX = e.clientX;
      hgTY = e.clientY + window.scrollY;
      heroGlow.classList.add("on");
    });
    document.addEventListener("mouseleave", function () {
      heroGlow.classList.remove("on");
    });
    window.addEventListener("blur", function () {
      heroGlow.classList.remove("on");
    });
    window.addEventListener("resize", function () {
      hgX = hgTX = window.innerWidth / 2;
      hgY = hgTY = window.innerHeight / 2;
    });

    (function heroGlowLoop() {
      hgX += (hgTX - hgX) * 0.1;
      hgY += (hgTY - hgY) * 0.1;
      heroGlow.style.transform = "translate(" + hgX + "px, " + hgY + "px) translate(-50%, -50%)";
      requestAnimationFrame(heroGlowLoop);
    })();
  }

  /* ---------- Preloader ---------- */
  var preloader = document.getElementById("preloader");
  var canvas = document.getElementById("particleCanvas");
  var fallbackText = document.getElementById("preloaderFallback");
  var countEl = document.getElementById("preloaderCount");
  var particleRAF = null;
  var particles = [];
  var particleWidth = 0;
  var hovX = -1e4, hovY = -1e4, hovOn = false;

  function showFallbackText() {
    if (fallbackText) fallbackText.classList.add("show");
  }

  function stopParticles() {
    if (particleRAF) {
      cancelAnimationFrame(particleRAF);
      particleRAF = null;
    }
  }

  if (preloader && glowPointer) {
    preloader.addEventListener("mousemove", function (e) {
      hovX = e.clientX;
      hovY = e.clientY;
      hovOn = true;
    });
    preloader.addEventListener("mouseleave", function () {
      hovOn = false;
    });
  }

  function initParticles() {
    if (!canvas) {
      showFallbackText();
      return;
    }
    var ctx = canvas.getContext("2d");
    if (!ctx) {
      showFallbackText();
      return;
    }
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var W = window.innerWidth;
    var H = window.innerHeight;
    particleWidth = W;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var off = document.createElement("canvas");
    off.width = W * dpr;
    off.height = H * dpr;
    var octx = off.getContext("2d");
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var t1 = "TAUSIF SHAIKH";
    var size = Math.max(40, Math.min(140, W * 0.085));
    octx.font = "200 " + size + "px Inter, sans-serif";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillStyle = "#ffffff";
    var tw = octx.measureText(t1).width;
    var textWidthLimit = W < 560 ? W * 0.82 : W * 0.92;
    if (tw > textWidthLimit) {
      size = Math.max(20, Math.floor(size * textWidthLimit / tw));
      octx.font = "200 " + size + "px Inter, sans-serif";
    }
    var y1 = H * 0.48;
    octx.fillText(t1, W / 2, y1);

    var img = octx.getImageData(0, 0, off.width, off.height);
    var data = img.data;
    particles.length = 0;
    // Use a denser sample on phones so the smaller glyphs do not break apart.
    var sampleSpacing = W < 560 ? 1.5 : 3;
    var step = Math.max(2, Math.round(dpr * sampleSpacing));
    var colors = ["237,237,237", "237,237,237", "237,237,237", "64,196,99"];
    var max = W < 560 ? 18000 : 9000;
    for (var py = 0; py < off.height && particles.length < max; py += step) {
      for (var px = 0; px < off.width && particles.length < max; px += step) {
        var idx = (py * off.width + px) * 4;
        if (data[idx + 3] > 128) {
          particles.push({
            tx: px / dpr,
            ty: py / dpr,
            x: W / 2 + (Math.random() * 2 - 1) * W * 0.6,
            y: H / 2 + (Math.random() * 2 - 1) * H * 0.45,
            c: colors[(Math.random() * colors.length) | 0]
          });
        }
      }
    }
    if (!particles.length) {
      showFallbackText();
      return;
    }

    var dot = W < 560 ? 2 : 1.6;
    // Keep every particle the same whole-device-pixel size on high-DPI screens.
    dot = Math.max(1, Math.round(dot * dpr)) / dpr;
    var settleSpeed = W < 560 ? 0.014 : 0.05;
    var hoverSettleSpeed = 0.05;
    var start = performance.now();
    (function frame(now) {
      if (!document.body.contains(canvas)) return;
      ctx.clearRect(0, 0, W, H);
      var t = (now - start) / 1000;
      // whole-name float: slow bob + sideways drift so it feels alive
      var gy = Math.sin(t * 0.55) * 5;
      var gx = Math.cos(t * 0.4) * 3.5;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var movementSpeed = hovOn ? hoverSettleSpeed : settleSpeed;
        p.x += (p.tx - p.x) * movementSpeed;
        p.y += (p.ty - p.y) * movementSpeed;
        if (hovOn) {
          var hdx = p.x - hovX, hdy = p.y - hovY;
          var hd2 = hdx * hdx + hdy * hdy;
          var hR = 90;
          if (hd2 < hR * hR) {
            var hd = Math.sqrt(hd2) || 1;
            var hf = (1 - hd / hR) * 16;
            p.x += (hdx / hd) * hf;
            p.y += (hdy / hd) * hf;
          }
        }
        var settled = Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) < 2;
        var wavePhase = t * 1.8 + p.tx * 0.045;
        var fx = settled ? Math.sin(wavePhase) * 0.45 : 0;
        var fy = settled ? Math.sin(wavePhase) * 1.8 : Math.sin(t * 0.9 + p.tx * 0.015) * 1.4;
        ctx.fillStyle = "rgba(" + p.c + ",0.9)";
        var drawX = Math.round((p.x + fx + gx) * dpr) / dpr;
        var drawY = Math.round((p.y + fy + gy) * dpr) / dpr;
        ctx.fillRect(drawX, drawY, dot, dot);
      }
      particleRAF = requestAnimationFrame(frame);
    })(start);
  }

  function startParticles() {
    var booted = false;
    var boot = function () {
      if (booted) return;
      booted = true;
      try {
        initParticles();
      } catch (err) {
        showFallbackText();
      }
    };
    if (document.fonts && document.fonts.load) {
      var safety = setTimeout(boot, 900);
      document.fonts.ready.then(function () {
        clearTimeout(safety);
        boot();
      }).catch(boot);
    } else {
      boot();
    }
  }

  var particleResizeT = null;
  window.addEventListener("resize", function () {
    // Mobile browser chrome can resize the viewport height while loading.
    // Rebuilding targets for height-only changes keeps the name from restarting.
    if (preloader && !preloader.classList.contains("hidden") && window.innerWidth !== particleWidth) {
      clearTimeout(particleResizeT);
      particleResizeT = setTimeout(function () {
        stopParticles();
        initParticles();
      }, 200);
    }
  });

  function startSiteAnimations() {
    initReveals();
    initSkillFills();
  }

  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add("hidden");
    document.body.classList.add("site-ready");
    stopParticles();
    // remove from layout once fade completes so nothing sits on top of content
    setTimeout(function () {
      preloader.style.display = "none";
    }, 750);
    document.body.style.overflow = "";
  }

  var welcome = document.getElementById("preloaderWelcome");
  var enterBtn = document.getElementById("preloaderEnter");
  var preloaderBottom = document.querySelector(".preloader-bottom");
  var loadTarget = 0;
  var shownWelcome = false;

  function bumpLoadTarget(p) {
    if (p > loadTarget) loadTarget = p;
  }

  function continueToSite() {
    hidePreloader();
    startSiteAnimations();
  }

  function showWelcome() {
    if (shownWelcome) return;
    shownWelcome = true;
    if (welcome) welcome.classList.add("show");
    if (enterBtn) {
      enterBtn.focus();
    } else {
      // no button available: keep the welcome message briefly, then continue
      setTimeout(continueToSite, 900);
    }
  }

  function runPreloader() {
    if (!preloader) {
      continueToSite();
      return;
    }

    // Real load progress: DOM parsed -> fonts ready -> window load (100%)
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        bumpLoadTarget(0.7);
      });
    } else {
      bumpLoadTarget(0.7);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        bumpLoadTarget(0.85);
      }).catch(function () {});
    } else {
      bumpLoadTarget(0.8);
    }
    if (document.readyState === "complete") {
      bumpLoadTarget(1);
    } else {
      window.addEventListener("load", function () {
        bumpLoadTarget(1);
      });
    }

    if (enterBtn) {
      enterBtn.addEventListener("click", function () {
        if (shownWelcome) continueToSite();
      });
    }

    var progressStart = performance.now();
    var minDuration = 2000; // loading completes at 100% in ~2s

    (function progressTick() {
      var elapsed = performance.now() - progressStart;
      if (elapsed > 10000) bumpLoadTarget(1); // stall safety
      var ramped = Math.min(1, elapsed / minDuration);
      var pct = ramped >= 1 ? Math.round(loadTarget * 100) : Math.round(ramped * 100);
      if (countEl) countEl.textContent = pct + "%";
      if (ramped >= 1 && loadTarget >= 1) {
        preloader.classList.add("loading-complete");
        if (preloaderBottom) preloaderBottom.style.display = "none";
        showWelcome();
        return; // wait for the user to continue
      }
      setTimeout(progressTick, 60);
    })();
  }

  document.body.style.overflow = "hidden";
  startParticles();

  /* ---------- Letter-split headings ---------- */
  function splitIntoSpans(el) {
    var words = el.textContent.split(" ");
    el.textContent = "";
    words.forEach(function (word, wIndex) {
      var wSpan = document.createElement("span");
      wSpan.className = "w";
      for (var i = 0; i < word.length; i++) {
        var lSpan = document.createElement("span");
        lSpan.className = "l";
        lSpan.textContent = word[i];
        wSpan.appendChild(lSpan);
      }
      el.appendChild(wSpan);
      if (wIndex < words.length - 1) {
        var sp = document.createElement("span");
        sp.className = "sp";
        sp.innerHTML = "\u00A0";
        el.appendChild(sp);
      }
    });
  }

  function splitText(el) {
    var lines = [];
    Array.prototype.forEach.call(el.children, function (child) {
      if (child.classList && child.classList.contains("line")) {
        lines.push(child);
      }
    });
    if (lines.length) {
      // split only pure-text lines so styled spans (e.g. green dot) stay intact
      lines.forEach(function (line) {
        if (line.children.length === 0) splitIntoSpans(line);
      });
    } else {
      splitIntoSpans(el);
    }
  }

  document.querySelectorAll(".split-text").forEach(function (el) {
    splitText(el);
  });

  /* ---------- Reveal on scroll (starts after preloader) ---------- */
  function initReveals() {
    var revealEls = document.querySelectorAll(".reveal");
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            revealEl(entry.target);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
    // elements already in view animate right away with a soft stagger
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        animateReveal(el);
        revealObserver.unobserve(el);
      }
    });
  }

  function revealEl(el) {
    var delay = parseFloat(el.getAttribute("data-delay")) || 0;
    startReveal(el, delay);
  }

  function startReveal(el, delay) {
    el.style.transitionDelay = delay + "s";
    el.classList.add("visible");
    // clean up so the reveal transition can't slow down hover effects later
    setTimeout(function () {
      el.classList.remove("reveal", "visible");
      el.style.transitionDelay = "";
    }, 200 + (delay + 0.9) * 1000);
  }

  function animateReveal(el) {
    startReveal(el, parseFloat(el.getAttribute("data-delay")) || 0);
  }

  /* ---------- Skill bars (start after preloader) ---------- */
  function initSkillFills() {
    var fills = document.querySelectorAll(".skill-fill");
    var fillObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            activateFill(entry.target);
            fillObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    fills.forEach(function (el) {
      fillObserver.observe(el);
    });
    fills.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
        activateFill(el);
        fillObserver.unobserve(el);
      }
    });
  }

  function activateFill(el) {
    el.style.setProperty("--width", el.getAttribute("data-width") || "0%");
    el.classList.add("animate");
  }

  /* ---------- Re-check on resize: reveal anything now in view ---------- */
  var reflowTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(reflowTimer);
    reflowTimer = setTimeout(function () {
      document.querySelectorAll(".reveal").forEach(function (el) {
        if (el.classList.contains("visible")) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
          animateReveal(el);
        }
      });
      document.querySelectorAll(".skill-fill:not(.animate)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
          activateFill(el);
        }
      });
    }, 150);
  });

  /* ---------- Toast ---------- */
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message || "Coming soon";
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  /* ---------- Coming soon triggers ---------- */
  document.querySelectorAll(".js-coming-soon").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      showToast(btn.getAttribute("data-message") || "Coming soon");
    });
  });

  /* ---------- GitHub project cards: click card = open repo ---------- */
  document.querySelectorAll("[data-repo]").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("a")) return; // let title / Live links handle themselves
      var url = card.getAttribute("data-repo");
      if (url) window.open(url, "_blank", "noopener");
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.target.closest("a")) {
        e.preventDefault();
        var url = card.getAttribute("data-repo");
        if (url) window.open(url, "_blank", "noopener");
      }
    });
  });

  /* ---------- Copy email ---------- */
  var emailBtn = document.querySelector(".js-copy-email");
  if (emailBtn) {
    var copyLabel = emailBtn.querySelector(".email-copy");
    emailBtn.addEventListener("click", function () {
      var email = emailBtn.getAttribute("data-email") || "";
      var done = function () {
        if (copyLabel) copyLabel.textContent = "Copied!";
        setTimeout(function () {
          if (copyLabel) copyLabel.textContent = "Copy";
        }, 2000);
        showToast("Email copied");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done);
      } else {
        var aux = document.createElement("textarea");
        aux.value = email;
        document.body.appendChild(aux);
        aux.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          /* ignore */
        }
        document.body.removeChild(aux);
        done();
      }
    });
  }

  /* ---------- Mobile menu ---------- */
  var hamburger = document.getElementById("hamburger");
  var mobileMenu = document.getElementById("mobileMenu");

  function closeMenu() {
    if (hamburger) hamburger.classList.remove("open");
    if (mobileMenu) mobileMenu.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("open");
      hamburger.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = document.querySelectorAll(".nav-link");
  var sections = [];
  navLinks.forEach(function (link) {
    var id = link.getAttribute("href");
    if (id && id.charAt(0) === "#") {
      var sec = document.querySelector(id);
      if (sec) sections.push({ id: id.slice(1), link: link, el: sec });
    }
  });

  var secObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var current = entry.target.id;
          navLinks.forEach(function (l) {
            l.classList.toggle("active", l.getAttribute("href") === "#" + current);
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach(function (s) {
    secObserver.observe(s.el);
  });

  /* ---------- Kick off page animations ---------- */
  if (!preloader) {
    document.body.style.overflow = "";
    document.body.classList.add("site-ready");
    startSiteAnimations();
  } else {
    runPreloader();
  }

  /* ---------- Diagnostic (only when ?diag=1) ---------- */
  try {
    if (/\bdiag\b/.test(location.search)) {
      var snap = function () {
        var cv = canvas, offOK = true, alphaCount = 0;
        try {
          var c2 = document.createElement("canvas");
          c2.width = 4; c2.height = 4;
          c2.getContext("2d").fillRect(0, 0, 4, 4);
          alphaCount = c2.getContext("2d").getImageData(0, 0, 4, 4).data[3];
        } catch (e) { offOK = false; }
        fetch("diag?d=" + encodeURIComponent(JSON.stringify({
          ua: navigator.userAgent,
          cw: cv ? cv.width : 0,
          ch: cv ? cv.height : 0,
          cssW: window.innerWidth,
          cssH: window.innerHeight,
          dpr: window.devicePixelRatio,
          parts: particles.length,
          fallbackShown: !!(fallbackText && fallbackText.classList.contains("show")),
          fontsStatus: (document.fonts && document.fonts.status) || "n/a",
          getImageDataOK: offOK,
          alphaSample: alphaCount,
          welcomeShown: !!(preloaderWelcome && preloaderWelcome.classList.contains("show"))
        }))).catch(function () {});
      };
      setTimeout(snap, 1800);
      setTimeout(snap, 4500);
    }
  } catch (e) {}
})();