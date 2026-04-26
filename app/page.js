"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Mail, Lock, Menu } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, increment, setDoc, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

const ARTWORKS = [
  { id:"art1", title:"Stille im Wald", medium:"Aquarell auf Papier", dims:"30 × 40 cm", year:2024, startBid:80, bg:"linear-gradient(150deg,#0d2b1a 0%,#1a5c35 45%,#7ab87a 75%,#c8e0b8 100%)", limit:3 },
  { id:"art2", title:"Abendhimmel über dem See", medium:"Acryl auf Leinwand", dims:"50 × 60 cm", year:2024, startBid:150, bg:"linear-gradient(160deg,#080814 0%,#151545 35%,#c04520 60%,#f09040 80%,#ffd090 100%)", limit:5 },
  { id:"art3", title:"Wintermorgen", medium:"Bleistift und Tusche", dims:"21 × 29 cm", year:2025, startBid:45, bg:"linear-gradient(140deg,#eaeaf4 0%,#c0ccd8 35%,#8aaabb 65%,#4a6070 100%)", limit:2 },
  { id:"art4", title:"Rote Tulpen", medium:"Öl auf Leinwand", dims:"40 × 40 cm", year:2025, startBid:200, bg:"linear-gradient(135deg,#150505 0%,#4a0d0d 30%,#b81818 58%,#e84040 78%,#f8b090 100%)", limit:7 },
  { id:"art5", title:"Zürich bei Nacht", medium:"Acryl auf Papier", dims:"60 × 45 cm", year:2024, startBid:180, bg:"linear-gradient(150deg,#04040f 0%,#080c28 35%,#101850 65%,#e8a020 85%,#ffd060 100%)", limit:4 },
  { id:"art6", title:"Abstrakte Komposition I", medium:"Mischtechnik", dims:"70 × 50 cm", year:2025, startBid:120, bg:"linear-gradient(120deg,#200830 0%,#50189a 42%,#9040b8 62%,#e080c8 82%,#ffc8e8 100%)", limit:6 },
];

function fmtTime(diff) {
  if (diff <= 0) return null;
  const d = Math.floor(diff / 864e5), h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4), s = Math.floor((diff % 6e4) / 1e3);
  if (d > 0) return `${d}T ${h}h ${m}m`;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export default function Home() {
  const [arts, setArts] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [bidArt, setBidArt] = useState(null);
  const [bidAmt, setBidAmt] = useState("");
  const [bidMsg, setBidMsg] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [navSolid, setNavSolid] = useState(false);
  const seedDone = useRef(false);

  const localArts = ARTWORKS.map(a => ({ ...a, endTime: null, bidsCount: 0 }));
  const display = arts.length > 0 ? arts : localArts;

  // Clock
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  // Scroll listener for nav
  useEffect(() => {
    const fn = () => setNavSolid(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Auth
  useEffect(() => { const u = onAuthStateChanged(auth, setUser); return u; }, []);

  // Firestore realtime
  useEffect(() => {
    const u = onSnapshot(collection(db, "artworks"), snap => {
      const d = snap.docs.map(dc => ({ id: dc.id, ...dc.data() }));
      if (d.length > 0) setArts(d);
    }, () => {});
    return u;
  }, []);

  // Seed artworks to Firestore once
  useEffect(() => {
    if (seedDone.current) return;
    seedDone.current = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "artworks"));
        if (snap.empty) {
          for (const a of ARTWORKS) {
            await setDoc(doc(db, "artworks", a.id), {
              ...a, endTime: null, currentBid: null, lastBidder: null, bidsCount: 0,
            });
          }
        }
      } catch (_) {}
    })();
  }, []);

  const doAuth = async (e) => {
    e.preventDefault(); setAuthErr("");
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, pw);
      else await createUserWithEmailAndPassword(auth, email, pw);
      setAuthOpen(false); setEmail(""); setPw("");
    } catch { setAuthErr("Anmeldung fehlgeschlagen. Überprüfe deine Daten."); }
  };

  const openBid = (art) => {
    if ((art.endTime - now) <= 0) return;
    if (!user) { setAuthOpen(true); setIsLogin(true); return; }
    setBidArt(art); setBidAmt((art.currentBid || art.startBid) + 5); setBidMsg("");
  };

  const placeBid = async () => {
    if (!user || !bidArt) return;
    const amt = Number(bidAmt), highest = bidArt.currentBid || bidArt.startBid;
    if (amt <= highest) { setBidMsg(`Mindestens CHF ${highest + 5}`); return; }
    try {
      const ref = doc(db, "artworks", bidArt.id);
      await updateDoc(ref, { currentBid: amt, lastBidder: user.email, bidsCount: increment(1) });
      setBidMsg("success");
      setTimeout(() => setBidArt(null), 2200);
    } catch {
      setBidMsg("Fehler beim Speichern. Versuche es erneut.");
    }
  };

  return (
    <div className="min-h-screen bg-ocean-darkest text-ocean-text">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${navSolid ? "nav-glass border-b border-ocean-border/40" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#" className="font-serif text-2xl tracking-[0.18em] text-ocean-gold">
            Ocean Galerie
          </a>
          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#auktionen" className="text-xs uppercase tracking-[0.15em] text-ocean-text/70 hover:text-ocean-gold transition-colors">Auktionen</a>
            <a href="#about" className="text-xs uppercase tracking-[0.15em] text-ocean-text/70 hover:text-ocean-gold transition-colors">Über Artemis</a>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-ocean-gold/80 tracking-wider">{user.email.split("@")[0]}</span>
                <button onClick={() => signOut(auth)} className="text-xs text-ocean-muted hover:text-ocean-gold transition-colors uppercase tracking-wider">Logout</button>
              </div>
            ) : (
              <button onClick={() => { setAuthOpen(true); setIsLogin(true); }} className="text-xs uppercase tracking-[0.15em] text-ocean-text/70 hover:text-ocean-gold transition-colors border border-ocean-gold/30 px-5 py-2 rounded-full hover:border-ocean-gold/60">
                Login
              </button>
            )}
          </div>
          {/* Mobile hamburger */}
          <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden text-ocean-text/70"><Menu size={22} /></button>
        </div>
        {/* Mobile dropdown */}
        {mobileNav && (
          <div className="md:hidden nav-glass border-t border-ocean-border/30 px-6 py-6 flex flex-col gap-4">
            <a href="#auktionen" onClick={() => setMobileNav(false)} className="text-sm text-ocean-text/70 tracking-wider">Auktionen</a>
            <a href="#about" onClick={() => setMobileNav(false)} className="text-sm text-ocean-text/70 tracking-wider">Über Artemis</a>
            {user ? (
              <button onClick={() => { signOut(auth); setMobileNav(false); }} className="text-sm text-ocean-muted tracking-wider text-left">Logout</button>
            ) : (
              <button onClick={() => { setAuthOpen(true); setIsLogin(true); setMobileNav(false); }} className="text-sm text-ocean-gold tracking-wider text-left">Login</button>
            )}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
            <source src="/ocean-waves.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-ocean-darkest/50 via-ocean-darkest/30 to-ocean-darkest z-10" />
        </div>
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:1.2, ease:"easeOut" }} className="relative z-20 text-center px-6">
          <p className="text-ocean-gold text-[11px] md:text-xs tracking-[0.3em] uppercase mb-8 font-medium">
            Originale Kunstwerke · Zürich, Schweiz
          </p>
          <h1 className="font-serif text-6xl md:text-[8.5rem] text-ocean-text tracking-[0.12em] leading-none mb-1" style={{ textShadow:"0 4px 40px rgba(196,162,101,0.25)" }}>
            OCEAN
          </h1>
          <h2 className="font-serif text-3xl md:text-6xl italic mb-10 tracking-wide" style={{ color:"#7eaab8" }}>
            Galerie
          </h2>
          <p className="text-sm md:text-base text-ocean-text/80 tracking-wider font-light max-w-md mx-auto leading-relaxed">
            Handgezeichnete Unikate — direkt vom Künstler Artemis.
            <br className="hidden md:block" />
            Biete jetzt auf dein Lieblingsstück.
          </p>
          <a href="#auktionen" className="inline-block mt-10 text-xs uppercase tracking-[0.2em] text-ocean-gold border border-ocean-gold/40 px-8 py-3 rounded-full hover:bg-ocean-gold hover:text-ocean-darkest transition-all duration-300">
            Werke entdecken
          </a>
        </motion.div>
      </section>

      {/* ── AUKTIONEN ── */}
      <section id="auktionen" className="py-28 px-6 max-w-7xl mx-auto">
        <div className="mb-20">
          <p className="text-ocean-gold text-[11px] tracking-[0.25em] uppercase mb-4 font-medium">Laufende Auktionen</p>
          <h3 className="font-serif text-4xl md:text-5xl text-ocean-text mb-5 leading-tight">Aktuelle Werke</h3>
          <p className="text-ocean-muted text-sm md:text-base max-w-lg leading-relaxed">
            Jedes Bild ist ein handgezeichnetes Original — Unikat, signiert und mit Echtheitszertifikat.
            Biete jetzt und sichere dir dein Lieblingsstück.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {display.map((art, i) => {
            const diff = art.endTime - now, ended = art.endTime && (art.endTime - now) <= 0, urgent = diff > 0 && diff < 864e5;
            const bid = art.currentBid || art.startBid;
            return (
              <motion.div key={art.id} initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:i*0.08 }}
                onClick={() => !ended && openBid(art)}
                className={`art-card flex flex-col ${ended ? "opacity-60 pointer-events-none" : "cursor-pointer"} group`}>
                <div className="h-[240px] relative overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ background: art.bg }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-ocean-card via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 z-10">
                    {ended ? (
                      <span className="bg-black/60 text-ocean-muted text-[10px] uppercase tracking-[0.1em] py-1 px-2.5 rounded border border-white/10">Beendet</span>
                    ) : (
                      <span className={`bg-black/60 text-xs font-mono py-1 px-2.5 rounded border tracking-wider ${urgent ? "text-ocean-red border-ocean-red/60 animate-pulse" : "text-ocean-gold border-ocean-gold/40"}`}>
                        ⏱ {!art.endTime ? "10 Tage ab Start" : fmtTime(diff)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="font-serif text-xl text-ocean-text mb-1 tracking-wide">{art.title}</h4>
                  <p className="text-ocean-muted text-[11px] tracking-wider mb-5">{art.medium} · {art.dims} · {art.year}</p>
                  <div className="mt-auto pt-4 border-t border-ocean-border/40 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-ocean-muted uppercase tracking-[0.1em] mb-0.5">{art.currentBid ? "Aktuelles Gebot" : "Startpreis"}</p>
                      <p className="font-serif text-xl text-ocean-gold">CHF {bid}</p>
                      {art.lastBidder && <p className="text-[10px] text-ocean-muted mt-0.5">von {art.lastBidder.split("@")[0]}</p>}
                    </div>
                    {(art.bidsCount || 0) > 0 && <p className="text-[10px] text-ocean-muted">{art.bidsCount} Gebot{art.bidsCount !== 1 ? "e" : ""}</p>}
                  </div>
                  {!ended && (
                    <button className="mt-4 w-full py-2.5 border border-ocean-gold/30 text-ocean-gold text-xs font-serif tracking-[0.15em] rounded transition-all duration-300 group-hover:bg-ocean-gold group-hover:text-ocean-darkest">
                      JETZT BIETEN →
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── SO FUNKTIONIERT'S ── */}
      <section className="py-24 border-y border-ocean-border/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-10">
          {[
            { n:"01", t:"Bieten", d:"Gib dein Gebot auf ein Werk ab. Das höchste Gebot bei Auktionsende gewinnt das Original." },
            { n:"02", t:"Bezahlen", d:"Zahlung bequem per Twint oder PayPal — sicher, schnell und direkt nach dem Auktionsgewinn." },
            { n:"03", t:"Erhalten", d:"Das Originalwerk wird sicher verpackt und innerhalb von 5 Werktagen in die Schweiz geliefert." },
          ].map((s, i) => (
            <motion.div key={s.n} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:i*0.12 }}>
              <span className="font-serif text-5xl md:text-6xl text-ocean-gold/50">{s.n}</span>
              <h5 className="text-ocean-text text-lg font-medium mt-3 mb-2 tracking-wide">{s.t}</h5>
              <p className="text-ocean-muted text-sm leading-relaxed">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ÜBER ARTEMIS ── */}
      <section id="about" className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ocean-gold text-[11px] tracking-[0.25em] uppercase mb-4 font-medium">Über den Künstler</p>
          <h3 className="font-serif text-4xl md:text-5xl text-ocean-text mb-8">Artemis</h3>
          <div className="w-12 h-px bg-ocean-gold/40 mx-auto mb-10" />
          <p className="text-ocean-muted text-sm md:text-base leading-[1.9] max-w-2xl mx-auto mb-6">
            Jedes Werk entsteht von Hand — mit Bleistift, Tusche, Aquarell oder Acryl auf Papier und Leinwand.
            Inspiriert von der Natur der Schweiz, urbanen Szenen und stillen Momenten entstehen Bilder,
            die Geschichten erzählen, ohne ein Wort zu brauchen.
          </p>
          <p className="text-ocean-muted text-sm md:text-base leading-[1.9] max-w-2xl mx-auto mb-10">
            Ocean Galerie ist mein Raum, diese Originale direkt zu dir zu bringen —
            ohne Galerien, ohne Zwischenhändler. Jedes Werk ist ein Unikat, signiert und mit Echtheitszertifikat.
          </p>
          <a href="mailto:mxocean@protonmail.com" className="text-ocean-gold text-sm tracking-wider hover:text-ocean-goldLight transition-colors">
            mxocean@protonmail.com
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-ocean-border/30 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-serif text-lg text-ocean-gold tracking-[0.2em]">Ocean Galerie</span>
          <p className="text-ocean-muted text-xs tracking-wider">Handgezeichnete Originale · Artemis · Zürich</p>
          <p className="text-ocean-muted/60 text-xs">© {new Date().getFullYear()} · <a href="mailto:mxocean@protonmail.com" className="hover:text-ocean-gold transition-colors">mxocean@protonmail.com</a></p>
        </div>
      </footer>

      {/* ── AUTH MODAL ── */}
      <AnimatePresence>
        {authOpen && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setAuthOpen(false)} className="absolute inset-0 modal-backdrop" />
            <motion.div initial={{ scale:0.96, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.96, opacity:0 }} className="modal-panel p-8 md:p-10">
              <button onClick={() => setAuthOpen(false)} className="absolute top-4 right-4 text-ocean-muted hover:text-ocean-gold transition-colors"><X size={20}/></button>
              <div className="text-center mb-8 mt-2">
                <ShieldCheck size={32} className="text-ocean-gold mx-auto mb-4" />
                <h2 className="font-serif text-2xl mb-1 text-ocean-text">{isLogin ? "Willkommen zurück" : "Account erstellen"}</h2>
                <p className="text-[11px] text-ocean-muted tracking-wide">Erforderlich, um Gebote abzugeben.</p>
              </div>
              <form onSubmit={doAuth} className="space-y-4">
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ocean-muted/50" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="E-Mail" className="input-field pl-10" />
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ocean-muted/50" />
                  <input type="password" value={pw} onChange={e => setPw(e.target.value)} required placeholder="Passwort" minLength={6} className="input-field pl-10" />
                </div>
                {authErr && <p className="text-ocean-red text-xs text-center py-1.5 bg-ocean-red/10 rounded">{authErr}</p>}
                <button type="submit" className="w-full py-3.5 bg-ocean-gold text-ocean-darkest font-serif font-semibold tracking-[0.12em] text-sm rounded hover:bg-ocean-goldLight transition-colors mt-2">
                  {isLogin ? "EINLOGGEN" : "REGISTRIEREN"}
                </button>
              </form>
              <div className="mt-6 text-center border-t border-ocean-border/30 pt-5">
                <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] text-ocean-muted hover:text-ocean-gold transition-colors uppercase tracking-[0.1em]">
                  {isLogin ? "Noch keinen Account? Registrieren" : "Bereits registriert? Einloggen"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BID MODAL ── */}
      <AnimatePresence>
        {bidArt && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setBidArt(null)} className="absolute inset-0 modal-backdrop" />
            <motion.div initial={{ scale:0.96, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.96, opacity:0 }} className="modal-panel p-8">
              <button onClick={() => setBidArt(null)} className="absolute top-4 right-4 text-ocean-muted hover:text-ocean-gold transition-colors"><X size={20}/></button>
              {bidMsg === "success" ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 border-2 border-ocean-gold rounded-full flex items-center justify-center mx-auto mb-5 text-ocean-gold"><ShieldCheck size={24}/></div>
                  <h2 className="font-serif text-2xl mb-2 text-ocean-gold">Gebot erfolgreich!</h2>
                  <p className="text-ocean-muted text-sm">Du bist Höchstbietende/r für<br/><em className="text-ocean-text font-serif not-italic">{bidArt.title}</em></p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="font-serif text-2xl mb-1 text-ocean-text">Gebot abgeben</h2>
                    <p className="text-ocean-muted text-xs tracking-wider">{bidArt.title} · Mindestgebot: <span className="text-ocean-gold">CHF {(bidArt.currentBid || bidArt.startBid) + 5}</span></p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.12em] text-ocean-muted mb-1.5">Angemeldet als</label>
                      <div className="input-field text-ocean-muted cursor-default">{user?.email}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.12em] text-ocean-muted mb-1.5">Betrag (CHF)</label>
                      <input type="number" value={bidAmt} onChange={e => setBidAmt(e.target.value)} className="input-field" />
                    </div>
                    {bidMsg && bidMsg !== "success" && <p className="text-ocean-red text-xs py-1">⚠ {bidMsg}</p>}
                    <button onClick={placeBid} className="w-full py-3.5 mt-2 bg-ocean-gold text-ocean-darkest font-serif font-semibold tracking-[0.12em] text-sm rounded hover:bg-ocean-goldLight transition-colors">
                      GEBOT BESTÄTIGEN
                    </button>
                    <button onClick={() => setBidArt(null)} className="w-full py-2 text-ocean-muted text-xs uppercase tracking-wider hover:text-ocean-text transition-colors">
                      Abbrechen
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
