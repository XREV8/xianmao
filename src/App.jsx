import { useState, useEffect, useRef, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/* ══════════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════════ */
(() => {
  if (document.getElementById("xm-g")) return;
  const s = document.createElement("style");
  s.id = "xm-g";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
    button{cursor:pointer;border:none;background:none;font-family:inherit}
    input,textarea,select{font-family:inherit}
    img{display:block;object-fit:cover}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px}
    @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes scaleIn{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
    .press:active{transform:scale(.96);transition:transform .1s}
    .hover-card{transition:transform .18s,box-shadow .18s}
    .hover-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(0,0,0,.13)!important}
    .hover-row{transition:background .12s}
    .hover-row:hover{background:#f9fafb!important}
  `;
  document.head.appendChild(s);
})();

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const OR = "#F97316";
const CATS = ["全部","手机数码","时尚服饰","包袋配件","家居生活","美妆护肤","潮玩收藏","书籍","游戏周边","酒店住宿","机票代订","旅游服务","餐饮美食","教育培训","汽车摩托","宠物用品","运动健身","母婴用品"];
const LOCS = ["新加坡","吉隆坡","槟城","曼谷","雅加达","胡志明市","马尼拉","东京"];
const CONDS = ["全新","近全新","九成新","八成新","七成新"];
const ADMIN_PASS_KEY = "xianmao_admin_pass";
const getAdminPass = () => localStorage.getItem(ADMIN_PASS_KEY) || "admin888";
const fmt = n => `RM ${Number(n).toLocaleString()}`;

/* ══════════════════════════════════════════════════════════
   CONTEXT
══════════════════════════════════════════════════════════ */
const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

/* ══════════════════════════════════════════════════════════
   AI HELPER
══════════════════════════════════════════════════════════ */
async function aiGenerate(name, cat) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      title: `${name} 出售转让`,
      description: `出售${name}，${cat}类商品，成色良好，价格实惠，有意者请联系，可议价，同城可面交验货。`,
      suggestedPrice: 500,
      condition: "九成新",
      sellingPoints: ["价格实惠","成色良好","可议价"]
    };
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", max_tokens: 1000,
      messages: [{ role: "user", content:
        `你是东南亚二手交易平台AI助手。商品：${name}，类别：${cat}。
返回JSON（仅JSON，无其他文字）：
{"title":"吸引人标题最多25字","description":"自然真实描述约100字","suggestedPrice":建议售价马币整数,"condition":"成色（全新/近全新/九成新/八成新/七成新）","sellingPoints":["卖点一","卖点二","卖点三"]}`
      }]
    })
  });
  const d = await res.json();
  return JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim());
}

/* ══════════════════════════════════════════════════════════
   SHARED UI
══════════════════════════════════════════════════════════ */
const Badge = ({ children, color = OR, bg }) => (
  <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:600, color, background: bg || `${color}18` }}>{children}</span>
);

const statusBadge = s => {
  const map = {"已上架":["#16a34a","#f0fdf4"],"待审核":[OR,"#fff7ed"],"已下架":["#6b7280","#f3f4f6"],"封禁":["#dc2626","#fef2f2"],"正常":["#16a34a","#f0fdf4"],"已处理":["#6b7280","#f3f4f6"],"待处理":[OR,"#fff7ed"]};
  const [c, bg] = map[s] || ["#6b7280","#f3f4f6"];
  return <Badge color={c} bg={bg}>{s}</Badge>;
};

/* ══════════════════════════════════════════════════════════
   AUTH VIEWS
══════════════════════════════════════════════════════════ */
function AuthModal({ onClose }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const inp = { width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid #F0EBE5", outline:"none", fontSize:14, background:"#fafaf9", marginBottom:12 };

  const login = async () => {
    if (!email || !password) { setMsg("请填写邮箱和密码"); setOk(false); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setMsg("登录失败：" + (error.message === "Invalid login credentials" ? "邮箱或密码错误" : error.message)); setOk(false); }
    else { setMsg("登录成功！"); setOk(true); setTimeout(onClose, 800); }
  };

  const register = async () => {
    if (!name || !email || !password) { setMsg("请填写所有字段"); setOk(false); return; }
    if (password.length < 6) { setMsg("密码至少6位"); setOk(false); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) { setLoading(false); setMsg("注册失败：" + error.message); setOk(false); return; }
    // 手动创建 profile，不依赖触发器
    if (data?.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        name: name,
        av: name[0],
        status: "正常"
      }, { onConflict: "id" });
    }
    setLoading(false);
    setMsg("注册成功！正在登录…"); setOk(true);
    // 自动登录
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!loginErr) setTimeout(onClose, 800);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", padding:28, width:"100%", maxWidth:430, animation:"slideUp .25s ease", paddingBottom:40 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", marginBottom:24, background:"#f3f4f6", borderRadius:12, padding:4 }}>
          {["login","register"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"10px 0", borderRadius:9, fontSize:14, fontWeight:600, background:tab===t?"#fff":"transparent", color:tab===t?"#18181B":"#78716C", boxShadow:tab===t?"0 1px 4px rgba(0,0,0,.1)":"none", transition:"all .2s" }}>
              {t==="login"?"登录":"注册"}
            </button>
          ))}
        </div>
        {tab==="register" && <input value={name} onChange={e=>setName(e.target.value)} placeholder="昵称（显示给买家）" style={inp} />}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="邮箱地址" type="email" style={inp} />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="密码（至少6位）" type="password" style={inp} onKeyDown={e=>e.key==="Enter"&&(tab==="login"?login():register())} />
        {msg && <p style={{ fontSize:13, color:ok?"#16a34a":"#ef4444", marginBottom:12, fontWeight:500 }}>{ok?"✅":"❌"} {msg}</p>}
        <button onClick={tab==="login"?login:register} disabled={loading} style={{ width:"100%", height:50, borderRadius:14, background:loading?"#e5e7eb":OR, color:"#fff", fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:16, boxShadow:loading?"none":"0 4px 16px rgba(249,115,22,.4)" }}>
          {loading ? "处理中…" : tab==="login" ? "登录" : "注册"}
        </button>
        <p style={{ fontSize:12, color:"#78716C", textAlign:"center", marginTop:14 }}>游客可浏览，发布商品需要登录</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRODUCT CARD
══════════════════════════════════════════════════════════ */
function ProductCard({ p, onClick }) {
  const { user, likedIds, toggleLike } = useApp();
  const liked = likedIds.has(p.id);

  return (
    <div className="hover-card" onClick={onClick} style={{ background:"#fff", borderRadius:14, overflow:"hidden", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.06)", animation:"slideUp .3s ease both" }}>
      <div style={{ position:"relative" }}>
        <img src={p.img || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop"} alt={p.title} style={{ width:"100%", height:160 }} />
        <span style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,.52)", color:"#fff", fontSize:10, padding:"3px 9px", borderRadius:20, fontWeight:500 }}>{p.cond||"九成新"}</span>
        <button className="press" onClick={e=>{ e.stopPropagation(); toggleLike(p.id); }} style={{ position:"absolute", top:8, right:8, width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,.88)", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {liked?"❤️":"🤍"}
        </button>
      </div>
      <div style={{ padding:"10px 11px 13px" }}>
        <p style={{ fontSize:12.5, fontWeight:500, lineHeight:1.35, color:"#18181B", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", marginBottom:6 }}>{p.title}</p>
        <p style={{ fontSize:18, fontWeight:800, color:OR, fontFamily:"Syne,sans-serif" }}>{fmt(p.price)}</p>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
          <span style={{ fontSize:11, color:"#78716C" }}>📍 {p.loc}</span>
          <span style={{ fontSize:11, color:"#78716C" }}>👁 {p.views||0}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HOME VIEW
══════════════════════════════════════════════════════════ */
function HomeView() {
  const { products, setView, setSelected, refreshProducts, refreshing } = useApp();
  const [cat, setCat] = useState("全部");
  const [q, setQ] = useState("");
  const visible = products.filter(p => p.status === "已上架");
  const filtered = visible.filter(p => (cat==="全部"||p.cat===cat) && (!q||p.title.toLowerCase().includes(q.toLowerCase())));

  return (
    <div style={{ paddingBottom:"calc(60px + 12px)", background:"#FFFBF7", minHeight:"100vh" }}>
      <div style={{ background:OR, padding:"44px 16px 16px", position:"sticky", top:0, zIndex:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:13 }}>
          <span style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800, color:"#fff", letterSpacing:-.5 }}>🐟 闲猫市集</span>
          <button className="press" onClick={refreshProducts} style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,.18)", color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}
            title="刷新">
            <span style={{ display:"inline-block", animation: refreshing ? "spin .6s linear infinite" : "none" }}>🔄</span>
          </button>
        </div>
        <div style={{ background:"rgba(255,255,255,.94)", borderRadius:12, display:"flex", alignItems:"center", padding:"10px 14px", gap:8 }}>
          <span>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="搜索闲置好物..." style={{ flex:1, border:"none", outline:"none", fontSize:14, background:"transparent" }} />
          {q && <button onClick={()=>setQ("")} style={{ color:"#78716C", fontSize:12 }}>✕</button>}
        </div>
      </div>
      <div style={{ margin:"12px 16px 0", background:"linear-gradient(120deg,#fff7ed,#ffedd5)", borderRadius:14, padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontWeight:700, fontSize:14, color:"#c2410c" }}>🎉 东南亚华人圈最大二手平台</p>
          <p style={{ fontSize:12, color:"#ea580c", marginTop:3 }}>发布闲置 · 买卖无忧 · 安全交易</p>
        </div>
        <button className="press" onClick={()=>setView("post")} style={{ background:OR, color:"#fff", padding:"9px 18px", borderRadius:22, fontSize:13, fontWeight:600, boxShadow:"0 4px 12px rgba(249,115,22,.35)" }}>发布闲置</button>
      </div>
      <div style={{ overflowX:"auto", display:"flex", gap:8, padding:"12px 16px" }}>
        {CATS.map(c=>(
          <button key={c} className="press" onClick={()=>setCat(c)} style={{ whiteSpace:"nowrap", padding:"7px 15px", borderRadius:22, fontSize:12.5, fontWeight:500, flexShrink:0, background:cat===c?OR:"#fff", color:cat===c?"#fff":"#78716C", border:cat===c?"none":"1.5px solid #F0EBE5", boxShadow:cat===c?"0 3px 10px rgba(249,115,22,.3)":"none", transition:"all .15s" }}>{c}</button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:"0 16px" }}>
        {filtered.map((p,i)=>(
          <div key={p.id} style={{ animationDelay:`${i*.04}s` }}>
            <ProductCard p={p} onClick={()=>{ setSelected(p); setView("detail"); }} />
          </div>
        ))}
        {filtered.length===0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"60px 0", color:"#78716C", animation:"fadeIn .3s" }}>
            <p style={{ fontSize:44 }}>🔍</p>
            <p style={{ marginTop:10, fontWeight:600 }}>没有找到相关商品</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DETAIL VIEW
══════════════════════════════════════════════════════════ */
function DetailView() {
  const { selected, setView, setChat, user, likedIds, toggleLike, updateProduct } = useApp();
  const p = selected;
  const liked = likedIds.has(p?.id);

  useEffect(() => {
    if (!p || !supabase) return;
    // 增加浏览数
    const newViews = (p.views || 0) + 1;
    supabase.from("products").update({ views: newViews }).eq("id", p.id);
    updateProduct(p.id, { views: newViews });
  }, [p?.id]);

  if (!p) return null;

  return (
    <div style={{ animation:"slideUp .2s ease", paddingBottom:90, background:"#FFFBF7", minHeight:"100vh" }}>
      <div style={{ position:"relative" }}>
        <img src={p.img || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop"} alt={p.title} style={{ width:"100%", height:300, objectFit:"cover" }} />
        <div style={{ position:"absolute", top:0, left:0, right:0, height:90, background:"linear-gradient(to bottom,rgba(0,0,0,.45),transparent)" }} />
        <button onClick={()=>setView("home")} style={{ position:"absolute", top:44, left:16, width:36, height:36, borderRadius:"50%", background:"rgba(0,0,0,.45)", color:"#fff", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>←</button>
      </div>
      <div style={{ padding:"18px 16px 0" }}>
        <p style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:800, color:OR }}>{fmt(p.price)}</p>
        <p style={{ fontSize:16, fontWeight:600, lineHeight:1.4, marginTop:5 }}>{p.title}</p>
        <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
          {[p.cond, p.cat, `📍 ${p.loc}`].map((tag,i)=>(
            <span key={i} style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:500, background:i===0?"#fff7ed":"#f5f5f4", color:i===0?OR:"#78716C" }}>{tag}</span>
          ))}
        </div>
        <div style={{ display:"flex", gap:20, margin:"14px 0", padding:"12px 0", borderTop:"1px solid #F0EBE5", borderBottom:"1px solid #F0EBE5" }}>
          <span style={{ fontSize:12, color:"#78716C" }}>👁 {p.views||0} 浏览</span>
          <span style={{ fontSize:12, color:"#78716C" }}>❤️ {p.likes||0} 喜欢</span>
          <span style={{ fontSize:12, color:"#78716C" }}>⭐ {p.rating||5.0} 分</span>
        </div>
        <p style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>商品描述</p>
        <p style={{ fontSize:14, color:"#78716C", lineHeight:1.75 }}>{p.desc}</p>
        <div style={{ marginTop:18, padding:14, background:"#fff7ed", borderRadius:14, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:46, height:46, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:18, fontFamily:"Syne,sans-serif", flexShrink:0 }}>{(p.seller||"?")[0]}</div>
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:600, fontSize:14 }}>{p.seller||"卖家"}</p>
            <p style={{ fontSize:12, color:"#78716C", marginTop:2 }}>⭐ {p.rating||5.0} · 东南亚华人卖家</p>
          </div>
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"12px 16px", background:"#fff", borderTop:"1px solid #F0EBE5", display:"flex", gap:10, maxWidth:430, margin:"0 auto", boxShadow:"0 -4px 20px rgba(0,0,0,.06)" }}>
        <button className="press" onClick={()=>toggleLike(p.id)} style={{ width:48, height:48, borderRadius:12, border:`1.5px solid ${liked?OR:"#F0EBE5"}`, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", background:liked?"#fff7ed":"#fff" }}>{liked?"❤️":"🤍"}</button>
        <button className="press" onClick={()=>{ setChat({ name:p.seller||"卖家", av:(p.seller||"卖")[0], productId:p.id }); setView("chat"); }} style={{ flex:1, height:48, borderRadius:12, background:OR, color:"#fff", fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:15, boxShadow:"0 4px 14px rgba(249,115,22,.35)" }}>💬 联系卖家</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   POST VIEW
══════════════════════════════════════════════════════════ */
function PostView() {
  const { addProduct, setView, user, setShowAuth } = useApp();
  const [form, setForm] = useState({ title:"", desc:"", price:"", cat:"手机数码", loc:"新加坡", cond:"九成新" });
  const [aiName, setAiName] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [done, setDone] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const fileRef = useRef();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // 未登录时提示
  if (!user) return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#FFFBF7", padding:32, animation:"fadeIn .3s" }}>
      <p style={{ fontSize:52 }}>🔐</p>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:20, marginTop:16 }}>登录后才能发布</p>
      <p style={{ color:"#78716C", marginTop:8, fontSize:14, textAlign:"center" }}>注册免费，发布商品触达东南亚华人买家</p>
      <button className="press" onClick={()=>setShowAuth(true)} style={{ marginTop:24, background:OR, color:"#fff", padding:"14px 40px", borderRadius:14, fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:16, boxShadow:"0 4px 16px rgba(249,115,22,.4)" }}>立即登录 / 注册</button>
      <button onClick={()=>setView("home")} style={{ marginTop:16, fontSize:14, color:"#78716C" }}>← 返回首页</button>
    </div>
  );

  const handleAI = async () => {
    if (!aiName.trim()) return;
    setLoading(true); setAiResult(null);
    try {
      const r = await aiGenerate(aiName.trim(), form.cat);
      setAiResult(r);
      setForm(f=>({ ...f, title:r.title, desc:r.description, price:String(r.suggestedPrice), cond:r.condition||f.cond }));
    } catch { alert("AI 生成失败，请手动填写"); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.price) { alert("请填写标题和价格"); return; }
    await addProduct({
      ...form, price:Number(form.price),
      img: imgUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop",
      seller: user.user_metadata?.name || user.email?.split("@")[0] || "我",
      user_id: user.id,
      status:"待审核"
    });
    setDone(true);
    setTimeout(()=>setView("home"), 1500);
  };

  const inp = { width:"100%", padding:"11px 13px", borderRadius:11, border:"1.5px solid #F0EBE5", outline:"none", fontSize:14, background:"#fafaf9" };

  if (done) return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", animation:"fadeIn .3s", background:"#FFFBF7" }}>
      <p style={{ fontSize:56 }}>🎉</p>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:20, marginTop:16 }}>发布成功！</p>
      <p style={{ color:"#78716C", marginTop:8, fontSize:14 }}>审核通过后即可展示</p>
    </div>
  );

  return (
    <div style={{ animation:"slideUp .2s ease", paddingBottom:90, background:"#FFFBF7", minHeight:"100vh" }}>
      <div style={{ padding:"44px 16px 14px", background:"#fff", borderBottom:"1px solid #F0EBE5", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:20 }}>
        <button onClick={()=>setView("home")} style={{ fontSize:20 }}>←</button>
        <span style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:17 }}>发布闲置</span>
      </div>
      <div style={{ padding:16 }}>
        <button onClick={()=>fileRef.current?.click()} style={{ width:"100%", height:120, borderRadius:14, border:"2px dashed #F0EBE5", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#fafaf9", marginBottom:16, overflow:"hidden" }}>
          {imgUrl ? <img src={imgUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <><span style={{ fontSize:34 }}>📷</span><span style={{ fontSize:13, color:"#78716C", marginTop:8 }}>点击上传商品图片</span></>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(f) setImgUrl(URL.createObjectURL(f)); }} />

        <div style={{ background:"linear-gradient(120deg,#fff7ed,#ffedd5)", borderRadius:14, padding:14, marginBottom:18, border:"1.5px solid #fed7aa" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
            <span>✨</span><p style={{ fontWeight:700, fontSize:14, color:"#c2410c" }}>AI 智能填写</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={aiName} onChange={e=>setAiName(e.target.value)} placeholder="输入商品名称（如：iPhone 14 Pro）" style={{ flex:1, padding:"10px 13px", borderRadius:10, border:"1.5px solid #fed7aa", outline:"none", fontSize:13, background:"rgba(255,255,255,.75)" }} onKeyDown={e=>{ if(e.key==="Enter") handleAI(); }} />
            <button onClick={handleAI} disabled={loading||!aiName.trim()} className="press" style={{ padding:"0 16px", borderRadius:10, fontSize:13, fontWeight:600, flexShrink:0, color:"#fff", background:loading||!aiName.trim()?"#e5e7eb":OR, minWidth:76 }}>{loading?<span style={{ animation:"pulse 1s infinite" }}>生成中…</span>:"AI 生成"}</button>
          </div>
          {aiResult?.sellingPoints && (
            <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(255,255,255,.75)", borderRadius:10 }}>
              <p style={{ fontSize:11, color:"#c2410c", fontWeight:700, marginBottom:5 }}>🎯 AI 建议卖点</p>
              {aiResult.sellingPoints.map((s,i)=><p key={i} style={{ fontSize:12, color:"#ea580c", marginTop:3 }}>• {s}</p>)}
            </div>
          )}
        </div>

        <div style={{ marginBottom:14 }}><label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>商品标题 *</label><input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="填写标题，让买家更容易找到" style={inp} /></div>
        <div style={{ marginBottom:14 }}><label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>商品描述</label><textarea value={form.desc} onChange={e=>set("desc",e.target.value)} rows={4} placeholder="描述商品状态、使用情况、出售原因…" style={{ ...inp, resize:"none", lineHeight:1.6 }} /></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div><label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>售价 (RM) *</label><input value={form.price} onChange={e=>set("price",e.target.value)} type="number" placeholder="0" style={inp} /></div>
          <div><label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>成色</label><select value={form.cond} onChange={e=>set("cond",e.target.value)} style={inp}>{CONDS.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div><label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>类别</label><select value={form.cat} onChange={e=>set("cat",e.target.value)} style={inp}>{CATS.filter(c=>c!=="全部").map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>所在城市</label><select value={form.loc} onChange={e=>set("loc",e.target.value)} style={inp}>{LOCS.map(l=><option key={l}>{l}</option>)}</select></div>
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"12px 16px", background:"#fff", borderTop:"1px solid #F0EBE5" }}>
        <button onClick={handleSubmit} className="press" style={{ width:"100%", height:50, borderRadius:14, background:OR, color:"#fff", fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:16, boxShadow:"0 4px 16px rgba(249,115,22,.4)" }}>🚀 立刻发布</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MY PRODUCT CARD (用户管理自己的商品)
══════════════════════════════════════════════════════════ */
function MyProductCard({ p }) {
  const { updateProduct, deleteProduct, setSelected, setView } = useApp();
  const [confirm, setConfirm] = useState(false);

  const statusColor = { "已上架":"#16a34a", "待审核":OR, "已下架":"#6b7280" };

  return (
    <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.06)", display:"flex", gap:0, animation:"slideUp .3s ease" }}>
      {/* 图片 */}
      <img
        src={p.img || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
        style={{ width:90, height:90, objectFit:"cover", flexShrink:0, cursor:"pointer" }}
        onClick={()=>{ setSelected(p); setView("detail"); }}
      />
      {/* 内容 */}
      <div style={{ flex:1, padding:"10px 12px", display:"flex", flexDirection:"column", justifyContent:"space-between", minWidth:0 }}>
        <div>
          <p style={{ fontSize:13, fontWeight:600, lineHeight:1.35, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.title}</p>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
            <p style={{ fontSize:15, fontWeight:800, color:OR, fontFamily:"Syne,sans-serif" }}>RM {p.price}</p>
            <span style={{ fontSize:11, fontWeight:600, color: statusColor[p.status] || "#6b7280" }}>● {p.status}</span>
          </div>
          <p style={{ fontSize:11, color:"#78716C", marginTop:2 }}>👁 {p.views||0} 浏览 · ❤️ {p.likes||0} 收藏</p>
        </div>
        {/* 操作按钮 */}
        <div style={{ display:"flex", gap:6, marginTop:8 }}>
          {p.status === "已上架" && (
            <button className="press" onClick={()=>updateProduct(p.id,{status:"已下架"})} style={{ flex:1, padding:"6px 0", borderRadius:8, fontSize:12, fontWeight:600, background:"#fff7ed", color:OR, border:"1px solid #fed7aa" }}>下架</button>
          )}
          {p.status === "已下架" && (
            <button className="press" onClick={()=>updateProduct(p.id,{status:"已上架"})} style={{ flex:1, padding:"6px 0", borderRadius:8, fontSize:12, fontWeight:600, background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0" }}>重新上架</button>
          )}
          {p.status === "待审核" && (
            <span style={{ flex:1, padding:"6px 0", borderRadius:8, fontSize:12, fontWeight:600, color:OR, textAlign:"center", background:"#fff7ed", border:"1px solid #fed7aa" }}>审核中…</span>
          )}
          {!confirm ? (
            <button className="press" onClick={()=>setConfirm(true)} style={{ padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>删除</button>
          ) : (
            <div style={{ display:"flex", gap:4 }}>
              <button className="press" onClick={()=>deleteProduct(p.id)} style={{ padding:"6px 10px", borderRadius:8, fontSize:12, fontWeight:700, background:"#dc2626", color:"#fff" }}>确认</button>
              <button className="press" onClick={()=>setConfirm(false)} style={{ padding:"6px 10px", borderRadius:8, fontSize:12, fontWeight:600, background:"#f3f4f6", color:"#6b7280" }}>取消</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROFILE VIEW
══════════════════════════════════════════════════════════ */
function ProfileView() {
  const { products, setMode, setView, user, setShowAuth, signOut, refreshProducts, refreshing } = useApp();
  const [showAdmin, setShowAdmin] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);
  const mine = products.filter(p => user ? p.user_id === user.id : false);
  const menus = [["📦","我的订单"],["❤️","我的收藏"],["🔔","消息通知"],["⚙️","账号设置"],["🛡️","实名认证"],["💬","联系客服"]];

  const adminLogin = () => {
    if (pass === getAdminPass()) { setMode("admin"); }
    else { setErr(true); setTimeout(()=>setErr(false),1500); }
  };

  if (!user) return (
    <div style={{ paddingBottom:"calc(60px + 16px)", background:"#FFFBF7", minHeight:"100vh" }}>
      <div style={{ background:OR, padding:"60px 16px 40px", textAlign:"center" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto", background:"rgba(255,255,255,.2)", border:"3px solid rgba(255,255,255,.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>👤</div>
        <p style={{ color:"#fff", fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, marginTop:10 }}>你好，游客</p>
        <p style={{ color:"rgba(255,255,255,.75)", fontSize:12, marginTop:3 }}>登录后享受完整功能</p>
      </div>
      <div style={{ padding:24 }}>
        <button className="press" onClick={()=>setShowAuth(true)} style={{ width:"100%", height:50, borderRadius:14, background:OR, color:"#fff", fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:16, boxShadow:"0 4px 16px rgba(249,115,22,.4)", marginBottom:12 }}>登录 / 注册</button>
        <div style={{ marginTop:24, borderTop:"1px solid #F0EBE5", paddingTop:16 }}>
          <button onClick={()=>setShowAdmin(!showAdmin)} style={{ fontSize:12, color:"#78716C", display:"flex", alignItems:"center", gap:6 }}><span>⚙️</span> 管理员入口</button>
          {showAdmin && (
            <div style={{ marginTop:12, padding:14, background:"#fafaf9", borderRadius:12, border:"1px solid #F0EBE5" }}>
              <p style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>🔐 管理员登录</p>
              <div style={{ display:"flex", gap:8 }}>
                <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="管理员密码" style={{ flex:1, padding:"9px 12px", borderRadius:9, border:`1.5px solid ${err?"#ef4444":"#F0EBE5"}`, outline:"none", fontSize:13 }} onKeyDown={e=>e.key==="Enter"&&adminLogin()} />
                <button onClick={adminLogin} className="press" style={{ padding:"0 16px", borderRadius:9, background:OR, color:"#fff", fontSize:13, fontWeight:600 }}>进入</button>
              </div>
              {err && <p style={{ fontSize:12, color:"#ef4444", marginTop:6 }}>密码错误</p>}
              <p style={{ fontSize:11, color:"#78716C", marginTop:8 }}>演示密码：admin888</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const displayName = user.user_metadata?.name || user.email?.split("@")[0] || "用户";

  return (
    <div style={{ paddingBottom:"calc(60px + 16px)", background:"#FFFBF7", minHeight:"100vh" }}>
      <div style={{ background:OR, padding:"44px 16px 28px", textAlign:"center" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto", background:"rgba(255,255,255,.2)", border:"3px solid rgba(255,255,255,.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontFamily:"Syne,sans-serif", color:"#fff", fontWeight:800 }}>{displayName[0].toUpperCase()}</div>
        <p style={{ color:"#fff", fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, marginTop:10 }}>{displayName}</p>
        <p style={{ color:"rgba(255,255,255,.75)", fontSize:12, marginTop:3 }}>{user.email}</p>
        <div style={{ display:"flex", justifyContent:"space-around", marginTop:18, padding:"14px 0", background:"rgba(255,255,255,.15)", borderRadius:14 }}>
          {[[mine.length,"在售"],["0","已卖出"],["5.0","信用分"]].map(([n,l])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, color:"#fff" }}>{n}</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,.8)", marginTop:2 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:16 }}>
        {/* 我的商品管理 */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <p style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:15 }}>
            我发布的商品 <span style={{ fontSize:12, color:"#78716C", fontWeight:400 }}>({mine.length})</span>
          </p>
          <button className="press" onClick={refreshProducts} style={{ fontSize:13, color:OR, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ display:"inline-block", animation: refreshing ? "spin .6s linear infinite" : "none" }}>🔄</span> 刷新
          </button>
        </div>
        {mine.length === 0 ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:"#78716C", background:"#fff", borderRadius:14, marginBottom:16 }}>
            <p style={{ fontSize:32 }}>📦</p>
            <p style={{ fontSize:14, marginTop:8 }}>还没有发布过商品</p>
            <button className="press" onClick={()=>setView("post")} style={{ marginTop:12, background:OR, color:"#fff", padding:"10px 24px", borderRadius:10, fontSize:13, fontWeight:600 }}>去发布第一件</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
            {mine.map(p=>(
              <MyProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
        <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
          {menus.map(([ic,lb],i)=>(
            <button key={lb} className="hover-row" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"15px 16px", fontSize:14, fontWeight:500, borderBottom:i<menus.length-1?"1px solid #F0EBE5":"none", background:"#fff" }}>
              <span style={{ display:"flex", alignItems:"center", gap:10 }}><span style={{ fontSize:18 }}>{ic}</span>{lb}</span>
              <span style={{ color:"#78716C", fontSize:18 }}>›</span>
            </button>
          ))}
        </div>
        <button className="press" onClick={signOut} style={{ width:"100%", marginTop:16, padding:"14px 0", borderRadius:12, border:"1.5px solid #F0EBE5", fontSize:14, fontWeight:600, color:"#ef4444", background:"#fff" }}>退出登录</button>
        <div style={{ marginTop:16, borderTop:"1px solid #F0EBE5", paddingTop:16 }}>
          <button onClick={()=>setShowAdmin(!showAdmin)} style={{ fontSize:12, color:"#78716C", display:"flex", alignItems:"center", gap:6 }}><span>⚙️</span> 管理员入口</button>
          {showAdmin && (
            <div style={{ marginTop:12, padding:14, background:"#fafaf9", borderRadius:12, border:"1px solid #F0EBE5" }}>
              <p style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>🔐 管理员登录</p>
              <div style={{ display:"flex", gap:8 }}>
                <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="管理员密码" style={{ flex:1, padding:"9px 12px", borderRadius:9, border:`1.5px solid ${err?"#ef4444":"#F0EBE5"}`, outline:"none", fontSize:13 }} onKeyDown={e=>e.key==="Enter"&&adminLogin()} />
                <button onClick={adminLogin} className="press" style={{ padding:"0 16px", borderRadius:9, background:OR, color:"#fff", fontSize:13, fontWeight:600 }}>进入</button>
              </div>
              {err && <p style={{ fontSize:12, color:"#ef4444", marginTop:6 }}>密码错误</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHAT VIEW — 真实聊天
══════════════════════════════════════════════════════════ */
function ChatView() {
  const { chat, setView, user, setShowAuth } = useApp();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef();

  // 未登录
  if (!user) return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#FFFBF7", padding:32 }}>
      <p style={{ fontSize:48 }}>💬</p>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, marginTop:16 }}>登录后才能聊天</p>
      <button className="press" onClick={()=>setShowAuth(true)} style={{ marginTop:20, background:OR, color:"#fff", padding:"12px 32px", borderRadius:12, fontWeight:700, fontSize:15 }}>立即登录</button>
      <button onClick={()=>setView("detail")} style={{ marginTop:12, fontSize:14, color:"#78716C" }}>← 返回</button>
    </div>
  );

  // 加载消息
  useEffect(() => {
    if (!supabase || !chat?.productId) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("product_id", chat.productId)
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
        .order("created_at", { ascending: true });
      if (data) setMsgs(data);
      setLoading(false);
    };
    load();

    // 实时订阅新消息
    let sub;
    try {
      sub = supabase.channel(`chat_${chat.productId}_${user.id}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "messages",
          filter: `product_id=eq.${chat.productId}`
        }, payload => {
          setMsgs(m => [...m, payload.new]);
        })
        .subscribe();
    } catch(e) { console.warn("Chat realtime:", e); }
    return () => { if(sub) supabase.removeChannel(sub); };
  }, [chat?.productId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [msgs]);

  const send = async () => {
    if (!input.trim() || !supabase) return;
    const text = input.trim();
    setInput("");
    const msg = {
      from_user: user.id,
      to_user: chat.sellerId || user.id,
      product_id: chat.productId,
      content: text,
      sender_name: user.user_metadata?.name || user.email?.split("@")[0],
      created_at: new Date().toISOString()
    };
    // 乐观更新
    setMsgs(m => [...m, { ...msg, id: Date.now() }]);
    const { error } = await supabase.from("messages").insert([msg]);
    if (error) console.error("发送失败:", error);
  };

  const isMe = (msg) => msg.from_user === user.id;
  const myName = user.user_metadata?.name || user.email?.split("@")[0] || "我";
  const myAv = myName[0].toUpperCase();

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"#FFFBF7" }}>
      {/* 顶部 */}
      <div style={{ padding:"44px 16px 12px", background:"#fff", borderBottom:"1px solid #F0EBE5", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={()=>setView("detail")} style={{ fontSize:20 }}>←</button>
        <div style={{ width:38, height:38, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:16, fontFamily:"Syne,sans-serif" }}>{chat?.av}</div>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:600, fontSize:14 }}>{chat?.name}</p>
          <p style={{ fontSize:11, color:"#78716C" }}>关于：{chat?.productTitle || "商品咨询"}</p>
        </div>
      </div>

      {/* 消息列表 */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {loading && <p style={{ textAlign:"center", color:"#78716C", fontSize:13 }}>加载消息中…</p>}
        {!loading && msgs.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#78716C" }}>
            <p style={{ fontSize:32 }}>👋</p>
            <p style={{ fontSize:13, marginTop:8 }}>发消息给卖家，开始聊天吧！</p>
          </div>
        )}
        {msgs.map((m, i) => {
          const me = isMe(m);
          const av = me ? myAv : chat?.av;
          return (
            <div key={m.id || i} style={{ display:"flex", justifyContent:me?"flex-end":"flex-start", alignItems:"flex-end", gap:8 }}>
              {!me && <div style={{ width:32, height:32, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, flexShrink:0 }}>{av}</div>}
              <div style={{ maxWidth:"72%" }}>
                <div style={{ padding:"10px 14px", fontSize:14, lineHeight:1.55, borderRadius:me?"16px 16px 4px 16px":"16px 16px 16px 4px", background:me?OR:"#fff", color:me?"#fff":"#18181B", boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
                  {m.content}
                </div>
                <p style={{ fontSize:10, color:"#78716C", marginTop:3, textAlign:me?"right":"left" }}>
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"}) : "刚刚"}
                </p>
              </div>
              {me && <div style={{ width:32, height:32, borderRadius:"50%", background:"#6366f1", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, flexShrink:0 }}>{myAv}</div>}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* 输入框 */}
      <div style={{ padding:"10px 16px", background:"#fff", borderTop:"1px solid #F0EBE5", display:"flex", gap:10 }}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") send(); }}
          placeholder="发消息给卖家..."
          style={{ flex:1, padding:"11px 16px", borderRadius:24, border:"1.5px solid #F0EBE5", outline:"none", fontSize:14, background:"#fafaf9" }}
        />
        <button onClick={send} disabled={!input.trim()} className="press" style={{ width:44, height:44, borderRadius:"50%", background:input.trim()?OR:"#e5e7eb", color:"#fff", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:input.trim()?"0 3px 10px rgba(249,115,22,.4)":"none" }}>↑</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BOTTOM NAV
══════════════════════════════════════════════════════════ */
function BottomNav() {
  const { view, setView } = useApp();
  const items = [
    {k:"home",ic:"🏠",lb:"首页"},
    {k:"discover",ic:"🧭",lb:"发现"},
    {k:"post",ic:"+",lb:"发布",main:true},
    {k:"messages",ic:"💬",lb:"消息"},
    {k:"profile",ic:"👤",lb:"我的"},
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, height:60, background:"#fff", borderTop:"1px solid #F0EBE5", display:"flex", alignItems:"center", zIndex:100, boxShadow:"0 -4px 20px rgba(0,0,0,.07)" }}>
      {items.map(it=>(
        <button key={it.k} className="press" onClick={()=>setView(it.k)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, color:view===it.k?OR:"#78716C" }}>
          {it.main ? (
            <><div style={{ width:46, height:46, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, color:"#fff", marginTop:-20, boxShadow:"0 4px 14px rgba(249,115,22,.45)" }}>+</div><span style={{ fontSize:10, fontWeight:500, color:view===it.k?OR:"#78716C" }}>{it.lb}</span></>
          ) : (
            <><span style={{ fontSize:20 }}>{it.ic}</span><span style={{ fontSize:10, fontWeight:500 }}>{it.lb}</span></>
          )}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DISCOVER + MESSAGES
══════════════════════════════════════════════════════════ */
function DiscoverShell() {
  const { products, setSelected, setView } = useApp();
  const trending = [...products].filter(p=>p.status==="已上架").sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,6);
  return (
    <div style={{ paddingBottom:"calc(60px + 12px)", background:"#FFFBF7", minHeight:"100vh" }}>
      <div style={{ padding:"44px 16px 16px", background:OR }}>
        <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:20, color:"#fff" }}>🔥 热门好物</p>
        <p style={{ fontSize:13, color:"rgba(255,255,255,.75)", marginTop:4 }}>东南亚华人圈最受欢迎</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:16 }}>
        {trending.map(p=><ProductCard key={p.id} p={p} onClick={()=>{ setSelected(p); setView("detail"); }} />)}
      </div>
    </div>
  );
}

function MessagesShell() {
  const { user, setShowAuth, setChat, setView, products } = useApp();
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user) { setLoading(false); return; }
    const load = async () => {
      // 取我参与的所有对话（按商品分组，取最新一条）
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (data) {
        // 按 product_id 分组，每组取最新一条
        const map = {};
        data.forEach(m => {
          if (!map[m.product_id]) map[m.product_id] = m;
        });
        setConvos(Object.values(map));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) return (
    <div style={{ padding:"60px 24px", textAlign:"center", color:"#78716C", background:"#FFFBF7", minHeight:"100vh" }}>
      <p style={{ fontSize:52 }}>💬</p>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:18, marginTop:14, color:"#18181B" }}>消息中心</p>
      <p style={{ fontSize:13, marginTop:8 }}>登录后查看与卖家的对话</p>
      <button className="press" onClick={()=>setShowAuth(true)} style={{ marginTop:20, background:OR, color:"#fff", padding:"12px 32px", borderRadius:12, fontWeight:700, fontSize:14 }}>立即登录</button>
    </div>
  );

  return (
    <div style={{ paddingBottom:"calc(60px + 12px)", background:"#FFFBF7", minHeight:"100vh" }}>
      <div style={{ padding:"44px 16px 16px", background:OR }}>
        <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:20, color:"#fff" }}>💬 消息中心</p>
        <p style={{ fontSize:13, color:"rgba(255,255,255,.75)", marginTop:4 }}>与卖家的对话记录</p>
      </div>

      {loading && <p style={{ textAlign:"center", padding:40, color:"#78716C" }}>加载中…</p>}

      {!loading && convos.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 24px", color:"#78716C" }}>
          <p style={{ fontSize:52 }}>💬</p>
          <p style={{ fontWeight:600, fontSize:16, marginTop:14, color:"#18181B" }}>暂无消息</p>
          <p style={{ fontSize:13, marginTop:8 }}>浏览商品，联系卖家开始聊天</p>
        </div>
      )}

      <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {convos.map(c => {
          const product = products.find(p => p.id === c.product_id);
          const isMe = c.from_user === user.id;
          const otherName = isMe ? (product?.seller || "卖家") : (c.sender_name || "买家");
          return (
            <div key={c.id} className="hover-card" onClick={() => {
              setChat({ name: otherName, av: otherName[0], productId: c.product_id, productTitle: product?.title });
              setView("chat");
            }} style={{ background:"#fff", borderRadius:14, padding:"14px 16px", boxShadow:"0 2px 8px rgba(0,0,0,.06)", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:18, fontFamily:"Syne,sans-serif", flexShrink:0 }}>
                {otherName[0]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <p style={{ fontSize:14, fontWeight:600 }}>{otherName}</p>
                  <p style={{ fontSize:11, color:"#78716C" }}>{new Date(c.created_at).toLocaleDateString("zh-CN")}</p>
                </div>
                <p style={{ fontSize:12, color:"#78716C", marginTop:3, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                  {isMe ? "我：" : ""}{c.content}
                </p>
                {product && <p style={{ fontSize:11, color:OR, marginTop:2 }}>📦 {product.title}</p>}
              </div>
              <span style={{ fontSize:18, color:"#78716C" }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN (保持原有功能)
══════════════════════════════════════════════════════════ */
const ADMIN_MENUS = [
  {k:"dashboard",ic:"📊",lb:"数据总览"},
  {k:"products",ic:"📦",lb:"商品管理"},
  {k:"users",ic:"👥",lb:"用户管理"},
  {k:"reports",ic:"🚩",lb:"举报处理"},
  {k:"settings",ic:"⚙️",lb:"平台设置"},
];

function AdminSidebar({ tab, setTab, setMode, pendingCount }) {
  return (
    <div style={{ width:200, background:"#111827", minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"28px 20px 20px" }}>
        <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:16, color:"#fff", letterSpacing:-.3 }}>🐟 闲猫后台</p>
        <p style={{ fontSize:11, color:"#6b7280", marginTop:3 }}>管理员控制台</p>
      </div>
      <div style={{ flex:1, padding:"0 12px" }}>
        {ADMIN_MENUS.map(m=>(
          <button key={m.k} className="press" onClick={()=>setTab(m.k)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"11px 12px", borderRadius:10, marginBottom:4, fontSize:13.5, fontWeight:tab===m.k?600:400, transition:"all .15s", background:tab===m.k?"rgba(249,115,22,.18)":"transparent", color:tab===m.k?OR:"#9ca3af", position:"relative" }}>
            <span style={{ fontSize:16 }}>{m.ic}</span>
            {m.lb}
            {m.k==="products" && pendingCount>0 && <span style={{ position:"absolute", right:10, minWidth:18, height:18, borderRadius:9, background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 5px" }}>{pendingCount}</span>}
          </button>
        ))}
      </div>
      <div style={{ padding:"16px 12px 24px" }}>
        <button className="press" onClick={()=>setMode("user")} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"10px 12px", borderRadius:10, fontSize:13, color:"#6b7280" }}>
          <span>↩</span> 返回用户端
        </button>
      </div>
    </div>
  );
}

function AdminDashboard({ products, reports }) {
  const stats = [
    { label:"在售商品", value:products.filter(p=>p.status==="已上架").length, ic:"📦", color:"#3b82f6" },
    { label:"待审核", value:products.filter(p=>p.status==="待审核").length, ic:"⏳", color:OR },
    { label:"总商品数", value:products.length, ic:"📊", color:"#8b5cf6" },
    { label:"待处理举报", value:reports.filter(r=>r.status==="待处理").length, ic:"🚩", color:"#ef4444" },
  ];
  const recent = [...products].sort((a,b)=>b.id-a.id).slice(0,8);
  return (
    <div style={{ padding:28, overflowY:"auto", flex:1 }}>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, color:"#18181B", marginBottom:6 }}>数据总览</p>
      <p style={{ fontSize:13, color:"#78716C", marginBottom:24 }}>实时数据，管理员您好！</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        {stats.map(s=>(
          <div key={s.label} style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ fontSize:12, color:"#78716C", fontWeight:500 }}>{s.label}</p>
                <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:32, color:"#18181B", marginTop:4 }}>{s.value}</p>
              </div>
              <span style={{ fontSize:28, opacity:.8 }}>{s.ic}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
        <p style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>最新发布商品</p>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:"2px solid #F0EBE5" }}>
            {["商品名称","卖家","价格","状态"].map(h=><th key={h} style={{ textAlign:"left", padding:"0 0 10px", fontSize:12, color:"#78716C", fontWeight:600 }}>{h}</th>)}
          </tr></thead>
          <tbody>{recent.map(p=>(
            <tr key={p.id} className="hover-row" style={{ borderBottom:"1px solid #F0EBE5" }}>
              <td style={{ padding:"12px 0", fontSize:13, fontWeight:500, maxWidth:200 }}><div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</div></td>
              <td style={{ padding:"12px 8px", fontSize:13, color:"#78716C" }}>{p.seller||"匿名"}</td>
              <td style={{ padding:"12px 8px", fontSize:13, fontWeight:600, color:OR }}>{fmt(p.price)}</td>
              <td style={{ padding:"12px 0" }}>{statusBadge(p.status)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function AdminProducts({ products, updateProduct, deleteProduct }) {
  const [filter, setFilter] = useState("全部");
  const tabs = ["全部","已上架","待审核","已下架"];
  const list = filter==="全部" ? products : products.filter(p=>p.status===filter);
  return (
    <div style={{ padding:28, overflowY:"auto", flex:1 }}>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, marginBottom:20 }}>商品管理</p>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {tabs.map(t=>(
          <button key={t} className="press" onClick={()=>setFilter(t)} style={{ padding:"7px 16px", borderRadius:20, fontSize:13, fontWeight:500, background:filter===t?OR:"#fff", color:filter===t?"#fff":"#78716C", border:filter===t?"none":"1.5px solid #F0EBE5", transition:"all .15s" }}>
            {t} {t!=="全部"&&<span style={{ opacity:.7 }}>({products.filter(p=>p.status===t).length})</span>}
          </button>
        ))}
      </div>
      <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead style={{ background:"#fafaf9" }}>
            <tr>{["商品","卖家","价格","成色","状态","操作"].map(h=><th key={h} style={{ textAlign:"left", padding:"12px 16px", fontSize:12, color:"#78716C", fontWeight:600, borderBottom:"1px solid #F0EBE5" }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {list.map(p=>(
              <tr key={p.id} className="hover-row" style={{ borderBottom:"1px solid #F0EBE5" }}>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <img src={p.img||"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"} style={{ width:44, height:44, borderRadius:8, objectFit:"cover", flexShrink:0 }} />
                    <p style={{ fontSize:13, fontWeight:500, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</p>
                  </div>
                </td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"#78716C" }}>{p.seller||"匿名"}</td>
                <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:OR }}>{fmt(p.price)}</td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"#78716C" }}>{p.cond}</td>
                <td style={{ padding:"12px 16px" }}>{statusBadge(p.status)}</td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    {p.status==="待审核" && <button className="press" onClick={()=>updateProduct(p.id,{status:"已上架"})} style={{ padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600, background:"#f0fdf4", color:"#16a34a" }}>通过</button>}
                    {p.status==="已上架" && <button className="press" onClick={()=>updateProduct(p.id,{status:"已下架"})} style={{ padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600, background:"#fff7ed", color:OR }}>下架</button>}
                    {p.status==="已下架" && <button className="press" onClick={()=>updateProduct(p.id,{status:"已上架"})} style={{ padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600, background:"#f0fdf4", color:"#16a34a" }}>上架</button>}
                    <button className="press" onClick={()=>{ if(window.confirm("确定删除？")) deleteProduct(p.id); }} style={{ padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600, background:"#fef2f2", color:"#dc2626" }}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length===0 && <div style={{ textAlign:"center", padding:40, color:"#78716C" }}>暂无商品</div>}
      </div>
    </div>
  );
}

function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [oldPass, setOldPass] = useState(""); const [newPass, setNewPass] = useState(""); const [confirmPass, setConfirmPass] = useState(""); const [passMsg, setPassMsg] = useState(""); const [passOk, setPassOk] = useState(false);
  const inp = { width:"100%", padding:"10px 13px", borderRadius:10, border:"1.5px solid #F0EBE5", outline:"none", fontSize:14, background:"#fafaf9" };
  const changePass = () => {
    if (oldPass !== getAdminPass()) { setPassMsg("原密码错误"); setPassOk(false); return; }
    if (newPass.length < 6) { setPassMsg("新密码至少6位"); setPassOk(false); return; }
    if (newPass !== confirmPass) { setPassMsg("两次密码不一致"); setPassOk(false); return; }
    localStorage.setItem(ADMIN_PASS_KEY, newPass);
    setPassMsg("密码修改成功！"); setPassOk(true);
    setOldPass(""); setNewPass(""); setConfirmPass("");
    setTimeout(()=>setPassMsg(""), 3000);
  };
  return (
    <div style={{ padding:28, overflowY:"auto", flex:1 }}>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, marginBottom:20 }}>平台设置</p>
      <div style={{ maxWidth:560 }}>
        <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 8px rgba(0,0,0,.06)", marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>🔐 修改管理员密码</p>
          {[["原密码","password",oldPass,setOldPass],["新密码（至少6位）","password",newPass,setNewPass],["确认新密码","password",confirmPass,setConfirmPass]].map(([lb,tp,val,fn])=>(
            <div key={lb} style={{ marginBottom:12 }}><label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>{lb}</label><input value={val} onChange={e=>fn(e.target.value)} type={tp} style={inp} /></div>
          ))}
          {passMsg && <p style={{ fontSize:13, color:passOk?"#16a34a":"#ef4444", marginBottom:10, fontWeight:500 }}>{passOk?"✅":"❌"} {passMsg}</p>}
          <button className="press" onClick={changePass} style={{ width:"100%", height:42, borderRadius:10, background:OR, color:"#fff", fontWeight:700, fontSize:14 }}>修改密码</button>
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════
   ADMIN — USERS
══════════════════════════════════════════════════════════ */
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("joined", { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    if (!supabase) return;
    await supabase.from("profiles").update({ status }).eq("id", id);
    setUsers(us => us.map(u => u.id === id ? { ...u, status } : u));
  };

  const setVerified = async (id, verified) => {
    if (!supabase) return;
    await supabase.from("profiles").update({ verified }).eq("id", id);
    setUsers(us => us.map(u => u.id === id ? { ...u, verified } : u));
  };

  const filtered = users.filter(u => !search || (u.name||"").includes(search));

  const statusStyle = {
    "正常": { bg:"#f0fdf4", color:"#16a34a" },
    "封禁": { bg:"#fef2f2", color:"#dc2626" },
    "警告": { bg:"#fff7ed", color:OR },
  };

  return (
    <div style={{ padding:28, overflowY:"auto", flex:1 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22 }}>用户管理</p>
        <button onClick={load} style={{ fontSize:13, color:OR, fontWeight:600, background:"none", padding:"6px 12px", borderRadius:8, border:"1.5px solid #F0EBE5" }}>🔄 刷新</button>
      </div>
      <p style={{ fontSize:13, color:"#78716C", marginBottom:16 }}>共 {users.length} 名注册用户</p>

      {/* 搜索 */}
      <div style={{ background:"#fff", borderRadius:10, padding:"10px 14px", display:"flex", gap:8, marginBottom:16, border:"1.5px solid #F0EBE5" }}>
        <span>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索用户昵称…" style={{ flex:1, border:"none", outline:"none", fontSize:14 }} />
      </div>

      {/* 统计 */}
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {[["全部用户", users.length, "#3b82f6"],["正常", users.filter(u=>u.status!=="封禁").length, "#16a34a"],["已封禁", users.filter(u=>u.status==="封禁").length, "#dc2626"],["已认证", users.filter(u=>u.verified).length, OR]].map(([lb,n,c])=>(
          <div key={lb} style={{ flex:1, background:"#fff", borderRadius:12, padding:"12px 14px", boxShadow:"0 2px 6px rgba(0,0,0,.06)", textAlign:"center" }}>
            <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, color:c }}>{n}</p>
            <p style={{ fontSize:11, color:"#78716C", marginTop:2 }}>{lb}</p>
          </div>
        ))}
      </div>

      {loading ? <p style={{ color:"#78716C", textAlign:"center", padding:40 }}>加载中…</p> : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(u=>(
            <div key={u.id} style={{ background:"#fff", borderRadius:14, padding:"16px 18px", boxShadow:"0 2px 8px rgba(0,0,0,.06)", display:"flex", alignItems:"center", gap:14, border: u.status==="封禁" ? "1.5px solid #fecaca" : "1.5px solid transparent" }}>
              {/* 头像 */}
              <div style={{ width:44, height:44, borderRadius:"50%", background: u.status==="封禁" ? "#fee2e2" : OR, display:"flex", alignItems:"center", justifyContent:"center", color: u.status==="封禁" ? "#dc2626" : "#fff", fontWeight:800, fontSize:18, fontFamily:"Syne,sans-serif", flexShrink:0 }}>
                {(u.name||"?")[0]}
              </div>
              {/* 信息 */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <p style={{ fontSize:14, fontWeight:600 }}>{u.name||"未设置"}</p>
                  {u.verified && <span style={{ fontSize:10, background:"#f0fdf4", color:"#16a34a", padding:"2px 7px", borderRadius:20, fontWeight:600 }}>✅ 认证</span>}
                  {u.status==="封禁" && <span style={{ fontSize:10, background:"#fef2f2", color:"#dc2626", padding:"2px 7px", borderRadius:20, fontWeight:600 }}>🚫 已封禁</span>}
                </div>
                <p style={{ fontSize:11, color:"#78716C", marginTop:2 }}>ID: {u.id?.slice(0,12)}… · 加入: {u.joined ? new Date(u.joined).toLocaleDateString("zh-CN") : "-"}</p>
              </div>
              {/* 操作按钮 */}
              <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                {u.status !== "封禁" ? (
                  <button className="press" onClick={()=>setStatus(u.id,"封禁")} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>🚫 封禁</button>
                ) : (
                  <button className="press" onClick={()=>setStatus(u.id,"正常")} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0" }}>✅ 解封</button>
                )}
                <button className="press" onClick={()=>setVerified(u.id, !u.verified)} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, background: u.verified?"#fff7ed":"#f0fdf4", color: u.verified?OR:"#16a34a", border:`1px solid ${u.verified?"#fed7aa":"#bbf7d0"}` }}>
                  {u.verified ? "取消认证" : "认证用户"}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign:"center", padding:60, color:"#78716C" }}>暂无用户</div>}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN — REPORTS
══════════════════════════════════════════════════════════ */
function AdminReports() {
  const { products, updateProduct } = useApp();
  const reported = products.filter(p => p.reported || p.status === "待审核");
  return (
    <div style={{ padding:28, overflowY:"auto", flex:1 }}>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, marginBottom:6 }}>举报 & 待审核</p>
      <p style={{ fontSize:13, color:"#78716C", marginBottom:20 }}>共 {reported.length} 条需处理</p>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {reported.length === 0 && <div style={{ textAlign:"center", padding:60, color:"#78716C" }}>🎉 暂无待处理内容</div>}
        {reported.map(p=>(
          <div key={p.id} style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,.06)", display:"flex", alignItems:"center", gap:16 }}>
            <img src={p.img||"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"} style={{ width:60, height:60, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <p style={{ fontSize:14, fontWeight:600 }}>{p.title}</p>
              <p style={{ fontSize:12, color:"#78716C", marginTop:3 }}>卖家：{p.seller} · {p.status==="待审核" ? "🕐 待审核" : "🚩 被举报"}</p>
              <p style={{ fontSize:13, fontWeight:700, color:OR, marginTop:2 }}>RM {p.price}</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
              {p.status==="待审核" && <>
                <button className="press" onClick={()=>updateProduct(p.id,{status:"已上架"})} style={{ padding:"7px 16px", borderRadius:9, fontSize:13, fontWeight:600, background:"#f0fdf4", color:"#16a34a" }}>✅ 通过</button>
                <button className="press" onClick={()=>updateProduct(p.id,{status:"已下架"})} style={{ padding:"7px 16px", borderRadius:9, fontSize:13, fontWeight:600, background:"#fef2f2", color:"#dc2626" }}>❌ 拒绝</button>
              </>}
              {p.reported && p.status!=="待审核" && <>
                <button className="press" onClick={()=>updateProduct(p.id,{status:"已下架",reported:false})} style={{ padding:"7px 16px", borderRadius:9, fontSize:13, fontWeight:600, background:"#fef2f2", color:"#dc2626" }}>下架</button>
                <button className="press" onClick={()=>updateProduct(p.id,{reported:false})} style={{ padding:"7px 16px", borderRadius:9, fontSize:13, fontWeight:600, background:"#f3f4f6", color:"#6b7280" }}>忽略</button>
              </>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminApp() {
  const { products, reports, updateProduct, deleteProduct, setMode } = useApp();
  const [tab, setTab] = useState("dashboard");
  const pendingCount = products.filter(p=>p.status==="待审核").length;
  return (
    <div style={{ display:"flex", height:"100vh", background:"#f8fafc", fontFamily:"'DM Sans',sans-serif" }}>
      <AdminSidebar tab={tab} setTab={setTab} setMode={setMode} pendingCount={pendingCount} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
        {tab==="dashboard" && <AdminDashboard products={products} reports={reports} />}
        {tab==="products" && <AdminProducts products={products} updateProduct={updateProduct} deleteProduct={deleteProduct} />}
        {tab==="settings" && <AdminSettings />}
        {tab==="users" && <AdminUsers />}
        {tab==="reports" && <AdminReports />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   USER APP SHELL
══════════════════════════════════════════════════════════ */
function UserApp() {
  const { view } = useApp();
  const hideNav = ["detail","post","chat"].includes(view);
  return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:"#FFFBF7", position:"relative", overflow:"hidden" }}>
      {view==="home"     && <HomeView />}
      {view==="discover" && <DiscoverShell />}
      {view==="detail"   && <DetailView />}
      {view==="post"     && <PostView />}
      {view==="messages" && <MessagesShell />}
      {view==="profile"  && <ProfileView />}
      {view==="chat"     && <ChatView />}
      {!hideNav && <BottomNav />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════ */
export default function App() {
  const [mode, setMode] = useState("user");
  const [view, setView] = useState("home");
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [chat, setChat] = useState(null);
  const [dbReady, setDbReady] = useState(false);
  const [user, setUser] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [showAuth, setShowAuth] = useState(false);

  // ── Auth 状态监听 ──────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) { setShowAuth(false); loadLikes(session.user.id); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase?.auth.signOut();
    setUser(null);
    setLikedIds(new Set());
  };

  // ── 加载收藏 ──────────────────────────────────────────
  const loadLikes = async (uid) => {
    if (!supabase || !uid) return;
    const { data } = await supabase.from("likes").select("product_id").eq("user_id", uid);
    if (data) setLikedIds(new Set(data.map(l => l.product_id)));
  };

  const toggleLike = async (productId) => {
    if (!user) { setShowAuth(true); return; }
    if (!supabase) return;
    const isLiked = likedIds.has(productId);
    if (isLiked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("product_id", productId);
      setLikedIds(s => { const n = new Set(s); n.delete(productId); return n; });
      setProducts(ps => ps.map(p => p.id===productId ? {...p, likes:Math.max(0,(p.likes||1)-1)} : p));
      await supabase.from("products").update({ likes: Math.max(0, (products.find(p=>p.id===productId)?.likes||1)-1) }).eq("id", productId);
    } else {
      await supabase.from("likes").insert([{ user_id:user.id, product_id:productId }]);
      setLikedIds(s => new Set([...s, productId]));
      const newLikes = (products.find(p=>p.id===productId)?.likes||0)+1;
      setProducts(ps => ps.map(p => p.id===productId ? {...p, likes:newLikes} : p));
      await supabase.from("products").update({ likes: newLikes }).eq("id", productId);
    }
  };

  // ── 加载商品 ──────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    const load = async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (data) setProducts(data.map(p => ({ sellerId:0, av:(p.seller||"?")[0], rating:p.rating??5.0, views:p.views??0, likes:p.likes??0, reported:p.reported??false, ...p })));
      setDbReady(true);
    };
    load();
    let sub;
    try {
      sub = supabase.channel("products_ch").on("postgres_changes", { event:"*", schema:"public", table:"products" }, load).subscribe(status => {
        if (status==="CHANNEL_ERROR") console.warn("Realtime 不可用，将手动刷新");
      });
    } catch(e) { console.warn("Realtime:", e); }
    return () => { if(sub) supabase.removeChannel(sub); };
  }, []);

  // ── CRUD ──────────────────────────────────────────────
  const addProduct = async p => {
    if (!supabase) return;
    const dbPayload = { title:p.title, desc:p.desc, price:p.price, cat:p.cat, loc:p.loc, cond:p.cond, img:p.img, seller:p.seller, status:p.status, user_id:p.user_id };
    const { data, error } = await supabase.from("products").insert([dbPayload]).select().single();
    if (error) { alert("发布失败：" + error.message); return; }
    if (data) setProducts(ps => [{ sellerId:0, av:(data.seller||"?")[0], rating:5.0, views:0, likes:0, reported:false, ...data }, ...ps]);
  };

  const updateProduct = async (id, patch) => {
    if (supabase) await supabase.from("products").update(patch).eq("id", id);
    setProducts(ps => ps.map(p => p.id===id ? {...p,...patch} : p));
  };

  const deleteProduct = async id => {
    if (supabase) await supabase.from("products").delete().eq("id", id);
    setProducts(ps => ps.filter(p => p.id!==id));
  };

  const [refreshing, setRefreshing] = useState(false);
  const refreshProducts = async () => {
    if (!supabase || refreshing) return;
    setRefreshing(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data.map(p => ({ sellerId:0, av:(p.seller||"?")[0], rating:p.rating??5.0, views:p.views??0, likes:p.likes??0, reported:p.reported??false, ...p })));
    setTimeout(() => setRefreshing(false), 600);
  };

  const ctx = { mode, setMode, view, setView, products, reports, selected, setSelected, chat, setChat, addProduct, updateProduct, deleteProduct, dbReady, user, likedIds, toggleLike, showAuth, setShowAuth, signOut, refreshProducts };

  return (
    <AppCtx.Provider value={ctx}>
      <div style={{ height:"100vh", background:mode==="admin"?"#f8fafc":"#FFFBF7" }}>
        {supabase && !dbReady && (
          <div style={{ position:"fixed", inset:0, background:"rgba(255,255,255,.9)", zIndex:9999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <p style={{ fontSize:36 }}>🐟</p>
            <p style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:16, marginTop:12 }}>正在连接数据库…</p>
          </div>
        )}
        {mode==="admin" ? <AdminApp /> : <UserApp />}
        {showAuth && <AuthModal onClose={()=>setShowAuth(false)} />}
      </div>
    </AppCtx.Provider>
  );
}
