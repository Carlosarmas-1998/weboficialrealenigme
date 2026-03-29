/* ============================================================
   ENIGME SHARED SYSTEMS - enigme-shared.js
   La Casa ENIGME Honduras
   All-in-one: Order IDs, PDF Receipts, Abril Chatbot,
   Fade Observer, Favorites/Cart Analytics
   ============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     CSS VARIABLES & CONSTANTS
  ---------------------------------------------------------- */
  const COLORS = {
    marfil: "#FAF9F6",
    carbon: "#1C1C1C",
    dorado: "#CBAA63",
    blancoDior: "#FFFFFF",
    doradoClaro: "#E8D9A0",
    doradoOscuro: "#A88C3F",
    grisClaro: "#F0EFEC",
    grisMedio: "#8C8C8C",
  };

  /* ==========================================================
     1. UNIQUE ORDER ID GENERATOR
  ========================================================== */
  function generateOrderId() {
    var STORAGE_KEY = "enigme_order_counter";
    var current = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    current += 1;
    localStorage.setItem(STORAGE_KEY, current.toString());
    var padded = String(current).padStart(5, "0");
    return "AAC301222-" + padded;
  }

  /* ==========================================================
     2. PDF RECEIPT GENERATOR (jsPDF)
  ========================================================== */

  // Psychological pricing: display prices ending in 9 (matches enigme-core.js)
  function psychologicalPrice(price) {
    var rounded = Math.round(price);
    if (rounded <= 0) return price;
    if (rounded < 10) return 9;
    var lastDigit = rounded % 10;
    if (lastDigit <= 4) {
      var result = rounded - lastDigit - 1;
      return result <= 0 ? 9 : result;
    } else if (lastDigit >= 5 && lastDigit < 9) {
      return rounded + (9 - lastDigit);
    }
    return rounded;
  }

  function generateOrderPDF(orderData) {
    if (typeof window.jspdf === "undefined" && typeof window.jsPDF === "undefined") {
      alert("Error: jsPDF no est\u00e1 cargado. Aseg\u00farate de incluir la librer\u00eda.");
      return null;
    }

    var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    var pageW = doc.internal.pageSize.getWidth();
    var marginL = 20;
    var marginR = 20;
    var contentW = pageW - marginL - marginR;
    var y = 0;

    // Get currency info for receipt
    var receiptCurrency = (typeof window.ENIGME_GET_RECEIPT_CURRENCY === "function")
      ? window.ENIGME_GET_RECEIPT_CURRENCY()
      : { currency: "HNL", symbol: "L" };
    var currSymbol = receiptCurrency.symbol;
    var currRate = parseFloat(localStorage.getItem("enigme_tasa")) || 1;
    var currLocale = receiptCurrency.currency === "EUR" ? "es-ES" : "es-HN";

    // --- Luxury gold header band ---
    doc.setFillColor(203, 170, 99);
    doc.rect(0, 0, pageW, 38, "F");

    // Brand name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("\u00C8NIGME", pageW / 2, 18, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("LA CASA \u00C8NIGME \u00B7 HONDURAS Y ESPA\u00D1A", pageW / 2, 26, { align: "center" });

    // Thin gold line below header
    y = 38;
    doc.setDrawColor(203, 170, 99);
    doc.setLineWidth(0.5);
    doc.line(marginL, y + 2, pageW - marginR, y + 2);
    y += 8;

    // --- Title ---
    doc.setTextColor(28, 28, 28);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("JUSTIFICANTE DE PEDIDO", pageW / 2, y, { align: "center" });
    y += 10;

    // --- Order ID box ---
    doc.setFillColor(250, 249, 246);
    doc.setDrawColor(203, 170, 99);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginL, y, contentW, 14, 2, 2, "FD");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(203, 170, 99);
    doc.text("N\u00ba Pedido: " + (orderData.orderId || ""), pageW / 2, y + 6, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Fecha: " + (orderData.date || new Date().toLocaleDateString(currLocale)), pageW / 2, y + 11, { align: "center" });
    y += 20;

    // --- Client Info ---
    doc.setFillColor(250, 249, 246);
    doc.roundedRect(marginL, y, contentW, 30, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(203, 170, 99);
    doc.text("DATOS DEL CLIENTE", marginL + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(28, 28, 28);
    doc.setFontSize(9);
    var clientY = y + 12;
    doc.text("Nombre: " + (orderData.clientName || ""), marginL + 4, clientY);
    doc.text("Email: " + (orderData.clientEmail || ""), marginL + 4, clientY + 5);
    doc.text("Tel\u00e9fono: " + (orderData.clientPhone || ""), pageW / 2, clientY);
    doc.text("Departamento: " + (orderData.department || ""), pageW / 2, clientY + 5);
    doc.text("Direcci\u00f3n: " + (orderData.address || "").substring(0, 60), marginL + 4, clientY + 10);
    y += 36;

    // --- Products Table ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(203, 170, 99);
    doc.text("DETALLE DE PRODUCTOS", marginL + 4, y);
    y += 4;

    // Table header
    doc.setFillColor(28, 28, 28);
    doc.rect(marginL, y, contentW, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");

    var colRef = marginL + 2;
    var colProd = marginL + 28;
    var colQty = marginL + 100;
    var colUnit = marginL + 118;
    var colSub = marginL + 145;

    doc.text("REF", colRef, y + 5.5);
    doc.text("PRODUCTO", colProd, y + 5.5);
    doc.text("CANT.", colQty, y + 5.5);
    doc.text("P. UNIT.", colUnit, y + 5.5);
    doc.text("SUBTOTAL", colSub, y + 5.5);
    y += 8;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(28, 28, 28);
    doc.setFontSize(8);

    var items = orderData.items || [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var rowColor = i % 2 === 0 ? [255, 255, 255] : [250, 249, 246];
      doc.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
      doc.rect(marginL, y, contentW, 7, "F");

      doc.text(String(item.ref || "").substring(0, 12), colRef, y + 5);
      doc.text(String(item.name || "").substring(0, 38), colProd, y + 5);
      doc.text(String(item.qty || 1), colQty + 4, y + 5);
      var unitPriceRaw = parseFloat(item.price || 0) * currRate;
      var unitPrice = (currRate !== 1) ? psychologicalPrice(unitPriceRaw) : unitPriceRaw;
      doc.text(currSymbol + " " + unitPrice.toFixed(2), colUnit, y + 5);
      var subtotal = (item.qty || 1) * unitPrice;
      doc.text(currSymbol + " " + subtotal.toFixed(2), colSub, y + 5);
      y += 7;

      if (y > 250) {
        doc.addPage();
        y = 20;
      }
    }

    // Bottom border of table
    doc.setDrawColor(203, 170, 99);
    doc.setLineWidth(0.4);
    doc.line(marginL, y, pageW - marginR, y);
    y += 4;

    // --- Subtotal (sin línea de Total separada) ---
    y += 4;

    // --- Payment Method ---
    doc.setTextColor(28, 28, 28);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("M\u00e9todo de pago: ", marginL, y);
    doc.setFont("helvetica", "normal");
    doc.text(orderData.paymentMethod || "No especificado", marginL + 32, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Direcci\u00f3n de entrega: ", marginL, y);
    doc.setFont("helvetica", "normal");
    doc.text((orderData.address || "").substring(0, 70), marginL + 38, y);
    y += 12;

    // --- Gold divider ---
    doc.setDrawColor(203, 170, 99);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 6;

    // --- Certificate note ---
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.setFont("helvetica", "italic");
    doc.text("Este documento es su justificante de compra. Cons\u00e9rvelo para cualquier consulta o reclamaci\u00f3n.", pageW / 2, y, { align: "center" });
    y += 4;
    doc.text("Todos nuestros productos incluyen certificado de autenticidad.", pageW / 2, y, { align: "center" });

    // --- Footer ---
    var footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFillColor(28, 28, 28);
    doc.rect(0, footerY - 4, pageW, 16, "F");
    doc.setTextColor(203, 170, 99);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("La Casa \u00C8NIGME Honduras y Espa\u00F1a \u2014 Todos los derechos reservados", pageW / 2, footerY + 2, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text("www.enigme.hn \u00B7 contacto@enigme.hn \u00B7 +504 0000-0000", pageW / 2, footerY + 7, { align: "center" });

    return doc;
  }

  /* --- PDF Modal --- */
  function showPDFModal(pdfDoc) {
    if (!pdfDoc) return;

    // Remove existing modal
    var existing = document.getElementById("enigme-pdf-modal");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.id = "enigme-pdf-modal";
    overlay.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(28,28,28,0.85);" +
      "z-index:100000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);" +
      "animation:enigmeFadeIn .3s ease;font-family:'Montserrat',sans-serif;";

    var modal = document.createElement("div");
    modal.style.cssText =
      "background:#FFFFFF;border-radius:12px;width:90%;max-width:440px;padding:40px 36px;" +
      "text-align:center;position:relative;box-shadow:0 24px 80px rgba(0,0,0,0.35);";

    // Close button
    var closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText =
      "position:absolute;top:14px;right:18px;background:none;border:none;font-size:28px;" +
      "color:#8C8C8C;cursor:pointer;line-height:1;transition:color .2s;";
    closeBtn.onmouseenter = function () { this.style.color = "#1C1C1C"; };
    closeBtn.onmouseleave = function () { this.style.color = "#8C8C8C"; };
    closeBtn.onclick = function () { overlay.remove(); };

    // Title
    var title = document.createElement("h2");
    title.textContent = "\u00C8NIGME";
    title.style.cssText =
      "font-family:'Cinzel',serif;font-size:24px;color:#1C1C1C;margin:0 0 4px 0;letter-spacing:3px;";

    var subtitle = document.createElement("p");
    subtitle.textContent = "Su justificante est\u00e1 listo";
    subtitle.style.cssText = "font-size:13px;color:#8C8C8C;margin:0 0 28px 0;";

    // Gold divider
    var divider = document.createElement("div");
    divider.style.cssText = "width:60px;height:2px;background:#CBAA63;margin:0 auto 28px auto;";

    // Buttons container
    var btnContainer = document.createElement("div");
    btnContainer.style.cssText = "display:flex;flex-direction:column;gap:12px;";

    function createModalBtn(text, isPrimary) {
      var btn = document.createElement("button");
      btn.textContent = text;
      btn.style.cssText =
        "padding:14px 24px;border-radius:8px;font-family:'Montserrat',sans-serif;font-size:13px;" +
        "font-weight:600;letter-spacing:1.5px;cursor:pointer;transition:all .25s ease;" +
        "text-transform:uppercase;border:" +
        (isPrimary ? "none;background:#1C1C1C;color:#CBAA63;" : "1.5px solid #1C1C1C;background:transparent;color:#1C1C1C;");
      btn.onmouseenter = function () {
        if (isPrimary) { this.style.background = "#CBAA63"; this.style.color = "#1C1C1C"; }
        else { this.style.background = "#1C1C1C"; this.style.color = "#CBAA63"; }
      };
      btn.onmouseleave = function () {
        if (isPrimary) { this.style.background = "#1C1C1C"; this.style.color = "#CBAA63"; }
        else { this.style.background = "transparent"; this.style.color = "#1C1C1C"; }
      };
      return btn;
    }

    var downloadBtn = createModalBtn("Descargar PDF", true);
    downloadBtn.onclick = function () {
      pdfDoc.save("ENIGME-Pedido.pdf");
    };

    var printBtn = createModalBtn("Imprimir", false);
    printBtn.onclick = function () {
      var blob = pdfDoc.output("blob");
      var url = URL.createObjectURL(blob);
      var win = window.open(url);
      if (win) {
        win.onload = function () { win.print(); };
      }
    };

    var shareBtn = createModalBtn("Compartir", false);
    shareBtn.onclick = function () {
      if (navigator.share) {
        var blob = pdfDoc.output("blob");
        var file = new File([blob], "ENIGME-Pedido.pdf", { type: "application/pdf" });
        navigator.share({ title: "\u00C8NIGME - Justificante de Pedido", files: [file] }).catch(function () {});
      } else {
        var blobAlt = pdfDoc.output("blob");
        var urlAlt = URL.createObjectURL(blobAlt);
        var a = document.createElement("a");
        a.href = urlAlt;
        a.download = "ENIGME-Pedido.pdf";
        a.click();
      }
    };

    btnContainer.appendChild(downloadBtn);
    btnContainer.appendChild(printBtn);
    btnContainer.appendChild(shareBtn);

    modal.appendChild(closeBtn);
    modal.appendChild(title);
    modal.appendChild(subtitle);
    modal.appendChild(divider);
    modal.appendChild(btnContainer);
    overlay.appendChild(modal);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  }

  /* ==========================================================
     3. ABRIL VIRTUAL ASSISTANT
  ========================================================== */

  /* --- Knowledge Base (200+ Q&A pairs) --- */
  var ABRIL_KB = [
    /* ======== PRODUCTS: Alta Joyeria ======== */
    { k: ["colecci", "coleccion", "colecciones", "catalogo", "lineas"], r: "En \u00C8NIGME contamos con cuatro colecciones principales: Alta Joyer\u00eda (piezas exclusivas en oro 14K y piedras preciosas), Boutique Bolsos (bolsos de dise\u00f1ador), Plata de Ley 925 (joyer\u00eda en plata esterlina) y nuestra secci\u00f3n de Liquidaci\u00f3n con precios especiales." },
    { k: ["alta joyeria", "alta joyer\u00eda", "joyeria alta", "exclusiv"], r: "Nuestra colecci\u00f3n de Alta Joyer\u00eda presenta piezas \u00fanicas elaboradas en oro de 14 kilates con piedras preciosas seleccionadas a mano. Cada pieza viene con certificado de autenticidad." },
    { k: ["boutique bolsos", "bolsos boutique", "bolsos dise\u00f1ador"], r: "La Boutique Bolsos ofrece una selecci\u00f3n curada de bolsos de alta gama. Cada bolso es seleccionado por su calidad, dise\u00f1o y exclusividad." },
    { k: ["plata 925", "plata de ley", "plata esterlina", "sterling"], r: "Nuestra l\u00ednea Plata de Ley 925 ofrece joyer\u00eda elegante y accesible en plata esterlina certificada. Todas las piezas llevan el sello 925 que garantiza su pureza." },
    { k: ["liquidaci\u00f3n", "liquidacion", "oferta", "descuento", "rebaja", "promoci\u00f3n", "promocion"], r: "En nuestra secci\u00f3n de Liquidaci\u00f3n encontrar\u00e1s piezas seleccionadas con descuentos especiales. Son ediciones limitadas o \u00faltimas unidades, \u00a1no dejes pasar la oportunidad!" },
    { k: ["oro 14k", "oro 14", "oro catorce", "quilate", "kilate"], r: "Trabajamos con oro de 14 kilates (14K), que ofrece el equilibrio perfecto entre pureza y durabilidad. Nuestro oro es certificado y cada pieza incluye documentaci\u00f3n de autenticidad." },
    { k: ["plata", "silver", "925"], r: "Nuestra plata es de Ley 925, tambi\u00e9n conocida como plata esterlina. Contiene 92.5% de plata pura, lo que garantiza calidad, brillo y durabilidad superior." },
    { k: ["acero", "acero inoxidable", "stainless"], r: "Tambi\u00e9n ofrecemos piezas en acero inoxidable quir\u00fargico de alta calidad. Es hipoalerg\u00e9nico, resistente al agua y mantiene su brillo por mucho m\u00e1s tiempo." },
    { k: ["material", "materiales", "de qu\u00e9 est\u00e1", "hecho de"], r: "Nuestros materiales principales son: Oro 14K, Plata de Ley 925 y Acero Inoxidable quir\u00fargico. Tambi\u00e9n utilizamos piedras preciosas naturales, circones AAA y perlas cultivadas." },
    { k: ["precio", "precios", "rango de precio", "cu\u00e1nto cuesta", "cuanto cuesta", "caro", "barato", "econ\u00f3mic"], r: "Nuestros precios var\u00edan seg\u00fan la colecci\u00f3n: Plata 925 desde L. 350, Acero Inoxidable desde L. 200, y Alta Joyer\u00eda en Oro 14K desde L. 3,500. Todos los precios est\u00e1n en Lempiras hondure\u00f1os." },
    { k: ["anillo", "anillos", "sortija"], r: "Tenemos una hermosa selecci\u00f3n de anillos en oro 14K, plata 925 y acero inoxidable. Disponibles en tallas del 5 al 12. Te recomiendo medir tu dedo con un hilo para encontrar tu talla perfecta." },
    { k: ["collar", "collares", "cadena", "cadenas", "gargantilla"], r: "Nuestros collares y cadenas est\u00e1n disponibles en diferentes largos: gargantilla (35-40cm), princesa (43-48cm) y \u00f3pera (70-90cm). En oro 14K, plata 925 y acero." },
    { k: ["pulsera", "pulseras", "brazalete"], r: "Ofrecemos pulseras y brazaletes en todas nuestras l\u00edneas. Desde delicadas cadenas hasta brazaletes statement. Ajustables y en tallas est\u00e1ndar." },
    { k: ["arete", "aretes", "pendiente", "pendientes", "zarcillo"], r: "Nuestros aretes van desde elegantes studs hasta llamativos pendientes colgantes. Todos con cierre seguro y en materiales hipoalerg\u00e9nicos." },
    { k: ["bolso", "bolsos", "cartera", "carteras", "handbag", "bag", "mochila"], r: "La Boutique Bolsos presenta una colecci\u00f3n curada de bolsos de alta gama. Desde clutches elegantes hasta totes espaciosos. Cada bolso es seleccionado por su calidad y exclusividad." },
    { k: ["talla", "tallas", "medida", "medidas", "tamano", "tama\u00f1o", "size"], r: "Para anillos manejamos tallas 5 a 12. Para collares: 35cm a 90cm. Para pulseras: 16cm a 21cm. Si necesitas ayuda para medir, te puedo guiar paso a paso." },
    { k: ["regalo", "regalar", "obsequio", "gift", "presente"], r: "Todas nuestras piezas pueden enviarse como regalo. Incluimos empaque de lujo \u00C8NIGME sin costo adicional, y podemos agregar una tarjeta personalizada con tu mensaje." },
    { k: ["empaque", "caja", "estuche", "packaging", "presentaci\u00f3n"], r: "Cada pieza \u00C8NIGME viene en nuestro exclusivo empaque de lujo: caja forrada en terciopelo negro con detalles dorados, bolsa de regalo y certificado de autenticidad." },
    { k: ["nuevo", "nueva", "nuevos", "nuevas", "novedades", "reci\u00e9n llegado", "recien", "tendencia"], r: "Actualizamos nuestras colecciones regularmente con las \u00faltimas tendencias internacionales. Te invito a visitar nuestra secci\u00f3n de Novedades en la tienda o seguirnos en redes sociales para ver lo m\u00e1s reciente." },
    { k: ["limitad", "edici\u00f3n limitada", "exclusiv", "unic"], r: "Frecuentemente lanzamos ediciones limitadas con pocas unidades disponibles. Estas piezas \u00fanicas son muy codiciadas. S\u00edguenos en redes sociales para no perd\u00e9rtelas." },
    { k: ["piedra", "piedras", "gema", "gemas", "diamante", "rubi", "esmeralda", "zafiro"], r: "Trabajamos con piedras preciosas naturales certificadas: diamantes, rub\u00edes, esmeraldas y zafiros en nuestra l\u00ednea de Alta Joyer\u00eda. Tambi\u00e9n utilizamos circones AAA de alta calidad." },
    { k: ["circon", "circonia", "zirconia", "cz"], r: "Nuestros circones son de calidad AAA, con corte y brillo excepcional. Son una alternativa elegante y accesible a los diamantes, con un resplandor impresionante." },
    { k: ["perla", "perlas", "pearl"], r: "Ofrecemos piezas con perlas cultivadas de agua dulce de alta calidad. Cada perla es seleccionada por su lustre, forma y color." },
    { k: ["grabado", "personali", "nombre", "iniciales"], r: "Algunas de nuestras piezas pueden personalizarse con grabado. Consulta la disponibilidad de grabado en la descripci\u00f3n del producto o cont\u00e1ctanos por WhatsApp." },
    { k: ["hombre", "masculin", "caballero", "el", "para \u00e9l"], r: "Tenemos una selecci\u00f3n de joyer\u00eda para caballero: cadenas, pulseras y anillos en acero inoxidable y plata 925 con dise\u00f1os masculinos y elegantes." },
    { k: ["mujer", "femeni", "dama", "ella", "para ella"], r: "Nuestra colecci\u00f3n femenina es la m\u00e1s amplia: desde piezas delicadas y minimalistas hasta joyas statement. En oro, plata y acero, con y sin piedras." },
    { k: ["cuidado", "cuidar", "limpiar", "limpieza", "mantenimiento", "conservar"], r: "Para cuidar tus joyas \u00C8NIGME: evita el contacto con perfumes y cremas, gu\u00e1rdalas por separado, l\u00edmpialas con un pa\u00f1o suave. El oro y la plata pueden limpiarse con agua tibia y jab\u00f3n neutro." },
    { k: ["cuidado oro", "limpiar oro", "oro cuidado"], r: "Para cuidar el oro 14K: l\u00edmpialo con agua tibia y jab\u00f3n neutro, seca con pa\u00f1o suave, evita cloro y qu\u00edmicos fuertes, ret\u00edralo antes de hacer ejercicio o dormir." },
    { k: ["cuidado plata", "limpiar plata", "plata negra", "plata oscura", "oxidada"], r: "La plata 925 puede oscurecerse naturalmente. L\u00edmpiala con bicarbonato y agua, o usa un pa\u00f1o especial para plata. Gu\u00e1rdala en bolsa herm\u00e9tica para evitar la oxidaci\u00f3n." },
    { k: ["cuidado acero", "limpiar acero"], r: "El acero inoxidable es el m\u00e1s f\u00e1cil de mantener. L\u00edmpialo con agua y jab\u00f3n. Es resistente al agua y no se oxida, pero evita golpes fuertes para mantener su acabado." },
    { k: ["cuidado bolso", "limpiar bolso", "mantener bolso"], r: "Para cuidar tu bolso: evita exponerlo a la lluvia prolongada, gu\u00e1rdalo relleno para mantener su forma, l\u00edmpialo con un pa\u00f1o h\u00famedo y usa protector de cuero si aplica." },
    { k: ["garant\u00eda joyer\u00eda", "garant\u00eda joyas", "durabilidad"], r: "Todas nuestras joyas incluyen garant\u00eda de calidad. El oro 14K y la plata 925 son materiales duraderos que, con el cuidado adecuado, durar\u00e1n toda la vida." },
    { k: ["hipoalerg", "alergia", "al\u00e9rgic", "sensible", "piel"], r: "Nuestros materiales son hipoalerg\u00e9nicos: el oro 14K, la plata 925 y el acero inoxidable quir\u00fargico son seguros para pieles sensibles." },
    { k: ["tendencia 2024", "tendencia 2025", "moda", "estilo", "trend"], r: "Las tendencias actuales incluyen joyer\u00eda minimalista, capas de collares (layering), anillos apilables y mezcla de metales. En \u00C8NIGME tenemos piezas para cada tendencia." },
    { k: ["set", "conjunto", "juego", "combo"], r: "Ofrecemos sets coordinados de collar + aretes + pulsera a precios especiales. Son perfectos para regalo o para completar tu look. Consulta los sets disponibles en nuestra tienda." },
    { k: ["boda", "novia", "compromiso", "matrimonio", "nupcial"], r: "Tenemos una selecci\u00f3n especial para novias y compromisos. Desde anillos de compromiso en oro 14K con diamante, hasta sets nupciales completos. Consulta con nosotros para piezas personalizadas." },
    { k: ["quince a\u00f1os", "quincea\u00f1era", "15 a\u00f1os", "xv a\u00f1os"], r: "Para quincea\u00f1eras tenemos sets especiales con tiara, collar, aretes y pulsera. Podemos crear el set perfecto para ese d\u00eda tan especial. \u00a1Consulta nuestras opciones!" },
    { k: ["bautizo", "comuni\u00f3n", "confirmaci\u00f3n", "religios"], r: "Ofrecemos joyer\u00eda para ocasiones religiosas: cruces, medallas de santos, pulseras de bautizo y m\u00e1s, en plata 925 y oro 14K." },
    { k: ["recomend", "suger", "qu\u00e9 me recomienda", "elegir", "escoger", "asesor"], r: "Con gusto te asesoro. Cu\u00e9ntame: \u00bfes para ti o para regalo? \u00bfQu\u00e9 ocasi\u00f3n? \u00bfPrefieres oro, plata o acero? Con esos datos puedo darte la mejor recomendaci\u00f3n." },
    { k: ["popular", "m\u00e1s vendido", "favorito", "best seller"], r: "Nuestras piezas m\u00e1s populares incluyen los collares de capa en plata 925, los anillos solitario en oro 14K y los aretes tipo huggie. \u00a1Son los favoritos de nuestras clientas!" },
    { k: ["certificado", "autenticidad", "garant\u00eda", "genuino", "real", "original"], r: "Cada pieza \u00C8NIGME incluye certificado de autenticidad que garantiza la calidad y pureza de los materiales. Es tu respaldo de que est\u00e1s adquiriendo joyer\u00eda genuina." },

    /* ======== SHIPPING & DELIVERY ======== */
    { k: ["env\u00edo", "envio", "env\u00edos", "envios", "despacho", "entrega", "delivery", "mandar", "llevar"], r: "Realizamos env\u00edos a los departamentos de Choluteca, Valle, Francisco Moraz\u00e1n (Tegucigalpa) y Cort\u00e9s (San Pedro Sula). El tiempo de entrega var\u00eda seg\u00fan tu ubicaci\u00f3n." },
    { k: ["choluteca"], r: "En Choluteca, nuestro departamento base, la entrega es en 1-2 d\u00edas h\u00e1biles. El costo de env\u00edo es el m\u00e1s bajo de todas nuestras zonas de cobertura." },
    { k: ["valle", "nacaome", "san lorenzo", "amapala"], r: "Para el departamento de Valle (Nacaome, San Lorenzo, Amapala), la entrega es en 1-3 d\u00edas h\u00e1biles. Coordinaremos el punto de entrega m\u00e1s conveniente para ti." },
    { k: ["tegucigalpa", "francisco moraz\u00e1n", "francisco morazan", "capital", "tgu", "tegus"], r: "Para Tegucigalpa y Francisco Moraz\u00e1n, la entrega es en 2-4 d\u00edas h\u00e1biles. Trabajamos con servicios de mensajer\u00eda confiables para garantizar tu pedido." },
    { k: ["san pedro sula", "cort\u00e9s", "cortes", "sps"], r: "Para San Pedro Sula y Cort\u00e9s, la entrega es en 3-5 d\u00edas h\u00e1biles. Tu paquete viaja con total seguridad y seguimiento." },
    { k: ["tiempo entrega", "cu\u00e1nto tarda", "cuanto tarda", "d\u00edas h\u00e1biles", "demora", "cuando llega"], r: "Los tiempos de entrega son: Choluteca 1-2 d\u00edas, Valle 1-3 d\u00edas, Tegucigalpa 2-4 d\u00edas, San Pedro Sula 3-5 d\u00edas h\u00e1biles. Pueden variar en temporada alta." },
    { k: ["costo env\u00edo", "costo envio", "precio env\u00edo", "cargo envio", "flete", "shipping cost"], r: "El costo de env\u00edo var\u00eda seg\u00fan tu departamento. En algunos casos, pedidos mayores a cierto monto tienen env\u00edo gratis. Consulta el costo exacto al momento de tu compra." },
    { k: ["env\u00edo gratis", "envio gratis", "free shipping", "sin cargo"], r: "Peri\u00f3dicamente ofrecemos env\u00edo gratis en pedidos que superen un monto m\u00ednimo. Mant\u00e9nte atento a nuestras promociones en redes sociales y en la p\u00e1gina." },
    { k: ["rastreo", "rastrear", "seguimiento", "tracking", "d\u00f3nde est\u00e1 mi pedido", "donde esta mi pedido"], r: "Una vez despachado tu pedido, te enviaremos un n\u00famero de seguimiento por WhatsApp o email para que puedas rastrear tu paquete en todo momento." },
    { k: ["paquete", "empaque env\u00edo", "c\u00f3mo llega", "protecci\u00f3n", "seguro"], r: "Tu pedido viaja protegido en nuestro empaque de lujo \u00C8NIGME, dentro de una caja resistente con relleno protector. Aseguramos que llegue en perfectas condiciones." },
    { k: ["coordinar entrega", "horario entrega", "dejar con alguien", "recibir"], r: "Coordinamos la entrega contigo v\u00eda WhatsApp. Puedes indicar horario preferido, si deseas que alguien m\u00e1s reciba el paquete, o un punto de referencia para la direcci\u00f3n." },
    { k: ["devoluci\u00f3n", "devolucion", "devolver", "retorno", "regresar", "return"], r: "Aceptamos devoluciones dentro de los primeros 7 d\u00edas naturales posteriores a la recepci\u00f3n, siempre que el producto est\u00e9 sin uso y en su empaque original. Cont\u00e1ctanos por WhatsApp para iniciar el proceso." },
    { k: ["cambio", "cambiar", "intercambiar", "exchange", "talla equivocada"], r: "Puedes solicitar un cambio de talla o producto dentro de los primeros 7 d\u00edas. El producto debe estar sin uso y en su empaque original. El env\u00edo del cambio corre por cuenta del cliente." },
    { k: ["da\u00f1ado", "defecto", "roto", "defectuoso", "lleg\u00f3 mal"], r: "Si tu producto lleg\u00f3 da\u00f1ado o con defecto, cont\u00e1ctanos inmediatamente por WhatsApp con fotos. Lo reemplazaremos sin costo alguno. Tu satisfacci\u00f3n es nuestra prioridad." },
    { k: ["cobertura", "zona", "a d\u00f3nde env\u00edan", "departamentos", "ciudades"], r: "Actualmente cubrimos: Choluteca, Valle, Francisco Moraz\u00e1n (Tegucigalpa) y Cort\u00e9s (San Pedro Sula). Estamos trabajando para expandir nuestra cobertura a m\u00e1s departamentos." },
    { k: ["internacional", "fuera de honduras", "otro pa\u00eds", "centroam\u00e9rica", "usa", "estados unidos"], r: "Por el momento solo realizamos env\u00edos dentro de Honduras. Estamos evaluando opciones de env\u00edo internacional para el futuro. \u00a1Mantente atenta a nuestras novedades!" },
    { k: ["recogida", "recoger", "pick up", "pasar a buscar", "sucursal"], r: "Por el momento operamos exclusivamente en l\u00ednea con env\u00edo a domicilio. No contamos con tienda f\u00edsica para recogida, pero estamos trabajando en ello." },
    { k: ["empaque discreto", "discreto", "privacidad"], r: "Si lo prefieres, podemos enviar tu pedido en empaque discreto sin marcas visibles del exterior. Solo ind\u00edcalo al momento de realizar tu pedido." },
    { k: ["mensajer\u00eda", "courier", "empresa de env\u00edo"], r: "Trabajamos con servicios de mensajer\u00eda confiables y verificados para cada zona. Seleccionamos el mejor servicio seg\u00fan tu departamento para garantizar rapidez y seguridad." },
    { k: ["d\u00eda festivo", "feriado", "semana santa", "navidad", "fin de a\u00f1o"], r: "Durante d\u00edas festivos y temporadas altas, los tiempos de entrega pueden extenderse 1-2 d\u00edas adicionales. Te mantendremos informado del estado de tu pedido en todo momento." },
    { k: ["urgente", "express", "r\u00e1pido", "rapido", "hoy mismo", "prisa"], r: "Para pedidos urgentes en Choluteca, podemos ofrecer entrega el mismo d\u00eda o al d\u00eda siguiente seg\u00fan disponibilidad. Para otras zonas, consulta las opciones express por WhatsApp." },
    { k: ["pedido no llega", "no ha llegado", "retrasado", "retraso", "perdido"], r: "Si tu pedido presenta retraso, por favor cont\u00e1ctanos por WhatsApp con tu n\u00famero de pedido. Investigaremos de inmediato y te daremos una soluci\u00f3n. \u00a1Tu tranquilidad es importante!" },
    { k: ["segunda entrega", "no estaba", "reintento"], r: "Si no pudimos entregarte en el primer intento, coordinaremos un segundo env\u00edo. Por favor aseg\u00farate de estar disponible o designar a alguien para recibir." },
    { k: ["verificar direcci\u00f3n", "direcci\u00f3n incorrecta", "cambiar direcci\u00f3n"], r: "Si necesitas corregir la direcci\u00f3n de entrega, cont\u00e1ctanos lo antes posible por WhatsApp. Si el pedido a\u00fan no ha sido despachado, podremos actualizar la informaci\u00f3n." },
    { k: ["rural", "aldea", "caser\u00edo", "pueblo peque\u00f1o"], r: "Hacemos nuestro mejor esfuerzo por llegar a zonas rurales dentro de nuestros departamentos de cobertura. Los tiempos pueden ser mayores. Coordinaremos contigo el punto m\u00e1s accesible." },
    { k: ["comprobante entrega", "firma", "confirmaci\u00f3n entrega"], r: "Al recibir tu pedido, nuestro mensajero solicitar\u00e1 una confirmaci\u00f3n de entrega. Tambi\u00e9n te enviaremos una notificaci\u00f3n por WhatsApp confirmando que tu paquete fue entregado." },
    { k: ["varios pedidos", "dos pedidos", "combinar"], r: "Si realizas m\u00faltiples pedidos, podemos combinarlos en un solo env\u00edo para ahorrarte costos. Cont\u00e1ctanos por WhatsApp antes del despacho para coordinarlo." },
    { k: ["fragil", "fr\u00e1gil", "cuidado env\u00edo"], r: "Todas nuestras joyas se env\u00edan con m\u00e1xima protecci\u00f3n: estuche acolchado, caja r\u00edgida y etiqueta de fr\u00e1gil. Los bolsos viajan en su dust bag protector dentro de caja reforzada." },

    /* ======== PAYMENT ======== */
    { k: ["pago", "pagar", "forma de pago", "m\u00e9todo de pago", "metodo de pago", "payment", "c\u00f3mo pago", "como pago"], r: "Aceptamos tres m\u00e9todos de pago: tarjeta de cr\u00e9dito/d\u00e9bito v\u00eda Stripe (pago seguro en l\u00ednea), pedido por WhatsApp con transferencia bancaria, o dep\u00f3sito directo." },
    { k: ["tarjeta", "visa", "mastercard", "cr\u00e9dito", "d\u00e9bito", "card", "stripe"], r: "Aceptamos todas las tarjetas Visa y Mastercard (cr\u00e9dito y d\u00e9bito) a trav\u00e9s de Stripe, la plataforma de pagos m\u00e1s segura del mundo. Tu informaci\u00f3n est\u00e1 100% protegida." },
    { k: ["whatsapp pago", "pedir por whatsapp", "whatsapp order", "pago whatsapp"], r: "Puedes hacer tu pedido por WhatsApp y pagar mediante transferencia bancaria o dep\u00f3sito. Te enviaremos los datos de la cuenta y confirmaremos al recibir tu comprobante." },
    { k: ["transferencia", "dep\u00f3sito", "deposito", "banco", "bancaria", "cuenta"], r: "Aceptamos transferencias y dep\u00f3sitos bancarios. Al elegir este m\u00e9todo, te proporcionaremos los datos de nuestra cuenta. Env\u00eda el comprobante por WhatsApp para confirmar tu pedido." },
    { k: ["seguro", "seguridad", "segura", "confiable", "encriptado", "ssl", "protecci\u00f3n datos"], r: "Tu seguridad es nuestra prioridad. Los pagos con tarjeta se procesan a trav\u00e9s de Stripe con encriptaci\u00f3n SSL de 256 bits. Nunca almacenamos los datos de tu tarjeta." },
    { k: ["lempira", "moneda", "divisa", "d\u00f3lar", "currency", "hnl"], r: "Todos nuestros precios est\u00e1n en Lempiras hondure\u00f1os (HNL). Los pagos con tarjeta internacional se convierten autom\u00e1ticamente al tipo de cambio vigente." },
    { k: ["cuota", "cuotas", "plazo", "financiamiento", "mensualidad", "tasa cero"], r: "El financiamiento en cuotas depende de tu banco emisor. Algunas tarjetas permiten diferir a meses sin intereses. Consulta con tu banco las opciones disponibles." },
    { k: ["factura", "fiscal", "recibo", "comprobante", "tax"], r: "Generamos un justificante de pedido digital con cada compra. Si necesitas factura fiscal, sol\u00edcitala al momento de tu compra proporcionando tu RTN." },
    { k: ["reembolso", "devoluci\u00f3n dinero", "me devuelven", "regreso de dinero", "refund"], r: "Los reembolsos se procesan dentro de 5-10 d\u00edas h\u00e1biles una vez aprobada la devoluci\u00f3n. Para pagos con tarjeta, el reembolso llega a tu cuenta. Para transferencias, se devuelve a la cuenta de origen." },
    { k: ["cobro doble", "cargo extra", "cargo adicional", "cobro incorrecto"], r: "Si detectas un cobro incorrecto, cont\u00e1ctanos inmediatamente por WhatsApp. Investigaremos y resolveremos la situaci\u00f3n. Stripe es muy seguro y los cobros dobles son extremadamente raros." },
    { k: ["efectivo", "cash", "contra entrega", "al recibir"], r: "Por el momento no manejamos pago en efectivo ni contra entrega. Nuestros m\u00e9todos disponibles son tarjeta (Stripe), transferencia bancaria y dep\u00f3sito." },
    { k: ["paypal"], r: "Actualmente no aceptamos PayPal. Nuestros m\u00e9todos de pago disponibles son: tarjeta v\u00eda Stripe, transferencia bancaria y dep\u00f3sito. Evaluamos incorporar m\u00e1s opciones en el futuro." },
    { k: ["bitcoin", "crypto", "criptomoneda"], r: "Por el momento no aceptamos criptomonedas. Puedes pagar con tarjeta de cr\u00e9dito/d\u00e9bito, transferencia bancaria o dep\u00f3sito." },
    { k: ["fall\u00f3 pago", "pago rechazado", "no pasa tarjeta", "error pago", "declinada"], r: "Si tu pago fue rechazado, verifica: fondos disponibles, datos correctos de la tarjeta, y que tu banco no est\u00e9 bloqueando compras en l\u00ednea. Si persiste, intenta con otra tarjeta o usa transferencia." },
    { k: ["comprobante pago", "recibo pago", "confirmaci\u00f3n pago", "prueba pago"], r: "Despu\u00e9s de cada pago exitoso recibir\u00e1s una confirmaci\u00f3n por email y/o WhatsApp, junto con tu justificante de pedido descargable en PDF." },
    { k: ["anticipo", "apartado", "reservar", "separar", "abono"], r: "Puedes apartar productos con un anticipo del 50%. El saldo restante se paga antes del env\u00edo. Cont\u00e1ctanos por WhatsApp para coordinar un apartado." },
    { k: ["moneda extranjera", "pago exterior", "tarjeta internacional"], r: "Las tarjetas internacionales son bienvenidas. Stripe procesa la conversi\u00f3n autom\u00e1ticamente. El monto se cobrar\u00e1 en la moneda de tu pa\u00eds al tipo de cambio vigente." },
    { k: ["bac", "banpais", "ficohsa", "atlantida", "occidente", "banco honduras"], r: "Aceptamos transferencias de cualquier banco hondure\u00f1o: BAC, Ficohsa, Banpa\u00eds, Atl\u00e1ntida, Occidente y m\u00e1s. Te proporcionaremos los datos de cuenta al momento de tu compra." },

    /* ======== SPAIN / ESPAÑA ======== */
    { k: ["espa\u00f1a", "espana", "spain", "madrid", "barcelona", "valencia", "sevilla", "m\u00e1laga", "malaga", "zaragoza", "bilbao"], r: "\u00a1S\u00ed! \u00C8NIGME tambi\u00e9n opera en Espa\u00f1a. Realizamos env\u00edos a domicilio a Madrid, Barcelona, Valencia, Sevilla, M\u00e1laga, Zaragoza, Bilbao y toda la pen\u00ednsula. Los precios se muestran autom\u00e1ticamente en euros (\u20ac) cuando nos visitas desde Espa\u00f1a. El env\u00edo tarda 18 d\u00edas naturales." },
    { k: ["env\u00edo espa\u00f1a", "envio espa\u00f1a", "enviar a espa\u00f1a", "shipping spain", "europa"], r: "Realizamos env\u00edos a domicilio a toda Espa\u00f1a peninsular en 18 d\u00edas naturales. La conversi\u00f3n es autom\u00e1tica: 1\u20ac = 31.50 Lempiras." },
    { k: ["euro", "euros", "precio en euros", "\u20ac", "eur"], r: "Si nos visitas desde Espa\u00f1a, todos los precios se muestran autom\u00e1ticamente en euros (\u20ac). La tasa de cambio es 1\u20ac = 31.50 HNL. Puedes pagar con tarjeta europea a trav\u00e9s de Stripe." },
    { k: ["comunidad aut\u00f3noma", "provincia", "andaluc\u00eda", "catalu\u00f1a", "galicia", "pa\u00eds vasco", "castilla"], r: "Enviamos a todas las comunidades aut\u00f3nomas de Espa\u00f1a: Andaluc\u00eda, Catalu\u00f1a, Madrid, Comunidad Valenciana, Galicia, Pa\u00eds Vasco, Castilla y Le\u00f3n, Castilla-La Mancha, Canarias, Baleares y m\u00e1s. Env\u00edo a domicilio en 18 d\u00edas naturales." },
    { k: ["pago espa\u00f1a", "tarjeta espa\u00f1ola", "banco espa\u00f1ol", "bizum", "transferencia espa\u00f1a"], r: "Desde Espa\u00f1a puedes pagar con cualquier tarjeta Visa/Mastercard a trav\u00e9s de Stripe. Tambi\u00e9n aceptamos transferencias bancarias SEPA. El importe se muestra directamente en euros." },
    { k: ["aduanas", "aduana", "customs", "impuestos importaci\u00f3n", "iva"], r: "Los env\u00edos a Espa\u00f1a pueden estar sujetos a tasas aduaneras e IVA de importaci\u00f3n seg\u00fan la normativa vigente de la UE. Te informaremos de cualquier coste adicional antes del env\u00edo." },
    { k: ["c\u00f3digo postal", "codigo postal", "cp", "zip code"], r: "En Espa\u00f1a reconocemos todos los c\u00f3digos postales (de 01000 a 52080). Ind\u00edquelo en el formulario de env\u00edo para calcular la entrega a domicilio. En Honduras usamos departamento y ciudad." },

    /* ======== HONDURAS - 18 DEPARTMENTS ======== */
    { k: ["atl\u00e1ntida", "atlantida", "la ceiba", "tela"], r: "Realizamos env\u00edos a Atl\u00e1ntida (La Ceiba, Tela). Entrega en punto de encuentro coordinado. Tiempo estimado: 25 d\u00edas naturales." },
    { k: ["comayagua", "siguatepeque"], r: "Cubrimos Comayagua y Siguatepeque. Entrega en punto de encuentro. Tiempo: 25 d\u00edas naturales." },
    { k: ["cop\u00e1n", "copan", "santa rosa de cop\u00e1n", "ruinas"], r: "Realizamos env\u00edos a Cop\u00e1n. Entrega en punto de encuentro coordinado. 25 d\u00edas naturales." },
    { k: ["olancho", "juticalpa", "catacamas"], r: "Cubrimos Olancho (Juticalpa, Catacamas). Punto de encuentro. 25 d\u00edas naturales." },
    { k: ["yoro", "el progreso", "olanchito"], r: "Cubrimos Yoro con env\u00edos a punto de encuentro. 25 d\u00edas naturales." },
    { k: ["intibuc\u00e1", "intibuca", "la esperanza"], r: "Enviamos a Intibuc\u00e1 a punto de encuentro. 25 d\u00edas naturales." },
    { k: ["lempira", "gracias"], r: "Enviamos a Lempira a punto de encuentro. 25 d\u00edas naturales." },
    { k: ["ocotepeque"], r: "Cubrimos Ocotepeque con env\u00edos a punto de encuentro. 25 d\u00edas naturales." },
    { k: ["santa b\u00e1rbara", "santa barbara"], r: "Cubrimos Santa B\u00e1rbara a punto de encuentro. 25 d\u00edas naturales." },
    { k: ["el para\u00edso", "el paraiso", "danl\u00ed", "danli"], r: "Enviamos a El Para\u00edso (Danl\u00ed) a punto de encuentro. 25 d\u00edas naturales." },
    { k: ["la paz"], r: "Enviamos a La Paz con punto de encuentro coordinado. 25 d\u00edas naturales." },
    { k: ["islas de la bah\u00eda", "roatan", "roat\u00e1n", "utila", "guanaja"], r: "Cubrimos Islas de la Bah\u00eda (Roat\u00e1n, Utila, Guanaja). Env\u00edo especial mar\u00edtimo/a\u00e9reo. Punto de encuentro. 25 d\u00edas naturales." },
    { k: ["gracias a dios", "mosquitia", "puerto lempira"], r: "Enviamos a Gracias a Dios con coordinaci\u00f3n especial. Punto de encuentro. 25 d\u00edas naturales." },
    { k: ["col\u00f3n", "colon", "trujillo", "tocoa"], r: "Cubrimos Col\u00f3n (Trujillo, Tocoa) a punto de encuentro. 25 d\u00edas naturales." },
    { k: ["18 departamentos", "todo honduras", "todo el pa\u00eds", "cobertura total", "nacional"], r: "\u00C8NIGME tiene cobertura en los 18 departamentos de Honduras: Atl\u00e1ntida, Choluteca, Col\u00f3n, Comayagua, Cop\u00e1n, Cort\u00e9s, El Para\u00edso, Francisco Moraz\u00e1n, Gracias a Dios, Intibuc\u00e1, Islas de la Bah\u00eda, La Paz, Lempira, Ocotepeque, Olancho, Santa B\u00e1rbara, Valle y Yoro. Env\u00edos a punto de encuentro en cada ciudad. 25 d\u00edas naturales." },
    { k: ["punto de encuentro", "donde recojo", "recoger pedido", "pickup"], r: "En Honduras, los env\u00edos se entregan en puntos de encuentro coordinados en cada ciudad. Te indicaremos el punto m\u00e1s cercano a tu ubicaci\u00f3n v\u00eda WhatsApp. En Espa\u00f1a, el env\u00edo es a domicilio." },
    { k: ["d\u00edas naturales", "cuanto tarda", "tiempo envio", "plazo entrega"], r: "Los env\u00edos a Honduras tardan 25 d\u00edas naturales a punto de encuentro. Los env\u00edos a Espa\u00f1a tardan 18 d\u00edas naturales a domicilio." },
    { k: ["descuento", "descuento rese\u00f1a", "comentarios descuento", "estrellas descuento"], r: "\u00a1S\u00ed! Si dejas 10 valoraciones de productos con estrellas y comentario, obtendr\u00e1s un 5% de descuento en tu pr\u00f3xima compra. Cada rese\u00f1a cuenta. \u00a1Tu opini\u00f3n vale!" },
    { k: ["valorar", "puntuar", "estrellas", "rese\u00f1ar producto", "calificar producto"], r: "Despu\u00e9s de recibir tu pedido, podr\u00e1s valorar cada art\u00edculo con estrellas (1-5) y dejar un comentario. Con 10 valoraciones, desbloqueas un 5% de descuento en tu siguiente compra." },

    /* ======== ABOUT ENIGME ======== */
    { k: ["qui\u00e9n", "quien es enigme", "qu\u00e9 es enigme", "que es enigme", "sobre enigme", "acerca", "historia", "marca"], r: "\u00C8NIGME es una casa de lujo hondure\u00f1a fundada por Carlos Armas Mart\u00ednez. Nos especializamos en alta joyer\u00eda, plata de ley 925 y bolsos de dise\u00f1ador. Nuestro compromiso es ofrecer lujo accesible con est\u00e1ndares internacionales." },
    { k: ["carlos armas", "fundador", "due\u00f1o", "creador", "propietario", "ceo"], r: "\u00C8NIGME fue fundada por Carlos Armas Mart\u00ednez, un emprendedor hondure\u00f1o apasionado por la joyer\u00eda de lujo y la moda. Su visi\u00f3n es llevar piezas exclusivas de calidad internacional a Honduras." },
    { k: ["misi\u00f3n", "mision"], r: "Nuestra misi\u00f3n es democratizar el lujo en Honduras, ofreciendo joyer\u00eda y accesorios de calidad internacional con un servicio excepcional y precios accesibles." },
    { k: ["visi\u00f3n", "vision"], r: "Nuestra visi\u00f3n es convertirnos en la casa de lujo l\u00edder de Centroam\u00e9rica, reconocida por la calidad de nuestros productos, la innovaci\u00f3n y la experiencia \u00fanica que ofrecemos a nuestros clientes." },
    { k: ["valores", "principios", "filosof\u00eda"], r: "Los valores de \u00C8NIGME son: Excelencia en calidad, Elegancia atemporal, Autenticidad certificada, Servicio personalizado y Compromiso con Honduras." },
    { k: ["nombre", "por qu\u00e9 enigme", "significa enigme", "enigme significa"], r: "\u00C8NIGME evoca misterio, elegancia y sofisticaci\u00f3n. El nombre refleja la idea de que cada pieza guarda un secreto de belleza y cada cliente es \u00fanico e irrepetible." },
    { k: ["tienda f\u00edsica", "tienda fisica", "local", "sucursal", "showroom", "ubicaci\u00f3n"], r: "Actualmente \u00C8NIGME opera como tienda 100% en l\u00ednea, lo que nos permite ofrecer mejores precios. Estamos evaluando abrir un showroom f\u00edsico pr\u00f3ximamente." },
    { k: ["horario", "hora", "atenci\u00f3n", "atencion", "abierto", "disponible"], r: "Nuestro horario de atenci\u00f3n es de lunes a s\u00e1bado de 8:00 AM a 8:00 PM (hora de Honduras). Los domingos atendemos de 9:00 AM a 5:00 PM por WhatsApp." },
    { k: ["contacto", "tel\u00e9fono", "telefono", "whatsapp", "n\u00famero", "llamar", "escribir"], r: "Puedes contactarnos por WhatsApp (nuestro canal principal de comunicaci\u00f3n). Tambi\u00e9n por email y a trav\u00e9s de nuestras redes sociales. \u00a1Estamos para servirte!" },
    { k: ["instagram", "facebook", "redes sociales", "social media", "tiktok", "red social"], r: "S\u00edguenos en nuestras redes sociales para ver las \u00faltimas novedades, promociones exclusivas y contenido de estilo. Enc\u00faentranos como @enigme.hn en Instagram y Facebook." },
    { k: ["email", "correo", "correo electr\u00f3nico"], r: "Puedes escribirnos por correo electr\u00f3nico. Para consultas de compra, WhatsApp es el canal m\u00e1s r\u00e1pido. Responderemos tu email en un m\u00e1ximo de 24 horas h\u00e1biles." },
    { k: ["calidad", "quality", "est\u00e1ndar", "nivel"], r: "Cada pieza \u00C8NIGME pasa por un riguroso control de calidad. Verificamos materiales, acabados, cierres y presentaci\u00f3n antes de llegar a tus manos. Solo lo mejor lleva nuestro nombre." },
    { k: ["diferencia", "por qu\u00e9 enigme", "por qu\u00e9 comprar", "ventaja", "mejor que"], r: "Lo que nos diferencia: certificado de autenticidad en cada pieza, empaque de lujo incluido, env\u00edo seguro, atenci\u00f3n personalizada y precios justos para Honduras. Somos lujo con alma hondure\u00f1a." },
    { k: ["confianza", "confiar", "leg\u00edtimo", "real", "estafa", "verdadero"], r: "\u00C8NIGME es una marca registrada y leg\u00edtima. Cada compra incluye certificado de autenticidad, factura y garant\u00eda. Miles de clientes satisfechos nos respaldan. Tu compra es 100% segura." },
    { k: ["prensa", "medio", "revista", "noticia", "blog"], r: "\u00C8NIGME ha sido destacada en diversos medios locales por su propuesta de lujo accesible en Honduras. S\u00edguenos en redes sociales para ver nuestras \u00faltimas apariciones." },
    { k: ["evento", "eventos", "pop up", "feria", "exhibici\u00f3n"], r: "Organizamos eventos exclusivos y pop-ups peri\u00f3dicamente. S\u00edguenos en redes sociales para enterarte de pr\u00f3ximos eventos donde podr\u00e1s ver nuestras piezas en persona." },
    { k: ["sostenible", "sustentable", "ecol\u00f3gico", "medioambiente", "eco"], r: "\u00C8NIGME est\u00e1 comprometida con pr\u00e1cticas responsables. Utilizamos empaques reciclables cuando es posible y seleccionamos proveedores que comparten nuestros valores \u00e9ticos." },
    { k: ["hondure\u00f1o", "honduras", "orgullosamente", "hecho en honduras", "nacional"], r: "\u00C8NIGME es orgullosamente hondure\u00f1a. Aunque nuestras piezas provienen de los mejores artesanos del mundo, nuestra alma, servicio y coraz\u00f3n son 100% catrachos." },
    { k: ["idioma", "ingl\u00e9s", "english"], r: "Nuestro sitio y atenci\u00f3n est\u00e1n principalmente en espa\u00f1ol, ya que servimos al mercado hondure\u00f1o. Sin embargo, podemos atenderte en ingl\u00e9s si lo necesitas." },

    /* ======== ORDERS & ACCOUNT ======== */
    { k: ["c\u00f3mo comprar", "como comprar", "c\u00f3mo pedir", "como pedir", "hacer pedido", "comprar", "proceso de compra", "pasos"], r: "Comprar en \u00C8NIGME es f\u00e1cil: 1) Navega y elige tus piezas favoritas. 2) Agr\u00e9galas al carrito. 3) Completa tus datos de env\u00edo. 4) Elige tu m\u00e9todo de pago. 5) Confirma tu pedido. \u00a1Listo!" },
    { k: ["seguimiento pedido", "estado pedido", "mi pedido", "rastrear pedido", "n\u00famero de pedido", "order status"], r: "Para consultar el estado de tu pedido, env\u00edanos tu n\u00famero de pedido (formato AAC301222-XXXXX) por WhatsApp y te daremos informaci\u00f3n al instante." },
    { k: ["modificar pedido", "cambiar pedido", "editar pedido", "agregar producto", "quitar producto"], r: "Si necesitas modificar tu pedido, cont\u00e1ctanos por WhatsApp lo antes posible. Si a\u00fan no ha sido despachado, podremos hacer los cambios necesarios." },
    { k: ["cancelar pedido", "cancelar", "anular", "no quiero"], r: "Puedes cancelar tu pedido antes de que sea despachado. Cont\u00e1ctanos por WhatsApp con tu n\u00famero de pedido. Si ya fue pagado, procesaremos el reembolso completo." },
    { k: ["favorito", "favoritos", "wishlist", "lista deseos", "guardar"], r: "Puedes guardar tus piezas favoritas haciendo clic en el coraz\u00f3n de cada producto. Tu lista de favoritos se guarda para que puedas volver a verlas cuando quieras." },
    { k: ["carrito", "cesta", "bolsa", "cart", "agregar al carrito"], r: "Tu carrito de compras guarda tus productos seleccionados. Puedes agregar, eliminar o cambiar cantidades antes de proceder al pago. Tu carrito se mantiene guardado en tu dispositivo." },
    { k: ["cuenta", "registr", "crear cuenta", "iniciar sesi\u00f3n", "login", "perfil"], r: "Actualmente puedes comprar sin necesidad de crear cuenta. Tus datos se solicitan al momento del checkout. Estamos desarrollando un sistema de cuentas con historial de compras." },
    { k: ["historial", "compras anteriores", "pedidos anteriores", "mis compras"], r: "Por ahora, tu historial de compras se gestiona v\u00eda WhatsApp. Env\u00edanos tu nombre y te compartiremos el resumen de tus pedidos. Pronto tendr\u00e1s un panel de cliente." },
    { k: ["vip", "cliente vip", "programa vip", "exclusivo", "beneficios"], r: "\u00C8NIGME prepara un programa VIP para clientes frecuentes con beneficios exclusivos: acceso anticipado a colecciones, descuentos especiales, env\u00edo prioritario y regalos de cumplea\u00f1os." },
    { k: ["newsletter", "suscripci\u00f3n", "suscribir", "novedades email"], r: "Pronto lanzaremos nuestro newsletter exclusivo con adelantos de colecciones, ofertas especiales y contenido de estilo. S\u00edguenos en redes sociales para no perderte nada." },
    { k: ["c\u00f3digo descuento", "cup\u00f3n", "cupon", "c\u00f3digo promoci\u00f3n", "discount code", "promo"], r: "Compartimos c\u00f3digos de descuento exclusivos a trav\u00e9s de nuestras redes sociales y por WhatsApp a clientes frecuentes. \u00a1S\u00edguenos para aprovecharlos!" },
    { k: ["notificaci\u00f3n", "aviso", "alerta", "disponible de nuevo", "restock"], r: "Si un producto est\u00e1 agotado, cont\u00e1ctanos por WhatsApp y te avisaremos cuando vuelva a estar disponible. Tambi\u00e9n publicamos restock en nuestras redes sociales." },
    { k: ["opini\u00f3n", "rese\u00f1a", "review", "calificar", "comentario", "valoraci\u00f3n"], r: "Tu opini\u00f3n es muy valiosa para nosotros. Puedes dejarnos tu rese\u00f1a por WhatsApp o en nuestras redes sociales. Cada rese\u00f1a nos ayuda a mejorar." },
    { k: ["queja", "reclamo", "insatisf", "problema", "malo", "mal servicio"], r: "Lamentamos cualquier inconveniente. Por favor cont\u00e1ctanos por WhatsApp detallando tu situaci\u00f3n y n\u00famero de pedido. Nos comprometemos a resolver tu caso en menos de 24 horas." },
    { k: ["error sitio", "no funciona", "p\u00e1gina ca\u00edda", "bug", "error web"], r: "Si experimentas un error en nuestro sitio, por favor int\u00e9ntalo de nuevo o usa otro navegador. Si persiste, cont\u00e1ctanos por WhatsApp y haremos tu pedido manualmente." },
    { k: ["checkout", "finalizar compra", "proceder al pago", "terminar compra"], r: "En el checkout necesitar\u00e1s: nombre completo, email, tel\u00e9fono, departamento, direcci\u00f3n de entrega y m\u00e9todo de pago. El proceso es r\u00e1pido y seguro." },
    { k: ["privacidad", "datos personales", "informaci\u00f3n personal", "privacy"], r: "Protegemos tus datos personales con los m\u00e1s altos est\u00e1ndares de seguridad. Nunca compartimos tu informaci\u00f3n con terceros. Consulta nuestra pol\u00edtica de privacidad para m\u00e1s detalles." },
    { k: ["t\u00e9rminos", "condiciones", "pol\u00edtica", "legal"], r: "Puedes consultar nuestros t\u00e9rminos y condiciones en el pie de p\u00e1gina de nuestro sitio web. Incluyen informaci\u00f3n sobre env\u00edos, devoluciones, garant\u00edas y privacidad." },
    { k: ["regalo sorpresa", "sin precio", "quitar precio"], r: "\u00a1Claro! Si es un regalo, podemos enviar el paquete sin incluir el precio. Solo ind\u00edcalo en las notas de tu pedido o av\u00edsanos por WhatsApp." },
    { k: ["mayor", "mayoreo", "wholesale", "al por mayor", "revender", "distribuidor"], r: "Ofrecemos precios especiales para compras al por mayor y distribuidores. Cont\u00e1ctanos por WhatsApp o email para conocer nuestros planes de mayor y las condiciones." },

    /* ======== WORK WITH US ======== */
    { k: ["trabajo", "trabajar", "empleo", "vacante", "oportunidad laboral", "contratan", "puesto"], r: "\u00C8NIGME ofrece oportunidades de venta por cat\u00e1logo para personas emprendedoras. Puedes generar ingresos vendiendo nuestras piezas de lujo. \u00a1Cont\u00e1ctanos para m\u00e1s informaci\u00f3n!" },
    { k: ["cat\u00e1logo", "catalogo", "venta cat\u00e1logo", "venta por cat\u00e1logo", "vendedora"], r: "Nuestro programa de Venta por Cat\u00e1logo te permite ofrecer las piezas \u00C8NIGME a tu c\u00edrculo. Recibir\u00e1s un cat\u00e1logo digital, capacitaci\u00f3n y comisiones atractivas por cada venta." },
    { k: ["requisito", "requisitos", "necesito para", "qu\u00e9 necesito", "c\u00f3mo aplico", "como aplico"], r: "Para ser vendedor/a \u00C8NIGME necesitas: ser mayor de 18 a\u00f1os, tener acceso a WhatsApp y redes sociales, compromiso con la atenci\u00f3n al cliente y pasi\u00f3n por la moda y joyer\u00eda." },
    { k: ["comisi\u00f3n", "comision", "ganancia", "cu\u00e1nto gano", "porcentaje", "ingreso"], r: "Nuestras vendedoras ganan comisiones competitivas por cada venta realizada. El porcentaje var\u00eda seg\u00fan el volumen de ventas. Los mejores vendedores obtienen bonos adicionales y beneficios exclusivos." },
    { k: ["capacitaci\u00f3n", "capacitacion", "entrenamiento", "formaci\u00f3n", "curso", "aprender"], r: "Ofrecemos capacitaci\u00f3n completa gratuita: conocimiento de productos, t\u00e9cnicas de venta, uso de redes sociales, atenci\u00f3n al cliente y manejo de objeciones. \u00a1Te preparamos para el \u00e9xito!" },
    { k: ["beneficio vendedor", "beneficios vendedora", "qu\u00e9 gano", "ventajas vendedor"], r: "Beneficios de ser vendedor/a \u00C8NIGME: comisiones atractivas, descuentos en productos, capacitaci\u00f3n gratuita, flexibilidad de horarios, material de marketing profesional y soporte continuo." },
    { k: ["aplicar", "inscribir", "registrar vendedor", "unirme", "interesado", "quiero vender"], r: "Para unirte al equipo \u00C8NIGME, env\u00edanos un mensaje por WhatsApp indicando tu inter\u00e9s. Te pediremos algunos datos b\u00e1sicos y agendar\u00e9mos una llamada de orientaci\u00f3n." },
    { k: ["territorio", "zona venta", "\u00e1rea asignada", "d\u00f3nde vender", "exclusividad zona"], r: "No asignamos territorios exclusivos; puedes vender a cualquier persona en las zonas de cobertura de \u00C8NIGME. Esto te da libertad total para crecer tu negocio sin l\u00edmites geogr\u00e1ficos." },
    { k: ["inversi\u00f3n", "inversion", "capital", "dinero inicial", "costo unirse", "gratis unirse"], r: "Unirse al equipo de ventas \u00C8NIGME no requiere inversi\u00f3n inicial ni cuota de ingreso. Te proporcionamos el cat\u00e1logo digital y material de apoyo sin costo." },
    { k: ["material venta", "material marketing", "fotos producto", "contenido"], r: "Proporcionamos material de marketing profesional: fotos de alta calidad, videos, descripciones de productos, plantillas para redes sociales y cat\u00e1logo digital actualizado." },
    { k: ["meta venta", "meta", "cuota", "m\u00ednimo venta", "obligaci\u00f3n"], r: "No exigimos metas m\u00ednimas de venta. T\u00fa decides tu ritmo y nivel de compromiso. Sin embargo, las vendedoras m\u00e1s activas acceden a mejores comisiones y beneficios exclusivos." },
    { k: ["soporte vendedor", "ayuda vendedor", "equipo venta"], r: "Nuestras vendedoras cuentan con soporte continuo: grupo exclusivo de WhatsApp, asesor\u00eda directa, resoluci\u00f3n r\u00e1pida de dudas y actualizaciones constantes de productos y precios." },
    { k: ["experiencia necesaria", "sin experiencia", "primera vez vendiendo"], r: "No necesitas experiencia previa en ventas. Nuestra capacitaci\u00f3n te dar\u00e1 todas las herramientas necesarias. Muchas de nuestras mejores vendedoras empezaron desde cero." },
    { k: ["horario vendedor", "tiempo completo", "medio tiempo", "flexible", "compatib"], r: "Ser vendedor/a \u00C8NIGME es 100% flexible. T\u00fa eliges tus horarios y puedes combinarlo con tu empleo, estudios u otras actividades. Trabaja desde donde quieras." },
    { k: ["red vendedores", "comunidad vendedores", "grupo vendedores"], r: "Al unirte, formar\u00e1s parte de nuestra comunidad de vendedores \u00C8NIGME. Compartimos tips, motivaci\u00f3n, \u00e9xitos y aprendizajes. Es un equipo unido y solidario." },
    { k: ["pago vendedor", "c\u00f3mo me pagan", "cu\u00e1ndo pagan", "frecuencia pago"], r: "Las comisiones se liquidan de forma semanal o quincenal, seg\u00fan tu preferencia. El pago se realiza por transferencia bancaria directa a tu cuenta." },
    { k: ["inventario vendedor", "stock vendedor", "producto f\u00edsico"], r: "No necesitas manejar inventario f\u00edsico. Vendes directamente desde el cat\u00e1logo digital y nosotros nos encargamos del env\u00edo al cliente. \u00a1Zero riesgo para ti!" },
    { k: ["crecer", "ascender", "l\u00edder", "lider", "coordinar"], r: "En \u00C8NIGME puedes crecer: desde vendedor/a individual hasta coordinador/a de equipo. Los l\u00edderes ganan comisiones adicionales por las ventas de su equipo." },
    { k: ["renuncia", "salir programa", "dejar de vender", "darme de baja"], r: "Puedes retirarte del programa de ventas en cualquier momento sin penalizaci\u00f3n alguna. Solo av\u00edsanos y liquidaremos tus comisiones pendientes." },
    { k: ["edad m\u00ednima", "menor de edad", "cu\u00e1ntos a\u00f1os"], r: "Para ser vendedor/a \u00C8NIGME debes ser mayor de 18 a\u00f1os. No hay l\u00edmite m\u00e1ximo de edad. \u00a1Todos son bienvenidos a emprender con nosotros!" },
    { k: ["contrato", "legal vendedor", "relaci\u00f3n laboral", "independiente"], r: "Nuestras vendedoras son colaboradoras independientes, no empleadas. No hay contrato laboral. Tienes total libertad y flexibilidad para manejar tu emprendimiento." },
    { k: ["cliente propio", "base clientes", "mi cliente"], r: "Los clientes que t\u00fa consigas son tuyos. Recibir\u00e1s la comisi\u00f3n por cada recompra que realicen. Construir\u00e1s tu propia cartera de clientes fieles." },
    { k: ["herramienta digital", "app vendedor", "plataforma vendedor"], r: "Te proporcionamos acceso a herramientas digitales para gestionar tus ventas, rastrear comisiones y acceder al cat\u00e1logo actualizado. Todo desde tu celular." },

    /* ======== MISC & COMMON PHRASES ======== */
    { k: ["hola", "buenas", "buenos d\u00edas", "buenas tardes", "buenas noches", "hey", "hi", "hello"], r: "\u00a1Hola! Bienvenido/a a \u00C8NIGME. Soy Abril, tu asistente personal. \u00bfEn qu\u00e9 puedo ayudarte hoy? Puedo informarte sobre nuestros productos, env\u00edos, pagos o cualquier otra consulta." },
    { k: ["gracias", "thank", "agradezco", "muchas gracias"], r: "\u00a1Gracias a ti por confiar en \u00C8NIGME! Si tienes alguna otra pregunta, no dudes en escribirme. Estoy aqu\u00ed para ti." },
    { k: ["adi\u00f3s", "adios", "bye", "chao", "hasta luego", "nos vemos"], r: "\u00a1Hasta pronto! Fue un placer atenderte. Recuerda que estoy disponible siempre que me necesites. \u00a1Que tengas un d\u00eda hermoso!" },
    { k: ["ayuda", "help", "necesito ayuda", "asistencia"], r: "Con gusto te ayudo. Puedo responder preguntas sobre: productos y colecciones, env\u00edos y entregas, m\u00e9todos de pago, tu pedido, o c\u00f3mo trabajar con nosotros. \u00bfQu\u00e9 necesitas saber?" },
    { k: ["abril", "qui\u00e9n eres", "quien eres", "qu\u00e9 eres", "eres real", "bot", "robot", "inteligencia artificial"], r: "Soy Abril, la asistente virtual de La Casa \u00C8NIGME. Estoy aqu\u00ed las 24 horas para ayudarte con cualquier consulta sobre nuestros productos y servicios. Si necesitas atenci\u00f3n humana, te conecto con nuestro equipo por WhatsApp." },
    { k: ["humano", "persona real", "agente", "hablar con alguien", "operador"], r: "Si prefieres hablar con un miembro de nuestro equipo, cont\u00e1ctanos directamente por WhatsApp. Nuestro horario de atenci\u00f3n humana es de lunes a s\u00e1bado de 8 AM a 8 PM." },
    { k: ["qu\u00e9 puedo hacer", "que puedo hacer", "opciones", "men\u00fa", "menu"], r: "Puedo ayudarte con: 1) Informaci\u00f3n de productos y colecciones, 2) Env\u00edos y entregas, 3) M\u00e9todos de pago, 4) Estado de tu pedido, 5) C\u00f3mo trabajar con nosotros, 6) Informaci\u00f3n de la marca. \u00bfQu\u00e9 te interesa?" },
    { k: ["emergencia", "urgente ayuda", "necesito ya"], r: "Para atenci\u00f3n urgente, cont\u00e1ctanos directamente por WhatsApp. Nuestro equipo te atender\u00e1 con la mayor prioridad posible. \u00a1Estamos para servirte!" },
  ];

  /* --- Fuzzy match function --- */
  function abrilFindAnswer(userInput) {
    var input = userInput.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .trim();

    var words = input.split(/\s+/);
    var bestScore = 0;
    var bestAnswer = null;

    for (var i = 0; i < ABRIL_KB.length; i++) {
      var entry = ABRIL_KB[i];
      var score = 0;

      for (var j = 0; j < entry.k.length; j++) {
        var keyword = entry.k[j].toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s]/g, " ")
          .trim();

        // Exact phrase match in input (highest score)
        if (input.indexOf(keyword) !== -1) {
          score += keyword.split(/\s+/).length * 3;
        } else {
          // Individual word matching
          var kwWords = keyword.split(/\s+/);
          for (var w = 0; w < kwWords.length; w++) {
            for (var u = 0; u < words.length; u++) {
              if (words[u] === kwWords[w]) {
                score += 2;
              } else if (words[u].length > 3 && kwWords[w].indexOf(words[u]) !== -1) {
                score += 1.5;
              } else if (kwWords[w].length > 3 && words[u].indexOf(kwWords[w]) !== -1) {
                score += 1.5;
              }
            }
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestAnswer = entry.r;
      }
    }

    if (bestScore >= 1.5) {
      return bestAnswer;
    }

    return "Disculpa, no tengo informaci\u00f3n sobre eso en este momento. Te sugiero contactar directamente a nuestro equipo por WhatsApp para una respuesta personalizada. \u00a1Estar\u00e1n encantados de ayudarte!";
  }

  /* --- Inject chatbot styles --- */
  function injectAbrilStyles() {
    if (document.getElementById("enigme-abril-styles")) return;
    var style = document.createElement("style");
    style.id = "enigme-abril-styles";
    style.textContent = [
      "@keyframes enigmeFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
      "@keyframes enigmeSlideUp{from{opacity:0;transform:translateY(20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}",
      "@keyframes enigmePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}",
      "@keyframes enigmeDotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}",

      "@keyframes enigmeFloat{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-6px) rotate(1deg)}50%{transform:translateY(-2px) rotate(-1deg)}75%{transform:translateY(-8px) rotate(0.5deg)}}",
      "#abril-fab{position:fixed;bottom:24px;left:24px;z-index:99998;display:flex;align-items:center;gap:10px;" +
      "background:linear-gradient(135deg,#1C1C1C 0%,#2A2A2A 100%);color:#CBAA63;border:1px solid rgba(203,170,99,0.3);padding:10px 18px 10px 14px;border-radius:50px;" +
      "font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;letter-spacing:1.5px;cursor:pointer;" +
      "box-shadow:0 8px 32px rgba(203,170,99,0.2);transition:all .3s ease;animation:enigmeFloat 6s ease-in-out infinite}",
      "#abril-fab:hover{background:#CBAA63;color:#1C1C1C;transform:translateY(-2px);box-shadow:0 12px 40px rgba(203,170,99,0.4)}",
      "#abril-fab svg{width:20px;height:20px;fill:currentColor;flex-shrink:0}",

      "#abril-window{position:fixed;bottom:90px;left:24px;z-index:99999;width:370px;max-width:calc(100vw - 48px);" +
      "max-height:520px;background:#FFFFFF;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.25);" +
      "display:none;flex-direction:column;overflow:hidden;animation:enigmeSlideUp .35s ease;" +
      "font-family:'Montserrat',sans-serif}",
      "#abril-window.open{display:flex}",

      "#abril-header{background:#1C1C1C;padding:18px 20px;display:flex;align-items:center;justify-content:space-between}",
      "#abril-header-left{display:flex;align-items:center;gap:12px}",
      "#abril-avatar{width:36px;height:36px;border-radius:50%;background:#CBAA63;display:flex;align-items:center;" +
      "justify-content:center;font-family:'Cinzel',serif;font-size:15px;font-weight:700;color:#1C1C1C;flex-shrink:0}",
      "#abril-header-info h3{margin:0;font-family:'Cinzel',serif;font-size:14px;color:#CBAA63;letter-spacing:1.5px;font-weight:600}",
      "#abril-header-info p{margin:2px 0 0;font-size:10px;color:#8C8C8C;letter-spacing:0.5px}",
      "#abril-close{background:none;border:none;color:#8C8C8C;font-size:22px;cursor:pointer;padding:0 4px;transition:color .2s;line-height:1}",
      "#abril-close:hover{color:#CBAA63}",

      "#abril-messages{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;" +
      "background:#FAF9F6;min-height:260px;max-height:340px}",
      "#abril-messages::-webkit-scrollbar{width:4px}",
      "#abril-messages::-webkit-scrollbar-thumb{background:#CBAA63;border-radius:4px}",

      ".abril-msg{display:flex;gap:10px;animation:enigmeFadeIn .3s ease}",
      ".abril-msg.bot{align-items:flex-start}",
      ".abril-msg.user{flex-direction:row-reverse}",
      ".abril-msg-avatar{width:28px;height:28px;border-radius:50%;background:#1C1C1C;display:flex;" +
      "align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:11px;font-weight:700;" +
      "color:#CBAA63;flex-shrink:0;margin-top:2px}",
      ".abril-msg.user .abril-msg-avatar{background:#CBAA63;color:#1C1C1C}",
      ".abril-msg-bubble{max-width:78%;padding:12px 16px;border-radius:14px;font-size:13px;line-height:1.55;letter-spacing:0.2px}",
      ".abril-msg.bot .abril-msg-bubble{background:#FFFFFF;color:#1C1C1C;border:1px solid #F0EFEC;border-bottom-left-radius:4px;" +
      "box-shadow:0 2px 8px rgba(0,0,0,0.04)}",
      ".abril-msg.user .abril-msg-bubble{background:#1C1C1C;color:#FAF9F6;border-bottom-right-radius:4px}",

      ".abril-typing{display:flex;gap:4px;padding:8px 0}",
      ".abril-typing span{width:6px;height:6px;background:#CBAA63;border-radius:50%;animation:enigmeDotBounce 1.2s infinite}",
      ".abril-typing span:nth-child(2){animation-delay:.15s}",
      ".abril-typing span:nth-child(3){animation-delay:.3s}",

      "#abril-input-area{display:flex;align-items:center;gap:8px;padding:14px 16px;border-top:1px solid #F0EFEC;background:#FFFFFF}",
      "#abril-input{flex:1;border:1.5px solid #E8E8E8;border-radius:24px;padding:10px 18px;font-family:'Montserrat',sans-serif;" +
      "font-size:13px;color:#1C1C1C;outline:none;transition:border-color .2s;background:#FAF9F6}",
      "#abril-input:focus{border-color:#CBAA63}",
      "#abril-input::placeholder{color:#ACACAC}",
      "#abril-send{background:#1C1C1C;border:none;width:38px;height:38px;border-radius:50%;cursor:pointer;" +
      "display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}",
      "#abril-send:hover{background:#CBAA63}",
      "#abril-send svg{width:16px;height:16px;fill:#CBAA63;transition:fill .2s}",
      "#abril-send:hover svg{fill:#1C1C1C}",

      "#abril-branding{text-align:center;padding:6px;font-size:9px;color:#ACACAC;letter-spacing:1px;background:#FFFFFF}",
    ].join("\n");
    document.head.appendChild(style);
  }

  /* --- Build chatbot DOM --- */
  function initAbril() {
    injectAbrilStyles();

    // FAB button
    var fab = document.createElement("button");
    fab.id = "abril-fab";
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" style="filter:drop-shadow(0 0 3px rgba(203,170,99,0.5))"><path d="M12 2L2 9l2 3h2l6 10 6-10h2l2-3L12 2zm0 2.5L18.5 9h-13L12 4.5zM6.5 11h11L12 20 6.5 11z"/></svg>' +
      '<span>Abril</span>';

    // Chat window
    var win = document.createElement("div");
    win.id = "abril-window";
    win.innerHTML = [
      '<div id="abril-header">',
      '  <div id="abril-header-left">',
      '    <div id="abril-avatar">A</div>',
      '    <div id="abril-header-info">',
      '      <h3>Abril</h3>',
      '      <p>Asistente \u00C8NIGME</p>',
      '    </div>',
      '  </div>',
      '  <button id="abril-close">&times;</button>',
      '</div>',
      '<div id="abril-messages"></div>',
      '<div id="abril-input-area">',
      '  <input type="text" id="abril-input" placeholder="Escribe tu mensaje..." autocomplete="off" />',
      '  <button id="abril-send">',
      '    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
      '  </button>',
      '</div>',
      '<div id="abril-branding">\u00C8NIGME \u00B7 La Casa del Lujo</div>',
    ].join("");

    document.body.appendChild(fab);
    document.body.appendChild(win);

    var messages = document.getElementById("abril-messages");
    var input = document.getElementById("abril-input");
    var sendBtn = document.getElementById("abril-send");
    var closeBtn = document.getElementById("abril-close");
    var isOpen = false;
    var greeted = false;

    function addMessage(text, isBot) {
      var wrap = document.createElement("div");
      wrap.className = "abril-msg " + (isBot ? "bot" : "user");

      var avatar = document.createElement("div");
      avatar.className = "abril-msg-avatar";
      avatar.textContent = isBot ? "A" : "T";

      var bubble = document.createElement("div");
      bubble.className = "abril-msg-bubble";
      bubble.textContent = text;

      wrap.appendChild(avatar);
      wrap.appendChild(bubble);
      messages.appendChild(wrap);
      messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
      var wrap = document.createElement("div");
      wrap.className = "abril-msg bot";
      wrap.id = "abril-typing-indicator";

      var avatar = document.createElement("div");
      avatar.className = "abril-msg-avatar";
      avatar.textContent = "A";

      var bubble = document.createElement("div");
      bubble.className = "abril-msg-bubble";
      bubble.innerHTML = '<div class="abril-typing"><span></span><span></span><span></span></div>';

      wrap.appendChild(avatar);
      wrap.appendChild(bubble);
      messages.appendChild(wrap);
      messages.scrollTop = messages.scrollHeight;
    }

    function removeTyping() {
      var el = document.getElementById("abril-typing-indicator");
      if (el) el.remove();
    }

    function handleSend() {
      var text = input.value.trim();
      if (!text) return;
      addMessage(text, false);
      input.value = "";

      showTyping();
      var delay = 400 + Math.random() * 600;
      setTimeout(function () {
        removeTyping();
        var answer = abrilFindAnswer(text);
        addMessage(answer, true);
      }, delay);
    }

    fab.addEventListener("click", function () {
      isOpen = !isOpen;
      if (isOpen) {
        win.classList.add("open");
        if (!greeted) {
          greeted = true;
          setTimeout(function () {
            addMessage("\u00a1Hola! Soy Abril, tu asistente personal de La Casa \u00C8NIGME. \u00bfEn qu\u00e9 puedo ayudarte hoy?", true);
          }, 300);
        }
        input.focus();
      } else {
        win.classList.remove("open");
      }
    });

    closeBtn.addEventListener("click", function () {
      isOpen = false;
      win.classList.remove("open");
    });

    sendBtn.addEventListener("click", handleSend);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") handleSend();
    });
  }

  /* ==========================================================
     4. FADE-IN OBSERVER
  ========================================================== */

  function initFadeObserver() {
    // Inject fade-in styles
    if (!document.getElementById("enigme-fade-styles")) {
      var style = document.createElement("style");
      style.id = "enigme-fade-styles";
      style.textContent = [
        ".fade-in{opacity:0;transform:translateY(30px);transition:opacity 0.7s ease,transform 0.7s ease}",
        ".fade-in.visible{opacity:1;transform:translateY(0)}",
        "img.fade-in,video.fade-in{transition:opacity 0.9s ease,transform 0.9s ease}",
      ].join("\n");
      document.head.appendChild(style);
    }

    if (!("IntersectionObserver" in window)) {
      // Fallback: show everything
      var all = document.querySelectorAll(".fade-in");
      for (var i = 0; i < all.length; i++) {
        all[i].classList.add("visible");
      }
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    var elements = document.querySelectorAll(".fade-in");
    elements.forEach(function (el) {
      observer.observe(el);
    });

    // Also observe dynamically added elements
    var mutationObs = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains("fade-in")) {
              observer.observe(node);
            }
            var children = node.querySelectorAll ? node.querySelectorAll(".fade-in") : [];
            children.forEach(function (child) {
              observer.observe(child);
            });
          }
        });
      });
    });

    mutationObs.observe(document.body, { childList: true, subtree: true });
  }

  /* ==========================================================
     5. FAVORITES & CART SYNC FOR ADMIN
  ========================================================== */

  function syncFavoritesToServer(departmentArg) {
    var STORAGE_KEY = "enigme_favs_analytics";
    var favorites = [];
    try {
      var raw = localStorage.getItem("enigme_favs");
      if (raw) favorites = JSON.parse(raw);
    } catch (e) {
      favorites = [];
    }

    var existing = [];
    try {
      var rawAnalytics = localStorage.getItem(STORAGE_KEY);
      if (rawAnalytics) existing = JSON.parse(rawAnalytics);
    } catch (e) {
      existing = [];
    }

    var department = departmentArg || "";
    if (!department) {
      try {
        var checkoutData = localStorage.getItem("enigme_checkout_department");
        if (checkoutData) department = checkoutData;
      } catch (e) {}
    }

    var entry = {
      timestamp: new Date().toISOString(),
      items: favorites,
      userAgent: navigator.userAgent,
      location: department || "No especificado",
    };

    existing.push(entry);

    // Keep only last 500 entries to avoid bloating
    if (existing.length > 500) {
      existing = existing.slice(-500);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return entry;
  }

  function syncCartToServer(departmentArg) {
    var STORAGE_KEY = "enigme_cart_analytics";
    var cart = [];
    try {
      var raw = localStorage.getItem("enigme_cart");
      if (raw) cart = JSON.parse(raw);
    } catch (e) {
      cart = [];
    }

    var existing = [];
    try {
      var rawAnalytics = localStorage.getItem(STORAGE_KEY);
      if (rawAnalytics) existing = JSON.parse(rawAnalytics);
    } catch (e) {
      existing = [];
    }

    var department = departmentArg || "";
    if (!department) {
      try {
        var checkoutData = localStorage.getItem("enigme_checkout_department");
        if (checkoutData) department = checkoutData;
      } catch (e) {}
    }
    // Also save the department for future reference
    if (department) {
      try { localStorage.setItem("enigme_checkout_department", department); } catch(e) {}
    }

    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      var p = parseInt(String(cart[i].price || "0").replace(/\D/g, "")) || 0;
      total += p * (cart[i].qty || 1);
    }

    var entry = {
      timestamp: new Date().toISOString(),
      items: cart,
      total: total,
      userAgent: navigator.userAgent,
      location: department || "No especificado",
    };

    existing.push(entry);

    if (existing.length > 500) {
      existing = existing.slice(-500);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return entry;
  }

  /* ==========================================================
     SHARE PRODUCT (GLOBAL)
  ========================================================== */
  function shareProduct(name, ref, imgSrc, price, lema) {
    // Ensure name is never empty in the share text
    var displayName = (name && name.trim()) ? name.trim() : (ref ? "Ref. " + ref : "Pieza exclusiva");

    // Build manifest URL so shared links go directly to the product page
    var pageName = window.location.pathname.split("/").pop() || "index.html";
    var catMap = { "joyeria.html": "joyeria", "boutique.html": "boutique", "plata.html": "plata", "liquidacion.html": "liquidacion" };
    var cat = catMap[pageName] || "joyeria";
    // Extract numeric price (HNL) from price string like "L 649" or "L. 1,299"
    var priceClean = "";
    if (price) {
      priceClean = String(price).replace(/[^\d]/g, "") || "0";
    }
    var manifestUrl = window.location.origin + "/producto.html?ref=" + encodeURIComponent(ref || "") +
      "&name=" + encodeURIComponent(displayName) +
      "&img=" + encodeURIComponent(imgSrc || "") +
      "&lema=" + encodeURIComponent(lema || "") +
      "&cat=" + encodeURIComponent(cat) +
      "&price=" + encodeURIComponent(priceClean);
    var text = "Descubre esta pieza de \u00C8NIGME: " + displayName;
    if (navigator.share) {
      navigator.share({ title: "\u00C8NIGME \u00B7 " + displayName, text: text, url: manifestUrl }).catch(function () {});
    } else {
      var copyUrl = text + " " + manifestUrl;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyUrl).then(function () { showShareToast(); });
      } else {
        var tmp = document.createElement("textarea");
        tmp.value = copyUrl; document.body.appendChild(tmp);
        tmp.select(); document.execCommand("copy");
        document.body.removeChild(tmp);
        showShareToast();
      }
    }
  }

  function showShareToast() {
    var toast = document.createElement("div");
    toast.textContent = "Enlace copiado al portapapeles";
    toast.style.cssText =
      "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1C1C1C;color:#CBAA63;padding:12px 24px;font-size:0.7rem;letter-spacing:2px;z-index:99999;text-transform:uppercase;font-family:Montserrat,sans-serif;border-radius:2px;";
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2500);
  }

  /* ==========================================================
     MOBILE DROPDOWN TOGGLE (GLOBAL)
  ========================================================== */
  function toggleMobileMenu(event, element) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    var parentDropdown = element.closest(".dropdown");
    document.querySelectorAll(".dropdown").forEach(function (d) {
      if (d !== parentDropdown) d.classList.remove("active");
    });
    parentDropdown.classList.toggle("active");
  }

  function initDropdownToggle() {
    document.querySelectorAll(".dropdown > .dropbtn, .dropdown > .nav-link.dropbtn, .dropdown > button.dropbtn").forEach(function (btn) {
      if (btn.getAttribute("data-dropdown-init")) return;
      btn.setAttribute("data-dropdown-init", "1");
      btn.addEventListener("click", function (e) {
        toggleMobileMenu(e, btn);
      });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".dropdown")) {
        document.querySelectorAll(".dropdown").forEach(function (d) {
          d.classList.remove("active");
        });
      }
    });
  }

  /* ==========================================================
     GLOBAL EXPORTS
  ========================================================== */
  window.ENIGME = window.ENIGME || {};
  window.ENIGME.generateOrderId = generateOrderId;
  window.ENIGME.generateOrderPDF = generateOrderPDF;
  window.ENIGME.showPDFModal = showPDFModal;
  // initAbril removed - using abril-bot.js standalone instead
  window.ENIGME.initFadeObserver = initFadeObserver;
  window.ENIGME.syncFavoritesToServer = syncFavoritesToServer;
  window.ENIGME.syncCartToServer = syncCartToServer;
  window.ENIGME.initDropdownToggle = initDropdownToggle;

  // Expose shareProduct and toggleMobileMenu globally
  window.shareProduct = shareProduct;
  window.toggleMobileMenu = toggleMobileMenu;

  /* --- Auto-initialize on DOM ready --- */
  function onReady(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  // Product deep linking
  function initDeepLinks() {
    var hash = window.location.hash;
    if (hash && hash.indexOf('#REF-') === 0) {
      var ref = hash.replace('#', '');
      setTimeout(function() {
        // Try to find the product by its reference code in text
        var allCards = document.querySelectorAll('.product-card');
        allCards.forEach(function(card) {
          if (card.textContent.indexOf(ref) !== -1 || card.innerHTML.indexOf(ref) !== -1) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight effect
            card.style.transition = 'all 0.5s ease';
            card.style.boxShadow = '0 0 30px rgba(201,169,110,0.6)';
            card.style.transform = 'scale(1.02)';
            setTimeout(function() {
              card.style.boxShadow = '';
              card.style.transform = '';
            }, 3000);
          }
        });
      }, 1000);
    }
  }

  // Auto-fix all share buttons on catalog pages to share manifest URLs
  function initShareButtons() {
    var pageName = window.location.pathname.split("/").pop() || "";
    var catPages = ["joyeria.html", "boutique.html", "plata.html", "liquidacion.html", "catalogo.html"];
    if (catPages.indexOf(pageName) === -1) return;
    var catMap = { "joyeria.html": "joyeria", "boutique.html": "boutique", "plata.html": "plata", "liquidacion.html": "liquidacion", "catalogo.html": "joyeria" };
    var cat = catMap[pageName] || "joyeria";

    document.querySelectorAll(".product-card").forEach(function(card) {
      var existingBtn = card.querySelector(".btn-share");
      var refEl = card.querySelector(".product-code");
      var imgEl = card.querySelector(".product-media");
      var priceEl = card.querySelector(".product-price");
      var lemaEl = card.querySelector(".product-lema");

      // Try multiple selectors for the product name
      var nameEl = card.querySelector(".product-name")
        || card.querySelector(".card-title")
        || card.querySelector(".product-title")
        || card.querySelector("h2")
        || card.querySelector("h3")
        || card.querySelector("h4");

      var name = nameEl ? nameEl.textContent.trim() : "";

      // Fallback: try data attribute on the card itself
      if (!name && card.dataset && card.dataset.name) {
        name = card.dataset.name;
      }

      // Fallback: try the btn-fav onclick which contains the product name
      if (!name) {
        var favBtn = card.querySelector(".btn-fav");
        if (favBtn) {
          var onclickStr = favBtn.getAttribute("onclick") || "";
          var favMatch = onclickStr.match(/toggleFav\([^,]+,\s*'([^']+)'/);
          if (favMatch) name = favMatch[1];
        }
      }

      // Fallback: try the alt text of the image
      if (!name && imgEl) {
        var altText = imgEl.getAttribute("alt") || "";
        if (altText && altText !== "Joyería ÈNIGME" && altText.indexOf("placeholder") === -1) {
          name = altText;
        }
      }

      var ref = refEl ? refEl.textContent.replace("REF: ", "").trim() : "";

      // Skip cards with no name AND no ref (completely unidentifiable)
      if (!name && !ref) return;

      var img = imgEl ? imgEl.getAttribute("src") : "";
      var price = priceEl ? priceEl.textContent.trim() : "";
      var lema = lemaEl ? lemaEl.textContent.trim() : "";

      if (existingBtn) {
        // Replace the old onclick with the new manifest share
        existingBtn.onclick = function(e) { e.stopPropagation(); shareProduct(name, ref, img, price, lema); };
      } else {
        // Inject share button if none exists
        var btn = document.createElement("button");
        btn.className = "btn-share";
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg><span class="share-label">COMPARTIR</span>';
        btn.onclick = function(e) { e.stopPropagation(); shareProduct(name, ref, img, price, lema); };
        card.appendChild(btn);
      }
    });
  }

  onReady(function () {
    // initAbril() removed - abril-bot.js handles the bot
    initFadeObserver();
    initDropdownToggle();
    initDeepLinks();
    initShareButtons();
  });
})();
