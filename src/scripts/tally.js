function formatTallyNumber(value, suffix = "") {
  return new Intl.NumberFormat("en-US").format(Math.round(value)) + suffix;
}

function animateTallyNumber(element) {
  if (element.dataset.hasAnimated === "true") return;
  element.dataset.hasAnimated = "true";

  const target = Number(element.dataset.target || 0);
  const suffix = element.dataset.suffix || "";
  const duration = Number(element.dataset.duration || 1200);
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = target * easedProgress;

    element.textContent = formatTallyNumber(currentValue, suffix);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatTallyNumber(target, suffix);
    }
  }

  requestAnimationFrame(update);
}

export function initTallyCounters() {
  const tallySection = document.querySelector("[data-tally-section]");
  if (!tallySection || tallySection.dataset.hasAnimated === "true") return;

  const numbers = tallySection.querySelectorAll("[data-tally-number]");

  function runCounters() {
    if (tallySection.dataset.hasAnimated === "true") return;

    tallySection.dataset.hasAnimated = "true";
    tallySection.classList.add("is-visible");
    numbers.forEach((number) => animateTallyNumber(number));
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);
      if (!isVisible) return;

      runCounters();
      obs.disconnect();
    },
    { threshold: 0.35 }
  );

  observer.observe(tallySection);
}
