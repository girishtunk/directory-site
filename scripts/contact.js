console.log("🔥 JS file loaded");

function initPropertyForm() {
  const form = document.getElementById("propertyForm");

  if (!form) {
    console.error("❌ propertyForm not found");
    return;
  }

  console.log("✅ Form found");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("📨 Form submit triggered");

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

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

      console.log("✅ Data sent");
      alert("Thank you! Your property details have been submitted.");
      form.reset();

    } catch (err) {
      console.error("❌ Submission error", err);
      alert("Error submitting form.");
    }
  });
}

document.addEventListener("DOMContentLoaded", initPropertyForm);
