const eventSources = [
  {
    title: "Senior Pantry",
    time: "8:30 AM",
    type: "weekly",
    weekday: 6,
    description: "Weekly senior pantry support.",
  },
  {
    title: "Breakfast Burritos Outreach",
    time: "10:00 AM",
    type: "weekly",
    weekday: 2,
    description: "Morning burrito outreach.",
  },
  {
    title: "Dinner Burritos Outreach",
    time: "5:00 PM",
    type: "weekly",
    weekday: 4,
    description: "Evening burrito outreach.",
  },
  {
    title: "La Mesa Food Distribution",
    time: "4:00-6:00 PM",
    type: "monthlyNthWeekday",
    weekday: 3,
    nth: 4,
    description: "Every fourth Wednesday of the month.",
  },
  {
    title: "Jamul Distribution Day",
    time: "2:00-6:00 PM",
    type: "dates",
    description: "Drive-through food box distribution.",
    dates: [
      "2026-09-15",
      "2026-10-20",
      "2026-11-24",
      "2026-12-15",
    ],
  },
  {
    title: "Cigar & Whiskey Night",
    time: "5:00-8:00 PM",
    type: "dates",
    description: "Hosted by Feeding the Flock SD at Excalibur Cigar & Scotch Lounge. $50 per person.",
    dates: ["2026-10-13"],
  },
  {
    title: "Cocktail Party",
    time: "5:30-7:00 PM",
    type: "dates",
    description: "VIP reception for 20 guests at El Torito, supporting Feeding the Flock SD.",
    dates: ["2026-11-05"],
  },
];

const foodBoxFormUrl = "https://www.signupgenius.com/go/10C0D4DAEAF28AAF9C52-65703393-sepfeeding#/";

const calendarWindow = {
  monthsBack: 0,
  monthsForward: 11,
};

function createDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getNthWeekdayOfMonth(year, monthIndex, weekday, nth) {
  const firstDay = new Date(year, monthIndex, 1);
  const offset = (weekday - firstDay.getDay() + 7) % 7;
  return 1 + offset + (nth - 1) * 7;
}

function getCalendarBounds(referenceDate = new Date()) {
  const thisMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const startMonth = addMonths(thisMonth, -calendarWindow.monthsBack);
  const monthCount = calendarWindow.monthsBack + calendarWindow.monthsForward + 1;
  const endMonth = addMonths(startMonth, monthCount);

  return { startMonth, endMonth, monthCount };
}

function expandEvents(startMonth, endMonth) {
  const events = [];

  eventSources.forEach((source) => {
    if (source.type === "dates") {
      source.dates.forEach((date) => {
        events.push({ ...source, date });
      });
      return;
    }

    for (let cursor = new Date(startMonth); cursor < endMonth; cursor = addMonths(cursor, 1)) {
      const year = cursor.getFullYear();
      const monthIndex = cursor.getMonth();

      if (source.type === "weekly") {
        const daysInMonth = getDaysInMonth(year, monthIndex);

        for (let day = 1; day <= daysInMonth; day += 1) {
          const date = new Date(year, monthIndex, day);

          if (date.getDay() === source.weekday) {
            events.push({ ...source, date: toDateKey(date) });
          }
        }
      }

      if (source.type === "monthlyNthWeekday") {
        const day = getNthWeekdayOfMonth(year, monthIndex, source.weekday, source.nth);
        const daysInMonth = getDaysInMonth(year, monthIndex);

        if (day <= daysInMonth) {
          events.push({ ...source, date: toDateKey(new Date(year, monthIndex, day)) });
        }
      }
    }
  });

  return events
    .filter((event) => {
      const eventDate = createDate(event.date);
      return eventDate >= startMonth && eventDate < endMonth;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function groupEventsByDate(events) {
  return events.reduce((groups, event) => {
    groups[event.date] = groups[event.date] || [];
    groups[event.date].push(event);
    return groups;
  }, {});
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function formatShortDate(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(createDate(dateString));
}

function renderMonth(monthDate, eventsByDate) {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const cells = [];

  for (let blank = 0; blank < firstDay; blank += 1) {
    cells.push('<div class="calendar-day calendar-day-empty" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = toDateKey(new Date(year, monthIndex, day));
    const dayEvents = eventsByDate[dateKey] || [];
    const eventMarkup = dayEvents
      .map(
        (event) => `
          <li>
            <span class="calendar-event-name">${event.title}</span>
            <span class="calendar-event-time">${event.time}</span>
          </li>
        `,
      )
      .join("");

    cells.push(`
      <div class="calendar-day${dayEvents.length ? " has-events" : ""}">
        <span class="calendar-date">${day}</span>
        ${dayEvents.length ? `<ul class="calendar-events">${eventMarkup}</ul>` : ""}
      </div>
    `);
  }

  return `
    <article class="calendar-month" aria-label="${formatMonth(monthDate)} events">
      <div class="calendar-weekdays" aria-hidden="true">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>
      <div class="calendar-grid">
        ${cells.join("")}
      </div>
    </article>
  `;
}

function renderCalendarShell(monthDate, eventsByDate, monthIndex) {
  const isFirstMonth = monthIndex === 0;
  const { monthCount } = getCalendarBounds();
  const isLastMonth = monthIndex === monthCount - 1;

  return `
    <div class="calendar-toolbar">
      <button type="button" class="calendar-nav-button" data-calendar-prev aria-label="View previous month" ${isFirstMonth ? "disabled" : ""}>
        &lt;
      </button>
      <h2>${formatMonth(monthDate)}</h2>
      <button type="button" class="calendar-nav-button" data-calendar-next aria-label="View next month" ${isLastMonth ? "disabled" : ""}>
        &gt;
      </button>
    </div>
    ${renderMonth(monthDate, eventsByDate)}
  `;
}

function renderUpcomingEvents(events) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const upcoming = events
    .filter((event) => event.date >= todayKey && event.type !== "weekly")
    .slice(0, 8);

  if (!upcoming.length) {
    return `<p class="muted center">No upcoming special events are posted right now. Please check back soon.</p>`;
  }

  return upcoming
    .map(
      (event) => `
        <article class="upcoming-event">
          <div>
            <span class="upcoming-date">${formatShortDate(event.date)}</span>
            <h3>${event.title}</h3>
            <p>${event.description}</p>
          </div>
          <span class="upcoming-time">${event.time}</span>
        </article>
      `,
    )
    .join("");
}

export function initEventsCalendar() {
  const calendarTarget = document.querySelector("[data-events-calendar]");
  const upcomingTarget = document.querySelector("[data-upcoming-events]");
  const formLinks = document.querySelectorAll("[data-food-box-form-link]");

  formLinks.forEach((link) => {
    link.href = foodBoxFormUrl;
  });

  if (!calendarTarget && !upcomingTarget) return;

  const { startMonth, endMonth, monthCount } = getCalendarBounds();
  const events = expandEvents(startMonth, endMonth);

  if (upcomingTarget) {
    upcomingTarget.innerHTML = renderUpcomingEvents(events);
  }

  if (calendarTarget) {
    const eventsByDate = groupEventsByDate(events);
    const months = Array.from({ length: monthCount }, (_, index) => addMonths(startMonth, index));
    const today = new Date();
    const currentMonthIndex = months.findIndex(
      (month) => month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth(),
    );
    let activeMonthIndex = currentMonthIndex >= 0 ? currentMonthIndex : 0;

    function renderActiveMonth() {
      calendarTarget.innerHTML = renderCalendarShell(months[activeMonthIndex], eventsByDate, activeMonthIndex);

      calendarTarget.querySelector("[data-calendar-prev]")?.addEventListener("click", () => {
        activeMonthIndex = Math.max(0, activeMonthIndex - 1);
        renderActiveMonth();
      });

      calendarTarget.querySelector("[data-calendar-next]")?.addEventListener("click", () => {
        activeMonthIndex = Math.min(months.length - 1, activeMonthIndex + 1);
        renderActiveMonth();
      });
    }

    renderActiveMonth();
  }
}
