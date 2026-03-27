function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h3>Como En Casa</h3>
          <p className="footer-muted">
            Domicilios, para llevar y comer aquí.
          </p>

          <div className="footer-contact">
            <a className="footer-link" href="tel:+57" aria-label="Llamar al restaurante">
              Tel: +57
            </a>
            <a
              className="footer-link"
              href="mailto:contacto@comencasa.com"
              aria-label="Escribir al correo"
            >
              contacto@comencasa.com
            </a>
          </div>

          <p className="footer-muted footer-small">
            Marinilla, Antioquia · Colombia
          </p>
        </div>

        <div className="footer-map">
          <div className="footer-map-frame">
            <iframe
              title="Mapa Marinilla"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Marinilla%2C%20Antioquia&output=embed"
            />
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Como En Casa</span>
      </div>
    </footer>
  );
}

export default Footer;

