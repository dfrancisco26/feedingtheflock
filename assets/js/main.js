import { Header } from "./header.js";
import { Footer } from "./footer.js";
import { initTallyCounters } from "./tally.js";
import { initDonationModal } from "./donation-modal.js";

const activePage = document.body.dataset.page || "";

const headerTarget = document.getElementById("site-header");
const footerTarget = document.getElementById("site-footer");

if (headerTarget) {
  headerTarget.innerHTML = Header(activePage);
}

if (footerTarget) {
  footerTarget.innerHTML = Footer();
}

initTallyCounters();

initDonationModal();
