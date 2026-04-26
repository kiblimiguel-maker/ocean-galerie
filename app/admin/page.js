"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ShieldCheck, ArrowLeft, Trash2, Clock, Mail, User } from "lucide-react";

export default function AdminPage() {
    const [arts, setArts] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

  useEffect(() => {
        const u = onAuthStateChanged(auth, (u) => {
                setUser(u);
                setLoading(false);
        });
        return u;
  }, []);

  useEffect(() => {
        const u = onSnapshot(collection(db, "artworks"), (snap) => {
                setArts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return u;
  }, []);

  const isAdmin = user && (user.email === "mxocean@protonmail.com" || user.email === "mxocean@proton.me");

  if (loading) return <div className="min-h-screen bg-ocean-darkest flex items-center justify-center text-ocean-gold">Laedt...</div>;

  if (!isAdmin) {
        return (
                <div className="min-h-screen bg-ocean-darkest flex flex-col items-center justify-center p-6 text-center">
                  <h1 className="font-serif text-3xl text-ocean-text mb-4">Zugriff verweigert</h1>
            <p className="text-ocean-muted mb-8">Diese Seite ist nur fuer den Administrator (Artemis) zugaenglich.</p>
            <a href="/" className="text-ocean-gold border border-ocean-gold/30 px-6 py-2 rounded-full hover:bg-ocean-gold hover:text-ocean-darkest transition-all">Zurueck zur Galerie</a>
          </div>
        );
  }

  return (
        <div className="min-h-screen bg-ocean-darkest text-ocean-text p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
              <div>
                <div className="flex items-center gap-3 text-ocean-gold mb-2">
                  <ShieldCheck size={20} />
                  <span className="text-xs uppercase tracking-[0.2em] font-medium">Admin Dashboard</span>
    </div>
              <h1 className="font-serif text-4xl md:text-5xl">Auktions-Verwaltung</h1>
    </div>
            <a href="/" className="flex items-center gap-2 text-xs uppercase tracking-widest text-ocean-muted hover:text-ocean-gold transition-colors">
                <ArrowLeft size={14} /> Zur Galerie
    </a>
    </div>

        <div className="grid grid-cols-1 gap-6">
  {arts.sort((a,b) => a.id.localeCompare(b.id)).map((art) => {
                const ended = art.endTime < Date.now();
                return (
                                <div key={art.id} className="bg-ocean-card border border-ocean-border/40 rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="font-serif text-2xl tracking-wide">{art.title}</h2>
  {ended ? (
                          <span className="bg-ocean-red/10 text-ocean-red text-[10px] px-2 py-0.5 rounded border border-ocean-red/20 uppercase tracking-tighter">Beendet</span>
                        ) : (
                          <span className="bg-ocean-gold/10 text-ocean-gold text-[10px] px-2 py-0.5 rounded border border-ocean-gold/20 uppercase tracking-tighter">Aktiv</span>
                       )}
  </div>

                  <p className="text-ocean-muted text-xs mb-4">{art.medium} - {art.dims}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-[10px] text-ocean-muted uppercase tracking-widest mb-1">Startpreis</p>
                      <p className="font-mono text-ocean-text">CHF {art.startBid}</p>
  </div>
                    <div>
                        <p className="text-[10px] text-ocean-muted uppercase tracking-widest mb-1">Aktuelles Gebot</p>
                      <p className="font-mono text-ocean-gold font-bold text-lg">CHF {art.currentBid || "---"}</p>
  </div>
                    <div>
                        <p className="text-[10px] text-ocean-muted uppercase tracking-widest mb-1">Gebote</p>
                      <p className="font-mono text-ocean-text">{art.bidsCount || 0}</p>
  </div>
                    <div>
                        <p className="text-[10px] text-ocean-muted uppercase tracking-widest mb-1">Endet am</p>
                      <p className="font-mono text-ocean-text text-[11px]">{new Date(art.endTime).toLocaleDateString()} {new Date(art.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
  </div>
  </div>
  </div>
                <div className="w-full md:w-64 bg-ocean-darkest/50 rounded-lg p-4 border border-ocean-border/30">
                    <p className="text-[10px] text-ocean-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                      <User size={10} /> {ended ? "Gewinner" : "Hoechstbietender"}
  </p>
{art.lastBidder ? (
                      <div>
                        <div className="flex items-center gap-2 text-ocean-gold mb-1">
                          <Mail size={12} />
                          <span className="text-xs font-medium truncate">{art.lastBidder}</span>
  </div>
                        <p className="text-[10px] text-ocean-muted italic mt-2">
{ended ? "-> Kontaktiere den Gewinner jetzt." : "Auktion laeuft noch..."}
</p>
  </div>
                    ) : (
                      <p className="text-xs text-ocean-muted italic">Noch keine Gebote</p>
                   )}
</div>
  </div>
            );
})}
  </div>
        <div className="mt-12 pt-8 border-t border-ocean-border/20 text-center">
            <p className="text-[10px] text-ocean-muted uppercase tracking-[0.2em]">
              Eingeloggt als: <span className="text-ocean-gold">{user?.email}</span>
  </p>
  </div>
  </div>
  </div>
  );
}
