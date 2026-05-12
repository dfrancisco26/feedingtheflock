

const donationOptions = {
  zelle: {
    title: "Zelle",
    qrSrc: "assets/images/zelle-qr-placeholder.png",
    link: "#",
    linkText: "Open Zelle",
  },
  paypal: {
    title: "PayPal",
    qrSrc: "assets/images/paypal-qr-placeholder.png",
    link: "#",
    linkText: "Open PayPal",
  },
  venmo: {
    title: "Venmo",
    qrSrc: "assets/images/venmo-qr-placeholder.png",
    link: "#",
    linkText: "Open Venmo",
  },
};

export function initDonationModal() {
  const modal = document.querySelector("[data-donation-modal]");
  if (!modal) return;

  const title = modal.querySelector("[data-modal-title]");
  const image = modal.querySelector("[data-modal-image]");
  const link = modal.querySelector("[data-modal-link]");
  const closeButtons = modal.querySelectorAll("[data-modal-close]");
  const triggers = document.querySelectorAll("[data-donation-option]");

  function openModal(optionKey) {
    const option = donationOptions[optionKey];
    if (!option) return;

    title.textContent = `${option.title} QR Code`;
    image.src = option.qrSrc;
    image.alt = `${option.title} donation QR code`;
    link.href = option.link;
    link.textContent = option.linkText;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openModal(trigger.dataset.donationOption);
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}