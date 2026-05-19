Feeding the Flock SD Website
============================

Static multi-page site for Feeding the Flock SD.

Project Structure
-----------------

- `index.html` - Homepage
- `about.html` - About, programs, locations, partners, and gallery
- `events.html` - Food Help and Events page with upcoming events and monthly calendar
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
- `assets/js/events-calendar.js` - Events data and calendar rendering

Current Behavior
----------------

- Header and footer are injected on each page from shared JS.
- Primary navigation includes Home, About, Food Help and Events, Donate, and Contact.
- Events calendar shows one month at a time with previous/next month controls.
- Upcoming events excludes weekly recurring events and shows non-weekly upcoming items.
- Donation page supports PayPal and Venmo links and QR modal actions.
- Zelle donation block is intentionally commented out in `donate.html`.

Configuration Notes
-------------------

- Food box request buttons on `events.html` are controlled by:
  - `foodBoxFormUrl` in `assets/js/events-calendar.js`

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
