function initPropertyForm() {
  const form = document.getElementById("propertyForm");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const fields = [
    "client_type",
    "property_type",
    "listing_type",
    "location",
    "budget",
    "message",
    "property_id",
    "property_title",
  ];

  fields.forEach((name) => {
    const field = form.elements.namedItem(name);
    const value = params.get(name);
    if (!field || !value) return;

    if (field instanceof HTMLSelectElement) {
      const hasOption = Array.from(field.options).some((option) => option.value === value);
      if (hasOption) field.value = value;
      return;
    }

    field.value = value;
  });

  const sourceUrl = form.elements.namedItem("source_url");
  if (sourceUrl) sourceUrl.value = params.get("source_url") || document.referrer || window.location.href;

  const propertyId = params.get("property_id");
  const propertyTitle = params.get("property_title");
  if (propertyId && propertyTitle) {
    const context = document.getElementById("enquiry-property-context");
    const title = document.getElementById("enquiry-property-title");
    const meta = document.getElementById("enquiry-property-meta");
    if (context && title && meta) {
      title.textContent = propertyTitle;
      meta.textContent = [propertyId, params.get("location"), params.get("budget")].filter(Boolean).join(" · ");
      context.hidden = false;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbz9x5qYNsU11xPNv1OsqYqhz-SbjChoBU1dQiUrLkbZiVCYpVSXHFHC6_JQ02ghe8lBDg/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      alert("Thank you! Your enquiry has been submitted.");
      form.reset();
    } catch (error) {
      console.error("Submission error", error);
      alert("We could not submit your enquiry. Please try again.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Enquiry";
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", initPropertyForm);
