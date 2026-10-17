/* Shared store behaviour for category and product pages.
   Load store-data.js before this file. Cart is kept in localStorage, shared with checkout.html.
   Saved data stays in the customer's browser. Before storing customer data on a server, follow
   applicable Indian data protection rules, such as the Digital Personal Data Protection Act, 2023. */
(function () {
  var STORE_KEY = 'apexStoreCart';
  var fmt = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };

  function readCart() {
    try { var v = JSON.parse(localStorage.getItem(STORE_KEY) || localStorage.getItem('rogStoreCart')); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function writeCart(c) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(c)); } catch (e) { /* storage unavailable */ }
  }
  function BASE() { return window.STORE_BASE || ''; }
  function productUrl(p) { return BASE() + 'products/' + p.slug + '.html'; }

  function productById(id) {
    return STORE_PRODUCTS.filter(function (p) { return p.id === id; })[0] || null;
  }
  function starsHTML(r) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" class="' + (i <= Math.round(r) ? '' : 'off') + '" aria-hidden="true"><use href="#i-star"/></svg>';
    }
    return '<span class="stars">' + out + '</span>';
  }

  function resolveImg(src) { return (src && src.indexOf('http') === 0) ? src : BASE() + src; }

  function productCard(p) {
    var href = productUrl(p);
    var img = p.img ? '<img src="' + resolveImg(p.img) + '" alt="' + p.brand + ' ' + p.name + '" loading="lazy" decoding="async" onerror="this.remove()">' : '';
    var reviewCount = Math.floor((p.price % 47) + 15);
    var ratingVal = p.rating || 4.8;
    var rating = starsHTML(ratingVal) + '<span>' + ratingVal.toFixed(1) + ' (' + reviewCount + ')</span>';
    var stock = p.stock ? '<span class="stock' + (p.stock === 'Few left' ? ' low' : '') + '">' + p.stock + '</span>' : '';
    return '<article class="card">' +
      '<a class="ph-link" href="' + href + '" tabindex="-1" aria-hidden="true"><div class="ph"><span>' + p.brand + ' ' + p.name + '<br>Product photo</span>' + img + '</div></a>' +
      '<span class="brand">' + p.brand + '</span>' +
      '<h3><a href="' + href + '">' + p.name + '</a></h3>' +
      '<p class="spec">' + p.spec + '</p>' +
      '<div class="price"><span class="now">' + fmt(p.price) + '</span>' + (p.was ? '<span class="was">' + fmt(p.was) + '</span>' : '') + '</div>' +
      '<p class="rating-line">' + rating + '</p>' +
      stock +
      '<button class="add" type="button" data-add-id="' + p.id + '">Add to cart</button>' +
      '<a class="view-link" href="' + href + '">View details</a>' +
    '</article>';
  }

  function updateHeader() {
    var n = readCart().reduce(function (s, i) { return s + i.qty; }, 0);
    var c = document.getElementById('cartCount');
    if (c) c.textContent = n;
    var b = document.getElementById('cartOpen');
    if (b) b.setAttribute('aria-label', 'Open cart, ' + n + (n === 1 ? ' item' : ' items'));
  }

  /* ----- Cart drawer ----- */
  var overlay = document.getElementById('cartOverlay');
  var drawer = document.getElementById('cartDrawer');
  var openBtn = document.getElementById('cartOpen');
  var closeBtn = document.getElementById('cartClose');
  var cartBody = document.getElementById('cartBody');
  var cartFoot = document.getElementById('cartFoot');
  var lastFocus = null;

  function renderDrawer() {
    var c = readCart();
    if (c.length === 0) {
      cartBody.innerHTML =
        '<div class="empty-cart">' +
          '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.5 11h11L21 7H6"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>' +
          '<p>Your cart is empty.</p>' +
          '<button type="button" class="btn" data-close>Continue shopping</button>' +
        '</div>';
      cartFoot.hidden = true;
      cartFoot.innerHTML = '';
    } else {
      cartBody.innerHTML = '<ul class="items">' + c.map(function (i) {
        return '<li class="item">' +
          '<div class="cthumb"><span>' + i.name + '</span>' + (i.img ? '<img src="' + BASE() + i.img + '" alt="' + i.name + '" onerror="this.remove()">' : '') + '</div>' +
          '<div>' +
            '<p class="item-name">' + i.name + '</p>' +
            '<p class="item-price">' + (i.spec || '') + '</p>' +
            '<p class="item-price">' + fmt(i.price) + ' each</p>' +
            '<div class="item-controls">' +
              '<div class="qty">' +
                '<button type="button" data-dr="dec" data-id="' + i.id + '" aria-label="Decrease quantity"' + (i.qty <= 1 ? ' disabled' : '') + '>-</button>' +
                '<output>' + i.qty + '</output>' +
                '<button type="button" data-dr="inc" data-id="' + i.id + '" aria-label="Increase quantity">+</button>' +
              '</div>' +
              '<button type="button" class="remove" data-dr="remove" data-id="' + i.id + '">Remove</button>' +
            '</div>' +
          '</div>' +
          '<p class="line-total">' + fmt(i.price * i.qty) + '</p>' +
        '</li>';
      }).join('') + '</ul>';
      var sub = c.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
      cartFoot.innerHTML =
        '<div class="sub-row"><span>Subtotal</span><strong>' + fmt(sub) + '</strong></div>' +
        '<a class="btn wide" href="' + BASE() + 'checkout.html">Proceed to checkout</a>';
      cartFoot.hidden = false;
    }
    updateHeader();
  }

  function changeCart(action, id) {
    var c = readCart();
    var item = c.filter(function (i) { return i.id === id; })[0];
    if (!item) return;
    if (action === 'inc') item.qty += 1;
    if (action === 'dec' && item.qty > 1) item.qty -= 1;
    if (action === 'remove') c = c.filter(function (i) { return i !== item; });
    writeCart(c);
    renderDrawer();
    if (typeof window.onCartChange === 'function') window.onCartChange();
  }

  function openCart() {
    lastFocus = openBtn;
    renderDrawer();
    overlay.hidden = false;
    drawer.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closeCart() {
    if (drawer.hidden) return;
    drawer.hidden = true;
    overlay.hidden = true;
    document.body.style.overflow = '';
    (lastFocus || openBtn).focus();
  }

  /* ----- Toast Notification ----- */
  var toastTimeout = null;
  function showToast(p) {
    var toast = document.getElementById('storeToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'storeToast';
      toast.className = 'store-toast';
      toast.setAttribute('role', 'status');
      toast.innerHTML =
        '<svg class="store-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>' +
        '<span class="store-toast-text" id="storeToastText"></span>' +
        '<button type="button" class="store-toast-btn" id="storeToastBtn">View Cart</button>';
      document.body.appendChild(toast);
      document.getElementById('storeToastBtn').addEventListener('click', function () {
        toast.classList.remove('show');
        openCart();
      });
    }
    document.getElementById('storeToastText').textContent = 'Added ' + p.brand + ' ' + p.name + ' to cart';
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toast.classList.remove('show');
    }, 3500);
  }

  function addToCart(id, qty) {
    var p = productById(id);
    if (!p) return;
    qty = Math.max(1, +qty || 1);
    var c = readCart();
    var line = c.filter(function (i) { return i.id === id; })[0];
    if (line) line.qty += qty;
    else c.push({ id: id, name: p.brand + ' ' + p.name, spec: p.spec, price: p.price, img: p.img || '', qty: qty });
    writeCart(c);
    updateHeader();
    showToast(p);
  }

  openBtn.addEventListener('click', openCart);
  closeBtn.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });
  drawer.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = drawer.querySelectorAll('button:not([disabled]), a[href]');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  cartBody.addEventListener('click', function (e) {
    var dr = e.target.closest('[data-dr]');
    if (dr) { changeCart(dr.getAttribute('data-dr'), dr.getAttribute('data-id')); return; }
    if (e.target.closest('[data-close]')) closeCart();
  });

  // "Add to cart" buttons on category pages and cards
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add-id]');
    if (b) addToCart(b.getAttribute('data-add-id'), 1);
  });

  /* ----- Live Instant Search ----- */
  function initLiveSearch() {
    var searchForms = document.querySelectorAll('form.search');
    searchForms.forEach(function (form) {
      var input = form.querySelector('input[type="search"], input[name="q"]');
      if (!input) return;

      var dropdown = document.createElement('div');
      dropdown.className = 'search-results';
      form.appendChild(dropdown);

      function performSearch() {
        var query = input.value.trim().toLowerCase();
        if (query.length < 2) {
          dropdown.classList.remove('active');
          dropdown.innerHTML = '';
          return;
        }

        var terms = query.split(/\s+/).filter(Boolean);
        var matches = STORE_PRODUCTS.filter(function (p) {
          var text = (p.brand + ' ' + p.name + ' ' + p.spec + ' ' + p.cat).toLowerCase();
          return terms.every(function (t) { return text.indexOf(t) >= 0; });
        }).slice(0, 5);

        if (matches.length === 0) {
          dropdown.innerHTML = '<div class="search-result-empty">No products found for "' + input.value + '"</div>';
        } else {
          dropdown.innerHTML = matches.map(function (p) {
            var href = productUrl(p);
            var imgHtml = p.img ? '<img src="' + BASE() + p.img + '" alt="' + p.name + '">' : '';
            return '<a class="search-result-item" href="' + href + '">' +
              '<div class="search-result-thumb">' + imgHtml + '</div>' +
              '<div class="search-result-info">' +
                '<div class="search-result-name">' + p.brand + ' ' + p.name + '</div>' +
                '<div class="search-result-spec">' + p.spec + '</div>' +
                '<div class="search-result-price">' + fmt(p.price) + '</div>' +
              '</div>' +
            '</a>';
          }).join('') +
          '<a class="search-result-footer" href="' + BASE() + 'search.html?q=' + encodeURIComponent(query) + '">View all results (' + matches.length + '+) →</a>';
        }
        dropdown.classList.add('active');
      }

      input.addEventListener('input', performSearch);
      input.addEventListener('focus', function () {
        if (input.value.trim().length >= 2) performSearch();
      });

      document.addEventListener('click', function (e) {
        if (!form.contains(e.target)) {
          dropdown.classList.remove('active');
        }
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') dropdown.classList.remove('active');
      });
    });
  }

  initLiveSearch();

  window.STORE = { fmt: fmt, productById: productById, productCard: productCard, starsHTML: starsHTML, addToCart: addToCart, updateHeader: updateHeader, productUrl: productUrl, openCart: openCart, showToast: showToast };
  updateHeader();
})();
