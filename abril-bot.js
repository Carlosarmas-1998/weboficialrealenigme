(function () {
  'use strict';

  /* ======================================================
     ABRIL - Asistente Virtual Oficial de ENIGME
     Self-contained chatbot widget
     ====================================================== */

  // ── Configuration ──────────────────────────────────────
  const CONFIG = {
    brandGold: '#CBAA63',
    brandDark: '#1C1C1C',
    brandWhite: '#FAFAF7',
    brandGray: '#2A2A2A',
    brandLightGray: '#F5F3EE',
    zIndex: 99999,
    animationDuration: 300,
    typingDelay: 600,
  };

  // ── FAQ Database ───────────────────────────────────────
  const FAQ_DATABASE = [
    {
      id: 'marca',
      keywords: ['que es', 'marca', 'origen', 'historia', 'empezo', 'creo', 'nombre', 'filosofia', 'esencia', 'diferencia', 'enigme'],
      answer:
        '\u00c8NIGME es una marca de origen espa\u00f1ol, creada por empresarios hondure\u00f1os en Madrid, con una visi\u00f3n clara: construir una empresa elegante, organizada y accesible. Naci\u00f3 desde la venta personal y fue creciendo paso a paso. Representa elegancia, presencia, misterio, aura, oportunidad, crecimiento y lujo accesible.',
    },
    {
      id: 'productos',
      keywords: ['productos', 'vende', 'catalogo', 'joyeria', 'bolsos', 'plata', 'oro', 'acero', 'joyas', 'anillos', 'collares', 'pulseras'],
      answer:
        '\u00c8NIGME ofrece productos seleccionados con enfoque visual cuidado: alta joyer\u00eda en Oro 14K, Plata de Ley 925, Acero Inoxidable, bolsos boutique y accesorios de lujo. Todo dentro de una propuesta de marca elegante y diferenciada.',
    },
    {
      id: 'compradores',
      keywords: ['comprar', 'cliente', 'pedido', 'como compro', 'compra', 'adquirir'],
      answer:
        'Cualquier persona puede comprar en \u00c8NIGME. El cliente conoce los productos, revisa la informaci\u00f3n, realiza su pedido y completa el pago por los canales habilitados. No es necesario pertenecer a la empresa para comprar.',
    },
    {
      id: 'pagos',
      keywords: ['pago', 'pagar', 'tarjeta', 'cuenta', 'bancaria', 'seguro', 'stripe', 'cifrado', 'formas de pago', 'metodo de pago'],
      answer:
        'Los pagos pueden realizarse por cuenta bancaria o por tarjeta. Son procesados mediante sistemas seguros y cifrados. \u00c8NIGME no almacena los datos bancarios completos ni la informaci\u00f3n sensible de las tarjetas.',
    },
    {
      id: 'envios_honduras',
      keywords: ['envio', 'envios', 'entrega', 'honduras', 'punto de encuentro', 'cuanto tarda', '25 dias', 'logistica', 'envio honduras'],
      answer:
        '\u00c8NIGME realiza env\u00edos a Honduras cada 25 d\u00edas, con un sistema de entrega organizado en puntos de encuentro. Este modelo permite una log\u00edstica m\u00e1s clara, planificada y accesible.',
    },
    {
      id: 'vendedoras',
      keywords: ['vendedora', 'vender', 'unirse', 'ganar dinero', 'ingresos', 'oportunidad', 'comercial', 'quiero ser vendedora'],
      answer:
        'Las vendedoras pueden integrarse a la din\u00e1mica comercial de \u00c8NIGME. La venta es una v\u00eda real de crecimiento. \u00c8NIGME naci\u00f3 desde la venta personal. "Si ellos lo hicieron, t\u00fa tambi\u00e9n puedes hacerlo." Para m\u00e1s informaci\u00f3n, contacta por WhatsApp: +34 602 149 162',
    },
    {
      id: 'trabajar',
      keywords: ['trabajar', 'empleo', 'postular', 'postulacion', 'puesto', 'vacante', 'trabaja', 'trabaja con nosotros'],
      answer:
        'En la secci\u00f3n "Trabaja con nosotros" puedes postularte a oportunidades activas dentro de la marca. \u00c8NIGME est\u00e1 abierta a incorporar personas que quieran crecer con el proyecto.',
    },
    {
      id: 'mayoristas',
      keywords: ['mayorista', 'socio', 'tienda online', 'negocio', 'distribuidor', 'socios'],
      answer:
        '\u00c8NIGME impulsa a socios mayoristas que deseen unirse a la marca, incluyendo apoyo para desarrollar su presencia comercial y, en determinados casos, la creaci\u00f3n de tiendas online vinculadas a su crecimiento.',
    },
    {
      id: 'contacto',
      keywords: ['contacto', 'contactar', 'correo', 'email', 'whatsapp', 'telefono', 'soporte', 'contacto oficial'],
      answer:
        'Canales oficiales:\n\u2022 Correo: info@enigmeofficial.com\n\u2022 WhatsApp: +34 602 149 162\n\u2022 Soporte: a trav\u00e9s del apartado de soporte de esta web.\n\n\u00c8NIGME recomienda contactar \u00fanicamente por sus canales oficiales.',
    },
    {
      id: 'abril',
      keywords: ['abril', 'quien eres', 'asistente', 'bot', 'ayuda', 'que haces', 'que puedes hacer'],
      answer:
        'Soy Abril, la asistente virtual oficial de \u00c8NIGME. Estoy aqu\u00ed para orientarte dentro de la web, ayudarte con informaci\u00f3n general y facilitar una experiencia m\u00e1s r\u00e1pida y organizada.',
    },
    {
      id: 'seguridad',
      keywords: ['seguridad', 'privacidad', 'datos', 'proteccion', 'confianza'],
      answer:
        'La seguridad es parte esencial de \u00c8NIGME. Los pagos se procesan mediante sistemas seguros y cifrados. No almacenamos la informaci\u00f3n sensible completa de pago. La confianza, imagen y claridad son pilares de nuestra comunicaci\u00f3n.',
    },
    {
      id: 'envios_espana',
      keywords: ['espana', 'madrid', 'barcelona', 'europa', 'envio espana', 'peninsula'],
      answer:
        '\u00c8NIGME tambi\u00e9n opera en Espa\u00f1a. Para informaci\u00f3n sobre env\u00edos en Espa\u00f1a, contacta por nuestros canales oficiales: info@enigmeofficial.com o WhatsApp +34 602 149 162',
    },
    {
      id: 'vision',
      keywords: ['vision', 'mision', 'suenos', 'crecer', 'crecimiento', 'inspirar', 'mensaje', 'proposito'],
      answer:
        '\u00c8NIGME no solo vende productos: crea oportunidades, impulsa sue\u00f1os y abre camino a quienes desean avanzar. "Si ellos lo hicieron, t\u00fa tambi\u00e9n puedes hacerlo. \u00danete a \u00c8NIGME."',
    },
  ];

  const GREETING_KEYWORDS = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'saludos', 'buenas', 'hi', 'hello'];

  const GREETING_MESSAGE =
    'Hola, soy Abril, tu asistente virtual de \u00c8NIGME. Estoy aqu\u00ed para ayudarte a resolver dudas, orientarte dentro de la web y facilitar tu experiencia con nuestra marca. \u00bfEn qu\u00e9 puedo ayudarte?';

  const FALLBACK_MESSAGE =
    'No tengo informaci\u00f3n espec\u00edfica sobre eso, pero puedes contactarnos por nuestros canales oficiales: info@enigmeofficial.com o WhatsApp +34 602 149 162';

  const QUICK_REPLIES = [
    '\u00bfQu\u00e9 es \u00c8NIGME?',
    'Formas de pago',
    'Env\u00edos a Honduras',
    'Quiero ser vendedora',
    'Trabaja con nosotros',
    'Contacto oficial',
  ];

  // ── Text Normalization ─────────────────────────────────
  function normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ── Matching Engine ────────────────────────────────────
  function findAnswer(userInput) {
    var normalized = normalize(userInput);

    // Check greetings first
    for (var g = 0; g < GREETING_KEYWORDS.length; g++) {
      if (normalized.indexOf(GREETING_KEYWORDS[g]) !== -1) {
        return GREETING_MESSAGE;
      }
    }

    // Check thank-you messages
    if (normalized.indexOf('gracias') !== -1 || normalized.indexOf('muchas gracias') !== -1) {
      return '\u00a1Con mucho gusto! Si necesitas algo m\u00e1s, estoy aqu\u00ed para ayudarte.';
    }

    // Check farewell
    if (normalized.indexOf('adios') !== -1 || normalized.indexOf('hasta luego') !== -1 || normalized.indexOf('chao') !== -1) {
      return '\u00a1Hasta pronto! Gracias por visitar \u00c8NIGME. Estamos aqu\u00ed cuando nos necesites.';
    }

    // Score each FAQ category
    var bestScore = 0;
    var bestAnswer = null;

    for (var i = 0; i < FAQ_DATABASE.length; i++) {
      var faq = FAQ_DATABASE[i];
      var score = 0;

      for (var k = 0; k < faq.keywords.length; k++) {
        var keyword = faq.keywords[k];
        if (normalized.indexOf(keyword) !== -1) {
          // Multi-word keywords get bonus points
          score += keyword.split(' ').length;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestAnswer = faq.answer;
      }
    }

    return bestScore > 0 ? bestAnswer : FALLBACK_MESSAGE;
  }

  // ── Inject Styles ──────────────────────────────────────
  function injectStyles() {
    var css = [
      /* Reset */
      '#abril-chat-widget, #abril-chat-widget * { box-sizing: border-box; margin: 0; padding: 0; }',

      /* Toggle Button */
      '#abril-toggle-btn {',
      '  position: fixed;',
      '  bottom: 24px;',
      '  right: 24px;',
      '  width: 60px;',
      '  height: 60px;',
      '  border-radius: 50%;',
      '  background: ' + CONFIG.brandGold + ';',
      '  border: none;',
      '  cursor: pointer;',
      '  z-index: ' + CONFIG.zIndex + ';',
      '  box-shadow: 0 4px 20px rgba(203, 170, 99, 0.4);',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;',
      '}',
      '#abril-toggle-btn:hover {',
      '  transform: scale(1.08);',
      '  box-shadow: 0 6px 28px rgba(203, 170, 99, 0.55);',
      '}',
      '#abril-toggle-btn svg { width: 28px; height: 28px; fill: #1C1C1C; transition: transform 0.3s ease; }',
      '#abril-toggle-btn.abril-open svg { transform: rotate(90deg); }',

      /* Notification badge */
      '#abril-badge {',
      '  position: absolute;',
      '  top: -2px;',
      '  right: -2px;',
      '  width: 18px;',
      '  height: 18px;',
      '  background: #E53935;',
      '  border-radius: 50%;',
      '  border: 2px solid #fff;',
      '  display: block;',
      '  transition: opacity 0.3s ease;',
      '}',
      '#abril-badge.abril-hidden { opacity: 0; pointer-events: none; }',

      /* Chat Window */
      '#abril-chat-window {',
      '  position: fixed;',
      '  bottom: 96px;',
      '  right: 24px;',
      '  width: 380px;',
      '  max-height: 560px;',
      '  background: #fff;',
      '  border-radius: 16px;',
      '  z-index: ' + CONFIG.zIndex + ';',
      '  box-shadow: 0 12px 48px rgba(0,0,0,0.18);',
      '  display: flex;',
      '  flex-direction: column;',
      '  overflow: hidden;',
      '  opacity: 0;',
      '  transform: translateY(20px) scale(0.95);',
      '  pointer-events: none;',
      '  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);',
      '}',
      '#abril-chat-window.abril-visible {',
      '  opacity: 1;',
      '  transform: translateY(0) scale(1);',
      '  pointer-events: all;',
      '}',

      /* Header */
      '#abril-header {',
      '  background: ' + CONFIG.brandDark + ';',
      '  padding: 16px 20px;',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 12px;',
      '  flex-shrink: 0;',
      '}',
      '#abril-avatar {',
      '  width: 40px;',
      '  height: 40px;',
      '  border-radius: 50%;',
      '  background: ' + CONFIG.brandGold + ';',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  font-size: 18px;',
      '  font-weight: 700;',
      '  color: ' + CONFIG.brandDark + ';',
      '  flex-shrink: 0;',
      '  letter-spacing: 0.5px;',
      '}',
      '#abril-header-info { flex: 1; }',
      '#abril-header-name {',
      '  color: #fff;',
      '  font-size: 15px;',
      '  font-weight: 600;',
      '  letter-spacing: 0.5px;',
      '}',
      '#abril-header-status {',
      '  color: ' + CONFIG.brandGold + ';',
      '  font-size: 12px;',
      '  margin-top: 2px;',
      '  letter-spacing: 0.3px;',
      '}',
      '#abril-close-btn {',
      '  background: none;',
      '  border: none;',
      '  cursor: pointer;',
      '  padding: 4px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  opacity: 0.6;',
      '  transition: opacity 0.2s;',
      '}',
      '#abril-close-btn:hover { opacity: 1; }',
      '#abril-close-btn svg { width: 20px; height: 20px; fill: #fff; }',

      /* Messages Area */
      '#abril-messages {',
      '  flex: 1;',
      '  overflow-y: auto;',
      '  padding: 16px;',
      '  background: ' + CONFIG.brandLightGray + ';',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 12px;',
      '  min-height: 280px;',
      '  max-height: 360px;',
      '}',
      '#abril-messages::-webkit-scrollbar { width: 5px; }',
      '#abril-messages::-webkit-scrollbar-track { background: transparent; }',
      '#abril-messages::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }',

      /* Message Bubbles */
      '.abril-msg {',
      '  display: flex;',
      '  gap: 8px;',
      '  align-items: flex-end;',
      '  animation: abrilFadeIn 0.3s ease;',
      '}',
      '.abril-msg-bot { align-self: flex-start; }',
      '.abril-msg-user { align-self: flex-end; flex-direction: row-reverse; }',
      '.abril-msg-avatar {',
      '  width: 28px;',
      '  height: 28px;',
      '  border-radius: 50%;',
      '  background: ' + CONFIG.brandGold + ';',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  font-size: 12px;',
      '  font-weight: 700;',
      '  color: ' + CONFIG.brandDark + ';',
      '  flex-shrink: 0;',
      '}',
      '.abril-msg-user .abril-msg-avatar {',
      '  background: ' + CONFIG.brandGray + ';',
      '  color: #fff;',
      '  font-size: 11px;',
      '}',
      '.abril-bubble {',
      '  max-width: 260px;',
      '  padding: 10px 14px;',
      '  border-radius: 14px;',
      '  font-size: 13.5px;',
      '  line-height: 1.5;',
      '  white-space: pre-wrap;',
      '  word-break: break-word;',
      '}',
      '.abril-msg-bot .abril-bubble {',
      '  background: #fff;',
      '  color: ' + CONFIG.brandDark + ';',
      '  border-bottom-left-radius: 4px;',
      '  box-shadow: 0 1px 4px rgba(0,0,0,0.06);',
      '}',
      '.abril-msg-user .abril-bubble {',
      '  background: ' + CONFIG.brandDark + ';',
      '  color: #fff;',
      '  border-bottom-right-radius: 4px;',
      '}',

      /* Typing indicator */
      '.abril-typing { display: flex; gap: 4px; padding: 12px 16px; align-items: center; }',
      '.abril-typing-dot {',
      '  width: 7px;',
      '  height: 7px;',
      '  background: ' + CONFIG.brandGold + ';',
      '  border-radius: 50%;',
      '  animation: abrilBounce 1.2s infinite;',
      '}',
      '.abril-typing-dot:nth-child(2) { animation-delay: 0.15s; }',
      '.abril-typing-dot:nth-child(3) { animation-delay: 0.3s; }',

      /* Quick Replies */
      '.abril-quick-replies {',
      '  display: flex;',
      '  flex-wrap: wrap;',
      '  gap: 6px;',
      '  padding: 4px 0 2px;',
      '  animation: abrilFadeIn 0.4s ease;',
      '}',
      '.abril-quick-btn {',
      '  background: #fff;',
      '  color: ' + CONFIG.brandDark + ';',
      '  border: 1.5px solid ' + CONFIG.brandGold + ';',
      '  border-radius: 20px;',
      '  padding: 6px 14px;',
      '  font-size: 12px;',
      '  cursor: pointer;',
      '  transition: all 0.2s ease;',
      '  font-weight: 500;',
      '  letter-spacing: 0.2px;',
      '  white-space: nowrap;',
      '}',
      '.abril-quick-btn:hover {',
      '  background: ' + CONFIG.brandGold + ';',
      '  color: ' + CONFIG.brandDark + ';',
      '}',

      /* Input Area */
      '#abril-input-area {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  padding: 12px 16px;',
      '  border-top: 1px solid #eee;',
      '  background: #fff;',
      '  flex-shrink: 0;',
      '}',
      '#abril-input {',
      '  flex: 1;',
      '  border: 1.5px solid #e0ddd6;',
      '  border-radius: 24px;',
      '  padding: 10px 16px;',
      '  font-size: 13.5px;',
      '  outline: none;',
      '  transition: border-color 0.2s;',
      '  color: ' + CONFIG.brandDark + ';',
      '  background: ' + CONFIG.brandLightGray + ';',
      '}',
      '#abril-input::placeholder { color: #999; }',
      '#abril-input:focus { border-color: ' + CONFIG.brandGold + '; }',
      '#abril-send-btn {',
      '  width: 38px;',
      '  height: 38px;',
      '  border-radius: 50%;',
      '  background: ' + CONFIG.brandGold + ';',
      '  border: none;',
      '  cursor: pointer;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  transition: background 0.2s, transform 0.15s;',
      '  flex-shrink: 0;',
      '}',
      '#abril-send-btn:hover { background: #b89a55; transform: scale(1.06); }',
      '#abril-send-btn svg { width: 18px; height: 18px; fill: ' + CONFIG.brandDark + '; }',

      /* Powered by */
      '#abril-footer {',
      '  text-align: center;',
      '  padding: 6px;',
      '  font-size: 10px;',
      '  color: #bbb;',
      '  background: #fff;',
      '  letter-spacing: 0.5px;',
      '}',

      /* Keyframes */
      '@keyframes abrilFadeIn {',
      '  from { opacity: 0; transform: translateY(8px); }',
      '  to { opacity: 1; transform: translateY(0); }',
      '}',
      '@keyframes abrilBounce {',
      '  0%, 60%, 100% { transform: translateY(0); }',
      '  30% { transform: translateY(-6px); }',
      '}',

      /* Mobile Responsive */
      '@media (max-width: 480px) {',
      '  #abril-chat-window {',
      '    width: calc(100vw - 16px);',
      '    right: 8px;',
      '    bottom: 88px;',
      '    max-height: calc(100vh - 120px);',
      '    border-radius: 14px;',
      '  }',
      '  #abril-toggle-btn { bottom: 16px; right: 16px; width: 54px; height: 54px; }',
      '  #abril-messages { min-height: 220px; max-height: calc(100vh - 320px); }',
      '}',
    ].join('\n');

    var style = document.createElement('style');
    style.id = 'abril-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── SVG Icons ──────────────────────────────────────────
  var ICON_CHAT =
    '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7z"/></svg>';
  var ICON_CLOSE =
    '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  var ICON_SEND =
    '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

  // ── Build DOM ──────────────────────────────────────────
  function buildWidget() {
    // Container
    var widget = document.createElement('div');
    widget.id = 'abril-chat-widget';

    // Toggle Button
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'abril-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Abrir chat con Abril');
    toggleBtn.innerHTML = ICON_CHAT + '<span id="abril-badge"></span>';

    // Chat Window
    var chatWindow = document.createElement('div');
    chatWindow.id = 'abril-chat-window';
    chatWindow.setAttribute('role', 'dialog');
    chatWindow.setAttribute('aria-label', 'Chat con Abril - Asistente ENIGME');

    // Header
    chatWindow.innerHTML = [
      '<div id="abril-header">',
      '  <div id="abril-avatar">A</div>',
      '  <div id="abril-header-info">',
      '    <div id="abril-header-name">Abril</div>',
      '    <div id="abril-header-status">Asistente Virtual \u00b7 \u00c8NIGME</div>',
      '  </div>',
      '  <button id="abril-close-btn" aria-label="Cerrar chat">' + ICON_CLOSE + '</button>',
      '</div>',
      '<div id="abril-messages"></div>',
      '<div id="abril-input-area">',
      '  <input id="abril-input" type="text" placeholder="Escribe tu mensaje..." autocomplete="off" />',
      '  <button id="abril-send-btn" aria-label="Enviar">' + ICON_SEND + '</button>',
      '</div>',
      '<div id="abril-footer">\u00c8NIGME \u00b7 Asistente Virtual</div>',
    ].join('');

    widget.appendChild(toggleBtn);
    widget.appendChild(chatWindow);
    document.body.appendChild(widget);
  }

  // ── Chat Logic ─────────────────────────────────────────
  var isOpen = false;
  var hasGreeted = false;

  function toggleChat() {
    var chatWindow = document.getElementById('abril-chat-window');
    var toggleBtn = document.getElementById('abril-toggle-btn');
    var badge = document.getElementById('abril-badge');

    isOpen = !isOpen;

    if (isOpen) {
      chatWindow.classList.add('abril-visible');
      toggleBtn.classList.add('abril-open');
      toggleBtn.innerHTML = ICON_CLOSE;
      badge.classList.add('abril-hidden');
      document.getElementById('abril-input').focus();

      if (!hasGreeted) {
        hasGreeted = true;
        showTyping(function () {
          addBotMessage(GREETING_MESSAGE);
          showQuickReplies();
        });
      }
    } else {
      chatWindow.classList.remove('abril-visible');
      toggleBtn.classList.remove('abril-open');
      toggleBtn.innerHTML = ICON_CHAT + '<span id="abril-badge" class="abril-hidden"></span>';
    }
  }

  function getTimestamp() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function addBotMessage(text) {
    var container = document.getElementById('abril-messages');
    var msg = document.createElement('div');
    msg.className = 'abril-msg abril-msg-bot';
    msg.innerHTML =
      '<div class="abril-msg-avatar">A</div>' +
      '<div class="abril-bubble">' + escapeHtml(text) + '</div>';
    container.appendChild(msg);
    scrollToBottom();
  }

  function addUserMessage(text) {
    var container = document.getElementById('abril-messages');
    var msg = document.createElement('div');
    msg.className = 'abril-msg abril-msg-user';
    msg.innerHTML =
      '<div class="abril-msg-avatar"><svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>' +
      '<div class="abril-bubble">' + escapeHtml(text) + '</div>';
    container.appendChild(msg);
    scrollToBottom();
  }

  function showTyping(callback) {
    var container = document.getElementById('abril-messages');
    var typing = document.createElement('div');
    typing.className = 'abril-msg abril-msg-bot';
    typing.id = 'abril-typing-indicator';
    typing.innerHTML =
      '<div class="abril-msg-avatar">A</div>' +
      '<div class="abril-bubble abril-typing">' +
      '  <span class="abril-typing-dot"></span>' +
      '  <span class="abril-typing-dot"></span>' +
      '  <span class="abril-typing-dot"></span>' +
      '</div>';
    container.appendChild(typing);
    scrollToBottom();

    setTimeout(function () {
      var el = document.getElementById('abril-typing-indicator');
      if (el) el.remove();
      if (callback) callback();
    }, CONFIG.typingDelay);
  }

  function showQuickReplies() {
    var container = document.getElementById('abril-messages');
    var wrap = document.createElement('div');
    wrap.className = 'abril-quick-replies';
    wrap.id = 'abril-quick-replies';

    for (var i = 0; i < QUICK_REPLIES.length; i++) {
      var btn = document.createElement('button');
      btn.className = 'abril-quick-btn';
      btn.textContent = QUICK_REPLIES[i];
      btn.addEventListener('click', (function (text) {
        return function () {
          handleQuickReply(text);
        };
      })(QUICK_REPLIES[i]));
      wrap.appendChild(btn);
    }

    container.appendChild(wrap);
    scrollToBottom();
  }

  function removeQuickReplies() {
    var el = document.getElementById('abril-quick-replies');
    if (el) el.remove();
  }

  function handleQuickReply(text) {
    removeQuickReplies();
    processUserInput(text);
  }

  function processUserInput(text) {
    if (!text || !text.trim()) return;

    addUserMessage(text.trim());

    var answer = findAnswer(text.trim());

    showTyping(function () {
      addBotMessage(answer);
    });
  }

  function handleSend() {
    var input = document.getElementById('abril-input');
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    removeQuickReplies();
    processUserInput(text);
  }

  function scrollToBottom() {
    var container = document.getElementById('abril-messages');
    setTimeout(function () {
      container.scrollTop = container.scrollHeight;
    }, 50);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    // Preserve line breaks
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  // ── Event Bindings ─────────────────────────────────────
  function bindEvents() {
    document.getElementById('abril-toggle-btn').addEventListener('click', toggleChat);
    document.getElementById('abril-close-btn').addEventListener('click', toggleChat);
    document.getElementById('abril-send-btn').addEventListener('click', handleSend);
    document.getElementById('abril-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        toggleChat();
      }
    });
  }

  // ── Initialize ─────────────────────────────────────────
  function init() {
    if (document.getElementById('abril-chat-widget')) return; // prevent double init
    injectStyles();
    buildWidget();
    bindEvents();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
