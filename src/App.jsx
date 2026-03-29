import { useState, useEffect, useRef, createContext, useContext } from "react";

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
   CONSTANTS & DATA
══════════════════════════════════════════════════════════ */
const OR = "#F97316";
const CATS = ["全部","手机数码","时尚服饰","包袋配件","家居生活","美妆护肤","潮玩收藏","书籍","游戏周边","酒店住宿","机票代订","旅游服务","餐饮美食","教育培训","汽车摩托","宠物用品","运动健身","母婴用品"];
const LOCS = ["新加坡","吉隆坡","槟城","曼谷","雅加达","胡志明市","马尼拉","东京"];
const CONDS = ["全新","近全新","九成新","八成新","七成新"];
const ADMIN_PASS = "admin888";
const fmt = n => `RM ${Number(n).toLocaleString()}`;

const INIT_USERS = [
  {id:1,name:"阿明",av:"明",loc:"新加坡",joined:"2024-01",sales:23,rating:4.9,status:"正常",verified:true,reports:0},
  {id:2,name:"小雯",av:"雯",loc:"吉隆坡",joined:"2024-03",sales:18,rating:5.0,status:"正常",verified:true,reports:0},
  {id:3,name:"阿龙",av:"龙",loc:"曼谷",joined:"2024-05",sales:9,rating:4.7,status:"正常",verified:false,reports:1},
  {id:4,name:"技术宅",av:"宅",loc:"新加坡",joined:"2023-11",sales:41,rating:4.8,status:"正常",verified:true,reports:0},
  {id:5,name:"摄影师",av:"摄",loc:"新加坡",joined:"2024-02",sales:7,rating:5.0,status:"正常",verified:true,reports:0},
  {id:6,name:"游戏佬",av:"游",loc:"雅加达",joined:"2024-06",sales:3,rating:4.6,status:"封禁",verified:false,reports:3},
];

const INIT_PRODUCTS = [
  {id:1,title:"iPhone 14 Pro 256GB 深紫色",price:3800,cat:"手机数码",loc:"新加坡",seller:"阿明",sellerId:1,av:"明",rating:4.9,views:342,likes:28,cond:"九成新",status:"已上架",reported:false,
   img:"https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&auto=format&fit=crop",
   desc:"自用 iPhone 14 Pro，购于去年三月，成色极佳，屏幕无划痕，机身无磕碰。原装配件盒子齐全，送钢化膜一张。"},
  {id:2,title:"LV Neverfull MM 老花 几乎全新",price:5500,cat:"包袋配件",loc:"吉隆坡",seller:"小雯",sellerId:2,av:"雯",rating:5.0,views:187,likes:54,cond:"近全新",status:"已上架",reported:false,
   img:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop",
   desc:"正品购于巴黎专柜，有购物小票和品牌保卡。只用过三次，内里干净无污渍，五金件光亮如新。"},
  {id:3,title:"Nike Air Jordan 1 High OG 芝加哥 US9",price:2200,cat:"时尚服饰",loc:"曼谷",seller:"阿龙",sellerId:3,av:"龙",rating:4.7,views:521,likes:89,cond:"八成新",status:"已上架",reported:true,
   img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop",
   desc:"正品 AJ1 芝加哥配色，上脚次数不多，鞋盒完整有防伪标签。"},
  {id:4,title:"MacBook Pro 14寸 M2 Pro 16GB/512GB",price:8800,cat:"手机数码",loc:"新加坡",seller:"技术宅",sellerId:4,av:"宅",rating:4.8,views:298,likes:42,cond:"九成新",status:"已上架",reported:false,
   img:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop",
   desc:"自用 MacBook Pro M2 Pro，2023年购入，电池循环次数仅128次，运行流畅无任何问题。"},
  {id:5,title:"Sony WH-1000XM5 黑色 降噪旗舰",price:1200,cat:"手机数码",loc:"吉隆坡",seller:"阿明",sellerId:1,av:"明",rating:4.6,views:156,likes:23,cond:"九成新",status:"待审核",reported:false,
   img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop",
   desc:"Sony 顶级旗舰降噪耳机，音质出色，续航35小时，配件齐全。"},
  {id:6,title:"Fujifilm X100V 银色 快门数极低",price:7200,cat:"手机数码",loc:"新加坡",seller:"摄影师",sellerId:5,av:"摄",rating:5.0,views:412,likes:67,cond:"九成新",status:"已上架",reported:false,
   img:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop",
   desc:"经典复古旁轴相机，快门数仅2300次，传感器完好，随机配件齐全。"},
  {id:7,title:"Nintendo Switch OLED 白色 含游戏",price:2000,cat:"游戏周边",loc:"雅加达",seller:"游戏佬",sellerId:6,av:"游",rating:4.6,views:289,likes:51,cond:"八成新",status:"已下架",reported:true,
   img:"https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&auto=format&fit=crop",
   desc:"Switch OLED 白色版，手柄无漂移，赠送5款游戏卡带。"},
  {id:8,title:"SK-II 神仙水 230ml 全新未拆封",price:680,cat:"美妆护肤",loc:"胡志明市",seller:"小雯",sellerId:2,av:"美",rating:4.9,views:203,likes:38,cond:"全新",status:"已上架",reported:false,
   img:"https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format&fit=crop",
   desc:"日本专柜购入，全新未拆封，有购买小票可验真假。"},
];

const INIT_REPORTS = [
  {id:1,type:"商品举报",target:"Nike Air Jordan 1 High OG 芝加哥",reporter:"用户_8823",reason:"疑似假货",time:"2025-03-25",status:"待处理",productId:3},
  {id:2,type:"商品举报",target:"Nintendo Switch OLED",reporter:"用户_4421",reason:"图片与实物不符",time:"2025-03-24",status:"已处理",productId:7},
  {id:3,type:"用户举报",target:"游戏佬",reporter:"用户_7765",reason:"恶意议价不交易",time:"2025-03-23",status:"待处理",userId:6},
  {id:4,type:"用户举报",target:"阿龙",reporter:"用户_3312",reason:"商品描述不实",time:"2025-03-22",status:"待处理",userId:3},
];

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
    // 没有API Key时返回模板内容
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
   SHARED UI ATOMS
══════════════════════════════════════════════════════════ */
const Badge = ({ children, color = OR, bg }) => (
  <span style={{
    display:"inline-block", padding:"2px 10px", borderRadius:20,
    fontSize:11, fontWeight:600, color: color,
    background: bg || `${color}18`
  }}>{children}</span>
);

const statusBadge = s => {
  const map = {"已上架":["#16a34a","#f0fdf4"],"待审核":[OR,"#fff7ed"],"已下架":["#6b7280","#f3f4f6"],"封禁":["#dc2626","#fef2f2"],"正常":["#16a34a","#f0fdf4"],"已处理":["#6b7280","#f3f4f6"],"待处理":[OR,"#fff7ed"]};
  const [c, bg] = map[s] || ["#6b7280","#f3f4f6"];
  return <Badge color={c} bg={bg}>{s}</Badge>;
};

/* ══════════════════════════════════════════════════════════
   USER APP — PRODUCT CARD
══════════════════════════════════════════════════════════ */
function ProductCard({ p, onClick }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="hover-card" onClick={onClick} style={{
      background:"#fff", borderRadius:14, overflow:"hidden",
      cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.06)", animation:"slideUp .3s ease both"
    }}>
      <div style={{ position:"relative" }}>
        <img src={p.img} alt={p.title} style={{ width:"100%", height:160 }} />
        <span style={{
          position:"absolute", top:8, left:8,
          background:"rgba(0,0,0,.52)", color:"#fff",
          fontSize:10, padding:"3px 9px", borderRadius:20, fontWeight:500
        }}>{p.cond}</span>
        <button className="press" onClick={e=>{e.stopPropagation();setLiked(!liked);}} style={{
          position:"absolute", top:8, right:8, width:30, height:30,
          borderRadius:"50%", background:"rgba(255,255,255,.88)", fontSize:14,
          display:"flex", alignItems:"center", justifyContent:"center"
        }}>{liked?"❤️":"🤍"}</button>
      </div>
      <div style={{ padding:"10px 11px 13px" }}>
        <p style={{
          fontSize:12.5, fontWeight:500, lineHeight:1.35, color:"#18181B",
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical", marginBottom:6
        }}>{p.title}</p>
        <p style={{ fontSize:18, fontWeight:800, color:OR, fontFamily:"Syne,sans-serif" }}>{fmt(p.price)}</p>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
          <span style={{ fontSize:11, color:"#78716C" }}>📍 {p.loc}</span>
          <span style={{ fontSize:11, color:"#78716C" }}>👁 {p.views}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   USER APP — HOME
══════════════════════════════════════════════════════════ */
function HomeView() {
  const { products, setView, setSelected } = useApp();
  const [cat, setCat] = useState("全部");
  const [q, setQ] = useState("");
  const visible = products.filter(p => p.status === "已上架");
  const filtered = visible.filter(p =>
    (cat==="全部" || p.cat===cat) &&
    (!q || p.title.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div style={{ paddingBottom:"calc(60px + 12px)", background:"#FFFBF7", minHeight:"100vh" }}>
      {/* Header */}
      <div style={{ background:OR, padding:"44px 16px 16px", position:"sticky", top:0, zIndex:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:13 }}>
          <span style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800, color:"#fff", letterSpacing:-.5 }}>🐟 闲猫市集</span>
          <button className="press" onClick={()=>setView("chat_placeholder")} style={{
            width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,.18)", color:"#fff", fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center"
          }}>💬</button>
        </div>
        <div style={{ background:"rgba(255,255,255,.94)", borderRadius:12, display:"flex", alignItems:"center", padding:"10px 14px", gap:8 }}>
          <span>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="搜索闲置好物..."
            style={{ flex:1, border:"none", outline:"none", fontSize:14, background:"transparent" }} />
          {q && <button onClick={()=>setQ("")} style={{ color:"#78716C", fontSize:12 }}>✕</button>}
        </div>
      </div>
      {/* Banner */}
      <div style={{ margin:"12px 16px 0", background:"linear-gradient(120deg,#fff7ed,#ffedd5)", borderRadius:14, padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontWeight:700, fontSize:14, color:"#c2410c" }}>🎉 东南亚华人圈最大二手平台</p>
          <p style={{ fontSize:12, color:"#ea580c", marginTop:3 }}>发布闲置 · 买卖无忧 · 安全交易</p>
        </div>
        <button className="press" onClick={()=>setView("post")} style={{
          background:OR, color:"#fff", padding:"9px 18px", borderRadius:22, fontSize:13, fontWeight:600,
          boxShadow:"0 4px 12px rgba(249,115,22,.35)"
        }}>发布闲置</button>
      </div>
      {/* Categories */}
      <div style={{ overflowX:"auto", display:"flex", gap:8, padding:"12px 16px" }}>
        {CATS.map(c=>(
          <button key={c} className="press" onClick={()=>setCat(c)} style={{
            whiteSpace:"nowrap", padding:"7px 15px", borderRadius:22, fontSize:12.5, fontWeight:500, flexShrink:0,
            background:cat===c ? OR : "#fff", color:cat===c ? "#fff" : "#78716C",
            border:cat===c?"none":"1.5px solid #F0EBE5",
            boxShadow:cat===c?"0 3px 10px rgba(249,115,22,.3)":"none", transition:"all .15s"
          }}>{c}</button>
        ))}
      </div>
      {/* Grid */}
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
            <p style={{ fontSize:13, marginTop:4 }}>换个关键词试试</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   USER APP — DETAIL
══════════════════════════════════════════════════════════ */
function DetailView() {
  const { selected, setView, setChat } = useApp();
  const p = selected;
  const [liked, setLiked] = useState(false);
  if (!p) return null;

  return (
    <div style={{ animation:"slideUp .2s ease", paddingBottom:90, background:"#FFFBF7", minHeight:"100vh" }}>
      <div style={{ position:"relative" }}>
        <img src={p.img} alt={p.title} style={{ width:"100%", height:300, objectFit:"cover" }} />
        <div style={{ position:"absolute", top:0, left:0, right:0, height:90, background:"linear-gradient(to bottom,rgba(0,0,0,.45),transparent)" }} />
        <button onClick={()=>setView("home")} style={{
          position:"absolute", top:44, left:16, width:36, height:36, borderRadius:"50%",
          background:"rgba(0,0,0,.45)", color:"#fff", fontSize:18,
          display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)"
        }}>←</button>
      </div>
      <div style={{ padding:"18px 16px 0" }}>
        <p style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:800, color:OR }}>{fmt(p.price)}</p>
        <p style={{ fontSize:16, fontWeight:600, lineHeight:1.4, marginTop:5 }}>{p.title}</p>
        <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
          {[p.cond, p.cat, `📍 ${p.loc}`].map((tag,i)=>(
            <span key={i} style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:500,
              background:i===0?"#fff7ed":"#f5f5f4", color:i===0?OR:"#78716C" }}>{tag}</span>
          ))}
        </div>
        <div style={{ display:"flex", gap:20, margin:"14px 0", padding:"12px 0", borderTop:"1px solid #F0EBE5", borderBottom:"1px solid #F0EBE5" }}>
          <span style={{ fontSize:12, color:"#78716C" }}>👁 {p.views} 浏览</span>
          <span style={{ fontSize:12, color:"#78716C" }}>❤️ {p.likes} 喜欢</span>
          <span style={{ fontSize:12, color:"#78716C" }}>⭐ {p.rating} 分</span>
        </div>
        <p style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>商品描述</p>
        <p style={{ fontSize:14, color:"#78716C", lineHeight:1.75 }}>{p.desc}</p>
        <div style={{ marginTop:18, padding:14, background:"#fff7ed", borderRadius:14, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:46, height:46, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:18, fontFamily:"Syne,sans-serif", flexShrink:0 }}>{p.av}</div>
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:600, fontSize:14 }}>{p.seller}</p>
            <p style={{ fontSize:12, color:"#78716C", marginTop:2 }}>⭐ {p.rating} · 东南亚华人卖家</p>
          </div>
        </div>
        <div style={{ marginTop:14, padding:"10px 14px", background:"#f0fdf4", borderRadius:10, display:"flex", gap:8 }}>
          <span>🛡️</span>
          <p style={{ fontSize:12, color:"#16a34a", lineHeight:1.5 }}>平台交易更安全，资金托管到确认收货后才释放。</p>
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"12px 16px", background:"#fff", borderTop:"1px solid #F0EBE5", display:"flex", gap:10, maxWidth:430, margin:"0 auto", boxShadow:"0 -4px 20px rgba(0,0,0,.06)" }}>
        <button className="press" onClick={()=>setLiked(!liked)} style={{ width:48, height:48, borderRadius:12, border:`1.5px solid ${liked?OR:"#F0EBE5"}`, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", background:liked?"#fff7ed":"#fff" }}>{liked?"❤️":"🤍"}</button>
        <button className="press" onClick={()=>{ setChat({ name:p.seller, av:p.av }); setView("chat"); }} style={{
          flex:1, height:48, borderRadius:12, background:OR, color:"#fff",
          fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:15,
          boxShadow:"0 4px 14px rgba(249,115,22,.35)"
        }}>💬 联系卖家</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   USER APP — POST
══════════════════════════════════════════════════════════ */
function PostView() {
  const { addProduct, setView } = useApp();
  const [form, setForm] = useState({ title:"", desc:"", price:"", cat:"手机数码", loc:"新加坡", cond:"九成新" });
  const [aiName, setAiName] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [done, setDone] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const fileRef = useRef();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

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

  const handleSubmit = () => {
    if (!form.title.trim() || !form.price) { alert("请填写标题和价格"); return; }
    addProduct({
      id:Date.now(), ...form, price:Number(form.price),
      img: imgUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop",
      seller:"我", sellerId:0, av:"我", rating:5.0, views:0, likes:0, status:"待审核", reported:false
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
        {/* Photo */}
        <button onClick={()=>fileRef.current?.click()} style={{ width:"100%", height:120, borderRadius:14, border:"2px dashed #F0EBE5", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#fafaf9", marginBottom:16, overflow:"hidden" }}>
          {imgUrl ? <img src={imgUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <>
            <span style={{ fontSize:34 }}>📷</span>
            <span style={{ fontSize:13, color:"#78716C", marginTop:8 }}>点击上传商品图片</span>
          </>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
          onChange={e=>{ const f=e.target.files[0]; if(f) setImgUrl(URL.createObjectURL(f)); }} />

        {/* AI */}
        <div style={{ background:"linear-gradient(120deg,#fff7ed,#ffedd5)", borderRadius:14, padding:14, marginBottom:18, border:"1.5px solid #fed7aa" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
            <span style={{ fontSize:16 }}>✨</span>
            <p style={{ fontWeight:700, fontSize:14, color:"#c2410c" }}>AI 智能填写</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={aiName} onChange={e=>setAiName(e.target.value)} placeholder="输入商品名称（如：iPhone 14 Pro）"
              style={{ flex:1, padding:"10px 13px", borderRadius:10, border:"1.5px solid #fed7aa", outline:"none", fontSize:13, background:"rgba(255,255,255,.75)" }}
              onKeyDown={e=>{ if(e.key==="Enter") handleAI(); }} />
            <button onClick={handleAI} disabled={loading||!aiName.trim()} className="press" style={{
              padding:"0 16px", borderRadius:10, fontSize:13, fontWeight:600, flexShrink:0, color:"#fff",
              background:loading||!aiName.trim()?"#e5e7eb":OR, minWidth:76
            }}>{loading?<span style={{ animation:"pulse 1s infinite" }}>生成中…</span>:"AI 生成"}</button>
          </div>
          {aiResult?.sellingPoints && (
            <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(255,255,255,.75)", borderRadius:10, animation:"fadeIn .3s" }}>
              <p style={{ fontSize:11, color:"#c2410c", fontWeight:700, marginBottom:5 }}>🎯 AI 建议卖点</p>
              {aiResult.sellingPoints.map((s,i)=><p key={i} style={{ fontSize:12, color:"#ea580c", marginTop:3 }}>• {s}</p>)}
            </div>
          )}
        </div>

        {/* Fields */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>商品标题 *</label>
          <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="填写标题，让买家更容易找到" style={inp} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>商品描述</label>
          <textarea value={form.desc} onChange={e=>set("desc",e.target.value)} rows={4} placeholder="描述商品状态、使用情况、出售原因…" style={{ ...inp, resize:"none", lineHeight:1.6 }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>售价 (RM) *</label>
            <input value={form.price} onChange={e=>set("price",e.target.value)} type="number" placeholder="0" style={inp} />
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>成色</label>
            <select value={form.cond} onChange={e=>set("cond",e.target.value)} style={inp}>{CONDS.map(c=><option key={c}>{c}</option>)}</select>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>类别</label>
            <select value={form.cat} onChange={e=>set("cat",e.target.value)} style={inp}>{CATS.filter(c=>c!=="全部").map(c=><option key={c}>{c}</option>)}</select>
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>城市</label>
            <select value={form.loc} onChange={e=>set("loc",e.target.value)} style={inp}>{LOCS.map(l=><option key={l}>{l}</option>)}</select>
          </div>
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"12px 16px", background:"#fff", borderTop:"1px solid #F0EBE5" }}>
        <button onClick={handleSubmit} className="press" style={{
          width:"100%", height:50, borderRadius:14, background:OR, color:"#fff",
          fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:16,
          boxShadow:"0 4px 16px rgba(249,115,22,.4)"
        }}>🚀 立即发布</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   USER APP — CHAT
══════════════════════════════════════════════════════════ */
function ChatView() {
  const { chat, setView } = useApp();
  const [msgs, setMsgs] = useState([{ from:"seller", text:`你好！我是 ${chat?.name}，有什么想了解的吗？😊` }]);
  const [input, setInput] = useState("");
  const endRef = useRef();
  const auto = ["好的，可以稍等～","可以小刀，你的价格？","还在的，成色很好！","可以面交，我在市中心。","好的，我发图给你看 😊"];
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:"smooth" }); },[msgs]);
  const send = () => {
    if (!input.trim()) return;
    const t = input.trim(); setInput("");
    setMsgs(m=>[...m,{from:"me",text:t}]);
    setTimeout(()=>setMsgs(m=>[...m,{from:"seller",text:auto[Math.floor(Math.random()*auto.length)]}]), 800+Math.random()*500);
  };
  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", animation:"slideUp .2s ease", background:"#FFFBF7" }}>
      <div style={{ padding:"44px 16px 12px", background:"#fff", borderBottom:"1px solid #F0EBE5", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={()=>setView("detail")} style={{ fontSize:20 }}>←</button>
        <div style={{ width:38, height:38, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:16, fontFamily:"Syne,sans-serif" }}>{chat?.av}</div>
        <div>
          <p style={{ fontWeight:600, fontSize:14 }}>{chat?.name}</p>
          <p style={{ fontSize:11, color:"#22c55e" }}>● 在线</p>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {msgs.map((m,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:m.from==="me"?"flex-end":"flex-start", animation:"slideUp .2s ease" }}>
            {m.from==="seller" && <div style={{ width:32, height:32, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, marginRight:8, flexShrink:0, alignSelf:"flex-end" }}>{chat?.av}</div>}
            <div style={{ maxWidth:"72%", padding:"10px 14px", fontSize:14, lineHeight:1.55,
              borderRadius:m.from==="me"?"16px 16px 4px 16px":"16px 16px 16px 4px",
              background:m.from==="me"?OR:"#fff", color:m.from==="me"?"#fff":"#18181B",
              boxShadow:"0 1px 4px rgba(0,0,0,.07)"
            }}>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding:"10px 16px", background:"#fff", borderTop:"1px solid #F0EBE5", display:"flex", gap:10 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send();}} placeholder="发消息给卖家..."
          style={{ flex:1, padding:"11px 16px", borderRadius:24, border:"1.5px solid #F0EBE5", outline:"none", fontSize:14, background:"#fafaf9" }} />
        <button onClick={send} className="press" style={{ width:44, height:44, borderRadius:"50%", background:OR, color:"#fff", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 3px 10px rgba(249,115,22,.4)" }}>↑</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   USER APP — PROFILE
══════════════════════════════════════════════════════════ */
function ProfileView() {
  const { products, setMode, setView } = useApp();
  const [showAdmin, setShowAdmin] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);
  const mine = products.filter(p=>p.sellerId===0);
  const menus = [["📦","我的订单"],["❤️","我的收藏"],["🔔","消息通知"],["⚙️","账号设置"],["🛡️","实名认证"],["💬","联系客服"]];

  const adminLogin = () => {
    if (pass === ADMIN_PASS) { setMode("admin"); } 
    else { setErr(true); setTimeout(()=>setErr(false),1500); }
  };

  return (
    <div style={{ paddingBottom:"calc(60px + 16px)", background:"#FFFBF7", minHeight:"100vh" }}>
      <div style={{ background:OR, padding:"44px 16px 28px", textAlign:"center" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto", background:"rgba(255,255,255,.2)", border:"3px solid rgba(255,255,255,.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>👤</div>
        <p style={{ color:"#fff", fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, marginTop:10 }}>新用户</p>
        <p style={{ color:"rgba(255,255,255,.75)", fontSize:12, marginTop:3 }}>欢迎加入闲猫市集 🐟</p>
        <div style={{ display:"flex", justifyContent:"space-around", marginTop:18, padding:"14px 0", background:"rgba(255,255,255,.15)", borderRadius:14 }}>
          {[["0","在售"],["0","已卖出"],["5.0","信用分"]].map(([n,l])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, color:"#fff" }}>{n}</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,.8)", marginTop:2 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:16 }}>
        {mine.length>0 && (
          <>
            <p style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:15, marginBottom:12 }}>我发布的</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {mine.slice(0,4).map(p=><ProductCard key={p.id} p={p} onClick={()=>{}} />)}
            </div>
          </>
        )}
        <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
          {menus.map(([ic,lb],i)=>(
            <button key={lb} className="hover-row" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"15px 16px", fontSize:14, fontWeight:500, borderBottom:i<menus.length-1?"1px solid #F0EBE5":"none", background:"#fff" }}>
              <span style={{ display:"flex", alignItems:"center", gap:10 }}><span style={{ fontSize:18 }}>{ic}</span>{lb}</span>
              <span style={{ color:"#78716C", fontSize:18 }}>›</span>
            </button>
          ))}
        </div>
        {/* Admin Entry */}
        <div style={{ marginTop:24, borderTop:"1px solid #F0EBE5", paddingTop:16 }}>
          <button onClick={()=>setShowAdmin(!showAdmin)} style={{ fontSize:12, color:"#78716C", display:"flex", alignItems:"center", gap:6 }}>
            <span>⚙️</span> 管理员入口
          </button>
          {showAdmin && (
            <div style={{ marginTop:12, padding:14, background:"#fafaf9", borderRadius:12, border:"1px solid #F0EBE5", animation:"fadeIn .2s" }}>
              <p style={{ fontSize:13, fontWeight:600, marginBottom:8, color:"#18181B" }}>🔐 管理员登录</p>
              <div style={{ display:"flex", gap:8 }}>
                <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="输入管理员密码"
                  style={{ flex:1, padding:"9px 12px", borderRadius:9, border:`1.5px solid ${err?"#ef4444":"#F0EBE5"}`, outline:"none", fontSize:13, background:"#fff" }}
                  onKeyDown={e=>{ if(e.key==="Enter") adminLogin(); }} />
                <button onClick={adminLogin} className="press" style={{ padding:"0 16px", borderRadius:9, background:OR, color:"#fff", fontSize:13, fontWeight:600 }}>进入</button>
              </div>
              {err && <p style={{ fontSize:12, color:"#ef4444", marginTop:6 }}>密码错误，请重试</p>}
              <p style={{ fontSize:11, color:"#78716C", marginTop:8 }}>演示密码：admin888</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   USER APP — BOTTOM NAV
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
            <>
              <div style={{ width:46, height:46, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, color:"#fff", marginTop:-20, boxShadow:"0 4px 14px rgba(249,115,22,.45)" }}>+</div>
              <span style={{ fontSize:10, fontWeight:500, color:view===it.k?OR:"#78716C" }}>{it.lb}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize:20 }}>{it.ic}</span>
              <span style={{ fontSize:10, fontWeight:500 }}>{it.lb}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN — SIDEBAR
══════════════════════════════════════════════════════════ */
const ADMIN_MENUS = [
  {k:"dashboard",ic:"📊",lb:"数据总览"},
  {k:"products",ic:"📦",lb:"商品管理"},
  {k:"users",ic:"👥",lb:"用户管理"},
  {k:"reports",ic:"🚩",lb:"举报处理"},
  {k:"settings",ic:"⚙️",lb:"平台设置"},
];

function AdminSidebar({ tab, setTab, setMode, reports }) {
  const pending = reports.filter(r=>r.status==="待处理").length;
  return (
    <div style={{ width:200, background:"#111827", minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"28px 20px 20px" }}>
        <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:16, color:"#fff", letterSpacing:-.3 }}>🐟 闲猫后台</p>
        <p style={{ fontSize:11, color:"#6b7280", marginTop:3 }}>管理员控制台</p>
      </div>
      <div style={{ flex:1, padding:"0 12px" }}>
        {ADMIN_MENUS.map(m=>(
          <button key={m.k} className="press" onClick={()=>setTab(m.k)} style={{
            display:"flex", alignItems:"center", gap:10, width:"100%", padding:"11px 12px", borderRadius:10,
            marginBottom:4, fontSize:13.5, fontWeight:tab===m.k?600:400, transition:"all .15s",
            background:tab===m.k?"rgba(249,115,22,.18)":"transparent",
            color:tab===m.k?OR:"#9ca3af", position:"relative"
          }}>
            <span style={{ fontSize:16 }}>{m.ic}</span>
            {m.lb}
            {m.k==="reports" && pending>0 && (
              <span style={{ position:"absolute", right:10, minWidth:18, height:18, borderRadius:9, background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 5px" }}>{pending}</span>
            )}
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

/* ══════════════════════════════════════════════════════════
   ADMIN — DASHBOARD
══════════════════════════════════════════════════════════ */
function AdminDashboard({ products, users, reports }) {
  const stats = [
    { label:"在售商品", value:products.filter(p=>p.status==="已上架").length, sub:"较昨日 +3", ic:"📦", color:"#3b82f6" },
    { label:"注册用户", value:users.length, sub:"本月新增 2", ic:"👥", color:"#8b5cf6" },
    { label:"待审核", value:products.filter(p=>p.status==="待审核").length, sub:"需及时处理", ic:"⏳", color:OR },
    { label:"待处理举报", value:reports.filter(r=>r.status==="待处理").length, sub:"需及时处理", ic:"🚩", color:"#ef4444" },
  ];
  const recent = [...products].sort((a,b)=>b.id-a.id).slice(0,5);
  return (
    <div style={{ padding:28, overflowY:"auto", flex:1 }}>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, color:"#18181B", marginBottom:6 }}>数据总览</p>
      <p style={{ fontSize:13, color:"#78716C", marginBottom:24 }}>欢迎回来，管理员！</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        {stats.map(s=>(
          <div key={s.label} style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,.06)", animation:"scaleIn .3s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ fontSize:12, color:"#78716C", fontWeight:500 }}>{s.label}</p>
                <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:32, color:"#18181B", marginTop:4 }}>{s.value}</p>
                <p style={{ fontSize:11, color:s.color, marginTop:4, fontWeight:500 }}>{s.sub}</p>
              </div>
              <span style={{ fontSize:28, opacity:.8 }}>{s.ic}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
        <p style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>最新发布商品</p>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"2px solid #F0EBE5" }}>
              {["商品名称","卖家","价格","状态","发布时间"].map(h=>(
                <th key={h} style={{ textAlign:"left", padding:"0 0 10px", fontSize:12, color:"#78716C", fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map(p=>(
              <tr key={p.id} className="hover-row" style={{ borderBottom:"1px solid #F0EBE5" }}>
                <td style={{ padding:"12px 0", fontSize:13, fontWeight:500, maxWidth:200 }}>
                  <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</div>
                </td>
                <td style={{ padding:"12px 0", fontSize:13, color:"#78716C" }}>{p.seller}</td>
                <td style={{ padding:"12px 0", fontSize:13, fontWeight:600, color:OR }}>{fmt(p.price)}</td>
                <td style={{ padding:"12px 8px" }}>{statusBadge(p.status)}</td>
                <td style={{ padding:"12px 0", fontSize:12, color:"#78716C" }}>刚刚</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN — PRODUCTS
══════════════════════════════════════════════════════════ */
function AdminProducts({ products, updateProduct, deleteProduct }) {
  const [filter, setFilter] = useState("全部");
  const tabs = ["全部","已上架","待审核","已下架"];
  const list = filter==="全部" ? products : products.filter(p=>p.status===filter);
  return (
    <div style={{ padding:28, overflowY:"auto", flex:1 }}>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, marginBottom:20 }}>商品管理</p>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {tabs.map(t=>(
          <button key={t} className="press" onClick={()=>setFilter(t)} style={{
            padding:"7px 16px", borderRadius:20, fontSize:13, fontWeight:500,
            background:filter===t?OR:"#fff", color:filter===t?"#fff":"#78716C",
            border:filter===t?"none":"1.5px solid #F0EBE5", transition:"all .15s"
          }}>{t} {t!=="全部"&&<span style={{ opacity:.7 }}>({products.filter(p=>p.status===t).length})</span>}</button>
        ))}
      </div>
      <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead style={{ background:"#fafaf9" }}>
            <tr>
              {["商品","卖家","价格","成色","状态","操作"].map(h=>(
                <th key={h} style={{ textAlign:"left", padding:"12px 16px", fontSize:12, color:"#78716C", fontWeight:600, borderBottom:"1px solid #F0EBE5" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(p=>(
              <tr key={p.id} className="hover-row" style={{ borderBottom:"1px solid #F0EBE5" }}>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <img src={p.img} style={{ width:44, height:44, borderRadius:8, objectFit:"cover", flexShrink:0 }} />
                    <div>
                      <p style={{ fontSize:13, fontWeight:500, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</p>
                      {p.reported && <span style={{ fontSize:10, color:"#ef4444", fontWeight:600 }}>⚠️ 被举报</span>}
                    </div>
                  </div>
                </td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"#78716C" }}>{p.seller}</td>
                <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:OR }}>{fmt(p.price)}</td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"#78716C" }}>{p.cond}</td>
                <td style={{ padding:"12px 16px" }}>{statusBadge(p.status)}</td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    {p.status==="待审核" && (
                      <button className="press" onClick={()=>updateProduct(p.id,{status:"已上架"})} style={{ padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600, background:"#f0fdf4", color:"#16a34a" }}>通过</button>
                    )}
                    {p.status==="已上架" && (
                      <button className="press" onClick={()=>updateProduct(p.id,{status:"已下架"})} style={{ padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600, background:"#fff7ed", color:OR }}>下架</button>
                    )}
                    {p.status==="已下架" && (
                      <button className="press" onClick={()=>updateProduct(p.id,{status:"已上架"})} style={{ padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600, background:"#f0fdf4", color:"#16a34a" }}>上架</button>
                    )}
                    <button className="press" onClick={()=>{ if(window.confirm("确认删除该商品？")) deleteProduct(p.id); }} style={{ padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600, background:"#fef2f2", color:"#dc2626" }}>删除</button>
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

/* ══════════════════════════════════════════════════════════
   ADMIN — USERS
══════════════════════════════════════════════════════════ */
function AdminUsers({ users, updateUser }) {
  return (
    <div style={{ padding:28, overflowY:"auto", flex:1 }}>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, marginBottom:20 }}>用户管理</p>
      <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead style={{ background:"#fafaf9" }}>
            <tr>
              {["用户","城市","成交数","评分","认证","举报次数","状态","操作"].map(h=>(
                <th key={h} style={{ textAlign:"left", padding:"12px 16px", fontSize:12, color:"#78716C", fontWeight:600, borderBottom:"1px solid #F0EBE5" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id} className="hover-row" style={{ borderBottom:"1px solid #F0EBE5" }}>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:OR, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:14, fontFamily:"Syne,sans-serif", flexShrink:0 }}>{u.av}</div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:500 }}>{u.name}</p>
                      <p style={{ fontSize:11, color:"#78716C" }}>加入 {u.joined}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"#78716C" }}>{u.loc}</td>
                <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600 }}>{u.sales}</td>
                <td style={{ padding:"12px 16px", fontSize:13 }}>⭐ {u.rating}</td>
                <td style={{ padding:"12px 16px" }}>
                  <button className="press" onClick={()=>updateUser(u.id,{verified:!u.verified})} style={{ fontSize:12, padding:"4px 10px", borderRadius:7, fontWeight:600,
                    background:u.verified?"#f0fdf4":"#fafaf9", color:u.verified?"#16a34a":"#78716C"
                  }}>{u.verified?"✓ 已认证":"未认证"}</button>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ fontSize:13, color:u.reports>0?"#ef4444":"#78716C", fontWeight:u.reports>0?600:400 }}>{u.reports} 次</span>
                </td>
                <td style={{ padding:"12px 16px" }}>{statusBadge(u.status)}</td>
                <td style={{ padding:"12px 16px" }}>
                  {u.status==="正常" ? (
                    <button className="press" onClick={()=>updateUser(u.id,{status:"封禁"})} style={{ padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600, background:"#fef2f2", color:"#dc2626" }}>封禁</button>
                  ) : (
                    <button className="press" onClick={()=>updateUser(u.id,{status:"正常"})} style={{ padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600, background:"#f0fdf4", color:"#16a34a" }}>解封</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN — REPORTS
══════════════════════════════════════════════════════════ */
function AdminReports({ reports, updateReport, products, users, updateProduct, updateUser }) {
  const handleProcess = (r) => {
    updateReport(r.id, { status:"已处理" });
    if (r.productId) updateProduct(r.productId, { status:"已下架", reported:false });
    if (r.userId) updateUser(r.userId, { status:"封禁" });
  };
  return (
    <div style={{ padding:28, overflowY:"auto", flex:1 }}>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, marginBottom:20 }}>举报处理</p>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {reports.map(r=>(
          <div key={r.id} style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,.06)", animation:"slideUp .3s ease", borderLeft:`3px solid ${r.status==="待处理"?"#ef4444":"#e5e7eb"}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:12, fontWeight:700, padding:"3px 9px", borderRadius:20, background:r.type==="商品举报"?"#fff7ed":"#faf5ff", color:r.type==="商品举报"?OR:"#8b5cf6" }}>{r.type}</span>
                  {statusBadge(r.status)}
                </div>
                <p style={{ fontSize:14, fontWeight:600 }}>举报对象：{r.target}</p>
                <p style={{ fontSize:13, color:"#78716C", marginTop:4 }}>举报原因：{r.reason}</p>
                <p style={{ fontSize:12, color:"#78716C", marginTop:4 }}>举报人：{r.reporter} · {r.time}</p>
              </div>
              {r.status==="待处理" && (
                <div style={{ display:"flex", gap:8, flexShrink:0, marginLeft:16 }}>
                  <button className="press" onClick={()=>handleProcess(r)} style={{ padding:"8px 16px", borderRadius:9, fontSize:13, fontWeight:600, background:"#fef2f2", color:"#dc2626" }}>
                    {r.productId?"下架商品":"封禁用户"}
                  </button>
                  <button className="press" onClick={()=>updateReport(r.id,{status:"已处理"})} style={{ padding:"8px 16px", borderRadius:9, fontSize:13, fontWeight:600, background:"#f0fdf4", color:"#16a34a" }}>忽略</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN — SETTINGS
══════════════════════════════════════════════════════════ */
function AdminSettings() {
  const [settings, setSettings] = useState({ appName:"闲猫市集", requireReview:true, allowChat:true, commissionRate:"2.5", maxPhotos:"9", announcement:"欢迎使用闲猫市集！" });
  const [saved, setSaved] = useState(false);
  const set = (k,v) => setSettings(s=>({...s,[k]:v}));
  const inp = { width:"100%", padding:"10px 13px", borderRadius:10, border:"1.5px solid #F0EBE5", outline:"none", fontSize:14, background:"#fafaf9" };
  return (
    <div style={{ padding:28, overflowY:"auto", flex:1 }}>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, marginBottom:20 }}>平台设置</p>
      <div style={{ maxWidth:560 }}>
        <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 8px rgba(0,0,0,.06)", marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>基本设置</p>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>平台名称</label>
            <input value={settings.appName} onChange={e=>set("appName",e.target.value)} style={inp} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>平台公告</label>
            <textarea value={settings.announcement} onChange={e=>set("announcement",e.target.value)} rows={3} style={{ ...inp, resize:"none" }} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>平台手续费 (%)</label>
            <input value={settings.commissionRate} onChange={e=>set("commissionRate",e.target.value)} type="number" step="0.1" style={inp} />
          </div>
          <div style={{ marginBottom:4 }}>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>最多上传图片数</label>
            <input value={settings.maxPhotos} onChange={e=>set("maxPhotos",e.target.value)} type="number" style={inp} />
          </div>
        </div>
        <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 8px rgba(0,0,0,.06)", marginBottom:16 }}>
          <p style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>功能开关</p>
          {[["requireReview","新商品需审核才可展示"],["allowChat","允许用户站内聊天"]].map(([k,lb])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #F0EBE5" }}>
              <p style={{ fontSize:14 }}>{lb}</p>
              <button className="press" onClick={()=>set(k,!settings[k])} style={{
                width:46, height:26, borderRadius:13, position:"relative", transition:"background .2s",
                background:settings[k]?OR:"#d1d5db"
              }}>
                <div style={{ position:"absolute", top:3, left:settings[k]?22:3, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
              </button>
            </div>
          ))}
        </div>
        <button className="press" onClick={()=>{ setSaved(true); setTimeout(()=>setSaved(false),2000); }} style={{
          width:"100%", height:46, borderRadius:12, background:saved?"#16a34a":OR, color:"#fff",
          fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:15, transition:"background .3s",
          boxShadow:"0 4px 14px rgba(249,115,22,.35)"
        }}>{saved?"✓ 已保存！":"保存设置"}</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN APP SHELL
══════════════════════════════════════════════════════════ */
function AdminApp() {
  const { products, users, reports, updateProduct, deleteProduct, updateUser, updateReport, setMode } = useApp();
  const [tab, setTab] = useState("dashboard");
  return (
    <div style={{ display:"flex", height:"100vh", background:"#f8fafc", fontFamily:"'DM Sans',sans-serif" }}>
      <AdminSidebar tab={tab} setTab={setTab} setMode={setMode} reports={reports} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
        {tab==="dashboard" && <AdminDashboard products={products} users={users} reports={reports} />}
        {tab==="products" && <AdminProducts products={products} updateProduct={updateProduct} deleteProduct={deleteProduct} />}
        {tab==="users" && <AdminUsers users={users} updateUser={updateUser} />}
        {tab==="reports" && <AdminReports reports={reports} updateReport={updateReport} products={products} users={users} updateProduct={updateProduct} updateUser={updateUser} />}
        {tab==="settings" && <AdminSettings />}
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

function DiscoverShell() {
  const { products, setSelected, setView } = useApp();
  const trending = [...products].filter(p=>p.status==="已上架").sort((a,b)=>b.views-a.views).slice(0,6);
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
  return (
    <div style={{ padding:"60px 24px", textAlign:"center", color:"#78716C", animation:"fadeIn .3s", background:"#FFFBF7", minHeight:"100vh" }}>
      <p style={{ fontSize:52 }}>💬</p>
      <p style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:18, marginTop:14, color:"#18181B" }}>消息中心</p>
      <p style={{ fontSize:13, marginTop:8, lineHeight:1.6 }}>暂无新消息<br/>与卖家聊天后会显示在这里</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════ */
export default function App() {
  const [mode, setMode] = useState("user"); // "user" | "admin"
  const [view, setView] = useState("home");
  const [products, setProducts] = useState(INIT_PRODUCTS);
  const [users, setUsers] = useState(INIT_USERS);
  const [reports, setReports] = useState(INIT_REPORTS);
  const [selected, setSelected] = useState(null);
  const [chat, setChat] = useState(null);

  const addProduct = p => setProducts(ps=>[p,...ps]);
  const updateProduct = (id, patch) => setProducts(ps=>ps.map(p=>p.id===id?{...p,...patch}:p));
  const deleteProduct = id => setProducts(ps=>ps.filter(p=>p.id!==id));
  const updateUser = (id, patch) => setUsers(us=>us.map(u=>u.id===id?{...u,...patch}:u));
  const updateReport = (id, patch) => setReports(rs=>rs.map(r=>r.id===id?{...r,...patch}:r));

  const ctx = { mode, setMode, view, setView, products, users, reports, selected, setSelected, chat, setChat, addProduct, updateProduct, deleteProduct, updateUser, updateReport };

  return (
    <AppCtx.Provider value={ctx}>
      <div style={{ height:"100vh", background: mode==="admin"?"#f8fafc":"#FFFBF7" }}>
        {mode==="admin" ? <AdminApp /> : <UserApp />}
      </div>
    </AppCtx.Provider>
  );
}
