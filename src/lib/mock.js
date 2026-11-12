// Faqat `npm run dev:mock` uchun: backendsiz, namunaviy (soxta) ma'lumotlar. Production build'ga kirmaydi.
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const day = (i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
const names = ['Jasur Rahimov', 'Dilnoza Karimova', 'Sardor Aliyev', 'Madina Tursunova', 'Bekzod Qodirov', 'Nilufar Saidova', 'Otabek Yusupov', 'Aziza Ergasheva', 'Javohir Nazarov', 'Malika Hasanova', 'Shoxrux Ismoilov', 'Zarina Mirzayeva'];
const users = names.map((n, i) => ({
  id: 100 - i, userId: String(5600000000 + i * 7919), publicId: String(1000 + i), name: n, login: '', tgUsername: n.split(' ')[0].toLowerCase() + (i + 7),
  email: '', authType: 'telegram', balance: [125000, 4000, 0, 56000, 980000, 12000, 0, 300, 45000, 7000, 0, 215000][i], totalDeposit: [400000, 20000, 0, 156000, 1500000, 52000, 10000, 5000, 95000, 17000, 0, 615000][i],
  referrals: [12, 0, 3, 5, 41, 1, 0, 0, 7, 2, 0, 18][i], banned: i === 6, plan: ['pro', 'oddiy', 'oddiy', 'premium', 'max', 'oddiy', 'oddiy', 'oddiy', 'pro', 'oddiy', 'oddiy', 'premium'][i],
  planUntil: i % 4 === 0 ? '2026-12-31' : '', lastSeen: day(i % 5), avatar: '', bots: [3, 1, 0, 2, 7, 1, 0, 0, 2, 1, 0, 4][i],
}));
const types = [['starska', 'Starska Bot'], ['anime', 'Anime Bot'], ['dokon', "Do'kon Bot"], ['referal', 'Referal Bot'], ['aichat', 'AI Chat Bot'], ['mafiya', 'Mafiya Bot']];
const bots = Array.from({ length: 18 }, (_, i) => {
  const [type, typeName] = types[i % types.length];
  const u = users[i % users.length];
  return { id: 200 - i, username: `${type}_${['shop', 'kino', 'uz', 'pro', 'bot'][i % 5]}${i + 1}bot`, ownerId: u.userId, ownerName: u.name, type, typeKey: type, typeName,
    plan: ['oddiy', 'standart', 'pro', 'max'][i % 4], daysLeft: [24, 3, 0, 15, 7, -2, 28, 1][i % 8], created: `${String((i % 27) + 1).padStart(2, '0')}.10.2026 | 14:${String(i * 3 % 60).padStart(2, '0')}`,
    price: [0, 6000, 30000, 120000][i % 4], autoPay: i % 3 === 0, trial: i % 5 === 0, paused: i % 8 === 5, webappAddon: i % 4 === 0 };
});
const series = Array.from({ length: 14 }, (_, i) => ({ date: day(13 - i), bots: [2, 4, 3, 6, 5, 8, 4, 7, 9, 6, 11, 8, 10, 12][i], payments: [120, 340, 80, 560, 220, 410, 700, 300, 650, 480, 900, 520, 760, 1100][i] * 1000 }));
const events = [
  ['panel_balance', '[admin 7919670157] 5600007919: +50000 (chek)'], ['admin_login', 'Admin botdan (/panelweb) yangi panelga kirdi'], ['login', 'Foydalanuvchi kirdi'],
  ['failed_login', "Admin token yaroqsiz yoki eskirgan"], ['panel_bot_extend', '[admin 7919670157] @starska_shop1bot +30 kun'], ['panel_templates_sync', '[admin 7919670157] starska: 2 yangilandi, 0 xato'],
].map(([event, message], i) => ({ id: 900 - i, event, message, user_id: '', ip: `85.209.1.${10 + i}`, created_at: new Date(Date.now() - i * 37e5).toISOString().replace('T', ' ').slice(0, 19) }));
const tpl = [
  ['starska', 'Starska Bot', '⭐', 'Telegram Stars', 0, 2, 0], ['anime', 'Anime Bot', '🎬', 'Anime / Kino', 0, 3, 1], ['dokon', "Do'kon Bot", '🛒', "Do'kon", 25000, 3, 0],
  ['referal', 'Referal Bot', '🎁', 'Referal', 0, 3, 0], ['aichat', 'AI Chat Bot', '🤖', 'AI', 15000, 3, 2], ['mafiya', 'Mafiya Bot', '🎭', "O'yin", 0, 3, 0],
].map(([id, name, icon, category, price, n, out]) => ({ id, name, icon, category, price, version: '1.0.0', description: `${name} — tayyor shablon: admin panel, Web App, tariflar va statistika.`, src: `shablon_src/${id}`, bots: n, actual: n - out, outdated: bots.filter((b) => b.type === id).slice(0, out).map((b) => b.username) }));

const settings = [
  ['holat', 'switch', 'Bot holati', "O'chirilsa bot javob bermaydi.", 'main', true], ['user', 'text', 'Admin username', '@ belgisiz', 'main', 'saidazaam'],
  ['valyuta', 'text', 'Valyuta', '', 'main', "so'm"], ['taklif', 'number', 'Referal mukofoti', '', 'main', '500'], ['gpul', 'number', 'Guruh mukofoti', '', 'main', '0'],
  ['admins', 'lines', 'Adminlar (Telegram ID)', 'Har qatorda bitta ID.', 'access', '7919670157'], ['kanal', 'lines', 'Majburiy obuna kanallari', 'Har qatorda @username.', 'access', '@makefy_news'],
  ['qoida', 'textarea', 'Qoidalar matni', '', 'content', "1. Spam taqiqlanadi.\n2. Boshqa birovning botini o'zlashtirish taqiqlanadi."],
  ['bonusstatus', 'switch', "Kunlik bonus o'yini", '', 'bonus', false], ['bonusmin', 'number', 'Bonus — minimal', '', 'bonus', '2'], ['bonusmax', 'number', 'Bonus — maksimal', '', 'bonus', '10'],
  ['bonusoladi', 'number', 'Bonus oluvchilar soni', '', 'bonus', '20'], ['oraliqvaqt', 'number', "Bonus oralig'i (soat)", '', 'bonus', '1'],
].map(([key, type, label, hint, group, value]) => ({ key, type, label, hint, group, value }));

const chatMsgs = {};
function msgsFor(uid) {
  if (!chatMsgs[uid]) {
    chatMsgs[uid] = [
      { id: 1, kim: 'user', matn: "Assalomu alaykum! Botim ishlamay qoldi, to'lov qildim lekin muddati yangilanmadi.", sana_label: '09.11.2026 21:04', oqildi: 1 },
      { id: 2, kim: 'admin', matn: "Va alaykum assalom! Tekshirib ko'ramiz, bot username'ini yuboring.", sana_label: '09.11.2026 21:10', oqildi: 1 },
      { id: 3, kim: 'user', matn: '@starska_shop1bot', sana_label: '09.11.2026 21:11', oqildi: 0 },
    ];
  }
  return chatMsgs[uid];
}

// Web App dizaynlari (namunaviy holat)
const DIDS = ['classic', 'minimal', 'bento', 'glass', 'futuristic', 'brutal'];
const DNAMES = { classic: 'Standart', minimal: 'Minimalism', bento: 'Bento Grid', glass: 'Glassmorphism', futuristic: 'Dark Mode / Futuristic', brutal: 'Neo-Brutalism' };
const WA = {
  global: { disabled: [], lockedTypes: [], colors: true, presets: ['#5b7cfa', '#7c6cf6', '#ec4899', '#ef4444', '#f97316', '#f2b53b', '#22c55e', '#14b8a6', '#0ea5e9', '#111827'] },
  plans: {}, // id -> {designs, colors}
  bots: Object.fromEntries(bots.map((b, i) => [b.username, { design: DIDS[i % 6], colors: i % 4 === 1 ? { accent: '#ef4444', accent2: '' } : null, force: i === 3 }])),
};
const botPlanItems = () => types.slice(0, 3).flatMap(([t, n], ti) => [['oddiy', 'Oddiy', 0, 500, 500, 'pullik', 5000, 1], ['standart', 'Standart', 6000, 1000, 3000, 'bor', 0, 2], ['pro', 'Pro', 30000, 5000, 20000, 'bor', 0, 3], ['max', 'Max', 120000, 0, 100000, 'bor', 0, 3]].map(([kalit, nomi, narx, mu, mm, w, wn, tz], i) => {
  const id = ti * 10 + i;
  const wa = WA.plans[id] || { designs: i === 0 ? ['classic', 'minimal'] : i === 1 ? ['classic', 'minimal', 'bento', 'glass'] : null, colors: i > 0 };
  const features = { majburiy_obuna: true, max_kontent: [50, 300, 1000, 0][i], webapp_colors: wa.colors, ...(wa.designs ? { webapp_designs: wa.designs } : {}) };
  return { id, botTuri: t, typeName: n, kalit, nomi, bosqich: i + 1, narx, muddatKun: 30, maxUsers: mu, monthlyMessages: mm, webapp: w, webappNarx: wn, tezlik: tz, features, faol: true, bots: [40, 22, 9, 3][i] };
}));
function waView(q) {
  const plans = botPlanItems();
  const applied = (b, s) => {
    if (s.locked || WA.global.lockedTypes.includes(b.type)) return { design: 'classic', colors: null, locked: true };
    const p = plans.find((x) => x.botTuri === b.type && x.kalit === b.plan);
    const allowed = !WA.global.disabled.includes(s.design) && (s.force || !p || !p.features.webapp_designs || p.features.webapp_designs.includes(s.design));
    const colorsOk = WA.global.colors && (s.force || !p || p.features.webapp_colors !== false);
    return { design: allowed ? s.design : 'classic', colors: colorsOk ? s.colors : null };
  };
  const list = bots.map((b) => ({ username: b.username, turi: b.type, typeName: b.typeName, ...WA.bots[b.username], tarif: b.plan, updated: 0 })).map((b) => ({ ...b, applied: applied(bots.find((x) => x.username === b.username), b) }));
  const counts = {}; list.forEach((b) => { counts[b.design] = (counts[b.design] || 0) + 1; });
  return {
    global: WA.global,
    designs: DIDS.map((id) => ({ id, name: DNAMES[id], bots: counts[id] || 0 })),
    plans: plans.map((p) => ({ id: p.id, botTuri: p.botTuri, typeName: p.typeName, kalit: p.kalit, nomi: p.nomi, bosqich: p.bosqich, faol: p.faol, designs: p.features.webapp_designs || null, colors: p.features.webapp_colors !== false })),
    bots: list.filter((b) => !q || b.username.includes(q)),
    types: [...new Map(list.map((b) => [b.turi, { id: b.turi, name: b.typeName, bots: list.filter((x) => x.turi === b.turi).length }])).values()],
    total: list.length,
  };
}

const MOD = {
  enabled: true,
  categories: { narko: 'Giyohvand moddalar', qimor: 'Qimor va kazino', adult: '18+ / fohishabozlik', firib: 'Firibgarlik va soxta hujjat', qurol: 'Qurol savdosi', ekstrem: 'Terror va ekstremizm', haqorat: "So'kinish va haqorat", boshqa: 'Boshqa' },
  defaults: [['narkotik', 'narko'], ['kokain', 'narko'], ['kazino', 'qimor'], ['1xbet', 'qimor'], ['porno', 'adult'], ['soxta pasport', 'firib'], ['qurol sotiladi', 'qurol'], ['terakt', 'ekstrem'], ['suka', 'haqorat']].map(([word, cat]) => ({ word, cat, disabled: false })),
  custom: [{ word: 'stavka bonus', cat: 'qimor', by: '7919670157', at: '2026-11-11 18:20:00' }],
  stats: { blocked7: 6, saved7: 142 },
  log: [
    { at: '2026-11-12 09:41:10', src: 'site', bot: 'starska_shop1bot', action: 'text', status: 'blocked', word: 'kazino', cat: 'qimor', text: 'Eng zo‘r kazino bonuslari shu yerda!' },
    { at: '2026-11-12 09:30:02', src: 'site', bot: 'anime_kino2bot', action: 'button', status: 'saved', text: '🎬 Yangi animelar' },
    { at: '2026-11-12 08:12:47', src: 'bot', bot: 'dokon_uz3bot', action: 'text', status: 'saved', text: 'Buyurtmangiz qabul qilindi! Raqami: {1}' },
  ],
};

const TMETA = tpl.map((t) => ({ slug: t.id, name: t.name, icon: t.icon, iconUrl: null, category: t.category, description: t.description, earn: '',
  highlights: ['Tayyor admin panel', 'Web App', 'Avto to‘lov'], tags: ['Web App'], buttons: ['🛒 Katalog', '👤 Profil'],
  features: [{ icon: '⚡', title: 'Tez ishga tushadi', desc: '2 daqiqada' }, { icon: '💳', title: 'To‘lov', desc: 'Avto yoki qo‘lda' }] }));

const BRB = {
  settings: { enabled: true, dailyFree: 1, ticketPrice: 5000, maxBuy: 20 },
  types: { balans: "Balans (so'm)", chipta: 'Chipta', sovga: "Sovg'a (qo'lda beriladi)", bosh: "Bo'sh (omad kelmadi)" },
  prizes: [['50 Stars', '⭐', 'sovga', 50, 10, false, -1], ["5 000 so'm", '💰', 'balans', 5000, 30, false, -1], ['+1 chipta', '🎟', 'chipta', 1, 20, false, -1],
    ['Muzqaymoq', '🍦', 'sovga', 0, 0.5, true, 3], ['Xmas paypoq', '🧦', 'sovga', 0, 0.5, true, 0], ['Omad kelmadi', '🙈', 'bosh', 0, 39, false, -1]]
    .map(([nomi, emoji, turi, qiymat, vazn, nft, soni], i) => ({ id: i + 1, nomi, emoji, rasm: '', turi, qiymat, vazn, nft, soni, faol: true, tartib: i })),
  stats: { today: 37, total: 1240, pending: 2, paid: 410000, sold: 96, tickets: 58 },
  spins: [
    { id: 3, user_id: '5600007919', ism: 'Dilnoza Karimova', nomi: '50 Stars', emoji: '⭐', rasm: '', turi: 'sovga', holat: 'kutilmoqda', created_at: '2026-11-12 16:40:02' },
    { id: 2, user_id: '5600015838', ism: 'Sardor Aliyev', nomi: 'Muzqaymoq', emoji: '🍦', rasm: '', turi: 'sovga', holat: 'kutilmoqda', created_at: '2026-11-12 15:12:44' },
    { id: 1, user_id: '5600000000', ism: 'Jasur Rahimov', nomi: "5 000 so'm", emoji: '💰', rasm: '', turi: 'balans', holat: 'berildi', created_at: '2026-11-12 14:01:10' },
  ],
};
function brbView() {
  const act = BRB.prizes.filter((p) => p.faol && p.soni !== 0 && p.vazn > 0);
  const tot = act.reduce((a, p) => a + p.vazn, 0);
  return { ...BRB, prizes: BRB.prizes.map((p) => ({ ...p, chance: act.includes(p) && tot ? Math.round((p.vazn / tot) * 10000) / 100 : 0 })) };
}

export async function mockRequest(path, method, body) {
  await wait();
  const [p, query = ''] = path.replace(/^\/+/, '').replace(/\.php/, '').split('?');
  const q = Object.fromEntries(new URLSearchParams(query));
  const ok = (message) => ({ message: message || 'Saqlandi (namunaviy rejim).' });
  if (method !== 'GET') {
    if (p === 'auth/admin_token') return {};
    if (p === 'panel/webapp_designs') {
      if (body.action === 'global') { WA.global = { ...WA.global, disabled: body.disabled, colors: body.colors, presets: body.presets }; return { message: 'Saqlandi.', global: WA.global }; }
      if (body.action === 'lock_type') { WA.global.lockedTypes = WA.global.lockedTypes.filter((t) => t !== body.turi).concat(body.locked ? [body.turi] : []); return { message: 'Saqlandi.', global: WA.global }; }
      if (body.action === 'plan') { WA.plans[body.id] = { designs: body.designs, colors: body.colors }; return { message: 'Tarif yangilandi.' }; }
      if (body.action === 'bot') { WA.bots[body.bot] = { design: body.design, colors: body.colors, force: body.force, locked: !!body.locked }; return { message: 'Bot dizayni saqlandi.' }; }
    }
    if (p === 'panel/bot_plans' && body.action === 'create') return { message: "Yangi tarif qo'shildi (namunaviy rejim)." };
    if (p === 'panel/bot_plans' && body.action === 'delete') return { message: "Tarif o'chirildi (namunaviy rejim)." };
    if (p === 'panel/bot_plans' && body.id !== undefined) {
      WA.plans[body.id] = { designs: body.features?.webapp_designs || null, colors: body.features?.webapp_colors !== false };
      return { message: 'Saqlandi.' };
    }
    if (p === 'panel/session') return { admin: false };
    if (p === 'panel/baraban') {
      if (body.action === 'settings') BRB.settings = { enabled: !!body.enabled, dailyFree: body.dailyFree, ticketPrice: body.ticketPrice, maxBuy: body.maxBuy };
      if (body.action === 'prize') {
        const row = { ...body, rasm: body.image || body.rasm || '' }; delete row.action; delete row.image;
        if (row.id) BRB.prizes = BRB.prizes.map((x) => (x.id === row.id ? { ...x, ...row } : x)); else BRB.prizes.push({ ...row, id: Date.now() });
      }
      if (body.action === 'prize_delete') BRB.prizes = BRB.prizes.filter((x) => x.id !== body.id);
      if (body.action === 'spin_status') BRB.spins = BRB.spins.map((x) => (x.id === body.id ? { ...x, holat: body.holat } : x));
      return { ...brbView(), message: 'Saqlandi (namunaviy rejim).' };
    }
    if (p === 'panel/template_meta') {
      const t = TMETA.find((x) => x.slug === body.slug);
      if (t && body.action === 'save') Object.assign(t, body.data);
      if (t && body.action === 'icon') t.iconUrl = body.image;
      if (t && body.action === 'icon_reset') t.iconUrl = null;
      return { message: 'Saqlandi (namunaviy rejim).', templates: TMETA };
    }
    if (p === 'panel/moderation') {
      if (body.action === 'test') return { hit: /kazino|narko/i.test(body.text || '') ? { word: 'kazino', cat: 'qimor', catName: 'Qimor va kazino' } : null };
      if (body.action === 'add') MOD.custom.unshift({ word: body.word, cat: body.cat, by: '7919670157', at: '2026-11-12 10:00:00' });
      if (body.action === 'remove') MOD.custom = MOD.custom.filter((x) => x.word !== body.word);
      if (body.action === 'default') MOD.defaults = MOD.defaults.map((x) => (x.word === body.word ? { ...x, disabled: !!body.disabled } : x));
      if (body.action === 'enabled') MOD.enabled = !!body.enabled;
      return { ...MOD, message: 'Saqlandi (namunaviy rejim).' };
    }
    if (p === 'panel/chat') { const m = { id: Date.now(), kim: 'admin', matn: body.text, sana_label: 'hozir', oqildi: 0 }; msgsFor(body.uid).push(m); return { message: m }; }
    if (p === 'panel/templates') return { message: 'Yangilanish tarqatildi.', summary: { bots: 17, synced: 4, changed: 3, errors: 0 }, failed: [] };
    if (p === 'panel/ai') return { message: 'Saqlandi.', providers: AI.providers };
    return ok(body?.action === 'balance' ? 'Balans yangilandi.' : undefined);
  }
  switch (p) {
    case 'panel/moderation': return MOD;
    case 'panel/baraban': return brbView();
    case 'panel/template_meta': return { templates: TMETA };
    case 'panel/session': return { admin: true, adminId: '7919670157', csrfToken: 'mock', botUsername: 'Makefybot' };
    case 'panel/dashboard': return {
      stats: { users: 2431, usersToday: 186, banned: 12, balance: 18450000, bots: 642, botsActive: 518, botsPaused: 31, requestsPending: 3, requestsPaid: 1, chatUnread: 5, paymentsToday: 1100000, payments30: 14600000, paymentsPending: 4, jobsPending: 0 },
      series, types: types.map(([type, name], i) => ({ type, name, count: [214, 168, 97, 74, 51, 38][i] })),
      top: { balance: users.slice().sort((a, b) => b.balance - a.balance).slice(0, 8), referrals: users.slice().sort((a, b) => b.referrals - a.referrals).slice(0, 8).map((u) => ({ userId: u.userId, name: u.name, count: u.referrals })), bots: users.slice(0, 8).map((u) => ({ userId: u.userId, name: u.name, count: u.bots })) },
      recentUsers: users.slice(0, 6), events, templates: { count: 12, outdated: 3 },
    };
    case 'panel/users': {
      if (q.id) {
        const u = users.find((x) => x.userId === q.id) || users[0];
        return { user: { ...u, streak: 6, referralLevel: 1 }, bots: bots.filter((b) => b.ownerId === u.userId), balanceLog: [
          { id: 3, summa: 50000, sabab: 'admin_panel', izoh: "Chek orqali to'lov", sana: '2026-11-08 18:22:00' },
          { id: 2, summa: -30000, sabab: 'bot_tarif', izoh: 'Bot: starska_shop1bot', sana: '2026-11-02 11:05:00' },
          { id: 1, summa: 100000, sabab: 'karta', izoh: "Humo •••• 4417", sana: '2026-10-29 09:41:00' },
        ], payments: [{ id: 77, amount_req: 100000, amount_final: 100012, status: 'paid', last4: '4417', paid_at: '2026-10-29 09:41:00' }],
        invited: users.slice(3, 6).map((x) => ({ referee_id: x.userId, ism: x.name, sana: '01.11.2026', bonus_berildi: '1' })), invitedBy: null,
        requests: [{ id: 5, sorov_id: '48213', nomi: 'Taksi buyurtma boti', status: 'approved', sana: '05.11.2026' }], chatUnread: 1,
        plans: [{ kalit: 'oddiy', nomi: 'Oddiy' }, { kalit: 'pro', nomi: 'Pro' }, { kalit: 'premium', nomi: 'Premium' }, { kalit: 'max', nomi: 'Max' }] };
      }
      let items = users.filter((u) => !q.q || `${u.name} ${u.userId} ${u.tgUsername}`.toLowerCase().includes(q.q.toLowerCase()));
      if (q.filter === 'banned') items = items.filter((u) => u.banned);
      return { items, total: items.length, page: 1, limit: 25 };
    }
    case 'panel/bots': {
      if (q.bot) {
        const b = bots.find((x) => x.username === q.bot) || bots[0];
        return { bot: b, owner: users.find((u) => u.userId === b.ownerId), instance: { isTemplate: true, panels: { admin: '#', app: '#' }, stats: { users: 1284, items: 56, orders: 312, revenue: 4820000, pending: 2 } },
          template: { version: '1.0.0', botVersion: '1.0.0', synced: '2026-11-09 23:22:06', upToDate: b.id % 3 !== 0 },
          limits: { max_users: 5000, monthly_messages: 20000, webapp: true, token_change: true, tezlik: 3 },
          plans: [{ kalit: 'oddiy', nomi: 'Oddiy', narx: 0 }, { kalit: 'standart', nomi: 'Standart', narx: 6000 }, { kalit: 'pro', nomi: 'Pro', narx: 30000 }, { kalit: 'max', nomi: 'Max', narx: 120000 }] };
      }
      let items = bots.filter((b) => !q.q || b.username.includes(q.q));
      if (q.status === 'paused') items = items.filter((b) => b.paused);
      if (q.status === 'expired') items = items.filter((b) => b.daysLeft <= 0);
      if (q.type) items = items.filter((b) => b.type === q.type);
      return { items, total: items.length, page: 1, limit: 25, types: types.map((t) => t[0]) };
    }
    case 'panel/requests': return {
      counts: { pending: 2, approved: 1, paid: 1, delivered: 4 },
      requests: [
        { id: 9, sorov_id: '51877', user_id: users[1].userId, owner_name: users[1].name, nomi: "Stomatologiya klinikasi uchun navbat boti", tavsif: "Bemorlar vaqt band qiladi, admin tasdiqlaydi, eslatma yuboriladi.", status: 'pending', sana: '09.11.2026' },
        { id: 8, sorov_id: '50112', user_id: users[3].userId, owner_name: users[3].name, nomi: 'Kurs sotish boti', tavsif: "Click/Payme orqali to'lov, yopiq kanalga qo'shish.", status: 'pending', sana: '08.11.2026' },
        { id: 7, sorov_id: '48213', user_id: users[0].userId, owner_name: users[0].name, nomi: 'Taksi buyurtma boti', tavsif: '', status: 'paid', pul_miqdori: '450000', sana: '05.11.2026' },
        { id: 6, sorov_id: '47001', user_id: users[4].userId, owner_name: users[4].name, nomi: 'Restoran menyu boti', tavsif: '', status: 'delivered', pul_miqdori: '300000', sana: '01.11.2026' },
      ],
      orders: [{ id: 3, sorov_id: '47001', iltimos_id: 6, user_id: users[4].userId, bot_user: 'oshxona_menu_bot', kunlik_tolov: '1500', status: 'tayyor', sana: '02.11.2026' }],
      transfers: [{ id: 1, bot_user: 'anime_kino2bot', user_id: users[2].userId, yangi_egasi_id: users[5].userId, status: 'pending', sana: '07.11.2026' }],
      catalog: [{ nomi: 'Restoran menyu', kod: 'Restoran-menyu', turi: 'restoran', kunlik: '1500', tavsif: 'Menyu, savat, buyurtma', bor: true }],
    };
    case 'panel/chat': {
      if (q.uid) {
        const all = msgsFor(q.uid);
        const after = Number(q.after || 0);
        return { user: users.find((u) => u.userId === q.uid) || { userId: q.uid, name: '' }, messages: all.filter((m) => m.id > after), typing: false };
      }
      return { threads: users.slice(0, 7).map((u, i) => ({ userId: u.userId, name: u.name, tgUsername: u.tgUsername, unread: [2, 0, 1, 0, 0, 3, 0][i], lastText: ['@starska_shop1bot', "Rahmat, ishladi!", "To'lov qanday qilinadi?", 'Ok', 'Botimga Web App qo‘shsa bo‘ladimi?', 'Salom', "Tushundim"][i], lastAt: new Date(Date.now() - i * 54e5).toISOString(), lastFrom: i === 1 ? 'admin' : 'user' })) };
    }
    case 'panel/broadcast': return { recipients: 2419, batches: [{ id: 14, total: 2398, sent: 2311, failed: 87, status: 'done', created: '2026-11-06 19:00:12', finished: '2026-11-06 19:03:40' }], history: [{ id: 5, body: "🎉 Yangi shablon: Mafiya Bot! Do'stlaringiz bilan guruhda o'ynang.", recipients: 2398, created_at: '2026-11-06 19:00:12' }] };
    case 'panel/autopay': return {
      config: { botToken: true, botUsername: 'MakefyPayBot', botLink: 'https://t.me/MakefyPayBot', workerSecret: true, workerOnline: true, uzcard: false, platformUserbot: false },
      summary: { botsLive: 1, botsTotal: 2, sessionsActive: 1, today: 150120, month: 2400360, pending: 2, failed: 0 },
      bots: [
        { bot: 'kinochi_bot', turi: 'kino', owner: '7919670157', ownerName: 'Saidazam', enabled: true, card: '**** 4521', cardType: 'humo', cardOwner: 'ALI VALIYEV', userbot: true, minAmount: 1000, live: true, sum: 2400360, count: 96, todaySum: 150120 },
        { bot: 'donat_uz_bot', turi: 'donatgame', owner: '6534936017', ownerName: 'Bekzod', enabled: false, card: '', cardType: 'humo', cardOwner: '', userbot: false, minAmount: 1000, live: false, sum: 0, count: 0, todaySum: 0 },
      ],
      sessions: [{ id: 3, owner: '7919670157', ownerName: 'Saidazam', scope: 'user', phone: '+99890…567', status: 'active', error: '', account: 'Saidazam', updated: '2026-11-11 12:40' }],
      payments: { items: [{ id: 96, bot: 'kinochi_bot', owner_uid: '7919670157', end_user: 6558150712, purpose: 'movie:12', card_last4: '4521', card_type: 'humo', amount_req: '15000.00', amount_final: '15037.00', status: 'paid', credited: true, credit_tries: 0, credit_error: null, created: '2026-11-11 12:41' }], total: 1, page: 1, limit: 30 },
      unmatched: [],
    };
    case 'panel/payments': return {
      cards: [{ id: 1, number: '**** **** **** 4417', last4: '4417', owner: 'SAIDAZAM A.', type: 'humo', active: true, created: '2026-09-01', received: 38400000 }, { id: 2, number: '**** **** **** 0912', last4: '0912', owner: 'SAIDAZAM A.', type: 'uzcard', active: false, created: '2026-10-11', received: 1200000 }],
      payments: { items: users.slice(0, 8).map((u, i) => ({ id: 120 - i, user_id: u.userId, name: u.name, last4: '4417', amount_req: [50000, 100000, 20000, 30000, 250000, 10000, 60000, 45000][i], amount_final: [50007, 100013, 20002, 30011, 250004, 10009, 60001, 45003][i], status: ['paid', 'paid', 'pending', 'expired', 'paid', 'paid', 'cancelled', 'paid'][i], created: `2026-11-0${9 - i} 1${i}:20`, paid_at: i % 3 ? `2026-11-0${9 - i} 1${i}:24:00` : null })), total: 8, page: 1, limit: 30 },
      unmatched: [{ id: 501, last4: '4417', amount: 75000, kind: 'income', status: 'unmatched', raw_text: "💳 HUMOCARD *4417\n➕ 75 000.00 UZS\n📍 P2P ...", tx_ts: 0 }],
      balanceLog: [{ id: 3, user_id: users[0].userId, name: users[0].name, summa: 50000, sabab: 'admin_panel', izoh: "Chek orqali to'lov", sana: '2026-11-08 18:22:00' }, { id: 2, user_id: users[4].userId, name: users[4].name, summa: -120000, sabab: 'bot_tarif', izoh: 'Max tarif', sana: '2026-11-07 10:00:00' }],
      summary: { today: 1100000, month: 9800000, pending: 4, autoPay: true },
    };
    case 'panel/plans': return {
      plans: [['pro', 'Pro', 50000, 10, 20, 20, 1, false, 214], ['premium', 'Premium', 120000, 20, 50, 40, 3, true, 61], ['max', 'Max', 250000, 35, 100, 70, 7, true, 18]].map(([kalit, nomi, narxi, chegirma, kb, rb, bk, ot, n], i) => ({ id: i + 1, kalit, nomi, narxi, muddat_kun: 30, chegirma, kunlik_bonus_foiz: kb, referal_bonus_foiz: rb, bot_bonus_kun: bk, otkazish: ot, chat_rasm: true, token_yangila: true, webapp_bepul: i > 0, users: n })),
      limits: [['oddiy', 2, 1000, 2000, 1, 0], ['pro', 5, 10000, 20000, 3, 2], ['premium', 15, 50000, 100000, 10, 5], ['max', 50, 0, 1000000, 30, 20]].map(([kalit, a, b, c, d, e]) => ({ kalit, max_bots: a, max_bot_users: b, monthly_messages: c, max_members: d, max_api_keys: e, allowed_templates: '*' })),
    };
    case 'panel/bot_plans': return { items: botPlanItems(), designs: DIDS.map((id) => ({ id, name: DNAMES[id] })), types: types.map(([value, label]) => ({ value, label })), webappGlobal: WA.global };
    case 'panel/webapp_designs': return waView(q.q || '');
    case 'panel/promocodes': return { items: [{ id: 3, kod: 'NOYABR26', soni: 500, ishlatilgan: 312, mukofot: { oddiy: 2000, pro: 3000, premium: 5000, max: 8000 }, shaxsiy: '', faol: true, sana: '01.11.2026 10:00' }, { id: 2, kod: 'VIPJASUR', soni: 1, ishlatilgan: 0, mukofot: { oddiy: 50000, pro: 50000, premium: 50000, max: 50000 }, shaxsiy: users[0].userId, faol: true, sana: '28.10.2026 15:31' }, { id: 1, kod: 'START', soni: 100, ishlatilgan: 100, mukofot: { oddiy: 1000, pro: 1000, premium: 1000, max: 1000 }, shaxsiy: '', faol: false, sana: '01.09.2026 09:00' }] };
    case 'panel/channels': return { items: [{ id: 2, nomi: 'Makefy yangiliklari', username: '@makefy_news', mukofot: 500, sana: '01.11.2026', done: 1288 }, { id: 1, nomi: 'Hamkor kanal', username: '@hamkor_uz', mukofot: 300, sana: '20.10.2026', done: 406 }] };
    case 'panel/templates': return { templates: tpl, autoSync: true, lastAutoSync: '2026-11-09 23:40:00' };
    case 'panel/categories': return { items: ['Umumiy', "Do'kon", 'Kino', "O'yin", 'Ta\'lim'].map((nomi, i) => ({ id: i + 1, nomi })) };
    case 'panel/ai': return AI;
    case 'panel/settings': return { fields: settings };
    case 'panel/security': return { items: events, total: events.length, page: 1, limit: 50, events: [{ event: 'login', n: 9120 }, { event: 'panel_balance', n: 31 }, { event: 'failed_login', n: 14 }], system: { php: '8.2.33', time: '2026-11-09 23:59:00', jobsPending: 0, jobsFailed24h: 3, templateAutoSync: true, frontendUrl: 'https://makefy.uz', adminPanelUrl: 'https://admin.makefy.uz', errorLogSize: 506519 }, errorLog: ['[09-Nov-2026 21:04:11] PHP Warning: Undefined index: kun in /VisionBuilder/main.php on line 1532'] };
    default: throw new Error(`Mock: ${p} yo'q`);
  }
}

const AI = {
  providers: [
    { provider: 'gemini', label: 'Google Gemini', order: 1, enabled: true, model: '', envModel: '', defaultModel: 'gemini-flash-latest', effectiveModel: 'gemini-flash-latest', keys: [{ index: 0, masked: 'AIza…k9Qw' }, { index: 1, masked: 'AIza…7Hd2' }], envKeyCount: 0, source: 'db' },
    { provider: 'groq', label: 'Groq', order: 2, enabled: true, model: 'llama-3.3-70b-versatile', envModel: '', defaultModel: 'llama-3.3-70b-versatile', effectiveModel: 'llama-3.3-70b-versatile', keys: [], envKeyCount: 1, source: 'env' },
    { provider: 'openrouter', label: 'OpenRouter', order: 3, enabled: false, model: '', envModel: '', defaultModel: 'openrouter/free', effectiveModel: 'openrouter/free', keys: [], envKeyCount: 0, source: 'none' },
  ],
  pricing: { base: 15000, mult: 1 },
  usage: Array.from({ length: 14 }, (_, i) => ({ d: day(13 - i), n: [12, 30, 18, 44, 25, 61, 38, 52, 70, 41, 88, 66, 73, 95][i], users: 5 })),
};
