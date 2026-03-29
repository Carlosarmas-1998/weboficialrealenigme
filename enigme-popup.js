/* ═══════════════════════════════════════════════════════════
   ENIGME — Popup Universal de Suscripción (10% descuento)
   Se muestra después de 12 seg si el usuario no está suscrito.
   El descuento es REAL (excepto SETS y Liquidación).
   Si no quiere dar correo, cierra y sigue navegando.
   ═══════════════════════════════════════════════════════════ */
(function() {
  // Si ya se suscribió o ya cerró el popup en esta sesión, no mostrar
  if (localStorage.getItem('enigme_subscriber_email')) return;
  if (sessionStorage.getItem('enigme_popup_closed')) return;

  // No mostrar en páginas corporativas
  var page = location.pathname.split('/').pop() || '';
  var skipPages = ['admin-v2.html','gerencia-divisional.html','gerencia-zona.html','logistica.html','order-form-v2.html'];
  if (skipPages.indexOf(page) >= 0) return;

  setTimeout(function() {
    // Doble check (pudo haberse suscrito mientras tanto)
    if (localStorage.getItem('enigme_subscriber_email')) return;

    // Crear el popup
    var overlay = document.createElement('div');
    overlay.id = 'enigmeEmailPopup';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,10,10,0.8);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity 0.4s;';

    overlay.innerHTML =
      '<div style="background:#FAF9F6;max-width:420px;width:100%;padding:36px 28px;text-align:center;border:1px solid rgba(203,170,99,0.3);position:relative;">' +
        '<button onclick="document.getElementById(\'enigmeEmailPopup\').style.opacity=\'0\';setTimeout(function(){document.getElementById(\'enigmeEmailPopup\').remove()},400);sessionStorage.setItem(\'enigme_popup_closed\',\'1\');" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:1.3rem;color:#888;cursor:pointer;font-family:serif;">&times;</button>' +
        '<div style="font-family:Cinzel,Georgia,serif;font-size:1.6rem;letter-spacing:0.3em;color:#CBAA63;margin-bottom:6px;">ÈNIGME</div>' +
        '<div style="width:40px;height:1px;background:linear-gradient(90deg,transparent,#CBAA63,transparent);margin:0 auto 18px;"></div>' +
        '<div style="font-family:Cinzel,Georgia,serif;font-size:1rem;color:#1C1C1C;letter-spacing:0.1em;margin-bottom:8px;">OBTÉN 10% DE DESCUENTO</div>' +
        '<p style="font-size:0.78rem;color:#666;line-height:1.6;margin-bottom:20px;font-family:Montserrat,sans-serif;">Ingresa tu correo y recibe un <strong style="color:#CBAA63;">10% de descuento real</strong> en tu primera compra de Alta Joyería, Boutique, Vestidos y Boda & Plata.</p>' +
        '<p style="font-size:0.6rem;color:#999;margin-bottom:14px;font-family:Montserrat,sans-serif;">*No aplica en SETS Exclusivos ni Liquidación (ya tienen precio especial)</p>' +
        '<form id="enigmePopupForm" style="display:flex;flex-direction:column;gap:0;">' +
          '<input type="email" id="enigmePopupEmail" placeholder="Tu correo electrónico" required style="padding:14px 16px;border:1px solid rgba(203,170,99,0.4);background:#fff;font-family:Montserrat,sans-serif;font-size:0.9rem;outline:none;text-align:center;letter-spacing:0.03em;"/>' +
          '<button type="submit" id="enigmePopupBtn" style="padding:14px;background:linear-gradient(135deg,#CBAA63,#E8D090);border:none;color:#0A0A0A;font-family:Cinzel,Georgia,serif;font-size:0.8rem;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;font-weight:700;margin-top:0;">UNIRME AL CLUB</button>' +
        '</form>' +
        '<p id="enigmePopupMsg" style="display:none;font-size:0.8rem;margin-top:12px;color:#CBAA63;font-family:Montserrat,sans-serif;"></p>' +
        '<button onclick="document.getElementById(\'enigmeEmailPopup\').style.opacity=\'0\';setTimeout(function(){document.getElementById(\'enigmeEmailPopup\').remove()},400);sessionStorage.setItem(\'enigme_popup_closed\',\'1\');" style="background:none;border:none;color:#999;font-size:0.65rem;cursor:pointer;margin-top:14px;font-family:Montserrat,sans-serif;letter-spacing:0.1em;text-transform:uppercase;text-decoration:underline;">No gracias, seguir navegando</button>' +
      '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.style.opacity = '1'; });

    // Handle form submit
    document.getElementById('enigmePopupForm').addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('enigmePopupEmail').value.trim();
      if (!email) return;
      var btn = document.getElementById('enigmePopupBtn');
      var msg = document.getElementById('enigmePopupMsg');
      btn.disabled = true;
      btn.textContent = '...';

      var SB = 'https://hajmyntnvurlcuwshjdd.supabase.co';
      var SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhham15bnRudnVybGN1d3NoamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM2MjEsImV4cCI6MjA4ODU3OTYyMX0.XGF5wPX1sI9VgG11bnr41lCxeqTfFVHEhBIfBXXYAkw';

      fetch(SB + '/rest/v1/suscriptores', {
        method: 'POST',
        headers: { 'apikey': SK, 'Authorization': 'Bearer ' + SK, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ email: email, fecha_suscripcion: new Date().toISOString(), descuento_usado: false })
      }).then(function(res) {
        // Save regardless (409 = already exists = fine)
        localStorage.setItem('enigme_subscriber_email', email);
        localStorage.setItem('enigme_discount_10', 'true');

        // Send welcome email
        fetch(SB + '/functions/v1/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SK },
          body: JSON.stringify({
            to: email,
            subject: 'Bienvenido/a al Club ENIGME — 10% de descuento activado',
            html: '<div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;padding:30px;background:#0A0A0A;border:1px solid rgba(203,170,99,0.3);">' +
              '<h1 style="text-align:center;font-size:24px;letter-spacing:8px;color:#CBAA63;font-weight:400;">ENIGME</h1>' +
              '<div style="width:50px;height:1px;background:#CBAA63;margin:12px auto 24px;"></div>' +
              '<p style="color:#e8e0d4;font-size:14px;line-height:1.8;">Hola,</p>' +
              '<p style="color:#b0a898;font-size:14px;line-height:1.8;">Gracias por unirte al Club Exclusivo de La Casa ENIGME.</p>' +
              '<div style="background:rgba(203,170,99,0.08);border:1px solid rgba(203,170,99,0.25);padding:20px;text-align:center;margin:20px 0;">' +
                '<div style="font-size:11px;color:#CBAA63;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;">Tu descuento exclusivo</div>' +
                '<div style="font-size:32px;color:#CBAA63;font-weight:700;">10% OFF</div>' +
                '<div style="font-size:12px;color:#888;margin-top:6px;">En Alta Joyeria, Boutique, Vestidos y Boda & Plata</div>' +
                '<div style="font-size:10px;color:#666;margin-top:8px;">*No aplica en SETS Exclusivos ni Liquidacion</div>' +
              '</div>' +
              '<p style="text-align:center;margin:24px 0;"><a href="https://enigmeofficial.com/catalogo.html" style="display:inline-block;padding:14px 36px;background:#CBAA63;color:#0A0A0A;text-decoration:none;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:700;">VER CATALOGO</a></p>' +
              '<p style="text-align:center;font-size:10px;color:#444;">info@enigmeofficial.com | enigmeofficial.com</p>' +
            '</div>'
          })
        }).catch(function() {});

        msg.textContent = '¡Bienvenido/a! Tu 10% de descuento ya está activo.';
        msg.style.display = 'block';
        btn.textContent = '✓';

        setTimeout(function() {
          overlay.style.opacity = '0';
          setTimeout(function() { overlay.remove(); }, 400);
        }, 2500);

      }).catch(function() {
        // Even on error, save locally
        localStorage.setItem('enigme_subscriber_email', email);
        localStorage.setItem('enigme_discount_10', 'true');
        msg.textContent = '¡Descuento activado!';
        msg.style.display = 'block';
        setTimeout(function() { overlay.style.opacity = '0'; setTimeout(function() { overlay.remove(); }, 400); }, 2000);
      });
    });

  }, 12000); // 12 seconds
})();
