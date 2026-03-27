/* ============================================================
   ENIGME CORE SYSTEMS - enigme-core.js
   La Casa ENIGME - Honduras & Espana

   Systems:
   1. Currency Detection (EUR/HNL) - 1EUR = 31.50 HNL
   2. Cookie Consent + Admin Tracking
   3. Screenshot Detection + Message
   4. Source Code Protection
   5. Push Notifications
   6. Analytics (pages, favorites, cart, location)
   7. Email Notification System
   8. Admin Data Collection
   9. Security Headers
   ============================================================ */

(function () {
  "use strict";

  var ENIGME_CORE = window.ENIGME_CORE || {};
  var ADMIN_EMAIL = "carlosarmas@enigmeofficial.com";
  var TASA_CAMBIO = 31.50; // 1 EUR = 31.50 HNL

  // Supabase REST API helper
  var SUPA_URL = 'https://hajmyntnvurlcuwshjdd.supabase.co';
  var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhham15bnRudnVybGN1d3NoamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM2MjEsImV4cCI6MjA4ODU3OTYyMX0.XGF5wPX1sI9VgG11bnr41lCxeqTfFVHEhBIfBXXYAkw';
  function supaPost(table, data) {
    fetch(SUPA_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    }).catch(function(e) { console.warn('Supabase sync:', e); });
  }

  /* ==========================================================
     1. CURRENCY DETECTION SYSTEM
  ========================================================== */

  function detectCurrency() {
    var saved = localStorage.getItem("enigme_currency_detected");
    if (saved) {
      try {
        var data = JSON.parse(saved);
        // Re-check every 24 hours
        if (Date.now() - data.timestamp < 86400000) {
          applyCurrencySettings(data);
          return;
        }
      } catch (e) {}
    }

    fetch("https://ipapi.co/json/")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var settings = {
          country: data.country_code || "HN",
          city: data.city || "",
          region: data.region || "",
          currency: "HNL",
          symbol: "L",
          rate: 1,
          timestamp: Date.now()
        };

        if (data.country_code === "ES") {
          settings.currency = "EUR";
          settings.symbol = "\u20AC";
          settings.rate = 1 / TASA_CAMBIO; // HNL to EUR
        }

        localStorage.setItem("enigme_currency_detected", JSON.stringify(settings));
        applyCurrencySettings(settings);
        trackVisitorLocation(settings);
      })
      .catch(function () {
        var fallback = {
          country: "HN", city: "", region: "",
          currency: "HNL", symbol: "L", rate: 1,
          timestamp: Date.now()
        };
        localStorage.setItem("enigme_currency_detected", JSON.stringify(fallback));
        applyCurrencySettings(fallback);
      });
  }

  function applyCurrencySettings(settings) {
    localStorage.setItem("enigme_moneda", settings.currency);
    localStorage.setItem("enigme_simbolo", settings.symbol);
    localStorage.setItem("enigme_tasa", settings.rate);
    localStorage.setItem("enigme_pais", settings.country);

    // Convert all prices on page
    setTimeout(function () { convertAllPrices(); }, 500);
  }

  // Psychological pricing: make all display prices end in 9
  function psychologicalPrice(price) {
    var rounded = Math.round(price);
    if (rounded <= 0) return price; // Keep original if 0 or negative
    if (rounded < 10) return 9;
    var lastDigit = rounded % 10;
    if (lastDigit <= 4) {
      var result = rounded - lastDigit - 1;
      return result <= 0 ? 9 : result;
    } else if (lastDigit >= 5 && lastDigit < 9) {
      return rounded + (9 - lastDigit);
    }
    return rounded; // Already ends in 9
  }

  function convertAllPrices() {
    var rate = parseFloat(localStorage.getItem("enigme_tasa")) || 1;
    var symbol = localStorage.getItem("enigme_simbolo") || "L";
    if (rate === 1 && symbol === "L") return; // Already in HNL

    // Find all elements with data-price-hnl attribute
    var priceElements = document.querySelectorAll("[data-price-hnl]");
    priceElements.forEach(function (el) {
      var hnlPrice = parseFloat(el.getAttribute("data-price-hnl"));
      if (!isNaN(hnlPrice)) {
        var converted = hnlPrice * rate;
        var displayPrice = psychologicalPrice(converted);
        el.textContent = symbol + " " + displayPrice.toFixed(2);
      }
    });

    // Also convert prices in format "L XXX" or "L. XXX"
    var allPriceSpans = document.querySelectorAll(".precio, .price, .product-price, .cart-price, .total-price, .old-price, .price-old, .precio-tachado, .precio-anterior, .item-price, del, s, .summary-total span:last-child, #summary-total, #stripe-amount-notice");
    allPriceSpans.forEach(function (el) {
      if (el.hasAttribute("data-converted")) return;
      var text = el.textContent.trim();
      var match = text.match(/L\.?\s*([\d,]+(?:\.\d{2})?)/);
      if (match) {
        var hnlVal = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(hnlVal)) {
          var converted = hnlVal * rate;
          var displayPrice = psychologicalPrice(converted);
          el.textContent = symbol + " " + displayPrice.toFixed(2);
          el.setAttribute("data-converted", "true");
          el.setAttribute("data-original-hnl", hnlVal);
        }
      }
    });
  }

  function initPriceObserver() {
    if (typeof MutationObserver === "undefined") return;
    var observer = new MutationObserver(function(mutations) {
      var shouldConvert = false;
      mutations.forEach(function(m) {
        if (m.addedNodes.length > 0) shouldConvert = true;
      });
      if (shouldConvert) {
        setTimeout(function() { convertAllPrices(); }, 200);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function formatPrice(hnlAmount) {
    var rate = parseFloat(localStorage.getItem("enigme_tasa")) || 1;
    var symbol = localStorage.getItem("enigme_simbolo") || "L";
    var converted = (hnlAmount * rate).toFixed(2);
    return symbol + " " + converted;
  }

  function getOriginalHNL(displayAmount) {
    var rate = parseFloat(localStorage.getItem("enigme_tasa")) || 1;
    if (rate === 1) return displayAmount;
    return (displayAmount / rate).toFixed(2);
  }

  // Global price formatter accessible from other scripts
  window.ENIGME_FORMAT_PRICE = function(hnlAmount) {
    var rate = parseFloat(localStorage.getItem("enigme_tasa")) || 1;
    var symbol = localStorage.getItem("enigme_simbolo") || "L";
    var converted = hnlAmount * rate;
    var displayPrice = psychologicalPrice(converted);
    return symbol + " " + numberWithCommas(displayPrice.toFixed(2));
  };

  // Global receipt currency helper
  window.ENIGME_GET_RECEIPT_CURRENCY = function() {
    var currency = localStorage.getItem("enigme_moneda") || "HNL";
    var symbol = localStorage.getItem("enigme_simbolo") || "L";
    return { currency: currency, symbol: symbol };
  };

  function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  /* ==========================================================
     2. COOKIE CONSENT SYSTEM
  ========================================================== */

  function initCookieConsent() {
    var consent = localStorage.getItem("enigme_cookies_accepted");
    if (consent) return; // Already accepted or declined

    var overlay = document.createElement("div");
    overlay.id = "enigme-cookie-overlay";
    overlay.style.cssText =
      "position:fixed;bottom:0;left:0;right:0;z-index:99999;padding:0;" +
      "animation:enigmeCookieSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both;";

    overlay.innerHTML = [
      '<div style="background:linear-gradient(135deg,#1C1C1C 0%,#2A2A2A 100%);padding:clamp(20px,4vw,32px) clamp(20px,5vw,40px);',
      'border-top:2px solid #CBAA63;box-shadow:0 -20px 60px rgba(0,0,0,0.4);font-family:\'Montserrat\',sans-serif;">',
      '<div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:clamp(16px,3vw,32px);flex-wrap:wrap;">',
      '<div style="flex:1;min-width:280px;">',
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">',
      '<div style="width:36px;height:36px;background:#CBAA63;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="#1C1C1C"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
      '</div>',
      '<h3 style="font-family:\'Cinzel\',serif;font-size:clamp(0.9rem,1.5vw,1.1rem);color:#CBAA63;letter-spacing:2px;margin:0;">',
      'La Casa \u00C8NIGME</h3></div>',
      '<p style="font-size:clamp(0.72rem,1vw,0.82rem);color:rgba(255,255,255,0.75);line-height:1.7;font-weight:300;margin:0;">',
      'Utilizamos cookies propias para mejorar su experiencia de navegaci\u00F3n, ',
      'personalizar el contenido y analizar el tr\u00E1fico. Al continuar navegando, ',
      'acepta nuestra <a href="ley.html" style="color:#CBAA63;text-decoration:underline;">Pol\u00EDtica de Privacidad</a>.</p>',
      '</div>',
      '<div style="display:flex;gap:12px;flex-shrink:0;flex-wrap:wrap;">',
      '<button id="enigme-cookie-accept" style="padding:12px 28px;background:#CBAA63;color:#1C1C1C;border:none;',
      'font-family:\'Montserrat\',sans-serif;font-size:0.68rem;font-weight:600;letter-spacing:2px;text-transform:uppercase;',
      'cursor:pointer;transition:all 0.3s;border-radius:2px;">ACEPTAR</button>',
      '<button id="enigme-cookie-decline" style="padding:12px 28px;background:transparent;color:rgba(255,255,255,0.5);',
      'border:1px solid rgba(255,255,255,0.2);font-family:\'Montserrat\',sans-serif;font-size:0.68rem;font-weight:400;',
      'letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all 0.3s;border-radius:2px;">CONTINUAR SIN ACEPTAR</button>',
      '</div></div></div>'
    ].join("");

    // Inject animation
    if (!document.getElementById("enigme-cookie-styles")) {
      var style = document.createElement("style");
      style.id = "enigme-cookie-styles";
      style.textContent =
        "@keyframes enigmeCookieSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}" +
        "#enigme-cookie-accept:hover{background:#E8D090 !important;transform:scale(1.03);}" +
        "#enigme-cookie-decline:hover{color:rgba(255,255,255,0.8) !important;border-color:rgba(255,255,255,0.4) !important;}";
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    document.getElementById("enigme-cookie-accept").addEventListener("click", function () {
      localStorage.setItem("enigme_cookies_accepted", "true");
      localStorage.setItem("enigme_cookies_date", new Date().toISOString());
      trackCookieConsent(true);
      overlay.style.animation = "enigmeCookieSlideUp 0.4s reverse both";
      setTimeout(function () { overlay.remove(); }, 400);
      // Enable full tracking after consent
      initFullAnalytics();
      // After cookie consent, show notification consent separately
      initNotificationConsent();
    });

    document.getElementById("enigme-cookie-decline").addEventListener("click", function () {
      localStorage.setItem("enigme_cookies_accepted", "false");
      localStorage.setItem("enigme_cookies_date", new Date().toISOString());
      trackCookieConsent(false);
      overlay.style.animation = "enigmeCookieSlideUp 0.4s reverse both";
      setTimeout(function () { overlay.remove(); }, 400);
    });
  }

  function trackCookieConsent(accepted) {
    var STORAGE_KEY = "enigme_cookie_consents";
    var existing = [];
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) existing = JSON.parse(raw);
    } catch (e) { existing = []; }

    var locationData = {};
    try {
      locationData = JSON.parse(localStorage.getItem("enigme_currency_detected") || "{}");
    } catch (e) {}

    existing.push({
      timestamp: new Date().toISOString(),
      accepted: accepted,
      userAgent: navigator.userAgent,
      language: navigator.language,
      country: locationData.country || "desconocido",
      city: locationData.city || "desconocido",
      region: locationData.region || "desconocido",
      screenSize: window.innerWidth + "x" + window.innerHeight,
      referrer: document.referrer || "directo"
    });

    if (existing.length > 1000) existing = existing.slice(-1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    // Sync to Supabase
    supaPost('web_cookie_consents', {
      aceptado: accepted,
      user_agent: navigator.userAgent,
      idioma: navigator.language,
      pais: locationData.country || 'desconocido',
      ciudad: locationData.city || 'desconocido',
      region: locationData.region || 'desconocido',
      pantalla: window.innerWidth + 'x' + window.innerHeight,
      referrer: document.referrer || 'directo',
      pagina: window.location.pathname || window.location.href
    });
  }

  /* ==========================================================
     3. SCREENSHOT DETECTION
  ========================================================== */

  function initScreenshotDetection() {
    var isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Samsung|Huawei|Xiaomi/i.test(navigator.userAgent);
    var screenshotCooldown = 0;

    // Product pages where the "Compratelo" overlay should appear
    var productPages = ['joyeria.html', 'plata.html', 'liquidacion.html', 'boutique.html'];
    var currentPage = window.location.pathname.split('/').pop().toLowerCase();
    var isProductPage = productPages.indexOf(currentPage) !== -1;

    function triggerScreenshot(method) {
      var now = Date.now();
      if (now - screenshotCooldown < 3000) return; // 3s cooldown to avoid double triggers
      screenshotCooldown = now;
      if (isProductPage) {
        showScreenshotMessage();
      }
      trackScreenshot(method);
    }

    // Method 1: Detect PrintScreen key (desktop)
    document.addEventListener("keyup", function (e) {
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        triggerScreenshot("PrintScreen key");
      }
    });

    // Method 2: Detect Ctrl+Shift+S (Windows Snipping Tool) + Mac shortcuts
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "s" || e.key === "S" || e.keyCode === 83)) {
        triggerScreenshot("Snipping Tool shortcut");
      }
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.keyCode === 51 || e.keyCode === 52)) {
        triggerScreenshot("Mac screenshot");
      }
    });

    // Method 3: Visibility change - show message on mobile too
    var lastVisibilityChange = 0;
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        lastVisibilityChange = Date.now();
      } else {
        var elapsed = Date.now() - lastVisibilityChange;
        if (elapsed > 50 && elapsed < 2000) {
          if (isMobile) {
            triggerScreenshot("Mobile screenshot (visibility change)");
          } else {
            trackScreenshot("Possible screenshot (visibility change)");
          }
        }
      }
    });

    // Method 4: iOS screenshot detection (blur + focus rapid succession)
    var lastBlurTime = 0;
    window.addEventListener("blur", function () {
      lastBlurTime = Date.now();
    });
    window.addEventListener("focus", function () {
      var elapsed = Date.now() - lastBlurTime;
      if (lastBlurTime > 0 && elapsed > 30 && elapsed < 800) {
        triggerScreenshot("iOS screenshot (blur+focus)");
      }
      lastBlurTime = 0;
    });

    // Method 5: Android screenshot detection (resize event)
    var lastResizeTime = 0;
    window.addEventListener("resize", function () {
      lastResizeTime = Date.now();
    });
    window.addEventListener("focus", function () {
      var elapsed = Date.now() - lastResizeTime;
      if (lastResizeTime > 0 && elapsed > 20 && elapsed < 800) {
        triggerScreenshot("Android screenshot (resize+focus)");
      }
      lastResizeTime = 0;
    });

    // Method 6: Samsung/Huawei/Xiaomi - touchend + immediate blur pattern
    if (isMobile) {
      var lastTouchEnd = 0;
      document.addEventListener("touchend", function () {
        lastTouchEnd = Date.now();
      });
      window.addEventListener("blur", function () {
        var elapsed = Date.now() - lastTouchEnd;
        // Some OEMs trigger blur right after palm swipe screenshot gesture
        if (lastTouchEnd > 0 && elapsed > 100 && elapsed < 600) {
          setTimeout(function () {
            // Confirm with a focus check - if focus returns quickly it was screenshot
            if (Date.now() - lastTouchEnd < 2000) {
              triggerScreenshot("Mobile gesture screenshot (touch+blur)");
            }
          }, 500);
        }
      });

      // Method 7: Screen capture API detection (modern mobile browsers)
      if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
        try {
          navigator.mediaDevices.addEventListener("devicechange", function () {
            triggerScreenshot("Screen capture API change");
          });
        } catch (e) {}
      }
    }
  }

  function showScreenshotMessage() {
    // Remove existing
    var existing = document.getElementById("enigme-screenshot-msg");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.id = "enigme-screenshot-msg";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;" +
      "background:rgba(28,28,28,0.92);backdrop-filter:blur(12px);" +
      "animation:enigmeScreenshotFadeIn 0.4s ease both;font-family:'Montserrat',sans-serif;cursor:pointer;";

    overlay.innerHTML = [
      '<div style="text-align:center;padding:40px;max-width:500px;animation:enigmeScreenshotScale 0.5s cubic-bezier(0.34,1.56,0.64,1) both;">',
      '<div style="width:70px;height:70px;margin:0 auto 24px;border:2px solid #CBAA63;border-radius:50%;',
      'display:flex;align-items:center;justify-content:center;">',
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="#CBAA63"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
      '</div>',
      '<h2 style="font-family:\'Cinzel\',serif;font-size:clamp(1.4rem,3vw,2rem);color:#CBAA63;letter-spacing:0.15em;margin-bottom:16px;">',
      'C\u00F3mpratelo</h2>',
      '<p style="font-size:clamp(1rem,2vw,1.3rem);color:#FFFFFF;font-weight:300;line-height:1.6;margin-bottom:8px;">',
      'Te lo mereces.</p>',
      '<p style="font-size:clamp(0.85rem,1.5vw,1.1rem);color:rgba(255,255,255,0.6);font-weight:200;font-style:italic;margin-bottom:28px;">',
      '\u00C8NIGME es para ti.</p>',
      '<div style="width:60px;height:1px;background:#CBAA63;margin:0 auto 24px;"></div>',
      '<a href="catalogo.html" style="display:inline-block;padding:14px 36px;background:#CBAA63;color:#1C1C1C;',
      'font-size:0.7rem;font-weight:600;letter-spacing:3px;text-transform:uppercase;text-decoration:none;',
      'transition:all 0.3s;border-radius:2px;" ',
      'onmouseover="this.style.background=\'#E8D090\'" onmouseout="this.style.background=\'#CBAA63\'">',
      'VER CAT\u00C1LOGO</a>',
      '</div>'
    ].join("");

    // Inject animations
    if (!document.getElementById("enigme-screenshot-styles")) {
      var style = document.createElement("style");
      style.id = "enigme-screenshot-styles";
      style.textContent =
        "@keyframes enigmeScreenshotFadeIn{from{opacity:0}to{opacity:1}}" +
        "@keyframes enigmeScreenshotScale{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}";
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        overlay.style.opacity = "0";
        overlay.style.transition = "opacity 0.3s";
        setTimeout(function () { overlay.remove(); }, 300);
      }
    });

    // Auto-dismiss after 6 seconds
    setTimeout(function () {
      if (document.getElementById("enigme-screenshot-msg")) {
        overlay.style.opacity = "0";
        overlay.style.transition = "opacity 0.3s";
        setTimeout(function () { overlay.remove(); }, 300);
      }
    }, 6000);
  }

  function trackScreenshot(method) {
    var STORAGE_KEY = "enigme_screenshots";
    var existing = [];
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) existing = JSON.parse(raw);
    } catch (e) { existing = []; }

    var locationData = {};
    try {
      locationData = JSON.parse(localStorage.getItem("enigme_currency_detected") || "{}");
    } catch (e) {}

    existing.push({
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      pageTitle: document.title,
      method: method,
      country: locationData.country || "desconocido",
      city: locationData.city || "desconocido",
      userAgent: navigator.userAgent,
      screenSize: window.innerWidth + "x" + window.innerHeight
    });

    if (existing.length > 1000) existing = existing.slice(-1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    // Sync screenshot event to Supabase
    var ua = navigator.userAgent;
    var dispositivo = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
    var navegador = /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : /Edge/i.test(ua) ? 'Edge' : 'Otro';
    supaPost('web_analytics', {
      tipo_evento: 'screenshot',
      pagina: window.location.pathname || window.location.href,
      pais: locationData.country || 'desconocido',
      ciudad: locationData.city || 'desconocido',
      dispositivo: dispositivo,
      navegador: navegador,
      metodo_screenshot: method
    });
  }

  /* ==========================================================
     4. SOURCE CODE PROTECTION
  ========================================================== */

  function initSourceProtection() {
    // Disable right-click context menu
    document.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      showProtectionToast();
      return false;
    });

    // Disable keyboard shortcuts for viewing source
    document.addEventListener("keydown", function (e) {
      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        showProtectionToast();
        return false;
      }
      // Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        showProtectionToast();
        return false;
      }
      // Ctrl+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        showProtectionToast();
        return false;
      }
      // Ctrl+Shift+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        showProtectionToast();
        return false;
      }
      // F12
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        showProtectionToast();
        return false;
      }
      // Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S") && !e.shiftKey) {
        e.preventDefault();
        return false;
      }
    });

    // Disable text selection on images and sensitive content
    var style = document.createElement("style");
    style.textContent =
      "img{-webkit-user-drag:none;user-drag:none;}" +
      ".no-select{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;}";
    document.head.appendChild(style);

    // Disable drag on images
    document.addEventListener("dragstart", function (e) {
      if (e.target.tagName === "IMG") {
        e.preventDefault();
        return false;
      }
    });
  }

  function showProtectionToast() {
    var existing = document.getElementById("enigme-protection-toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.id = "enigme-protection-toast";
    toast.style.cssText =
      "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.9);z-index:999999;" +
      "background:rgba(28,28,28,0.95);color:#CBAA63;padding:24px 36px;border:1px solid #CBAA63;" +
      "font-family:'Montserrat',sans-serif;font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;" +
      "text-align:center;backdrop-filter:blur(10px);opacity:0;transition:all 0.3s ease;border-radius:2px;" +
      "box-shadow:0 20px 60px rgba(0,0,0,0.5);";
    toast.innerHTML = '<div style="font-family:\'Cinzel\',serif;font-size:1.1rem;margin-bottom:8px;letter-spacing:3px;">\u00C8NIGME</div>' +
      '<div style="color:rgba(255,255,255,0.7);font-weight:300;font-size:0.65rem;">Contenido protegido por derechos de autor</div>';

    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.style.opacity = "1";
      toast.style.transform = "translate(-50%,-50%) scale(1)";
    });

    setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%,-50%) scale(0.9)";
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  /* ==========================================================
     5. PUSH NOTIFICATIONS SYSTEM
  ========================================================== */

  function initNotifications() {
    if (!("Notification" in window)) return;

    // Schedule periodic notifications if already granted
    if (Notification.permission === "granted") {
      scheduleNotifications();
    }
  }

  // Separate notification consent flow - called after cookie consent or on its own
  function initNotificationConsent() {
    if (localStorage.getItem("enigme_push_consent")) return;
    if (!("Notification" in window)) return;

    // Wait 5 seconds after page load, then show consent
    setTimeout(function() {
      if (localStorage.getItem("enigme_push_consent")) return;
      showNotificationBanner();
    }, 5000);
  }

  function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (localStorage.getItem("enigme_push_consent")) return;
    showNotificationBanner();
  }

  function showNotificationBanner() {
    // Don't show if already showing
    if (document.getElementById("enigme-notif-consent")) return;

    var banner = document.createElement("div");
    banner.id = "enigme-notif-consent";
    banner.style.cssText =
      "position:fixed;bottom:0;left:0;right:0;z-index:99998;padding:0;" +
      "animation:enigmeNotifSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both;";

    banner.innerHTML = [
      '<div style="background:linear-gradient(135deg,#1C1C1C 0%,#2A2A2A 100%);padding:clamp(20px,4vw,32px) clamp(20px,5vw,40px);',
      'border-top:2px solid #CBAA63;box-shadow:0 -20px 60px rgba(0,0,0,0.4);font-family:\'Montserrat\',sans-serif;">',
      '<div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:clamp(16px,3vw,32px);flex-wrap:wrap;">',
      '<div style="flex:1;min-width:280px;">',
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">',
      '<div style="width:36px;height:36px;background:linear-gradient(135deg,#CBAA63,#E8D9A0);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(203,170,99,0.3);">',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="#1C1C1C"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
      '</div>',
      '<h3 style="font-family:\'Cinzel\',serif;font-size:clamp(0.9rem,1.5vw,1.1rem);color:#CBAA63;letter-spacing:2px;margin:0;">',
      'Notificaciones \u00C8NIGME</h3></div>',
      '<p style="font-size:clamp(0.72rem,1vw,0.82rem);color:rgba(255,255,255,0.75);line-height:1.7;font-weight:300;margin:0;">',
      'Activa notificaciones de \u00C8NIGME para recibir novedades, ofertas y recordatorios.</p>',
      '</div>',
      '<div style="display:flex;gap:12px;flex-shrink:0;flex-wrap:wrap;">',
      '<button id="enigme-notif-accept" style="padding:12px 28px;background:linear-gradient(135deg,#CBAA63,#E8D9A0);color:#1C1C1C;border:none;',
      'font-family:\'Montserrat\',sans-serif;font-size:0.68rem;font-weight:600;letter-spacing:2px;text-transform:uppercase;',
      'cursor:pointer;transition:all 0.3s;border-radius:2px;box-shadow:0 4px 12px rgba(203,170,99,0.3);">ACTIVAR</button>',
      '<button id="enigme-notif-decline" style="padding:12px 28px;background:transparent;color:rgba(255,255,255,0.5);',
      'border:1px solid rgba(255,255,255,0.2);font-family:\'Montserrat\',sans-serif;font-size:0.68rem;font-weight:400;',
      'letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all 0.3s;border-radius:2px;">NO, GRACIAS</button>',
      '</div></div></div>'
    ].join("");

    // Inject animation styles
    if (!document.getElementById("enigme-notif-styles")) {
      var style = document.createElement("style");
      style.id = "enigme-notif-styles";
      style.textContent =
        "@keyframes enigmeNotifSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}" +
        "#enigme-notif-accept:hover{background:linear-gradient(135deg,#E8D9A0,#CBAA63) !important;transform:scale(1.03);box-shadow:0 6px 20px rgba(203,170,99,0.4) !important;}" +
        "#enigme-notif-decline:hover{color:rgba(255,255,255,0.8) !important;border-color:rgba(255,255,255,0.4) !important;}";
      document.head.appendChild(style);
    }

    document.body.appendChild(banner);

    document.getElementById("enigme-notif-accept").addEventListener("click", function () {
      localStorage.setItem("enigme_push_consent", "accepted");
      // Now request the real browser notification permission
      Notification.requestPermission().then(function (perm) {
        if (perm === "granted") {
          scheduleNotifications();
          // Welcome notification
          new Notification("\u00C8NIGME", {
            body: "Bienvenido/a al mundo \u00C8NIGME. Recibir\u00E1 novedades exclusivas.",
            icon: "monograma.png",
            badge: "monograma.png"
          });
        }
        // Save push subscription to Supabase
        var locationData = {};
        try { locationData = JSON.parse(localStorage.getItem("enigme_currency_detected") || "{}"); } catch(e) {}
        supaPost('web_push_suscripciones', {
          permiso: perm,
          user_agent: navigator.userAgent,
          pais: locationData.country || 'desconocido',
          ciudad: locationData.city || 'desconocido',
          pagina: window.location.pathname || window.location.href
        });
      });
      banner.style.animation = "enigmeNotifSlideUp 0.4s reverse both";
      setTimeout(function () { banner.remove(); }, 400);
    });

    document.getElementById("enigme-notif-decline").addEventListener("click", function () {
      localStorage.setItem("enigme_push_consent", "declined");
      banner.style.animation = "enigmeNotifSlideUp 0.4s reverse both";
      setTimeout(function () { banner.remove(); }, 400);
    });
  }

  function scheduleNotifications() {
    if (Notification.permission !== "granted") return;

    // Check if 24 hours have passed since last notification
    var lastNotif = parseInt(localStorage.getItem("enigme_last_notif") || "0");
    var now = Date.now();
    var TWENTY_FOUR_HOURS = 86400000;

    if (now - lastNotif < TWENTY_FOUR_HOURS) return;

    // Send notification based on cart/favorites state
    var cart = [];
    var favs = [];
    try { cart = JSON.parse(localStorage.getItem("enigme_cart") || "[]"); } catch(e) {}
    try { favs = JSON.parse(localStorage.getItem("enigme_favs") || "[]"); } catch(e) {}

    var elegantMessages = [
      { title: "\u00C8NIGME \u2022 Colecci\u00F3n Exclusiva", body: "Nuevas piezas de alta joyer\u00EDa le esperan. Descubra lo \u00FAltimo en elegancia." },
      { title: "\u00C8NIGME \u2022 Distinci\u00F3n", body: "El lujo no espera. Explore nuestras colecciones antes de que se agoten." },
      { title: "\u00C8NIGME \u2022 Invitaci\u00F3n Privada", body: "Ha sido seleccionado/a para descubrir nuestra colecci\u00F3n m\u00E1s exclusiva." },
      { title: "\u00C8NIGME \u2022 Novedades", body: "Piezas \u00FAnicas acaban de llegar. Sea de los primeros en verlas." }
    ];

    var cartMessages = [
      { title: "\u00C8NIGME \u2022 Su Selecci\u00F3n Privada", body: "Tiene " + cart.length + " pieza(s) exclusiva(s) en su bolsa. Aseg\u00FArela antes de que el precio cambie." },
      { title: "\u00C8NIGME \u2022 Reserva Temporal", body: "Sus art\u00EDculos no estar\u00E1n disponibles para siempre. Complete su pedido y disfrute del lujo." },
      { title: "\u00C8NIGME \u2022 Oportunidad \u00DAnica", body: "Los precios de su selecci\u00F3n podr\u00EDan ajustarse pr\u00F3ximamente. Efect\u00FAe su compra ahora." }
    ];

    var favMessages = [
      { title: "\u00C8NIGME \u2022 Sus Favoritos", body: "Tiene " + favs.length + " pieza(s) guardada(s). No deje escapar lo que le enamor\u00F3." },
      { title: "\u00C8NIGME \u2022 Piezas Reservadas", body: "Sus favoritos siguen disponibles, pero la exclusividad tiene l\u00EDmite. Haga su movimiento." }
    ];

    var msg;
    if (cart.length > 0) {
      msg = cartMessages[Math.floor(Math.random() * cartMessages.length)];
    } else if (favs.length > 0) {
      msg = favMessages[Math.floor(Math.random() * favMessages.length)];
    } else {
      msg = elegantMessages[Math.floor(Math.random() * elegantMessages.length)];
    }

    try {
      new Notification(msg.title, {
        body: msg.body,
        icon: "monograma.png",
        badge: "monograma.png",
        vibrate: [100, 50, 100]
      });
    } catch(e) {}

    localStorage.setItem("enigme_last_notif", String(now));

    // Schedule next check in 24 hours (will fire if page is still open)
    setTimeout(function() { scheduleNotifications(); }, TWENTY_FOUR_HOURS);

    // Register service worker with push capabilities for offline notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(function(reg) {
        // Check if push subscription exists
        reg.pushManager.getSubscription().then(function(sub) {
          if (!sub) {
            // Subscribe for push
            reg.pushManager.subscribe({ userVisibleOnly: true }).catch(function(){});
          }
        });
      });
    }
  }

  /* ==========================================================
     6. ANALYTICS SYSTEM
  ========================================================== */

  function initFullAnalytics() {
    trackPageVisit();
    trackSessionData();
  }

  function trackPageVisit() {
    var STORAGE_KEY = "enigme_page_visits";
    var visits = [];
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) visits = JSON.parse(raw);
    } catch (e) { visits = []; }

    var locationData = {};
    try {
      locationData = JSON.parse(localStorage.getItem("enigme_currency_detected") || "{}");
    } catch (e) {}

    visits.push({
      timestamp: new Date().toISOString(),
      page: window.location.pathname || window.location.href,
      pageTitle: document.title,
      referrer: document.referrer || "directo",
      country: locationData.country || "desconocido",
      city: locationData.city || "desconocido",
      region: locationData.region || "desconocido",
      userAgent: navigator.userAgent,
      screenSize: window.innerWidth + "x" + window.innerHeight,
      language: navigator.language
    });

    if (visits.length > 2000) visits = visits.slice(-2000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));

    // Sync page visit to Supabase
    var ua = navigator.userAgent;
    var dispositivo = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
    var navegador = /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : /Edge/i.test(ua) ? 'Edge' : 'Otro';
    supaPost('web_analytics', {
      tipo_evento: 'page_visit',
      pagina: window.location.pathname || window.location.href,
      titulo_pagina: document.title,
      referrer: document.referrer || 'directo',
      pais: locationData.country || 'desconocido',
      ciudad: locationData.city || 'desconocido',
      region: locationData.region || 'desconocido',
      dispositivo: dispositivo,
      navegador: navegador,
      pantalla: window.innerWidth + 'x' + window.innerHeight,
      idioma: navigator.language
    });
  }

  function trackSessionData() {
    var STORAGE_KEY = "enigme_sessions";
    var sessionId = sessionStorage.getItem("enigme_session_id");
    if (!sessionId) {
      sessionId = "SES-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6);
      sessionStorage.setItem("enigme_session_id", sessionId);
    }

    var sessions = [];
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) sessions = JSON.parse(raw);
    } catch (e) { sessions = []; }

    var locationData = {};
    try {
      locationData = JSON.parse(localStorage.getItem("enigme_currency_detected") || "{}");
    } catch (e) {}

    // Check if session already exists
    var found = false;
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].sessionId === sessionId) {
        sessions[i].pagesVisited++;
        sessions[i].lastPage = window.location.pathname;
        sessions[i].lastActivity = new Date().toISOString();
        found = true;
        break;
      }
    }

    if (!found) {
      sessions.push({
        sessionId: sessionId,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        firstPage: window.location.pathname,
        lastPage: window.location.pathname,
        pagesVisited: 1,
        country: locationData.country || "desconocido",
        city: locationData.city || "desconocido",
        region: locationData.region || "desconocido",
        userAgent: navigator.userAgent,
        screenSize: window.innerWidth + "x" + window.innerHeight
      });
    }

    if (sessions.length > 500) sessions = sessions.slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  function trackVisitorLocation(settings) {
    var STORAGE_KEY = "enigme_visitor_locations";
    var locations = [];
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) locations = JSON.parse(raw);
    } catch (e) { locations = []; }

    locations.push({
      timestamp: new Date().toISOString(),
      country: settings.country,
      city: settings.city,
      region: settings.region,
      currency: settings.currency
    });

    if (locations.length > 1000) locations = locations.slice(-1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  }

  /* ==========================================================
     7. EMAIL NOTIFICATION SYSTEM (via form submission)
  ========================================================== */

  function sendEmailNotification(subject, body) {
    // Use a hidden form to send data to formsubmit.co (free service)
    var formUrl = "https://formsubmit.co/ajax/" + ADMIN_EMAIL;

    fetch(formUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        _subject: "[ENIGME] " + subject,
        message: body,
        _template: "table"
      })
    }).catch(function () {
      // Silent fail - don't disrupt user experience
    });
  }

  function notifyNewOrder(orderData) {
    var body = "NUEVO PEDIDO ENIGME\n\n" +
      "Pedido: " + (orderData.orderId || "") + "\n" +
      "Cliente: " + (orderData.clientName || "") + "\n" +
      "Email: " + (orderData.clientEmail || "") + "\n" +
      "Telefono: " + (orderData.clientPhone || "") + "\n" +
      "Departamento: " + (orderData.department || "") + "\n" +
      "Direccion: " + (orderData.address || "") + "\n" +
      "Productos: " + (orderData.items || []).map(function (i) { return i.name + " x" + i.qty; }).join(", ") + "\n" +
      "Total: L " + (orderData.total || "0") + "\n" +
      "Metodo de pago: " + (orderData.paymentMethod || "") + "\n" +
      "Fecha: " + new Date().toLocaleString("es-HN");

    sendEmailNotification("Nuevo Pedido " + (orderData.orderId || ""), body);
  }

  /* ==========================================================
     8. SECURITY & ANTI-INSPECTION
  ========================================================== */

  function initSecurityMeasures() {
    // Console warning
    var warningStyle = "color:#CBAA63;font-size:20px;font-weight:bold;font-family:serif;";
    var textStyle = "color:#888;font-size:12px;";
    console.log("%c\u00C8NIGME", warningStyle);
    console.log("%cEste sitio est\u00E1 protegido. El acceso no autorizado al c\u00F3digo fuente est\u00E1 prohibido.", textStyle);
    console.log("%c\u00A9 2026 La Casa \u00C8NIGME Honduras. Todos los derechos reservados.", textStyle);

    // Clear console periodically
    setInterval(function () {
      if (typeof console.clear === "function") {
        // Only clear if DevTools might be open
        var threshold = 100;
        var widthDiff = window.outerWidth - window.innerWidth;
        var heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > threshold || heightDiff > threshold) {
          console.clear();
          console.log("%c\u00C8NIGME - Contenido Protegido", warningStyle);
        }
      }
    }, 3000);
  }

  /* ==========================================================
     9. SERVICE WORKER REGISTRATION (for PWA + offline)
  ========================================================== */

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {
        // Silent fail
      });
    }
  }

  /* ==========================================================
     INITIALIZATION
  ========================================================== */

  function initAll() {
    detectCurrency();
    initPriceObserver();
    initCookieConsent();
    initScreenshotDetection();
    initSourceProtection();
    initSecurityMeasures();
    initNotifications();
    initNotificationConsent();
    initFullAnalytics();
    initNavAutoHide();
  }

  // Wait for DOM
  if (document.readyState !== "loading") {
    initAll();
  } else {
    document.addEventListener("DOMContentLoaded", initAll);
  }

  /* ==========================================================
     10. AUTO-HIDE NAV ITEMS (Atención, Trabaja con Nosotros)
  ========================================================== */

  function initNavAutoHide() {
    var hideTimeout;
    var hiddenItems = [];

    // Find items to auto-hide: Atención dropdown and "Trabaja" link
    var allDropdowns = document.querySelectorAll(".dropdown");
    allDropdowns.forEach(function(dd) {
      var btn = dd.querySelector(".dropbtn");
      if (btn && /ATENCI/i.test(btn.textContent)) {
        hiddenItems.push(dd);
      }
    });

    // Find "Trabaja con Nosotros" link
    var allNavLinks = document.querySelectorAll(".nav-link, a.nav-link");
    allNavLinks.forEach(function(link) {
      if (/TRABAJA/i.test(link.textContent)) {
        hiddenItems.push(link);
      }
    });

    if (hiddenItems.length === 0) return;

    // Add transition CSS
    var style = document.createElement("style");
    style.textContent = ".nav-auto-hide{transition:opacity 0.4s ease,transform 0.4s ease,max-width 0.4s ease,padding 0.4s ease,margin 0.4s ease;overflow:hidden;}" +
      ".nav-auto-hide.nav-hidden{opacity:0;transform:scale(0.8);max-width:0 !important;padding-left:0 !important;padding-right:0 !important;margin-left:0 !important;margin-right:0 !important;pointer-events:none;}";
    document.head.appendChild(style);

    hiddenItems.forEach(function(el) {
      el.classList.add("nav-auto-hide");
    });

    function hideItems() {
      hiddenItems.forEach(function(el) {
        el.classList.add("nav-hidden");
      });
    }

    function showItems() {
      hiddenItems.forEach(function(el) {
        el.classList.remove("nav-hidden");
      });
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(hideItems, 4000);
    }

    // Initially hide after 3 seconds
    hideTimeout = setTimeout(hideItems, 3000);

    // Show on any interaction
    document.addEventListener("touchstart", showItems, { passive: true });
    document.addEventListener("scroll", showItems, { passive: true });
    document.addEventListener("mousemove", function() {
      // Only show on significant mouse movement near navbar
      var navbar = document.querySelector(".navbar");
      if (navbar) {
        showItems();
      }
    }, { passive: true });
  }

  /* ==========================================================
     GLOBAL EXPORTS
  ========================================================== */

  ENIGME_CORE.formatPrice = formatPrice;
  ENIGME_CORE.getOriginalHNL = getOriginalHNL;
  ENIGME_CORE.convertAllPrices = convertAllPrices;
  ENIGME_CORE.sendEmailNotification = sendEmailNotification;
  ENIGME_CORE.notifyNewOrder = notifyNewOrder;
  ENIGME_CORE.trackScreenshot = trackScreenshot;
  ENIGME_CORE.showScreenshotMessage = showScreenshotMessage;
  ENIGME_CORE.detectCurrency = detectCurrency;
  ENIGME_CORE.requestNotificationPermission = requestNotificationPermission;
  ENIGME_CORE.TASA_CAMBIO = TASA_CAMBIO;
  window.ENIGME_CORE = ENIGME_CORE;

  // ══════════════════════════════════════════════════
  //  MOBILE DROPDOWN TOGGLE (click/touch for all pages)
  // ══════════════════════════════════════════════════
  function initMobileDropdowns() {
    if (window.innerWidth > 768) return;
    var dropbtns = document.querySelectorAll('.dropbtn');
    if (!dropbtns.length) return;
    dropbtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var dropdown = btn.closest('.dropdown');
        if (!dropdown) return;
        var content = dropdown.querySelector('.dropdown-content');
        if (!content) return;
        var isOpen = content.style.opacity === '1';
        // Close all dropdowns first
        document.querySelectorAll('.dropdown-content').forEach(function(dc) {
          dc.style.opacity = '0';
          dc.style.visibility = 'hidden';
          dc.style.transform = 'translateY(15px)';
        });
        if (!isOpen) {
          content.style.opacity = '1';
          content.style.visibility = 'visible';
          content.style.transform = 'translateY(0)';
        }
      });
    });
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(function(dc) {
          dc.style.opacity = '0';
          dc.style.visibility = 'hidden';
          dc.style.transform = 'translateY(15px)';
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileDropdowns);
  } else {
    initMobileDropdowns();
  }
  // Also re-init on resize in case user rotates device
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) initMobileDropdowns();
  });

})();
