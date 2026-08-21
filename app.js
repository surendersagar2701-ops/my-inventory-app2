/* ========================================
   SMART INVENTORY APP v2.0 - With Design Images
   ======================================== */

let products = JSON.parse(localStorage.getItem('products')) || [];
let sections = JSON.parse(localStorage.getItem('sections')) || [];
let bills = JSON.parse(localStorage.getItem('bills')) || [];
let currentBill = [];
let selectedImage = null;

// ==========================================
// 1. NAVIGATION
// ==========================================

function switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[onclick="switchPage('${page}')"]`).classList.add('active');
    
    if (page === 'inventory') renderInventory();
    if (page === 'aiSet') { updateAvailableDesigns(); updateColorPalette(); }
    if (page === 'home') updateUI();
    if (page === 'bill') renderBillHistory();
}

// ==========================================
// 2. MODAL
// ==========================================

function openModal(type) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    
    let html = '';
    
    switch(type) {
        case 'addSection':
            html = `
                <button class="modal-close" onclick="closeModal()">✕</button>
                <h3 class="modal-title">📁 Create New Section</h3>
                <div class="form-group">
                    <label>Section Name</label>
                    <input id="sectionNameInput" placeholder="e.g., Bangles, Rings" class="form-input">
                </div>
                <button onclick="addSection()" class="btn-gradient">Create Section</button>
            `;
            break;
            
        case 'addProduct':
            const sectionOptions = sections.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            html = `
                <button class="modal-close" onclick="closeModal()">✕</button>
                <h3 class="modal-title">➕ Add New Product with Design</h3>
                <div class="form-group">
                    <label>Section</label>
                    <select id="productSection" class="form-input">
                        <option value="">Select Section</option>
                        ${sectionOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Product Name</label>
                    <input id="productName" placeholder="Product name" class="form-input">
                </div>
                <div class="form-group">
                    <label>SKU</label>
                    <input id="productSKU" placeholder="e.g., BGL-001" class="form-input">
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <select id="productColor" class="form-input">
                        <option value="">Select Color</option>
                        <option value="Red">🔴 Red</option>
                        <option value="Blue">🔵 Blue</option>
                        <option value="Gold">🟡 Gold</option>
                        <option value="Green">🟢 Green</option>
                        <option value="Silver">⚪ Silver</option>
                        <option value="Pink">🩷 Pink</option>
                        <option value="Purple">🟣 Purple</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Size</label>
                    <input id="productSize" placeholder="e.g., M, L, 18" class="form-input">
                </div>
                <div class="form-group">
                    <label>Design Image</label>
                    <div class="image-upload-area" onclick="document.getElementById('designImageInput').click()">
                        <span class="upload-icon">🖼️</span>
                        <span class="upload-text">Tap to upload design image</span>
                    </div>
                    <input type="file" id="designImageInput" accept="image/*" style="display:none" onchange="handleImageUpload(event)">
                    <div id="imagePreviewContainer" class="image-preview"></div>
                </div>
                <div class="form-group">
                    <label>Selling Price (₹)</label>
                    <input id="productPrice" type="number" placeholder="0" class="form-input">
                </div>
                <div class="form-group">
                    <label>Stock</label>
                    <input id="productStock" type="number" value="0" class="form-input">
                </div>
                <button onclick="addProduct()" class="btn-gradient">➕ Add Product</button>
            `;
            break;
            
        case 'bulkAdd':
            html = `
                <button class="modal-close" onclick="closeModal()">✕</button>
                <h3 class="modal-title">📥 Bulk Add Products</h3>
                <p style="color:#6b7280;font-size:13px;margin-bottom:12px">Format: Name,SKU,Color,Size,Price,Stock</p>
                <div class="form-group">
                    <label>Section</label>
                    <select id="bulkSection" class="form-input">
                        <option value="">Select Section</option>
                        ${sections.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Products</label>
                    <textarea id="bulkProducts" rows="6" placeholder="Bangle Gold,BGL-001,Gold,M,499,10" style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:12px;background:rgba(255,255,255,0.04);color:#fff;font-family:monospace;font-size:14px;resize:vertical"></textarea>
                </div>
                <button onclick="bulkAdd()" class="btn-gradient">📥 Add All</button>
            `;
            break;
            
        case 'aiSet':
            html = `
                <button class="modal-close" onclick="closeModal()">✕</button>
                <h3 class="modal-title">🤖 AI Set Maker</h3>
                <p style="color:#6b7280;font-size:13px;margin-bottom:12px">AI will analyze available designs & colors to create sets</p>
                <div id="modalDesigns" class="design-grid" style="margin-bottom:12px"></div>
                <button onclick="generateAISetsModal()" class="btn-gradient">⚡ Generate Sets from Designs</button>
                <div id="modalGeneratedSets" style="margin-top:12px"></div>
            `;
            break;
            
        default:
            html = `<button class="modal-close" onclick="closeModal()">✕</button><p>Unknown</p>`;
    }
    
    content.innerHTML = html;
    modal.classList.add('show');
    
    if (type === 'aiSet') renderModalDesigns();
    selectedImage = null;
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
    selectedImage = null;
}

// ===== IMAGE UPLOAD HANDLER =====
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImage = e.target.result;
        const container = document.getElementById('imagePreviewContainer');
        container.innerHTML = `
            <div class="image-preview-item">
                <img src="${e.target.result}" alt="Design">
                <button class="remove-img" onclick="removeImage()">✕</button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    selectedImage = null;
    document.getElementById('imagePreviewContainer').innerHTML = '';
    document.getElementById('designImageInput').value = '';
}

// ==========================================
// 3. SECTIONS
// ==========================================

function addSection() {
    const name = document.getElementById('sectionNameInput').value.trim();
    if (!name) { alert('Enter section name'); return; }
    
    sections.push({ id: 'SEC-' + Date.now(), name: name });
    localStorage.setItem('sections', JSON.stringify(sections));
    closeModal();
    updateUI();
}

function deleteSection(id) {
    if (!confirm('Delete section?')) return;
    products = products.filter(p => p.sectionId !== id);
    sections = sections.filter(s => s.id !== id);
    localStorage.setItem('sections', JSON.stringify(sections));
    localStorage.setItem('products', JSON.stringify(products));
    updateUI();
}

// ==========================================
// 4. PRODUCTS WITH IMAGE
// ==========================================

function addProduct() {
    const sectionId = document.getElementById('productSection').value;
    const name = document.getElementById('productName').value.trim();
    const sku = document.getElementById('productSKU').value.trim();
    const color = document.getElementById('productColor').value;
    const size = document.getElementById('productSize').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value) || 0;
    const stock = parseInt(document.getElementById('productStock').value) || 0;
    
    if (!sectionId) { alert('Select section'); return; }
    if (!name) { alert('Enter name'); return; }
    if (!sku) { alert('Enter SKU'); return; }
    if (products.some(p => p.sku === sku)) { alert('SKU exists!'); return; }
    
    const product = {
        id: 'PROD-' + Date.now(),
        sectionId, name, sku, color, size,
        price, stock, purchase: 0,
        designImage: selectedImage || null,
        designEmoji: getDesignEmoji(name)
    };
    
    products.push(product);
    localStorage.setItem('products', JSON.stringify(products));
    selectedImage = null;
    closeModal();
    updateUI();
}

function getDesignEmoji(name) {
    const map = {
        'Gold': '🟡',
        'Red': '🔴',
        'Blue': '🔵',
        'Green': '🟢',
        'Silver': '⚪',
        'Pink': '🩷',
        'Purple': '🟣'
    };
    return map[name] || '💎';
}

function editProduct(id) {
    const p = products.find(pr => pr.id === id);
    if (!p) return;
    
    const opts = sections.map(s => `<option value="${s.id}" ${s.id===p.sectionId?'selected':''}>${s.name}</option>`).join('');
    
    document.getElementById('modalContent').innerHTML = `
        <button class="modal-close" onclick="closeModal()">✕</button>
        <h3 class="modal-title">✏️ Edit Product</h3>
        <div class="form-group"><label>Section</label><select id="editSection" class="form-input">${opts}</select></div>
        <div class="form-group"><label>Name</label><input id="editName" value="${p.name}" class="form-input"></div>
        <div class="form-group"><label>SKU</label><input id="editSKU" value="${p.sku}" class="form-input"></div>
        <div class="form-group"><label>Color</label>
            <select id="editColor" class="form-input">
                <option value="">Select</option>
                <option value="Red" ${p.color==='Red'?'selected':''}>🔴 Red</option>
                <option value="Blue" ${p.color==='Blue'?'selected':''}>🔵 Blue</option>
                <option value="Gold" ${p.color==='Gold'?'selected':''}>🟡 Gold</option>
                <option value="Green" ${p.color==='Green'?'selected':''}>🟢 Green</option>
                <option value="Silver" ${p.color==='Silver'?'selected':''}>⚪ Silver</option>
                <option value="Pink" ${p.color==='Pink'?'selected':''}>🩷 Pink</option>
            </select>
        </div>
        <div class="form-group"><label>Size</label><input id="editSize" value="${p.size||''}" class="form-input"></div>
        <div class="form-group"><label>Price</label><input id="editPrice" type="number" value="${p.price}" class="form-input"></div>
        <div class="form-group"><label>Stock</label><input id="editStock" type="number" value="${p.stock}" class="form-input"></div>
        ${p.designImage ? `<div style="margin:10px 0"><img src="${p.designImage}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;border:2px solid rgba(255,255,255,0.06)"></div>` : ''}
        <button onclick="saveEdit('${id}')" class="btn-gradient">💾 Save</button>
        <button onclick="deleteProduct('${id}')" style="width:100%;padding:14px;margin-top:10px;background:#ef4444;color:#fff;border:none;border-radius:12px;font-weight:600;cursor:pointer">🗑️ Delete</button>
    `;
    document.getElementById('modal').classList.add('show');
}

function saveEdit(id) {
    const p = products.find(pr => pr.id === id);
    if (!p) return;
    p.sectionId = document.getElementById('editSection').value;
    p.name = document.getElementById('editName').value.trim();
    p.sku = document.getElementById('editSKU').value.trim();
    p.color = document.getElementById('editColor').value;
    p.size = document.getElementById('editSize').value.trim();
    p.price = parseFloat(document.getElementById('editPrice').value) || 0;
    p.stock = parseInt(document.getElementById('editStock').value) || 0;
    localStorage.setItem('products', JSON.stringify(products));
    closeModal();
    updateUI();
}

function deleteProduct(id) {
    if (!confirm('Delete?')) return;
    products = products.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(products));
    closeModal();
    updateUI();
}

// ==========================================
// 5. BULK
// ==========================================

function bulkAdd() {
    const sectionId = document.getElementById('bulkSection').value;
    const text = document.getElementById('bulkProducts').value;
    if (!sectionId) { alert('Select section'); return; }
    if (!text.trim()) { alert('Enter products'); return; }
    
    let added = 0, errors = [];
    text.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 4) { errors.push('Invalid: ' + line); return; }
        const [name, sku, color, size, price, stock] = parts;
        if (products.some(p => p.sku === sku)) { errors.push('SKU exists: ' + sku); return; }
        products.push({
            id: 'PROD-' + Date.now() + '-' + Math.random().toString(36).substr(2,3),
            sectionId, name, sku, color: color||'', size: size||'',
            price: parseFloat(price)||0, stock: parseInt(stock)||0, purchase: 0,
            designImage: null,
            designEmoji: getDesignEmoji(color)
        });
        added++;
    });
    
    localStorage.setItem('products', JSON.stringify(products));
    closeModal();
    updateUI();
    alert('✅ Added ' + added + ' products' + (errors.length ? '\nErrors:\n' + errors.join('\n') : ''));
}

// ==========================================
// 6. AI SET MAKER WITH DESIGNS
// ==========================================

function updateAvailableDesigns() {
    const container = document.getElementById('availableDesigns');
    if (!container) return;
    
    const designs = products.filter(p => p.stock > 0);
    if (designs.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;text-align:center;padding:20px">No products in inventory. Add some designs first!</p>';
        return;
    }
    
    container.innerHTML = designs.map(p => `
        <div class="design-card">
            <div class="design-image">
                ${p.designImage ? `<img src="${p.designImage}" alt="${p.name}">` : `<span class="design-emoji">${p.designEmoji || '💎'}</span>`}
            </div>
            <div class="design-name">${p.name}</div>
            <div class="design-color">${p.color || 'No color'} • ${p.size || ''}</div>
            <div class="design-stock">${p.stock} in stock</div>
        </div>
    `).join('');
}

function renderModalDesigns() {
    const container = document.getElementById('modalDesigns');
    if (!container) return;
    
    const designs = products.filter(p => p.stock > 0);
    if (designs.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;text-align:center;padding:20px">No products. Add designs first!</p>';
        return;
    }
    
    container.innerHTML = designs.slice(0,6).map(p => `
        <div class="design-card" style="padding:8px">
            <div class="design-image" style="width:60px;height:60px;font-size:24px">
                ${p.designImage ? `<img src="${p.designImage}" alt="${p.name}">` : `<span class="design-emoji">${p.designEmoji || '💎'}</span>`}
            </div>
            <div class="design-name" style="font-size:10px">${p.name}</div>
        </div>
    `).join('');
}

function generateAISets() {
    updateAvailableDesigns();
    generateAISetsFromDesigns();
}

function generateAISetsModal() {
    const container = document.getElementById('modalGeneratedSets');
    if (!container) return;
    generateAISetsFromDesigns(container);
}

function generateAISetsFromDesigns(container) {
    const targetContainer = container || document.getElementById('generatedSets');
    if (!targetContainer) return;
    
    // Get all products with stock
    const availableProducts = products.filter(p => p.stock > 0);
    
    if (availableProducts.length < 2) {
        targetContainer.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">Need at least 2 designs with stock to create sets!</p>';
        return;
    }
    
    // Group by color for set combinations
    const colorGroups = {};
    availableProducts.forEach(p => {
        if (p.color) {
            if (!colorGroups[p.color]) colorGroups[p.color] = [];
            colorGroups[p.color].push(p);
        }
    });
    
    const colors = Object.keys(colorGroups);
    if (colors.length < 2) {
        targetContainer.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">Need at least 2 different colors!</p>';
        return;
    }
    
    // Generate sets
    const sets = [];
    for (let i = 0; i < colors.length; i++) {
        for (let j = i+1; j < colors.length; j++) {
            const products1 = colorGroups[colors[i]];
            const products2 = colorGroups[colors[j]];
            const minStock = Math.min(
                products1.reduce((s,p) => s + p.stock, 0),
                products2.reduce((s,p) => s + p.stock, 0)
            );
            if (minStock >= 2) {
                sets.push({
                    colors: [colors[i], colors[j]],
                    products: [...products1, ...products2],
                    maxSets: Math.floor(minStock / 2),
                    name: `${colors[i]} + ${colors[j]} Set`,
                    designEmojis: [products1[0]?.designEmoji || '💎', products2[0]?.designEmoji || '💎'],
                    designImages: [products1[0]?.designImage, products2[0]?.designImage]
                });
            }
        }
    }
    
    // 3-color combos
    for (let i = 0; i < colors.length; i++) {
        for (let j = i+1; j < colors.length; j++) {
            for (let k = j+1; k < colors.length; k++) {
                const products1 = colorGroups[colors[i]];
                const products2 = colorGroups[colors[j]];
                const products3 = colorGroups[colors[k]];
                const minStock = Math.min(
                    products1.reduce((s,p) => s + p.stock, 0),
                    products2.reduce((s,p) => s + p.stock, 0),
                    products3.reduce((s,p) => s + p.stock, 0)
                );
                if (minStock >= 2) {
                    sets.push({
                        colors: [colors[i], colors[j], colors[k]],
                        products: [...products1, ...products2, ...products3],
                        maxSets: Math.floor(minStock / 2),
                        name: `${colors[i]} + ${colors[j]} + ${colors[k]} Set`,
                        designEmojis: [products1[0]?.designEmoji || '💎', products2[0]?.designEmoji || '💎', products3[0]?.designEmoji || '💎'],
                        designImages: [products1[0]?.designImage, products2[0]?.designImage, products3[0]?.designImage]
                    });
                }
            }
        }
    }
    
    if (sets.length === 0) {
        targetContainer.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">Not enough stock to create sets!</p>';
        return;
    }
    
    targetContainer.innerHTML = sets.slice(0,12).map((set, idx) => `
        <div class="set-card-design">
            <div class="set-header">
                <span class="set-name">${set.name}</span>
                <span class="set-badge">${set.maxSets} sets</span>
            </div>
            <div class="set-design-preview">
                ${set.designImages.map((img, i) => `
                    <div class="design-thumb">
                        ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">` : set.designEmojis[i] || '💎'}
                    </div>
                `).join('')}
            </div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:8px">Colors: ${set.colors.join(', ')}</div>
            <button onclick="addSetToInventory(${idx})" class="btn-add-set">➕ Add to Inventory</button>
        </div>
    `).join('');
    
    window._generatedSets = sets;
}

function addSetToInventory(idx) {
    const set = window._generatedSets[idx];
    if (!set) return;
    
    let sec = sections.find(s => s.name === 'AI Sets');
    if (!sec) { 
        sec = { id: 'SEC-AI-' + Date.now(), name: 'AI Sets' }; 
        sections.push(sec); 
        localStorage.setItem('sections', JSON.stringify(sections)); 
    }
    
    const product = {
        id: 'SET-' + Date.now(),
        sectionId: sec.id,
        name: set.name,
        sku: 'SET-' + Date.now().toString().slice(-6),
        color: set.colors.join(' + '),
        size: 'Set',
        price: 499 + (set.colors.length * 100),
        stock: set.maxSets,
        purchase: 0,
        isSet: true,
        designImage: set.designImages[0] || null,
        designEmoji: set.designEmojis[0] || '💎'
    };
    
    products.push(product);
    localStorage.setItem('products', JSON.stringify(products));
    closeModal();
    updateUI();
    alert('✅ Added "' + set.name + '" (' + set.maxSets + ' sets)');
}

function getColorHex(color) {
    const map = { 'Red':'#ef4444','Blue':'#3b82f6','Gold':'#f59e0b','Green':'#22c55e','Silver':'#9ca3af','Pink':'#ec4899','Purple':'#8b5cf6' };
    return map[color] || '#6b7280';
}

// ==========================================
// 7. INVENTORY
// ==========================================

function renderInventory() {
    const c = document.getElementById('inventorySections');
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filterSection = document.getElementById('filterSection')?.value || '';
    const filterColor = document.getElementById('filterColor')?.value || '';
    
    const fs = document.getElementById('filterSection');
    if (fs) {
        const v = fs.value;
        fs.innerHTML = `<option value="">All Sections</option>` + sections.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        fs.value = v;
    }
    
    let filtered = products;
    if (search) filtered = filtered.filter(p => p.name?.toLowerCase().includes(search) || p.sku?.toLowerCase().includes(search));
    if (filterSection) filtered = filtered.filter(p => p.sectionId === filterSection);
    if (filterColor) filtered = filtered.filter(p => p.color === filterColor);
    
    if (sections.length === 0) {
        c.innerHTML = `<div class="card" style="text-align:center;padding:30px"><div style="font-size:48px;margin-bottom:10px">📁</div><p style="color:#6b7280">No sections</p><button onclick="openModal('addSection')" class="btn-gradient" style="margin-top:12px;padding:12px 30px">Create Section</button></div>`;
        return;
    }
    
    let html = '';
    sections.forEach(section => {
        const sp = filtered.filter(p => p.sectionId === section.id);
        if (sp.length === 0 && !filterSection && !search && !filterColor) {
            html += `<div class="section-card"><div class="section-header"><span class="section-name">📁 ${section.name}</span><span class="section-count">0</span></div><div style="padding:16px;text-align:center;color:#6b7280;font-size:13px">No products</div></div>`;
            return;
        }
        if (sp.length === 0) return;
        html += `<div class="section-card"><div class="section-header"><span class="section-name">📁 ${section.name}</span><span class="section-count">${sp.length}</span><button onclick="deleteSection('${section.id}')" style="background:rgba(239,68,68,0.15);color:#f87171;border:none;border-radius:8px;padding:4px 10px;cursor:pointer">✕</button></div><div class="section-products">${sp.map(p => `
            <div class="product-item">
                <div class="product-info" style="display:flex;align-items:center;gap:10px">
                    <div style="width:36px;height:36px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:18px;overflow:hidden">
                        ${p.designImage ? `<img src="${p.designImage}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">` : (p.designEmoji || '💎')}
                    </div>
                    <div><div class="product-name">${p.name}</div><div class="product-sku">SKU: ${p.sku} ${p.color ? '• '+p.color : ''} ${p.size ? '• '+p.size : ''}</div></div>
                </div>
                <div class="product-right"><div class="product-price">₹${p.price||0}</div><span class="product-stock-badge ${(p.stock||0)<5?'badge-low':'badge-good'}">${p.stock||0}</span><button onclick="editProduct('${p.id}')" class="product-edit-btn">✏️</button></div>
            </div>
        `).join('')}</div></div>`;
    });
    c.innerHTML = html || '<p style="color:#6b7280;text-align:center;padding:30px">No products</p>';
}

// ==========================================
// 8. BILL
// ==========================================

function scanBillProduct() {
    const q = prompt('Enter SKU or name:');
    if (!q) return;
    const p = products.find(pr => pr.sku?.toLowerCase().includes(q.toLowerCase()) || pr.name?.toLowerCase().includes(q.toLowerCase()));
    if (!p) { alert('Not found'); return; }
    if ((p.stock||0) < 1) { alert('Out of stock'); return; }
    const qty = parseInt(prompt('Quantity:', '1')) || 1;
    if (qty > p.stock) { alert('Not enough stock'); return; }
    currentBill.push({ ...p, qty, subtotal: p.price * qty });
    renderBillItems();
}

function renderBillItems() {
    const c = document.getElementById('billItems');
    if (currentBill.length === 0) { c.innerHTML = '<p style="color:#6b7280;text-align:center;padding:12px">No items</p>'; return; }
    c.innerHTML = currentBill.map((item, idx) => `
        <div class="product-item">
            <div class="product-info" style="display:flex;align-items:center;gap:10px">
                <div style="width:30px;height:30px;border-radius:4px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:14px;overflow:hidden">
                    ${item.designImage ? `<img src="${item.designImage}" style="width:100%;height:100%;object-fit:cover;border-radius:4px">` : (item.designEmoji || '💎')}
                </div>
                <div><div class="product-name">${item.name}</div><div class="product-sku">₹${item.price} × ${item.qty}</div></div>
            </div>
            <div style="display:flex;align-items:center;gap:10px"><span style="font-weight:700">₹${item.subtotal}</span><button onclick="removeBillItem(${idx})" style="background:none;border:none;font-size:20px;color:#ef4444;cursor:pointer">✕</button></div>
        </div>
    `).join('');
    calculateBillTotal();
}

function removeBillItem(idx) { currentBill.splice(idx,1); renderBillItems(); }

function calculateBillTotal() {
    const sub = currentBill.reduce((s,i) => s + (i.subtotal||0), 0);
    const dis = parseInt(document.getElementById('billDiscount').value) || 0;
    document.getElementById('billSubtotal').textContent = '₹' + sub;
    document.getElementById('billTotal').textContent = '₹' + Math.max(0, sub - dis);
}

function saveBill() {
    if (currentBill.length === 0) { alert('Add items'); return; }
    const sub = currentBill.reduce((s,i) => s + (i.subtotal||0), 0);
    const dis = parseInt(document.getElementById('billDiscount').value) || 0;
    const total = Math.max(0, sub - dis);
    const bill = {
        id: 'BILL-' + Date.now(),
        date: new Date().toLocaleString(),
        customer: document.getElementById('customerName').value || 'Walk-in',
        mobile: document.getElementById('customerMobile').value || '',
        items: currentBill.map(i => ({...i})),
        subtotal: sub, discount: dis, total: total
    };
    currentBill.forEach(item => {
        const p = products.find(pr => pr.id === item.id);
        if (p) p.stock = (p.stock||0) - item.qty;
    });
    bills.push(bill);
    localStorage.setItem('bills', JSON.stringify(bills));
    localStorage.setItem('products', JSON.stringify(products));
    currentBill = [];
    document.getElementById('customerName').value = '';
    document.getElementById('customerMobile').value = '';
    document.getElementById('billDiscount').value = '0';
    renderBillItems();
    updateUI();
    renderBillHistory();
    alert('✅ Bill saved! Total: ₹' + total);
}

function renderBillHistory() {
    const c = document.getElementById('billHistory');
    if (bills.length === 0) { c.innerHTML = '<p style="color:#6b7280;text-align:center;padding:20px">No bills</p>'; return; }
    c.innerHTML = bills.slice(-10).reverse().map(b => `
        <div class="card" style="cursor:pointer" onclick="viewBill('${b.id}')">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div><strong>#${b.id}</strong><div style="font-size:12px;color:#6b7280">${b.date}</div></div>
                <div style="text-align:right"><span style="font-weight:700;font-size:16px">₹${b.total}</span><div style="font-size:11px;color:#6b7280">${b.customer}</div></div>
            </div>
        </div>
    `).join('');
}

function viewBill(id) {
    const b = bills.find(bill => bill.id === id);
    if (!b) return;
    alert('🧾 BILL\n━━━━━━━━━━━━━━━━\nBill: ' + b.id + '\nDate: ' + b.date + '\nCustomer: ' + b.customer + '\n━━━━━━━━━━━━━━━━\n' + b.items.map(i => i.name + ' × ' + i.qty + ' = ₹' + i.subtotal).join('\n') + '\n━━━━━━━━━━━━━━━━\nSubtotal: ₹' + b.subtotal + '\nDiscount: ₹' + b.discount + '\nTOTAL: ₹' + b.total);
}

// ==========================================
// 9. UI UPDATE
// ==========================================

function updateUI() {
    document.getElementById('totalSections').textContent = sections.length;
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalStock').textContent = products.reduce((s,p) => s + (p.stock||0), 0);
    renderHomeSections();
    renderInventory();
    renderBillHistory();
    updateAvailableDesigns();
    updateColorPalette();
}

function renderHomeSections() {
    const c = document.getElementById('homeSections');
    if (sections.length === 0) {
        c.innerHTML = `<div class="card" style="text-align:center;padding:30px"><div style="font-size:48px;margin-bottom:10px">📂</div><p style="color:#6b7280">No sections</p><button onclick="openModal('addSection')" class="btn-gradient" style="margin-top:12px;padding:12px 30px">Create Section</button></div>`;
        return;
    }
    c.innerHTML = sections.slice(0,5).map(s => `<div class="section-card" onclick="switchPage('inventory')" style="cursor:pointer"><div class="section-header"><span class="section-name">📁 ${s.name}</span><span class="section-count">${products.filter(p => p.sectionId === s.id).length} products</span></div></div>`).join('');
}

function updateColorPalette() {
    const c = document.getElementById('availableColors');
    if (!c) return;
    const colors = {};
    products.forEach(p => { if (p.color && p.stock > 0) colors[p.color] = (colors[p.color]||0) + p.stock; });
    if (Object.keys(colors).length === 0) { c.innerHTML = '<p style="color:#6b7280">No colors</p>'; return; }
    c.innerHTML = Object.entries(colors).map(([col, qty]) => `
        <div class="color-item"><div class="color-chip" style="background:${getColorHex(col)}"></div><div class="color-label">${col}<br>${qty}</div></div>
    `).join('');
}

// ==========================================
// 10. MORE
// ==========================================

function exportData() {
    const data = { products, sections, bills };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart_inventory_backup.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Exported!');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.products) products = data.products;
                if (data.sections) sections = data.sections;
                if (data.bills) bills = data.bills;
                localStorage.setItem('products', JSON.stringify(products));
                localStorage.setItem('sections', JSON.stringify(sections));
                localStorage.setItem('bills', JSON.stringify(bills));
                updateUI();
                alert('✅ Imported!');
            } catch(err) { alert('Invalid file'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData() {
    if (!confirm('Delete ALL data?')) return;
    if (!confirm('Sure?')) return;
    products = []; sections = []; bills = []; currentBill = [];
    localStorage.removeItem('products');
    localStorage.removeItem('sections');
    localStorage.removeItem('bills');
    updateUI();
    renderBillItems();
    alert('✅ Cleared!');
}

function aboutApp() {
    alert('📱 Smart Inventory v2.0\n━━━━━━━━━━━━━━━━\n✅ Sections + Products\n✅ Design Images Upload\n✅ AI Set Maker with Designs\n✅ Billing System\n✅ 100% Real');
}

// ==========================================
// 11. INIT
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchInput')?.addEventListener('input', renderInventory);
    document.getElementById('filterSection')?.addEventListener('change', renderInventory);
    document.getElementById('filterColor')?.addEventListener('change', renderInventory);
});

updateUI();
console.log('✅ Smart Inventory v2.0 - With Design Images Loaded!');
