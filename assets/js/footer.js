export function Footer() {
  return `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <span class="logo-mark" aria-hidden="true">
            <img src="/images/logo_2026.png" alt="" class="logo-icon" />
          </span>
          <p class="small">
          Feeding the Flock SD is a registered 501(c)(3) nonprofit organization.
          Contributions may be tax deductible to the extent allowed by law.
          EIN: XX-XXXXXXX
</p>
        </div>

        <div>
          <nav class="footer-nav" aria-label="Footer navigation">
            <a href="index.html">Home</a>
            <a href="about.html">About</a>
            <a href="donate.html">Donate</a>
            <a href="contact.html">Contact</a>
          </nav>
        </div>
      </div>
    </footer>
  `;
}