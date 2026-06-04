import {
  siteFooterContact,
  siteFooterLegal,
  siteFooterSocialLinks,
  siteFooterWhatsappInquiryMessage,
} from "../config/siteFooter";
import { buildWhatsAppLink } from "../utils/whatsapp";

const WHATSAPP_PHONE =
  import.meta.env.VITE_WHATSAPP_PHONE?.replace(/\D/g, "") || "5491122334455";

function hasContactContent(contact) {
  return Boolean(
    contact.address ||
      contact.hours ||
      contact.email ||
      contact.shippingNote
  );
}

export default function SiteFooter({
  legal = siteFooterLegal,
  contact = siteFooterContact,
  socialLinks = siteFooterSocialLinks,
  whatsappInquiryMessage = siteFooterWhatsappInquiryMessage,
  whatsappPhone = WHATSAPP_PHONE,
  showAdminLink = false,
  onAdminAccessClick,
}) {
  const whatsappInquiryHref =
    whatsappInquiryMessage &&
    buildWhatsAppLink({
      phoneNumber: whatsappPhone,
      message: whatsappInquiryMessage,
      client: "desktop",
    });

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">
        {hasContactContent(contact) && (
          <section className="site-footer-contact" aria-label="Contacto">
            {contact.address && (
              <p className="site-footer-address">{contact.address}</p>
            )}
            {contact.hours && <p className="site-footer-hours">{contact.hours}</p>}
            {contact.email && (
              <p className="site-footer-email">
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </p>
            )}
            {contact.shippingNote && (
              <p className="site-footer-shipping">{contact.shippingNote}</p>
            )}
          </section>
        )}

        <section className="site-footer-actions" aria-label="Enlaces del pie">
          {whatsappInquiryHref && (
            <a
              className="site-footer-whatsapp-link"
              href={whatsappInquiryHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultanos por WhatsApp
            </a>
          )}

          {socialLinks.length > 0 && (
            <ul className="site-footer-social">
              {socialLinks.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {showAdminLink && (
            <button
              type="button"
              className="admin-access-link"
              onClick={onAdminAccessClick}
            >
              Ingresar admin
            </button>
          )}
        </section>
      </div>

      <p className="site-footer-legal">
        © {legal.year} {legal.businessName}
      </p>
    </footer>
  );
}
