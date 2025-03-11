const handleForm = ({ formId, submitBtnId, hasPhoneNumber, phoneNumberIsRequired, klaviyo = { customTextFields: [], customCheckFields: [], forceChecksTrue: [], klaviyoA: "", klaviyoG: "" }, ghl = { formId: "", location_id: "", captchaToken: "", fields: [], customFields: [] }, hubspot = { endpoint: "" }, submitFunction = () => {} }) => {
  const trySentry = ({ error, message }) => {
    try {
      if (error) {
        Sentry.captureException(error);
      } else {
        const sentryError = new Error();
        sentryError.name = "Error";
        sentryError.message = message;
        Sentry.captureException(sentryError);
      }
    } catch (e) {
      console.error("Error loading sentry.");
    }
  };

  const getTopLevelDomain = () => {
    const fullDomain = window.location.hostname;
    const domainRegex = /\.([a-z]{2,})\.([a-z]{2,})$/;
    const match = fullDomain.match(domainRegex);
    if (match) {
      return `.${match[1]}.${match[2]}`;
    } else {
      return fullDomain;
    }
  };
  const cookieConfig = `path=/; domain=${getTopLevelDomain()};max-age=3600`;

  let iti;
  let phoneField;
  const submitBtn = document.getElementById(submitBtnId);
  const form = document.getElementById(formId);
  const urlParams = new URLSearchParams(window.location.search);
  if (ghl.formId) {
    const captchaScript = document.createElement("script");
    captchaScript.src = `https://www.google.com/recaptcha/enterprise.js?render=${ghl.captchaToken}`;
    captchaScript.async = true;
    captchaScript.type = "text/javascript";

    document.head.append(captchaScript);
  }

  if (hasPhoneNumber) {
    phoneField = form.querySelector("[name='phone_number']");
    const disableSubmitBtn = () => {
      submitBtn.setAttribute("disabled", "disabled");
      submitBtn.style.filter = "contrast(0.5)";
      submitBtn.style.cursor = "not-allowed";
    };

    let phoneNumberIsNotValid;
    if (phoneNumberIsRequired) {
      disableSubmitBtn();
      phoneNumberIsNotValid = () => !iti.isValidNumber();
    } else {
      phoneNumberIsNotValid = () => phoneField.value.trim() !== "" && !iti.isValidNumber();
    }

    iti = window.intlTelInput(phoneField, {
      utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/js/utils.js",
      autoPlaceholder: "aggressive",
      initialCountry: "auto",
      geoIpLookup: async (success, failure) => {
        try {
          const cookieCountry = document.cookie.split("user_country=")[1]?.split(";")[0];
          if (cookieCountry) {
            success(cookieCountry);
            return;
          }
          const response = await fetch("https://get.geojs.io/v1/ip/country.json");
          const data = await response.json();
          if (response.ok) {
            document.cookie = `user_country=${data.country};${cookieConfig}`;
            success(data.country);
          } else throw new error("Error Fetching Ip", response, data);
        } catch (e) {
          console.warn(e);
          failure();
        }
      },
    });
    phoneField.addEventListener("input", () => {
      if (phoneNumberIsNotValid()) {
        submitBtn.setAttribute("disabled", "disabled");
      } else {
        submitBtn.removeAttribute("disabled");
        phoneField.style = "";
        submitBtn.style = "";
      }
    });
    phoneField.addEventListener("focusout", () => {
      if (phoneNumberIsNotValid()) {
        phoneField.style.borderColor = "red";
        phoneField.style.outline = "1px solid red";
        disableSubmitBtn();
      }
    });
    const invalidPhoneField = () => {
      alert("Phone field invalid. Please check if every number is present.");
    };
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && submitBtn.hasAttribute("disabled")) {
        invalidPhoneField();
      }
    });
  }

  const handleError = () => {
    const p = form.parentElement.querySelector(".w-form-done div");
    if (p) p.innerHTML = "Oops! Something went wrong while submitting the form.";
  };

  const formDone = form.parentElement.querySelector(".w-form-done");

  const initObserver = () => {
    const targetElement = formDone;
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.attributeName === "style") {
          const displayChanged = mutation.target.style.display !== mutation.oldValue;
          if (displayChanged) {
            submitFunction();
          }
        }
      }
    });
    observer.observe(targetElement, {
      attributes: true,
      attributeOldValue: true,
    });
  };

  const utms = Object.fromEntries(urlParams.entries());
  Object.keys(utms).forEach((key) => {
    const input = document.createElement("input");
    input.type = "text";
    input.setAttribute("hidden", "hidden");
    input.name = key;
    input.value = utms[key];
    form.appendChild(input);
  });

  const handleKlaviyo = async (e) => {
    const formData = new FormData(e.target);
    if (hasPhoneNumber) {
      phoneField.value.trim === "" ? formData.set("phone_number", "") : formData.set("phone_number", iti.getNumber());
      phoneField.value = iti.getNumber();
    }
    (klaviyo.customTextFields = klaviyo.customTextFields || []), (klaviyo.customCheckFields = klaviyo.customCheckFields || []), (klaviyo.forceChecksTrue = klaviyo.forceChecksTrue || []), formData.append("$fields", [...klaviyo.customTextFields, ...klaviyo.customCheckFields, ...klaviyo.forceChecksTrue, ...Object.keys(utms)]);
    klaviyo.customCheckFields.forEach((checkFieldId) => {
      const field = document.getElementById(checkFieldId);
      formData.set(checkFieldId, field.checked ? true : false);
    });
    ["accepts-marketing", "sms_consent", ...klaviyo.forceChecksTrue].forEach((checkFieldId) => {
      formData.set(checkFieldId, true);
    });

    const response = await fetch(`https://manage.kmail-lists.com/ajax/subscriptions/subscribe?a=${klaviyo.klaviyoA}&g=${klaviyo.klaviyoG}`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      return Promise.reject("Klaviyo Network response was not ok: " + response.statusText);
    }
    const data = await response.json();
    if (!data.success) return Promise.reject("Error sending to klaviyo: " + data.errors);
  };

  const handleGHL = async () => {
    const body = {};
    const formData = new FormData();

    if (hasPhoneNumber) body.phone = iti.getNumber() || "";
    if (ghl.fields.includes("full_name")) body.full_name = form.querySelector("[name='first_name']").value;
    if (ghl.fields.includes("first_name")) body.first_name = form.querySelector("[name='first_name']").value;
    if (ghl.fields.includes("email")) body.email = form.querySelector("[name='email']").value;
    if (ghl.fields.includes("organization")) body.organization = form.querySelector("[name='company']")?.value || "";
    if (ghl.fields.includes("country")) body.country = form.querySelector("[name='country']")?.value || "";
    if (ghl.fields.includes("state")) body.state = form.querySelector("[name='state']")?.value || "";
    ghl.customFields?.forEach((fieldPair) => {
      fieldName = fieldPair[0];
      fieldId = fieldPair[1];
      body[fieldId] = form.querySelector(`[name='${fieldName}']`).value;
    });
    body.terms_and_conditions = "I agree to terms & conditions provided by the company. By providing my phone number, I agree to receive text messages from the business.";
    body.formId = ghl.formId;
    body.location_id = ghl.location_id;
    body.eventData = {};
    body.eventData.url_params = Object.fromEntries(urlParams.entries());
    body.eventData.campaign = urlParams.get("utm_campaign");
    formData.append("formData", JSON.stringify(body));
    formData.append("locationId", ghl.location_id);
    formData.append("formId", ghl.formId);

    try {
      const token = await grecaptcha.enterprise.execute(ghl.captchaToken, { action: "submit" });
      formData.append("captchaV3", token);
    } catch {
      return Promise.reject("GHL response was not ok");
    }

    const response = await fetch("https://backend.leadconnectorhq.com/forms/submit", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return Promise.reject("GHL response was not ok");
    }
  };

  const handleHubspot = async () => {
    const body = { properties: {} };
    body.properties.email = form.querySelector("[name='email']")?.value;
    body.properties.firstname = form.querySelector("[name='first_name']")?.value;
    body.properties.phone = form.querySelector("[name='phone_number']")?.value;

    const response = await fetch(hubspot.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return Promise.reject("Hubspot response was not ok");
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const tasks = [];
      if (klaviyo.klaviyoA) tasks.push(handleKlaviyo(e));
      if (ghl.formId) tasks.push(handleGHL());
      if (hubspot.endpoint) tasks.push(handleHubspot());

      if (tasks.length) await Promise.all(tasks);

      if (formDone.style.display === "block") submitFunction();
      else initObserver();
    } catch (e) {
      trySentry({ error: e });
      handleError();
      console.error(e);
    }
  });
};
