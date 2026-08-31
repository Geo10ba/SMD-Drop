import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import logoImg from '../assets/logo.png';
import { LegalModal } from './LegalModal';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  ExternalLink, 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Truck,
  HelpCircle
} from 'lucide-react';

const InstagramIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.592 9 4.416V8z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export const Footer = ({ onOpenTracking, onOpenFaq, onOpenAdminLogin }) => {
  const { companySettings } = useStore();
  const [legalModalMode, setLegalModalMode] = useState(null); // 'terms', 'privacy' or null

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)] pt-12 pb-8 text-xs text-[var(--text-muted)] transition-colors duration-200">
      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Brand & Enterprise */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-11 flex items-center justify-center shrink-0">
                <img src={logoImg} alt="SMD Drop Logo" className="h-11 w-auto max-h-12 object-contain rounded-lg shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src = "/logo.png"; }} />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-[var(--text-main)] font-['Outfit'] block">
                  SMD <span className="text-[#C59B27] font-light">DROP</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C59B27] block">
                  FABRICAÇÃO PRÓPRIA
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              Plataforma industrial de fabricação e distribuição exclusiva para revendedores de e-commerce e marketplaces.
            </p>

            <div className="space-y-1.5 text-[11px] pt-1 text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <Building2 size={13} className="text-amber-500 shrink-0" />
                <span>CNPJ: <strong className="text-[var(--text-main)]">{companySettings.cnpj}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-amber-500 shrink-0" />
                <span className="line-clamp-1">{companySettings.address}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Meus Sites / External Portals */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-[var(--text-main)] text-xs flex items-center gap-1.5">
              <Globe size={14} className="text-amber-500" /> Meus Sites & Ecossistema
            </h4>
            <ul className="space-y-2">
              {companySettings.mySites && companySettings.mySites.map((site, idx) => (
                <li key={idx}>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-500 transition-colors flex items-center gap-1.5 font-medium text-xs text-[var(--text-main)]"
                  >
                    <ExternalLink size={12} className="text-amber-500/70 shrink-0" />
                    {site.title}
                  </a>
                </li>
              ))}
              <li>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-amber-500 transition-colors flex items-center gap-1.5 font-medium text-xs text-[var(--text-muted)]"
                >
                  <Truck size={13} className="text-amber-500 shrink-0" />
                  Rastreamento de Envio Direto
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenFaq}
                  className="hover:text-amber-500 transition-colors flex items-center gap-1.5 font-medium text-xs text-[var(--text-muted)]"
                >
                  <HelpCircle size={13} className="text-amber-500 shrink-0" />
                  Perguntas Frequentes (F.A.Q)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal Shielding & Protection */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-[var(--text-main)] text-xs flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" /> Blindagem Jurídica & LGPD
            </h4>
            <div className="space-y-2.5">
              <button
                onClick={() => setLegalModalMode('terms')}
                className="w-full text-left bg-[var(--bg-surface-hover)] border border-[var(--border-color)] hover:border-amber-500 p-2.5 rounded-xl transition-all font-semibold flex items-center justify-between text-xs text-[var(--text-main)] group"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  Termos e Condições de Uso
                </span>
                <span className="text-[10px] text-amber-500 font-bold">Ler →</span>
              </button>

              <button
                onClick={() => setLegalModalMode('privacy')}
                className="w-full text-left bg-[var(--bg-surface-hover)] border border-[var(--border-color)] hover:border-emerald-500 p-2.5 rounded-xl transition-all font-semibold flex items-center justify-between text-xs text-[var(--text-main)] group"
              >
                <span className="flex items-center gap-2">
                  <Lock size={15} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  Política de Privacidade (LGPD)
                </span>
                <span className="text-[10px] text-emerald-500 font-bold">Ler →</span>
              </button>

              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold space-y-1">
                <p className="flex items-center gap-1 font-bold uppercase">
                  <ShieldCheck size={12} /> Proteção Contratual Ativa
                </p>
                <p className="text-[10px] opacity-90 leading-tight">
                  Logística Cega (Blind Shipping) garantida com exceções legais do CDC Art. 49 para itens sob medida.
                </p>
              </div>
            </div>
          </div>

          {/* Column 4: Social Media & Contact */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-[var(--text-main)] text-xs flex items-center gap-1.5">
              <MessageCircle size={14} className="text-amber-500" /> Redes Sociais & Contato
            </h4>
            
            <div className="flex items-center gap-2 pt-1">
              {companySettings.socialLinks?.instagram && (
                <a
                  href={companySettings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-500 hover:bg-pink-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                  title="Instagram Oficial"
                >
                  <InstagramIcon />
                </a>
              )}

              {companySettings.socialLinks?.facebook && (
                <a
                  href={companySettings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                  title="Facebook"
                >
                  <FacebookIcon />
                </a>
              )}

              {companySettings.socialLinks?.whatsapp && (
                <a
                  href={companySettings.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                  title="Suporte WhatsApp"
                >
                  <MessageCircle size={16} />
                </a>
              )}

              {companySettings.socialLinks?.youtube && (
                <a
                  href={companySettings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                  title="Canal YouTube"
                >
                  <YoutubeIcon />
                </a>
              )}
            </div>

            <div className="space-y-1.5 text-[11px] pt-2 text-[var(--text-muted)] font-medium">
              <div className="flex items-center gap-1.5">
                <Mail size={13} className="text-amber-500 shrink-0" />
                <a href={`mailto:${companySettings.email}`} className="hover:text-amber-500 transition-colors">
                  {companySettings.email}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone size={13} className="text-amber-500 shrink-0" />
                <span>{companySettings.phone}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--text-muted)] text-center sm:text-left">
          <p className="font-semibold text-[var(--text-main)]">
            {companySettings.name} Platform © {new Date().getFullYear()} • Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-[10px] text-[var(--text-muted)] hidden md:block">
              Logística Cega (Blind Shipping) • Anexo de Etiquetas Mercado Livre, Shopee & Amazon • Calculadora sob Medida R$/m²
            </p>
            {onOpenAdminLogin && (
              <button
                onClick={onOpenAdminLogin}
                className="text-[11px] text-[var(--text-muted)] hover:text-amber-500 font-semibold flex items-center gap-1 transition-colors border border-[var(--border-color)] px-2.5 py-1 rounded-lg bg-[var(--bg-surface-hover)]"
              >
                <Lock size={12} className="text-amber-500" /> Área Restrita Fábrica
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Legal Modal */}
      <LegalModal
        isOpen={!!legalModalMode}
        mode={legalModalMode || 'terms'}
        onClose={() => setLegalModalMode(null)}
      />
    </footer>
  );
};
