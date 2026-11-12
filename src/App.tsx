// Web3Forms contact form integration for GitHub Pages
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Database, 
  Share2, 
  Euro, 
  Clock, 
  CheckCircle2, 
  Mail, 
  MapPin,
  FileDigit,
  ArrowRight,
  Info,
  ChevronLeft,
  Loader2,
  Lock
} from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Email Obfuscation Component to prevent scraping
const ObfuscatedEmail = ({ className = "" }: { className?: string }) => {
  const [user] = useState('info');
  const [domain] = useState('behold-dit-bogforingsprogram.dk');
  
  return (
    <a 
      href={`mailto:${user}@${domain}`}
      className={className}
      onClick={(e) => {
        // Fallback for extreme cases
        if (!user || !domain) e.preventDefault();
      }}
    >
      {user}<span className="hidden">anti-spam</span>@{domain}
    </a>
  );
};

// Logo Component
const Logo = ({ className = "" }: { className?: string }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {!imageError ? (
        <img 
          src="/logo.png" 
          alt="Laursen Consulting" 
          className="h-10 w-auto"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-tighter text-slate-900 leading-none">LAURSEN</span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase leading-none mt-1">Consulting</span>
        </div>
      )}
    </div>
  );
};

const initialFormData = {
  navn: '',
  email: '',
  virksomhed: '',
  program: '',
  hasBackup: false,
  backupDetails: {
    frekvens: '',
    ekstern: false
  },
  hasEfaktura: false,
  efakturaType: 'OIOUBL/Nemhandel',
  hasBank: false,
  hasSaft: false,
  fritekst: '',
  humanCheck: ''
};

export default function App() {
  const [showContactPage, setShowContactPage] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [botcheck, setBotcheck] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState(initialFormData);

  const buildMailtoHref = () => {
    const subject = encodeURIComponent(
      `Henvendelse fra ${formData.virksomhed || formData.navn || 'kunde'} — Behold dit bogføringsprogram`
    );
    const bodyLines = [
      `Navn: ${formData.navn}`,
      `E-mail: ${formData.email}`,
      `Virksomhed og CVR-nr.: ${formData.virksomhed}`,
      `Bogføringsprogram: ${formData.program}`,
      `Tager løbende backup: ${formData.hasBackup ? 'Ja' : 'Nej'}${formData.hasBackup ? ` (Frekvens: ${formData.backupDetails.frekvens || 'Ikke oplyst'}, Ekstern EU/EØS: ${formData.backupDetails.ekstern ? 'Ja' : 'Nej'})` : ''}`,
      `Har e-faktura-funktion: ${formData.hasEfaktura ? `Ja (${formData.efakturaType})` : 'Nej'}`,
      `Har bankafstemningsfunktion: ${formData.hasBank ? 'Ja' : 'Nej'}`,
      `Har SAF-T-fil: ${formData.hasSaft ? 'Ja' : 'Nej'}`,
      '',
      'Spørgsmål:',
      formData.fritekst || '(Ingen)'
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    return `mailto:info@behold-dit-bogforingsprogram.dk?subject=${subject}&body=${body}`;
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setFormSubmitted(false);
    setSubmitError(null);
    setShowContactPage(true);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Simple human check
    const checkValue = formData.humanCheck.trim().toLowerCase();
    if (checkValue !== 'menneske' && checkValue !== '8') {
      setSubmitError("Venligst bekræft at du er et menneske (Svar 8 eller skriv menneske).");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
      const web3formsKey = env?.VITE_WEB3FORMS_ACCESS_KEY?.trim();

      if (web3formsKey) {
        const payload: Record<string, string | boolean> = {
          access_key: web3formsKey,
          subject: `Ny henvendelse fra ${formData.virksomhed} (${formData.navn}) — Behold dit bogføringsprogram`,
          from_name: 'Behold dit bogføringsprogram',
          name: formData.navn,
          email: formData.email,
          replyto: formData.email,
          Virksomhed_og_CVR: formData.virksomhed,
          Bogfoeringsprogram: formData.program,
          Tager_loebende_backup: formData.hasBackup ? 'Ja' : 'Nej',
          Har_efaktura_funktion: formData.hasEfaktura ? `Ja (${formData.efakturaType})` : 'Nej',
          Har_bankafstemningsfunktion: formData.hasBank ? 'Ja' : 'Nej',
          Har_SAFT_fil: formData.hasSaft ? 'Ja' : 'Nej',
          message: formData.fritekst || '(Ingen spørgsmål angivet)',
          botcheck,
        };

        if (formData.hasBackup) {
          payload.Backup_frekvens = formData.backupDetails.frekvens || 'Ikke oplyst';
          payload.Ekstern_backup_EU_EOES = formData.backupDetails.ekstern ? 'Ja' : 'Nej';
        }

        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result?.success) {
          setFormSubmitted(true);
          setFormData(initialFormData);
          setBotcheck(false);
        } else {
          setSubmitError(
            result?.message ||
              "Beskeden kunne ikke sendes automatisk lige nu. Du kan sende den direkte via dit mailprogram nedenfor."
          );
        }
        return;
      }

      const contactEndpoint = env?.VITE_CONTACT_API_URL || '/api/contact';
      const response = await fetch(contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        setFormSubmitted(true);
        setFormData(initialFormData);
        setBotcheck(false);
      } else {
        setSubmitError(
          result?.error ||
            "Beskeden kunne ikke sendes automatisk lige nu. Du kan sende den direkte via dit mailprogram nedenfor."
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        "Der opstod en netværksfejl under afsendelsen. Du kan sende din besked direkte via dit mailprogram nedenfor."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showContactPage) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        <nav className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowContactPage(false)}>
            <Logo />
          </div>
          <button 
            onClick={() => setShowContactPage(false)}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> Tilbage
          </button>
        </nav>

        <div className="max-w-3xl mx-auto px-6 mt-12">
          <AnimatePresence mode="wait">
            {!formSubmitted ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100"
              >
                <h1 className="text-3xl font-black mb-2">Kom godt i gang</h1>
                <p className="text-slate-500 mb-10">Udfyld formularen, så kontakter vi dig med det samme.</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <input
                    type="checkbox"
                    name="botcheck"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                    checked={botcheck}
                    onChange={e => setBotcheck(e.target.checked)}
                  />
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Navn</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="Dit fulde navn"
                        value={formData.navn}
                        onChange={e => setFormData({...formData, navn: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">E-mail</label>
                      <input 
                        required
                        type="email" 
                        className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="din@email.dk"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Virksomhed og CVR-nr.</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="Virksomhed ApS, 12345678"
                        value={formData.virksomhed}
                        onChange={e => setFormData({...formData, virksomhed: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Bogføringsprogram</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all"
                        placeholder="F.eks. Business Central, C5 eller lign."
                        value={formData.program}
                        onChange={e => setFormData({...formData, program: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-lg">Nuværende bogføringsprogram:</h3>
                    
                    <div className="space-y-4">
                      {/* Backup */}
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-6 h-6 rounded-lg text-blue-600 border-slate-200 focus:ring-blue-600"
                            checked={formData.hasBackup}
                            onChange={e => setFormData({...formData, hasBackup: e.target.checked})}
                          />
                          <span className="font-medium group-hover:text-blue-600 transition-colors">Tager løbende backup</span>
                        </label>
                        {formData.hasBackup && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-9 space-y-4">
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm"
                              placeholder="Hvor ofte tages der backup?"
                              value={formData.backupDetails.frekvens}
                              onChange={e => setFormData({...formData, backupDetails: {...formData.backupDetails, frekvens: e.target.value}})}
                            />
                            <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-600">
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded text-blue-600"
                                checked={formData.backupDetails.ekstern}
                                onChange={e => setFormData({...formData, backupDetails: {...formData.backupDetails, ekstern: e.target.checked}})}
                              />
                              Sikkerhedskopi ligger hos ekstern tredjepart i EU/EØS
                            </label>
                          </motion.div>
                        )}
                      </div>

                      {/* E-faktura */}
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-6 h-6 rounded-lg text-blue-600 border-slate-200"
                            checked={formData.hasEfaktura}
                            onChange={e => setFormData({...formData, hasEfaktura: e.target.checked})}
                          />
                          <span className="font-medium group-hover:text-blue-600 transition-colors">Har e-faktura-funktion</span>
                        </label>
                        {formData.hasEfaktura && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-9">
                            <select 
                              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm"
                              value={formData.efakturaType}
                              onChange={e => setFormData({...formData, efakturaType: e.target.value})}
                            >
                              <option>OIOUBL/Nemhandel</option>
                              <option>Peppol BIS</option>
                              <option>Begge dele</option>
                            </select>
                          </motion.div>
                        )}
                      </div>

                      {/* Bank & Saft */}
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-lg text-blue-600 border-slate-200"
                          checked={formData.hasBank}
                          onChange={e => setFormData({...formData, hasBank: e.target.checked})}
                        />
                        <span className="font-medium group-hover:text-blue-600 transition-colors">Har bankafstemningsfunktion</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-lg text-blue-600 border-slate-200"
                          checked={formData.hasSaft}
                          onChange={e => setFormData({...formData, hasSaft: e.target.checked})}
                        />
                        <span className="font-medium group-hover:text-blue-600 transition-colors">Har SAF-T-fil</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Har du nogle spørgsmål?</label>
                    <textarea 
                      className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-600 h-32"
                      placeholder="Skriv dine spørgsmål her..."
                      value={formData.fritekst}
                      onChange={e => setFormData({...formData, fritekst: e.target.value})}
                    />
                  </div>

                  {submitError && (
                    <div
                      role="alert"
                      className="bg-red-50 border border-red-200 text-red-900 p-5 rounded-2xl space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium leading-relaxed">{submitError}</p>
                      </div>
                      <a
                        href={buildMailtoHref()}
                        className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Åbn i mailprogram (info@behold-dit-bogforingsprogram.dk)
                      </a>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Sikkerhedstjek: hvad er 5 + 3?</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-600"
                        placeholder="Skriv svar her"
                        value={formData.humanCheck}
                        onChange={e => setFormData({...formData, humanCheck: e.target.value})}
                      />
                    </div>
                    <button 
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-5 rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" /> Sender...
                        </>
                      ) : (
                        'Send besked'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-12 md:p-20 rounded-[3rem] shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black mb-4">Mailen er sendt!</h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Tak for din henvendelse. Vi vender tilbage til dig snarest muligt.
                </p>
                <p className="text-lg font-bold text-blue-600 mb-10">Hav en dejlig dag!</p>
                <button 
                  onClick={() => setShowContactPage(false)}
                  className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  Gå tilbage til forsiden
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900" id="main-wrapper">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 py-4 px-6 md:px-12 flex justify-between items-center" id="navbar">
        <div className="flex items-center gap-2" id="logo-container">
          <Logo />
        </div>
        <div className="hidden md:flex gap-8 items-center" id="nav-links">
          <a href="#krav" className="text-sm font-medium hover:text-blue-600 transition-colors">Loven</a>
          <a href="#losninger" className="text-sm font-medium hover:text-blue-600 transition-colors">Løsninger</a>
          <a href="#om-os" className="text-sm font-medium hover:text-blue-600 transition-colors">Om os</a>
          <a 
            href="#losninger" 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
            id="nav-cta"
          >
            Se priser
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 xl:gap-24 items-center" id="hero">
        <motion.div {...fadeIn} className="z-10 max-w-xl xl:max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6" id="badge">
            <CheckCircle2 className="w-4 h-4" /> Overhold bogføringsloven nemt
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-8 tracking-tight" id="hero-title">
            Du skal ikke skifte dit <span className="text-blue-600">bogføringsprogram</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl" id="hero-subtitle">
            Hvorfor skifte bogføringsprogram, når det stadigvæk virker? Vi hjælper dig med at opfylde kravene om digital bogføring til en brøkdel af prisen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4" id="hero-actions">
            <a 
              href="#losninger" 
              className="bg-slate-900 text-white px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
              id="hero-primary-cta"
            >
              Se vores løsninger <ArrowRight className="w-5 h-5" />
            </a>
            <div className="flex items-center gap-3 text-slate-500" id="trust-indicator">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden" />
                ))}
              </div>
              <span className="text-sm font-medium">Både for selskaber & enkeltmandsvirksomheder</span>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden lg:block"
          id="hero-visual"
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-3xl blur-3xl opacity-50 -z-10" />
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 relative overflow-hidden" id="hero-card">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <h3 className="font-bold text-lg text-slate-800">Automatiseringskrav</h3>
            </div>
            <div className="space-y-5">
              {[
                'E-faktura - dansk (OIOUBL/Nemhandel) og europæisk format (Peppol BIS)',
                'Bankafstemning',
                'SAF-T-fil',
                'Back-up'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Software Support */}
      <section className="py-16 bg-white border-y border-slate-100" id="software">
        <div className="max-w-7xl mx-auto px-6" id="software-container">
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-12">Vi understøtter bl.a. disse systemer</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-24" id="software-logos">
            <div className="flex flex-col items-center group">
              <span className="text-xl md:text-2xl font-black text-slate-400 group-hover:text-blue-600 transition-colors">Microsoft Business Central</span>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 uppercase tracking-widest mt-1 italic">on premise</span>
            </div>
            <div className="flex items-baseline gap-1 group">
              <span className="text-3xl md:text-5xl font-black text-slate-400 group-hover:text-blue-600 transition-colors">C5</span>
            </div>
            <div className="flex items-baseline gap-1 group">
              <span className="text-3xl md:text-4xl font-light text-slate-400 group-hover:text-blue-600 transition-colors tracking-tighter">NAV</span>
              <span className="text-lg font-bold text-slate-400 group-hover:text-blue-400 italic">ision</span>
            </div>
            <div className="flex items-baseline gap-1 group">
              <span className="text-3xl md:text-5xl font-black text-slate-400 group-hover:text-blue-600 transition-colors italic">XAL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Constraints Grid */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto" id="krav">
        <div className="mb-16 max-w-2xl" id="krav-header">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Lovens krav til digital bogføringssystemer</h2>
          <p className="text-slate-600">Din bogføring skal leve op til 34 krav. Vi har kogt de vigtigste punkter ned her.</p>
        </div>
        
        <motion.div 
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          id="krav-grid"
        >
          {requirements.map((krav, idx) => (
            <motion.div 
              key={idx}
              variants={fadeIn}
              className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors shadow-sm group"
              id={`krav-${idx}`}
            >
              <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <krav.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-4">{krav.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">{krav.desc}</p>
              <div className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">{krav.paragraph}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Solutions / Pricing */}
      <section className="bg-blue-600 py-24 text-white relative overflow-hidden" id="losninger">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-500 opacity-50 skew-x-12 translate-x-32" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10" id="pricing-wrapper">
          <div className="grid md:grid-cols-2 gap-16 mb-16 items-center" id="pricing-top">
            <div>
              <h2 className="text-4xl font-extrabold mb-8 leading-tight">Vi har sat os grundigt ind i loven - så du ikke behøver</h2>
              <p className="text-xl text-blue-100 mb-10 leading-relaxed">
                Vores løsninger gør det muligt at opfylde samtlige krav uden at bruge mange timer på it-udvikling eller lære komplicerede systemer.
              </p>
              <div className="space-y-4">
                {['Simpelt og let trin-for-trin vejledning', 'Garanteret overholdelse af loven', 'Support på dansk', 'Ingen tekniske forkundskaber påkrævet'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="text-blue-200 w-6 h-6" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white text-slate-900 p-10 rounded-3xl shadow-2xl relative" id="pricing-card">
              <div className="absolute top-6 right-6 bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">Spar 40 %</div>
              <h3 className="text-2xl font-bold mb-2">Den samlede pakke</h3>
              <p className="text-slate-500 mb-8 text-sm italic">Opfyld alle automatiseringskravene i én pakke</p>
              <div className="flex items-baseline gap-2 mb-8" id="price">
                <span className="text-6xl font-black tracking-tighter">1.995,-</span>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ex. Moms</span>
              </div>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start gap-3 text-sm font-medium border-b border-slate-100 pb-4">
                  <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  Kræver minimal indsats at sætte op
                </li>
                <li className="flex items-start gap-3 text-sm font-medium border-b border-slate-100 pb-4">
                  <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  Kan klares på én dag
                </li>
                <li className="flex items-start gap-3 text-sm font-medium border-b border-slate-100 pb-4">
                  <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  Grundig vejledning og tekst til bogføringsprocedurebeskrivelsen følger med
                </li>
              </ul>
              <button 
                onClick={handleContactClick}
                className="block w-full bg-blue-600 text-white text-center py-5 rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                id="cta-buy"
              >
                Kom godt i gang
              </button>
            </div>
          </div>

          <div className="bg-slate-50 text-slate-900 p-8 md:p-12 rounded-[2.5rem] border border-slate-200" id="individual-prices-card">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Info className="text-blue-600 w-6 h-6" /> Prisen pr. løsning
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
              {[
                { name: 'E-faktura', price: 995 },
                { name: 'SAF-T-fil', price: 1195 },
                { name: 'Bankafstemning', price: 345 },
                { name: 'Sikkerhedskopiering (opbevaring)', price: 795 },
                { name: 'Kontoplan', price: 0, label: 'Gratis' },
                { name: 'Tjek af SAF-T-fil', price: 495 }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm pb-4 border-b border-slate-200/50">
                  <span className="text-slate-600 font-medium">{item.name}</span>
                  <span className="font-bold tabular-nums text-slate-900">{item.label || `${item.price.toLocaleString('da-DK')},-`}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-8 italic text-center">* Alle priser er ekskl. moms</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto" id="om-os">
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-20 text-white grid md:grid-cols-2 gap-16 items-center" id="about-container">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">Hvem er vi?</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Laursen Consulting ApS er specialister i at rådgive små og mellemstore virksomheder. Vi forstår vigtigheden af sammenhængen mellem kvalitet og pris.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-blue-400 font-medium">
                <Mail className="w-5 h-5" />
                <ObfuscatedEmail className="hover:underline" />
              </div>
              <div className="flex items-start gap-3 text-slate-400">
                <MapPin className="w-5 h-5 mt-1 shrink-0" />
                <span>Store Kongensgade 85, 4. sal, 1264 København K</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>CVR-nr: 4124 2647</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4" id="consultants">
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
              <h4 className="font-bold text-xl mb-1">Dennis Lindberg Laursen</h4>
              <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider">Jurist & Ejer</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
              <h4 className="font-bold text-xl mb-1">Jossiane Laursen</h4>
              <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider">Jurist</p>
            </div>
        </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6 md:px-12 text-center" id="footer">
        <div className="max-w-7xl mx-auto text-slate-400 text-xs text-center border-t border-slate-100 pt-8 mt-8">
          <p>© 2026 Laursen Consulting ApS. Alle rettigheder forbeholdes.</p>
        </div>
      </footer>
    </div>
  );
}

const requirements = [
  {
    title: 'Registreringsdata',
    desc: 'Systemet skal indeholde felter til transaktionsdato (fx betalingsdato eller købsdato), beløb, bilagsnummer, transaktionstekst og kurs hvis i andet end DKK.',
    paragraph: 'Bekendtgørelsens § 3, stk. 1',
    icon: Database
  },
  {
    title: 'Transaktionsdata',
    desc: 'Hver transaktion skal tildeles en registreringsdato, et fortløbende transaktionsnummer/id og initialer på personen eller programmet bag.',
    paragraph: 'Bekendtgørelsens § 3, stk. 2',
    icon: FileDigit
  },
  {
    title: 'Beskyttelse af data',
    desc: 'Systemet skal gemme ændringer. Fejlposteringer skal rettes ved nye posteringer. Brugere må ikke kunne ændre eller slette posterede data.',
    paragraph: 'Bekendtgørelsens § 3, stk. 3',
    icon: ShieldCheck
  },
  {
    title: 'It-sikkerhed',
    desc: 'Systemet skal opfylde anerkendte standarder for it-sikkerhed, herunder styring af brugeradgang og logs.',
    paragraph: 'Bogføringslovens § 15',
    icon: ShieldCheck
  },
  {
    title: 'Opbevaring af bilag',
    desc: 'Can opbevare dokumentation med udstedelsesdato, leverancens art, beløb, afsender/modtager (navn, adresse, CVR) og momsoplysninger.',
    paragraph: 'Bekendtgørelsens § 3, stk. 4',
    icon: FileText
  },
  {
    title: 'Backup hos 3. part',
    desc: 'Ugentlig sikkerhedskopi skal tages og opbevares hos en ikke-nærtstående part på en server i et EU- eller EØS-land.',
    paragraph: 'Bekendtgørelsens § 4',
    icon: Share2
  },
  {
    title: 'E-fakturering',
    desc: 'Automatisk afsendelse og modtagelse af e-fakturaer og kreditnotaer i OIOUBL-format via Nemhandel eller Peppol BIS-format.',
    paragraph: 'Bekendtgørelsens § 5',
    icon: Euro
  },
  {
    title: 'SAF-T Fildeling',
    desc: 'Understøtter fildeling ved at kunne generere en SAF-T-fil efter Erhvervsstyrelsens gældende definitioner.',
    paragraph: 'Bekendtgørelsens § 5',
    icon: Share2
  },
  {
    title: 'Bankafstemning',
    desc: 'Understøtter afstemning med bankkonto og skal tydeligt fremhæve differencer, hvis en postering ikke stemmer.',
    paragraph: 'Bekendtgørelsens § 5',
    icon: ShieldCheck
  }
];
