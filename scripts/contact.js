function initPropertyForm() {
  const form = document.getElementById("propertyForm");

  if (!form) {
    return;
  }

  const nameField = form.querySelector("#name");
  const phoneField = form.querySelector("#phone");
  const emailField = form.querySelector("#email");
  const locationField = form.querySelector("#location");
  const errorFields = {
    name: form.querySelector("#name-error"),
    phone: form.querySelector("#phone-error"),
    email: form.querySelector("#email-error"),
    location: form.querySelector("#location-error"),
  };

  function setFieldError(field, message) {
    const errorField = errorFields[field.name];

    if (errorField) {
      errorField.textContent = message;
    }

    field.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateName() {
    const value = nameField.value.trim();

    if (!value) {
      setFieldError(nameField, "Full Name is required.");
      return false;
    }

    if (value.length < 2) {
      setFieldError(nameField, "Enter at least 2 characters.");
      return false;
    }

    setFieldError(nameField, "");
    return true;
  }

  function validatePhone() {
    const value = phoneField.value.trim();

    if (!value) {
      setFieldError(phoneField, "Phone Number is required.");
      return false;
    }

    if (!/^\+?[0-9]{7,15}$/.test(value)) {
      setFieldError(phoneField, "Enter a valid international phone number.");
      return false;
    }

    setFieldError(phoneField, "");
    return true;
  }

  function validateEmail() {
    const value = emailField.value.trim();

    if (!value) {
      setFieldError(emailField, "Email is required.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError(emailField, "Enter a valid email address.");
      return false;
    }

    setFieldError(emailField, "");
    return true;
  }

  function validateLocation() {
    const value = locationField.value.trim();

    if (!value) {
      setFieldError(locationField, "Location is required.");
      return false;
    }

    if (value.length < 2) {
      setFieldError(locationField, "Enter a valid location.");
      return false;
    }

    setFieldError(locationField, "");
    return true;
  }

  function validateForm() {
    const validators = [
      validateName(),
      validatePhone(),
      validateEmail(),
      validateLocation(),
    ];

    return validators.every(Boolean);
  }

  if (nameField) {
    nameField.addEventListener("input", () => {
      nameField.value = nameField.value.replace(/[^a-zA-Z .'-]/g, "");
      validateName();
    });
  }

  if (phoneField) {
    phoneField.addEventListener("input", () => {
      phoneField.value = phoneField.value
        .replace(/(?!^)\+/g, "")
        .replace(/[^0-9+]/g, "");
      validatePhone();
    });
  }

  if (emailField) {
    emailField.addEventListener("input", () => {
      emailField.value = emailField.value.replace(/\s/g, "");
      validateEmail();
    });
  }

  if (locationField) {
    locationField.addEventListener("input", () => {
      locationField.value = locationField.value.replace(/\s{2,}/g, " ");
      validateLocation();
    });
  }

  [nameField, phoneField, emailField, locationField].forEach((field) => {
    if (!field) {
      return;
    }

    field.addEventListener("blur", () => {
      if (field === nameField) validateName();
      if (field === phoneField) validatePhone();
      if (field === emailField) validateEmail();
      if (field === locationField) validateLocation();
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const clientTypeMap = {
      buyer: "Buyer",
      seller: "Seller",
      buyer_and_seller: "Buyer and Seller",
      investor: "Investor",
    };
    const propertyTypeMap = {
      apartment: "Apartment / Flat",
      villa: "Villa / Independent House",
      commercial: "Commercial Property",
      plot: "Open Plot / Land",
    };
    const listingTypeMap = {
      buy: "Buy Property",
      rent: "Rent / Lease Property",
      sell: "Sell Property",
      lease_out: "Lease Out Property",
      investment: "Investment",
    };
    const fields = {
      client_type: form.querySelector("#client_type"),
      property_type: form.querySelector("#property_type"),
      name: form.querySelector("#name"),
      phone: form.querySelector("#phone"),
      email: form.querySelector("#email"),
      listing_type: form.querySelector("#listing_type"),
      location: form.querySelector("#location"),
      budget: form.querySelector("#budget"),
      message: form.querySelector("#message"),
    };

    const payload = {
      "entry.655985995": clientTypeMap[fields.client_type?.value] || "",
      "entry.730122530": propertyTypeMap[fields.property_type?.value] || "",
      "entry.1382422915": fields.name?.value || "",
      "entry.808171166": fields.phone?.value || "",
      "entry.1325715926": fields.email?.value || "",
      "entry.703556880": listingTypeMap[fields.listing_type?.value] || "",
      "entry.1528503922": fields.location?.value || "",
      "entry.474400745": fields.budget?.value || "",
      "entry.669518967": fields.message?.value || "",
      fvv: "1",
      partialResponse: '[null,null,"-7204446661009652439"]',
      pageHistory: "0",
      fbzx: "-7204446661009652439",
      submissionTimestamp: "-1",
    };

    let iframe = document.getElementById("hidden-google-form-target");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "hidden-google-form-target";
      iframe.name = "hidden-google-form-target";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    const submitForm = document.createElement("form");
    submitForm.action =
      "https://docs.google.com/forms/d/e/1FAIpQLSdIC4bHlSuzDlMbBc1ALkVtYBCx9SKwMX4MEnjX2utGOrP_0Q/formResponse";
    submitForm.method = "POST";
    submitForm.target = "hidden-google-form-target";
    submitForm.style.display = "none";

    Object.entries(payload).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      submitForm.appendChild(input);
    });

    document.body.appendChild(submitForm);

    try {
      submitForm.submit();

      alert("Thank you! Your enquiry has been submitted.");
      form.reset();
    } catch (err) {
      console.error("Submission error", err);
      alert("Error submitting form.");
    } finally {
      submitForm.remove();
    }
  });
}

document.addEventListener("DOMContentLoaded", initPropertyForm);
