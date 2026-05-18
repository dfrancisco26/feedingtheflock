Feeding the Flock SD Website
============================

Static multi-page site for Feeding the Flock SD.

Project Structure
-----------------

- `index.html` - Homepage
- `about.html` - About, programs, locations, partners, and gallery
- `donate.html` - Donation methods and donation QR modal
- `contact.html` - Contact information and social links

Shared Assets
-------------

- `assets/css/styles.css` - Global styles for all pages
- `assets/js/main.js` - Shared page bootstrapping (header/footer/tally/modal/calendar)
- `assets/js/header.js` - Shared header/nav component
- `assets/js/footer.js` - Shared footer component
- `assets/js/tally.js` - Home page animated impact counters
- `assets/js/donation-modal.js` - Donate page QR modal behavior
- `assets/js/events-calendar.js` - Calendar logic kept in repo for future reuse

Current Behavior
----------------

- Header and footer are injected on each page from shared JS.
- Primary navigation includes Home, About, Food Help and Events, Donate, and Contact.
- Donation page supports PayPal and Venmo links and QR modal actions.
- Zelle donation block is intentionally commented out in `donate.html`.

Configuration Notes
-------------------

- Event page is currently disabled and `events.html` has been removed.

Run Locally
-----------

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000/`

Outstanding Cleanup (Optional)
------------------------------

- Remove inline styles currently in `donate.html`.
- Replace remaining placeholder alt text where needed.
- Add favicon and Open Graph metadata.
