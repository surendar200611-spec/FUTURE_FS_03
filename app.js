// ===== FIREBASE INITIALIZATION =====
const firebaseConfig = {
  apiKey: "AIzaSyCC2uZI8ltpi0IV9WgSb9f33JcW-3O3cq4",
  authDomain: "yourcafe-8fa9e.firebaseapp.com",
  projectId: "yourcafe-8fa9e",
  storageBucket: "yourcafe-8fa9e.firebasestorage.app",
  messagingSenderId: "145694899840",
  appId: "1:145694899840:web:6263810c03aecb2669f065",
  measurementId: "G-NM4YBP2QXY"
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ===== PRODUCT CATALOG =====
const catalog = [
  {name:'Espresso',price:149,img:'espresso_card.png',cat:'hot'},
  {name:'Mocha Coffee',price:189,img:'mocha_card.png',cat:'hot'},
  {name:'Hot Chocolate',price:169,img:'hot_chocolate.png',cat:'hot'},
  {name:'Cappuccino',price:179,img:'cappuccino.png',cat:'hot'},
  {name:'Americano',price:139,img:'americano.png',cat:'hot'},
  {name:'Caramel Macchiato',price:199,img:'caramel_macchiato.png',cat:'hot'},
  {name:'Iced Latte',price:199,img:'latte_card.png',cat:'cold'},
  {name:'Iced Mocha',price:219,img:'iced_mocha.png',cat:'cold'},
  {name:'Cold Brew',price:189,img:'cold_brew.png',cat:'cold'},
  {name:'Biscoff Shake',price:249,img:'biscoff_shake.png',cat:'shake'},
  {name:'Biscoff Milkshake',price:249,img:'biscoff_shake.png',cat:'shake'},
  {name:'Salted Caramel Shake',price:249,img:'caramel_shake.png',cat:'shake'},
  {name:'Salted Caramel Milkshake',price:249,img:'caramel_shake.png',cat:'shake'},
  {name:'Chocolate Shake',price:259,img:'choco_shake.png',cat:'shake'},
  {name:'Decadent Chocolate Milkshake',price:259,img:'choco_shake.png',cat:'shake'},
  {name:'Chocolate Milkshake',price:229,img:'choco_shake2.png',cat:'shake'},
  {name:'Butter Croissant',price:129,img:'croissant.png',cat:'pastry'},
  {name:'Chocolate Brownie',price:149,img:'brownie.png',cat:'pastry'},
  {name:'Blueberry Muffin',price:119,img:'muffin.png',cat:'pastry'},
  {name:'Cinnamon Roll',price:159,img:'cinnamon_roll.png',cat:'pastry'},
  {name:'Tiramisu Slice',price:199,img:'tiramisu.png',cat:'pastry'},
  {name:'Red Velvet Cake',price:219,img:'red_velvet.png',cat:'pastry'}
];

// ===== SCROLL REVEAL =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) setTimeout(() => entry.target.classList.add('visible'), 80 * i);
  });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.transform = 'translateY(0)'; t.style.opacity = '1';
  setTimeout(() => { t.style.transform = 'translateY(100px)'; t.style.opacity = '0'; }, 2500);
}

// ===== STICKY NAV =====
window.addEventListener('scroll', () => {
  const nav = document.getElementById('main-nav');
  nav.style.boxShadow = window.scrollY > 20 ? '0 4px 20px rgba(0,0,0,0.2)' : 'none';
});

// ===== MENU TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.toggle('show', f === 'all' || item.dataset.cat === f);
    });
  });
});

// ===== TESTIMONIALS =====
let tCur = 0;
const tSlides = document.querySelectorAll('.testimonial-slide');
const tDots = document.querySelectorAll('.t-dot');
function goT(n) {
  tSlides[tCur].classList.remove('active'); tDots[tCur].classList.remove('active');
  tCur = (n + tSlides.length) % tSlides.length;
  tSlides[tCur].classList.add('active'); tDots[tCur].classList.add('active');
}
tDots.forEach(d => d.addEventListener('click', () => goT(+d.dataset.idx)));
setInterval(() => goT(tCur + 1), 4000);

// ===== RESERVE =====
async function handleReserve(e) {
  e.preventDefault();
  const name = document.getElementById('res-name').value;
  const phone = document.getElementById('res-phone').value;
  const date = document.getElementById('res-date').value;
  const guests = document.getElementById('res-guests').value;
  const btn = e.target.querySelector('button');
  
  // Attach cart items
  const preOrderedItems = cart.map(item => `${item.qty}x ${item.name}`).join(', ');
  const preOrderTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled = true;

  try {
    await db.collection('reservations').add({
      name,
      phone,
      date,
      guests,
      preOrderedItems: preOrderedItems || 'None',
      preOrderTotal: preOrderTotal || 0,
      status: 'Pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showToast('✓ Table reserved for ' + name + '!');
    e.target.reset();
    
    // Clear cart after reservation
    cart = [];
    updateCartBadge();

  } catch (error) {
    console.error('Error adding reservation: ', error);
    showToast('Error saving reservation. Please try again.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ===== SEARCH =====
function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  setTimeout(() => document.getElementById('search-input').focus(), 100);
}
function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
}
function doSearch(q) {
  const box = document.getElementById('search-results');
  if (!q.trim()) { box.innerHTML = ''; return; }
  const lower = q.toLowerCase();
  const results = catalog.filter(p => p.name.toLowerCase().includes(lower));
  const unique = [...new Map(results.map(r => [r.name, r])).values()];
  if (!unique.length) { box.innerHTML = '<div style="padding:1.2rem;color:#999;text-align:center;">No results found</div>'; return; }
  box.innerHTML = unique.map(r => `
    <div class="search-result-item" onclick="addToCart('${r.name}',${r.price},'${r.img}');closeSearch();">
      <img src="${r.img}" alt="${r.name}">
      <div class="sri-info"><h5>${r.name}</h5><p>₹${r.price}</p></div>
    </div>`).join('');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });

// ===== CART =====
let cart = [];
function addToCart(name, price, img) {
  if (!price) { const found = catalog.find(c => c.name === name); if (found) { price = found.price; img = found.img; } else { price = 0; img = ''; } }
  const existing = cart.find(c => c.name === name);
  if (existing) { existing.qty++; } else { cart.push({ name, price, img, qty: 1 }); }
  updateCartBadge();
  showToast('✓ ' + name + ' added to cart!');
}
function updateCartBadge() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  const badge = document.getElementById('cart-badge');
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
}
function openCart() {
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
  renderCart();
}
function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
}
function renderCart() {
  const list = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-footer');
  if (!cart.length) {
    list.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p></div>';
    footer.innerHTML = '';
    return;
  }
  list.innerHTML = cart.map((c, i) => `
    <div class="cart-item">
      <img src="${c.img}" alt="${c.name}">
      <div class="cart-item-info">
        <h5>${c.name}</h5>
        <p>₹${c.price} each</p>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
          <span class="qty-num">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeItem(${i})"><i class="fas fa-trash"></i></button>
    </div>`).join('');
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;
  footer.innerHTML = `
    <div class="cart-summary-row"><span>Subtotal</span><span>₹${subtotal}</span></div>
    <div class="cart-summary-row"><span>GST (5%)</span><span>₹${gst}</span></div>
    <div class="cart-summary-row total"><span>Total</span><span>₹${total}</span></div>
    <button class="btn-checkout" onclick="openPayment()">Proceed to Checkout</button>`;
}
function changeQty(i, d) {
  cart[i].qty += d;
  if (cart[i].qty < 1) cart.splice(i, 1);
  updateCartBadge(); renderCart();
}
function removeItem(i) { cart.splice(i, 1); updateCartBadge(); renderCart(); }

// ===== PAYMENT =====
function openPayment() {
  closeCart();
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;
  const body = document.getElementById('pay-body');
  body.innerHTML = `
    <div class="pay-order-summary">
      <h4>Order Summary</h4>
      ${cart.map(c => `<div class="pay-item-row"><span>${c.name} × ${c.qty}</span><span>₹${c.price * c.qty}</span></div>`).join('')}
      <hr class="pay-divider">
      <div class="pay-item-row"><span>Subtotal</span><span>₹${subtotal}</span></div>
      <div class="pay-item-row"><span>GST (5%)</span><span>₹${gst}</span></div>
      <hr class="pay-divider">
      <div class="pay-total-row"><span>Total</span><span>₹${total}</span></div>
    </div>
    <div class="pay-methods">
      <h4>Payment Method</h4>
      <div class="pay-method-grid">
        <div class="pay-method-btn selected" onclick="selectPay(this,'card')"><i class="fas fa-credit-card"></i><span>Card</span></div>
        <div class="pay-method-btn" onclick="selectPay(this,'upi')"><i class="fas fa-mobile-alt"></i><span>UPI</span></div>
        <div class="pay-method-btn" onclick="selectPay(this,'cod')"><i class="fas fa-money-bill-wave"></i><span>Cash</span></div>
      </div>
    </div>
    <div class="pay-fields" id="pay-fields">
      <div class="pay-field"><label>Card Number</label><input type="text" id="pay-card" placeholder="1234 5678 9012 3456" maxlength="19"></div>
      <div class="pay-field-row">
        <div class="pay-field"><label>Expiry</label><input type="text" id="pay-exp" placeholder="MM/YY" maxlength="5"></div>
        <div class="pay-field"><label>CVV</label><input type="password" id="pay-cvv" placeholder="•••" maxlength="4"></div>
      </div>
      <div class="pay-field"><label>Cardholder Name</label><input type="text" id="pay-name" placeholder="Full name on card"></div>
    </div>
    <button class="btn-pay-now" onclick="processPayment(${total})">Pay ₹${total}</button>`;
  document.getElementById('pay-modal').classList.add('open');
}
function selectPay(el, method) {
  document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  const fields = document.getElementById('pay-fields');
  if (method === 'card') {
    fields.innerHTML = `
      <div class="pay-field"><label>Card Number</label><input type="text" placeholder="1234 5678 9012 3456" maxlength="19"></div>
      <div class="pay-field-row"><div class="pay-field"><label>Expiry</label><input type="text" placeholder="MM/YY" maxlength="5"></div><div class="pay-field"><label>CVV</label><input type="password" placeholder="•••" maxlength="4"></div></div>
      <div class="pay-field"><label>Cardholder Name</label><input type="text" placeholder="Full name on card"></div>`;
  } else if (method === 'upi') {
    fields.innerHTML = '<div class="pay-field"><label>UPI ID</label><input type="text" placeholder="yourname@upi"></div>';
  } else {
    fields.innerHTML = '<div class="pay-field"><label>Phone Number</label><input type="tel" placeholder="Your phone for OTP verification"></div>';
  }
}
function processPayment(total) {
  document.getElementById('pay-body').innerHTML = `
    <div class="pay-success">
      <i class="fas fa-check-circle"></i>
      <h3>Payment Successful!</h3>
      <p>₹${total} has been charged. Your order is being prepared.</p>
      <p style="margin-top:.8rem;font-size:.8rem;color:#aaa;">Order #YC${Date.now().toString().slice(-6)}</p>
      <button class="btn-pay-now" style="margin-top:1.2rem;" onclick="closePayment();cart=[];updateCartBadge();">Done</button>
    </div>`;
}
function closePayment() { document.getElementById('pay-modal').classList.remove('open'); }

// ===== AI CHATBOT =====
const botFlow = {
  start: { msg: "Hi! I'm your YourCafe assistant ☕ How are you feeling?", opts: ["Energetic","Tired","Relaxed","Sweet tooth","Just browsing"] },
  energetic: { msg: "Love the energy! Try our Espresso (₹149) or Mocha (₹189). 💪", opts: ["Order Espresso","Order Mocha","See full menu","Start over"] },
  tired: { msg: "Need a pick-me-up? Espresso (₹149) or Biscoff Shake (₹249)! ⚡", opts: ["Order Espresso","Order Biscoff Shake","See full menu","Start over"] },
  relaxed: { msg: "Perfect mood! Iced Latte (₹199) or Hot Chocolate (₹169). 🍃", opts: ["Order Iced Latte","Order Hot Chocolate","See full menu","Start over"] },
  sweet: { msg: "Salted Caramel Shake (₹249) or Chocolate Shake (₹259)! 🍫", opts: ["Order Caramel Shake","Order Choco Shake","See full menu","Start over"] },
  browsing: { msg: "Browse our Menu, Gallery, or Reserve a table!", opts: ["View Menu","Reserve a Table","Gallery","Start over"] }
};
const chatOrders = {
  "Order Espresso":{name:"Espresso",price:149,img:"espresso_card.png"},
  "Order Mocha":{name:"Mocha Coffee",price:189,img:"mocha_card.png"},
  "Order Biscoff Shake":{name:"Biscoff Shake",price:249,img:"biscoff_shake.png"},
  "Order Iced Latte":{name:"Iced Latte",price:199,img:"latte_card.png"},
  "Order Hot Chocolate":{name:"Hot Chocolate",price:169,img:"hot_chocolate.png"},
  "Order Caramel Shake":{name:"Salted Caramel Shake",price:249,img:"caramel_shake.png"},
  "Order Choco Shake":{name:"Chocolate Shake",price:259,img:"choco_shake.png"}
};
let chatOpen = false, chatStarted = false;
function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chat-panel').classList.toggle('open', chatOpen);
  document.getElementById('chat-icon').className = chatOpen ? 'fas fa-times' : 'fas fa-comment-dots';
  document.getElementById('chat-notif').style.display = 'none';
  if (chatOpen && !chatStarted) { chatStarted = true; startChat(); }
}
function startChat() { addMsg('bot', botFlow.start.msg); renderOpts(botFlow.start.opts); }
function addMsg(who, text) {
  const box = document.getElementById('chat-messages');
  const d = document.createElement('div'); d.className = 'msg ' + who; d.textContent = text;
  box.appendChild(d); box.scrollTop = box.scrollHeight;
}
function renderOpts(opts) {
  const c = document.getElementById('chat-options'); c.innerHTML = '';
  opts.forEach(o => { const b = document.createElement('button'); b.className = 'chat-opt'; b.textContent = o; b.onclick = () => handleOpt(o); c.appendChild(b); });
}
function handleOpt(opt) {
  addMsg('user', opt);
  document.getElementById('chat-options').innerHTML = '';
  setTimeout(() => {
    if (opt === 'Start over') { startChat(); return; }
    if (opt === 'View Menu' || opt === 'See full menu') { window.location.hash = '#full-menu'; addMsg('bot', 'Check out our full menu! 🍵'); renderOpts(['Start over']); return; }
    if (opt === 'Reserve a Table') { window.location.hash = '#reserve'; addMsg('bot', 'Fill in your reservation! 📅'); renderOpts(['Start over']); return; }
    if (opt === 'Gallery') { window.location.hash = '#gallery'; addMsg('bot', 'Enjoy our gallery! 📸'); renderOpts(['Start over']); return; }
    if (chatOrders[opt]) {
      const it = chatOrders[opt];
      addToCart(it.name, it.price, it.img);
      addMsg('bot', it.name + ' (₹' + it.price + ') added to cart! 😊');
      renderOpts(['Start over', 'Reserve a Table']); return;
    }
    const km = {'Energetic':'energetic','Tired':'tired','Relaxed':'relaxed','Sweet tooth':'sweet','Just browsing':'browsing'};
    if (km[opt] && botFlow[km[opt]]) { addMsg('bot', botFlow[km[opt]].msg); renderOpts(botFlow[km[opt]].opts); }
    else { addMsg('bot', "Let me help you explore!"); renderOpts(['View Menu','Reserve a Table','Start over']); }
  }, 400);
}
function sendChatMsg() {
  const inp = document.getElementById('chat-input'); const t = inp.value.trim(); if (!t) return; inp.value = '';
  addMsg('user', t); const l = t.toLowerCase();
  setTimeout(() => {
    if (l.includes('espresso') || l.includes('strong')) { addMsg('bot','Espresso (₹149) – bold & perfect!'); renderOpts(['Order Espresso','Start over']); }
    else if (l.includes('shake') || l.includes('milk') || l.includes('sweet')) { addMsg('bot','Try Biscoff (₹249) or Caramel (₹249)! 🍫'); renderOpts(['Order Biscoff Shake','Order Caramel Shake','Start over']); }
    else if (l.includes('latte') || l.includes('cold') || l.includes('iced')) { addMsg('bot','Iced Latte (₹199) – smooth & refreshing! ❄️'); renderOpts(['Order Iced Latte','Start over']); }
    else if (l.includes('mocha')) { addMsg('bot','Mocha (₹189) – rich chocolate twist! ☕'); renderOpts(['Order Mocha','Start over']); }
    else if (l.includes('reserve') || l.includes('book') || l.includes('table')) { window.location.hash='#reserve'; addMsg('bot','Reserve your table above! 📅'); renderOpts(['Start over']); }
    else if (l.includes('menu')) { window.location.hash='#full-menu'; addMsg('bot','Here is our menu!'); renderOpts(['Start over']); }
    else if (l.includes('hi') || l.includes('hello') || l.includes('hey')) { addMsg('bot','Welcome to YourCafe! 👋'); renderOpts(['Energetic','Tired','Relaxed','Sweet tooth','Just browsing']); }
    else { addMsg('bot',"Tell me your mood and I'll find your perfect drink! 😊"); renderOpts(['Energetic','Tired','Relaxed','Sweet tooth','View Menu']); }
  }, 400);
}
setTimeout(() => { if (!chatOpen) document.getElementById('chat-notif').style.display = 'block'; }, 3000);
