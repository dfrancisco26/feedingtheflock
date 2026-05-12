export function Header(activePage = "") {
  return `
    <header class="site-header">
      <div class="container header-inner">
        <a href="index.html" class="logo">
          <span class="logo-mark" aria-hidden="true">
            <img src="/images/logo_2026.png" alt="" class="logo-icon" />
          </span>
          <span class="logo-text">Feeding the Flock SD</span>
        </a>

        <nav aria-label="Primary navigation">
          <ul class="nav-list">
            <li><a href="index.html" class="${activePage === "home" ? "active" : ""}">Home</a></li>
            <li><a href="about.html" class="${activePage === "about" ? "active" : ""}">About</a></li>
            <li><a href="donate.html" class="${activePage === "donate" ? "active" : ""}">Donate</a></li>
            <li><a href="contact.html" class="${activePage === "contact" ? "active" : ""}">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `;
}